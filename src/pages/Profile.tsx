import { useEffect, useRef, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonAvatar, IonButton, IonText, IonItem, IonLabel, IonInput,
  IonToast
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth, db, storage } from "../lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.photoURL || null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{open: boolean; msg: string}>({ open: false, msg: "" });

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setPreviewUrl(user?.photoURL || null);
  }, [user?.displayName, user?.photoURL]);

  if (!user) {
    return (
      <IonPage>
        <IonHeader><IonToolbar><IonTitle>Profile</IonTitle></IonToolbar></IonHeader>
        <IonContent className="ion-padding">
          <p>You are not signed in.</p>
          <IonButton onClick={() => nav("/login")}>Go to Login</IonButton>
        </IonContent>
      </IonPage>
    );
  }

  function onPickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // ограничим базовые типы
    if (!f.type.startsWith("image/")) {
      setToast({ open: true, msg: "Please choose an image file" });
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }

  async function uploadAvatarIfNeeded(): Promise<string | null> {
    if (!file) return null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `users/${user.uid}/avatar_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    return url;
  }

  async function onSave() {
    try {
      setBusy(true);

      // 1) Если выбран новый файл — загружаем и получаем url
      const uploadedUrl = await uploadAvatarIfNeeded();
      const photoURL = uploadedUrl ?? user.photoURL ?? null;

      // 2) Обновляем Firebase Auth профиль
      await updateProfile(auth.currentUser!, {
        displayName: displayName || user.displayName || undefined,
        photoURL: photoURL || undefined
      });

      // 3) Сохраняем в Firestore профиль пользователя
      await setDoc(doc(db, "users", user.uid), {
        displayName: displayName || null,
        photoURL: photoURL || null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setToast({ open: true, msg: "Profile updated" });
      setFile(null);
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to update profile" });
    } finally {
      setBusy(false);
    }
  }

  async function onRemovePhoto() {
    try {
      setBusy(true);
      // Обнуляем photoURL в Auth
      await updateProfile(auth.currentUser!, { photoURL: "" });
      // И в Firestore
      await setDoc(doc(db, "users", user.uid), {
        photoURL: null,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setPreviewUrl(null);
      setFile(null);
      setToast({ open: true, msg: "Photo removed" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to remove photo" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton slot="start" fill="clear" onClick={() => nav(-1)}>← Back</IonButton>
          <IonTitle>Profile</IonTitle>
          <IonButton slot="end" onClick={onSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <IonAvatar style={{ width: 96, height: 96 }}>
            {previewUrl ? (
              <img src={previewUrl} alt="avatar" />
            ) : (
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: "var(--ion-color-light)"
              }} />
            )}
          </IonAvatar>

          <div style={{ display: "flex", gap: 8 }}>
            <IonButton onClick={onPickFile} fill="outline">Choose Photo</IonButton>
            {previewUrl && <IonButton color="danger" fill="outline" onClick={onRemovePhoto}>Remove</IonButton>}
          </div>

          {/* скрытый file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ marginTop: 24 }}>
          <IonItem>
            <IonLabel position="stacked">Display name</IonLabel>
            <IonInput
              value={displayName}
              onIonInput={(e: any) => setDisplayName(e.detail.value || "")}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput readonly value={user.email || ""} />
          </IonItem>
        </div>

        <IonToast
          isOpen={toast.open}
          message={toast.msg}
          duration={1500}
          onDidDismiss={() => setToast({ open: false, msg: "" })}
        />
      </IonContent>
    </IonPage>
  );
}

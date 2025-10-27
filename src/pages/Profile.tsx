
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";
// src/pages/Profile.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonAvatar, IonButton, IonText, IonItem, IonLabel, IonInput, IonToast
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";


const AVATAR_OPTIONS = ["gorilla", "cat", "panda", "meerkat", "bear"] as const;
const DEFAULT_AVATAR = "/avatars/gorilla.png";

export default function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();

  // UI state
  const [displayName, setDisplayName] = useState<string>(user?.displayName || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.photoURL || null);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });

  
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const d = snap.data() as { displayName?: string; photoURL?: string | null };
          if (d.displayName !== undefined) setDisplayName(d.displayName || "");
          if (d.photoURL !== undefined) setPreviewUrl(d.photoURL || null);
        } else {
          
          setDisplayName(user.displayName || "");
          setPreviewUrl(user.photoURL || null);
        }
      } catch (e) {
        console.error("Load profile error:", e);
      }
    })();
  }, [user?.uid]);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setPreviewUrl((prev) => prev ?? user?.photoURL ?? null);
  }, [user?.displayName, user?.photoURL]);

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>You are not signed in.</p>
          <IonButton onClick={() => nav("/login")}>Go to Login</IonButton>
        </IonContent>
      </IonPage>
    );
  }

  async function onSave() {
    try {
      setBusy(true);

      // Если выбрали вариант из сетки — берём его, иначе используем текущее превью или дефолт
      const chosenUrl = selectedAvatar ? `/avatars/${selectedAvatar}.png` : (previewUrl || DEFAULT_AVATAR);

      // 1) Обновляем Firebase Auth профиль (displayName + photoURL)
      await updateProfile(auth.currentUser!, {
        displayName: displayName || undefined,
        photoURL: chosenUrl || undefined,
      });

      // 2) Сохраняем профиль в Firestore (users/{uid})
      await setDoc(
        doc(db, "users", user.uid),
        {
          displayName: displayName || null,
          photoURL: chosenUrl || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPreviewUrl(chosenUrl);
      setSelectedAvatar(null);
      setToast({ open: true, msg: "Profile updated" });
    } catch (e) {
      console.error("Save profile error:", e);
      setToast({ open: true, msg: "Failed to update profile" });
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

        {/* Avatar preview */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <IonAvatar style={{ width: 96, height: 96 }}>
            {(previewUrl || DEFAULT_AVATAR) ? (
              <img src={previewUrl || DEFAULT_AVATAR} alt="avatar" />
            ) : (
              <div
                style={{
                  width: "100%", height: "100%", borderRadius: "50%",
                  background: "var(--ion-color-light)"
                }}
              />
            )}
          </IonAvatar>
        </div>

        {/* choose avatar */}
        <IonText style={{ display: "block", textAlign: "center", marginTop: 16 }}>
          Choose your avatar
        </IonText>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 12,
          }}
        >
          {AVATAR_OPTIONS.map((name) => {
            const src = `/avatars/${name}.png`;
            const isSelected = selectedAvatar === name || previewUrl === src;
            return (
              <img
                key={name}
                src={src}
                alt={name}
                onClick={() => {
                  setSelectedAvatar(name);
                  setPreviewUrl(src);
                }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: isSelected
                    ? "3px solid var(--ion-color-primary)"
                    : "1px solid #ccc",
                  boxShadow: isSelected ? "0 0 6px rgba(0,0,0,0.3)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* profile Fields */}
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

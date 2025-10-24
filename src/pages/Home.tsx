import {
  IonPage,
  IonHeader,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton
} from "@ionic/react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import LogoutButton from "../components/LogoutButton";

export default function Home() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (data) {
        setDisplayName(data.displayName ?? "");
        setStatus(data.status ?? "");
      }
    });
    return unsub;
  }, [user]);

  const saveStatus = async () => {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(
      ref,
      { status, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonTitle>Home</IonTitle>
      </IonHeader>
      <IonContent className="ion-padding">
        <p>Welcome to BookApp</p>
        {user && (
          <>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Display Name:</strong> {displayName}</p>

            <IonItem>
              <IonLabel position="stacked">Status</IonLabel>
              <IonInput
                value={status}
                onIonInput={(e: CustomEvent) =>
                  setStatus((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            <IonButton expand="block" onClick={saveStatus}>
              Save Status
            </IonButton>
          </>
        )}
        <LogoutButton />
      </IonContent>
    </IonPage>
  );
}
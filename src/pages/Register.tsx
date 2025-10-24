import { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [nickname,  setNickname]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (): Promise<void> => {
    setErr("");
    if (!firstName || !lastName || !nickname || !email || !password) {
      setErr("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const cred = await register(email, password);

      const displayName = `${firstName} ${lastName}`.trim();
      await updateProfile(cred.user, { displayName });

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email,
        firstName,
        lastName,
        nickname,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      nav("/home");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonTitle>Register</IonTitle>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">First name</IonLabel>
          <IonInput
            value={firstName}
            onIonInput={(e: CustomEvent) =>
              setFirstName((e.target as HTMLInputElement).value)
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Last name</IonLabel>
          <IonInput
            value={lastName}
            onIonInput={(e: CustomEvent) =>
              setLastName((e.target as HTMLInputElement).value)
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Nickname</IonLabel>
          <IonInput
            value={nickname}
            onIonInput={(e: CustomEvent) =>
              setNickname((e.target as HTMLInputElement).value)
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Email</IonLabel>
          <IonInput
            value={email}
            inputmode="email"
            onIonInput={(e: CustomEvent) =>
              setEmail((e.target as HTMLInputElement).value)
            }
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput
            type="password"
            value={password}
            onIonInput={(e: CustomEvent) =>
              setPassword((e.target as HTMLInputElement).value)
            }
          />
        </IonItem>

        {err && <p style={{ color: "crimson", marginTop: 12 }}>{err}</p>}

        <IonButton expand="block" onClick={onSubmit} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Creating account…" : "Register"}
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
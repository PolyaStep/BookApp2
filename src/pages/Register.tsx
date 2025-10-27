import { useState, useRef, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import lottie, { AnimationItem } from "lottie-web";
import "../theme/variables.css";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const animRef = useRef<HTMLDivElement | null>(null);
  const animInstance = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!animRef.current) return;
    fetch("/books.json")
      .then((res) => res.json())
      .then((data) => {
        if (animInstance.current) animInstance.current.destroy();
        animInstance.current = lottie.loadAnimation({
          container: animRef.current!,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data,
        });
      });
    return () => {
      if (animInstance.current) animInstance.current.destroy();
      animInstance.current = null;
    };
  }, []);

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
        <IonToolbar>
          <IonTitle>Book App</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" fullscreen>
        <div className="hero-col">
          <IonText color="primary">
            <h1 className="hero-title">Create Your Account</h1>
          </IonText>
          <p className="hero-sub">
            Join Book App and start discovering books today!
          </p>

          {/*  Lottie Animation */}
          <div ref={animRef} className="hero-lottie" />

          {/* Registration Form */}
          <div className="form-card">
            <h2 className="form-title">Sign Up</h2>

            <IonItem>
              <IonLabel position="stacked">First Name</IonLabel>
              <IonInput
                value={firstName}
                onIonInput={(e) =>
                  setFirstName((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Last Name</IonLabel>
              <IonInput
                value={lastName}
                onIonInput={(e) =>
                  setLastName((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Nickname</IonLabel>
              <IonInput
                value={nickname}
                onIonInput={(e) =>
                  setNickname((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                autocomplete="new-password"  
                autocapitalize="off"
                type="email"
                value={email}
                onIonInput={(e) =>
                  setEmail((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                autocomplete="new-password"  
                autocapitalize="off"
                value={password}
                onIonInput={(e) =>
                  setPassword((e.target as HTMLInputElement).value)
                }
              />
            </IonItem>

            {err && <p style={{ color: "crimson" }}>{err}</p>}

            <IonButton
              expand="block"
              onClick={onSubmit}
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? "Creating account…" : "Register"}
            </IonButton>

            <p style={{ marginTop: 12 }}>
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

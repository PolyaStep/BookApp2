import { useState, useEffect, useRef } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText
} from "@ionic/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import lottie, { AnimationItem } from "lottie-web";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  // Lottie animation
  const animRef = useRef<HTMLDivElement | null>(null);
  const animInstance = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!animRef.current) return;
    fetch("/books.json")
      .then(res => res.json())
      .then(data => {
        if (animInstance.current) animInstance.current.destroy();
        animInstance.current = lottie.loadAnimation({
          container: animRef.current!,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: data
        });
      });
    return () => {
      if (animInstance.current) animInstance.current.destroy();
      animInstance.current = null;
    };
  }, []);

  const onSubmit = async () => {
    setErr("");
    setLoading(true);
    try {
      const cred = await login(email.trim(), password);
      const uid = cred.user.uid;

      // Check user in db
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        // If not create new 
        await setDoc(userRef, {
          uid,
          email: cred.user.email,
          displayName: cred.user.displayName || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // If ok redirect to home
      nav("/home", { replace: true });
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
        <div
          style={{
            minHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 12,
          }}
        >
          <IonText color="primary">
            <h1 style={{ fontSize: "clamp(28px,3vw,38px)", margin: 0 }}>
              Welcome to Book App
            </h1>
          </IonText>
          <p style={{ margin: 0, color: "var(--ion-color-medium)" }}>
            Discover, save, and revisit your favourite books. Log in to continue.
          </p>

          <div ref={animRef} style={{ width: 220, height: 180, margin: "12px auto 4px" }} />

          {/* Login form */}
          <div style={{ width: "100%", maxWidth: 420, marginTop: 8 }}>
            <h2 style={{ margin: "0 0 12px" }}>Login</h2>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                autocomplete="off"
                autocapitalize="off"
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || "")}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                autocomplete="new-password"
                autocapitalize="off"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || "")}
              />
            </IonItem>

            {err && (
              <p style={{ color: "crimson", marginTop: 10, textAlign: "left" }}>
                {err}
              </p>
            )}

            <IonButton
              expand="block"
              onClick={onSubmit}
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </IonButton>

            <p style={{ marginTop: 12 }}>
              No account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

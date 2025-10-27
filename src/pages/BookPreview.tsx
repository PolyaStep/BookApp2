import { useEffect, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonImg, IonText, IonSpinner
} from "@ionic/react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

export default function BookPreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !id) return;
    const ref = doc(db, "books", user.uid, "items", id);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setBook({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
  }, [user?.uid, id]);

  async function handleDelete() {
    if (!user?.uid || !id) return;
    if (!window.confirm("Remove this book from your collection?")) return;
    await deleteDoc(doc(db, "books", user.uid, "items", id));
    nav("/home");
  }

  if (loading) return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Loading...</IonTitle></IonToolbar></IonHeader>
      <IonContent className="ion-padding"><IonSpinner /></IonContent>
    </IonPage>
  );

  if (!book) return (
    <IonPage>
      <IonHeader><IonToolbar><IonTitle>Book not found</IonTitle></IonToolbar></IonHeader>
      <IonContent className="ion-padding">
        <p>Book not found or removed.</p>
        <IonButton onClick={() => nav("/home")}>Back</IonButton>
      </IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{book.title}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {book.coverUrl && (
          <IonImg src={book.coverUrl} alt={book.title} style={{ maxWidth: 200, margin: "0 auto 16px" }} />
        )}
        <IonText color="dark">
          <h2>{book.title}</h2>
        </IonText>
        <p style={{ color: "var(--ion-color-medium)" }}>{book.author}</p>

        {book.description ? (
          <p style={{ marginTop: 12 }}>{book.description}</p>
        ) : (
          <p style={{ marginTop: 12, color: "var(--ion-color-medium)" }}>No description available.</p>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <IonButton color="danger" onClick={handleDelete}>
            Remove
          </IonButton>
          <IonButton fill="outline" onClick={() => nav("/home")}>
            Back
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}

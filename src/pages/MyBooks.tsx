import { useEffect, useMemo, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonAvatar,
  IonButton, IonText, IonChip, IonGrid, IonRow, IonCol, IonImg, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonToast
} from "@ionic/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { removeBookFromUser, setBookLike } from "../services/userBooks";

type SegKey = "all" | "liked" | "disliked" | "wishlist" | "reading" | "finished";

export default function MyBooks() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [books, setBooks] = useState<any[]>([]);
  const [seg, setSeg] = useState<SegKey>("all");
  const [activeGenre, setActiveGenre] = useState<string>("all");
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const qRef = query(
      collection(db, "books", user.uid, "items"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qRef, (snap) => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user?.uid]);

  // All genres
  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach(b => (b.genres || []).forEach((g: string) => set.add(g)));
    return ["all", ...Array.from(set).sort()];
  }, [books]);

  // Filter by genre
  const filtered = useMemo(() => {
    return books.filter(b => {
      // segment filter
      if (seg === "liked" && b.liked !== true) return false;
      if (seg === "disliked" && b.liked !== false) return false;
      if (seg === "wishlist" && b.status !== "wishlist") return false;
      if (seg === "reading" && b.status !== "reading") return false;
      if (seg === "finished" && b.status !== "finished") return false;

      // по жанру
      if (activeGenre !== "all") {
        const list: string[] = b.genres || [];
        if (!list.includes(activeGenre)) return false;
      }
      return true;
    });
  }, [books, seg, activeGenre]);

  async function onLike(b: any, next: boolean | null) {
    if (!user?.uid) return;
    try {
      setBusy(`like-${b.id}`);
      await setBookLike(user.uid, b.id, next);
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to update like" });
    } finally {
      setBusy(null);
    }
  }

  async function onDelete(b: any) {
    if (!user?.uid) return;
    if (!confirm("Remove this book from your collection?")) return;
    try {
      setBusy(`del-${b.id}`);
      await removeBookFromUser(user.uid, b.id);
      setToast({ open: true, msg: "Removed from My Books" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to remove book" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <IonPage>
      <IonHeader>
  <IonToolbar>
    <IonButton
      slot="start"
      fill="clear"
      onClick={() => nav(-1)} 
    >
      ← Back
    </IonButton>
    <IonTitle>My Books</IonTitle>
  </IonToolbar>
</IonHeader>


      <IonContent className="ion-padding">
        
        <IonSegment value={seg} onIonChange={(e) => setSeg((e.detail.value as SegKey) || "all")}>
          <IonSegmentButton value="all"><IonLabel>All</IonLabel></IonSegmentButton>
          <IonSegmentButton value="liked"><IonLabel>Liked</IonLabel></IonSegmentButton>
          <IonSegmentButton value="disliked"><IonLabel>Disliked</IonLabel></IonSegmentButton>
          <IonSegmentButton value="wishlist"><IonLabel>Wishlist</IonLabel></IonSegmentButton>
          <IonSegmentButton value="reading"><IonLabel>Reading</IonLabel></IonSegmentButton>
          <IonSegmentButton value="finished"><IonLabel>Finished</IonLabel></IonSegmentButton>
        </IonSegment>

        {/* Genres */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0 16px" }}>
          {genres.map(g => (
            <IonChip
              key={g}
              outline={activeGenre !== g}
              color={activeGenre === g ? "primary" : undefined}
              onClick={() => setActiveGenre(g)}
            >
              {g}
            </IonChip>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <p style={{ color: "var(--ion-color-medium)" }}>No books here yet.</p>
        ) : (
          <IonGrid>
            <IonRow>
              {filtered.map(b => (
                <IonCol key={b.id} size="12" sizeMd="6" sizeLg="4">
                  <IonCard>
                    {b.coverUrl && <IonImg
                        src={b.thumbnail || b.coverUrl}
                        alt={b.title}
                        style={{
                            width: "120px",
                            height: "auto",
                            borderRadius: "8px",
                            margin: "12px auto 0",
                            display: "block",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                        }}
                        />
                        }
                 <IonCardHeader>
                      <IonCardTitle>{b.title}</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ color: "var(--ion-color-medium)" }}>{b.author || "Unknown author"}</p>

                      {/* Genres */}
                      {Array.isArray(b.genres) && b.genres.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 10px" }}>
                          {b.genres.slice(0, 4).map((g: string) => (
                            <IonChip key={g} outline>{g}</IonChip>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <IonButton size="small" onClick={() => nav(`/book/${b.id}`)}>
                          Read
                        </IonButton>

                        {/* Like / Dislike / Reset */}
                        <IonButton
                          size="small"
                          fill={b.liked === true ? "solid" : "outline"}
                          color="success"
                          disabled={busy === `like-${b.id}`}
                          onClick={() => onLike(b, true)}
                        >
                          Like
                        </IonButton>

                        <IonButton
                          size="small"
                          fill={b.liked === false ? "solid" : "outline"}
                          color="warning"
                          disabled={busy === `like-${b.id}`}
                          onClick={() => onLike(b, false)}
                        >
                          Dislike
                        </IonButton>

                        <IonButton
                          size="small"
                          fill="outline"
                          color="medium"
                          disabled={busy === `like-${b.id}`}
                          onClick={() => onLike(b, null)}
                        >
                          Reset
                        </IonButton>

                        <IonButton
                          size="small"
                          color="danger"
                          disabled={busy === `del-${b.id}`}
                          onClick={() => onDelete(b)}
                        >
                          {busy === `del-${b.id}` ? "Removing…" : "Delete"}
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}

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

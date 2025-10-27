import { useEffect, useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonAvatar,
  IonButton, IonSearchbar, IonGrid, IonRow, IonCol, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonText,
  IonToast, IonModal
} from "@ionic/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { searchBooks } from "../services/bookService";
import { addBookToUser, removeBookFromUser } from "../services/userBooks";
import { db } from "../lib/firebase";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";

type TabKey = "account" | "search";

export default function Home() {
  const [tab, setTab] = useState<TabKey>("account");
  const { user, logout } = useAuth();
  const nav = useNavigate();

  // mini-search
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [toast, setToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });

  // my recent books (from Firestore)
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [loadingMy, setLoadingMy] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // preview modal
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingMy(true);
    const qRef = query(
      collection(db, "books", user.uid, "items"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsub = onSnapshot(qRef, (snap) => {
      setMyBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingMy(false);
    });
    return () => unsub();
  }, [user?.uid]);

  const genres = [
    { label: "Popular", query: "bestseller" },
    { label: "Detective", query: "detective" },
    { label: "Thriller", query: "thriller" },
    { label: "Fantasy", query: "fantasy" },
    { label: "Sci-Fi", query: "science fiction" },
    { label: "Romance", query: "romance" },
  ];

  const runSearch = async (queryStr: string) => {
    if (!queryStr || queryStr.length < 2) return;
    setLoading(true);
    try {
      const r = await searchBooks(queryStr);
      setResults(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  async function onAdd(b: any) {
    if (!user?.uid) return;
    try {
      await addBookToUser(user.uid, {
        id: b.id,
        title: b.title,
        authors: b.authors,
        thumbnail: b.thumbnail,
      });
      setToast({ open: true, msg: "Added to My Books" });
      setShowModal(false); // if added from modal
      setTab("account");   // show result on Account
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to add book" });
    }
  }

  async function handleDelete(id: string) {
    if (!user?.uid) return;
    if (!confirm("Remove this book from your collection?")) return;
    try {
      setDeleting(id);
      await removeBookFromUser(user.uid, id);
      setToast({ open: true, msg: "Removed from My Books" });
    } catch (e) {
      console.error(e);
      setToast({ open: true, msg: "Failed to remove book" });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Tabs */}
        <IonSegment
          value={tab}
          onIonChange={(e) => setTab((e.detail.value as TabKey) || "account")}
        >
          <IonSegmentButton value="account">
            <IonLabel>Account</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="search">
            <IonLabel>Search</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* ACCOUNT TAB */}
        {tab === "account" && (
          <div style={{ marginTop: 16 }}>
            {/* Profile */}
            <IonItem lines="none">
             <IonAvatar slot="start">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "var(--ion-color-light)"
                  }} />
                )}
              </IonAvatar>

              <div>
                <IonText>
                  <h2 style={{ margin: 0 }}>{user?.displayName || "Reader"}</h2>
                </IonText>
                <small style={{ color: "var(--ion-color-medium)" }}>
                  {user?.email}
                </small>
              </div>
            </IonItem>

            {/* Quick links */}
            <IonList>
              <IonItem button onClick={() => nav("/my-books")}>
                <IonLabel>My Books</IonLabel>
              </IonItem>
              <IonItem button onClick={() => setTab("search")}>
                <IonLabel>Find new books</IonLabel>
              </IonItem>
            </IonList>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <IonButton onClick={() => nav("/profile")} fill="outline">
                Edit Profile
              </IonButton>
              <IonButton color="medium" fill="outline" onClick={logout}>
                Log out
              </IonButton>
            </div>

            {/* Recently added */}
            <div style={{ marginTop: 24 }}>
              <IonText color="primary">
                <h3 style={{ marginBottom: 8 }}>Recently added</h3>
              </IonText>

              {loadingMy && (
                <p style={{ color: "var(--ion-color-medium)" }}>Loading…</p>
              )}

              {!loadingMy && myBooks.length === 0 && (
                <p style={{ color: "var(--ion-color-medium)" }}>
                  No books yet — add your first one from Search.
                </p>
              )}

              {!loadingMy && myBooks.length > 0 && (
                <IonList>
                  {myBooks.map((b) => (
                    <IonItem key={b.id}>
                      <IonAvatar slot="start">
                        {b.coverUrl ? (
                          <img src={b.coverUrl} alt={b.title} />
                        ) : (
                          <div
                            style={{
                              width: 48,
                              height: 64,
                              borderRadius: 4,
                              background: "var(--ion-color-light-shade)",
                            }}
                          />
                        )}
                      </IonAvatar>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong>{b.title}</strong>
                        <small style={{ color: "var(--ion-color-medium)" }}>
                          {b.author || "Unknown author"}
                        </small>
                      </div>

                      {/* Actions on the right */}
                      <IonButton
                        slot="end"
                        size="small"
                        onClick={() => nav(`/book/${b.id}`)} // opens BookPreview page
                      >
                        Read
                      </IonButton>

                      <IonButton
                        slot="end"
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(b.id)}
                        disabled={deleting === b.id}
                      >
                        {deleting === b.id ? "Removing…" : "Delete"}
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              )}
            </div>
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === "search" && (
          <div style={{ marginTop: 16 }}>
            {/* Mini-search */}
            <IonSearchbar
              placeholder="Search for books..."
              debounce={500}
              value={q}
              onIonInput={(e) => {
                const val = (e.detail.value || "").trim();
                setQ(val);
                runSearch(val);
              }}
            />

            {/* Genres */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                margin: "8px 0 12px",
              }}
            >
              {genres.map((g) => (
                <IonButton
                  key={g.label}
                  size="small"
                  fill="outline"
                  onClick={() => {
                    setQ(g.query);
                    runSearch(g.query);
                  }}
                >
                  {g.label}
                </IonButton>
              ))}
            </div>

            {/* Full search page link */}
            <IonButton
              expand="block"
              onClick={() => nav("/search")}
              color="primary"
            >
              Open full search
            </IonButton>

            {/* Results */}
            <IonGrid style={{ marginTop: 12 }}>
              <IonRow>
                {loading && <p style={{ padding: "8px 12px" }}>Loading…</p>}
                {!loading &&
                  results.map((b) => (
                    <IonCol key={b.id} size="12" sizeMd="4">
                      <IonCard>
                        {b.thumbnail && (
                          <IonImg src={b.thumbnail} alt={b.title} />
                        )}
                        <IonCardHeader>
                          <IonCardTitle>{b.title}</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                          <p
                            style={{
                              marginTop: 4,
                              color: "var(--ion-color-medium)",
                            }}
                          >
                            {b.authors || "Unknown author"}
                          </p>
                          <div
                            style={{ display: "flex", gap: 8, marginTop: 8 }}
                          >
                            <IonButton
                              size="small"
                              fill="outline"
                              onClick={() => {
                                setSelectedBook(b);
                                setShowModal(true);
                              }}
                            >
                              Preview
                            </IonButton>

                            <IonButton size="small" onClick={() => onAdd(b)}>
                              Add
                            </IonButton>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
              </IonRow>
            </IonGrid>
          </div>
        )}

        {/* Preview modal */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader translucent>
            <IonToolbar>
              <IonTitle>{selectedBook?.title || "Book Preview"}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowModal(false)}>
                ✕
              </IonButton>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            {selectedBook ? (
              <div style={{ textAlign: "center" }}>
                {selectedBook.thumbnail && (
                  <IonImg
                    src={selectedBook.thumbnail}
                    alt={selectedBook.title}
                    style={{
                      width: 160,
                      height: "auto",
                      borderRadius: 8,
                      margin: "0 auto 16px",
                    }}
                  />
                )}
                <IonText color="dark">
                  <h2 style={{ marginBottom: 4 }}>{selectedBook.title}</h2>
                </IonText>
                <p style={{ color: "var(--ion-color-medium)", marginTop: 0 }}>
                  {selectedBook.authors || "Unknown author"}
                </p>
                <p
                  style={{
                    marginTop: 12,
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    textAlign: "justify",
                  }}
                >
                  {selectedBook.description
                    ? selectedBook.description
                    : "No description available for this book."}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 20,
                    justifyContent: "center",
                  }}
                >
                  <IonButton
                    size="default"
                    color="primary"
                    onClick={() => onAdd(selectedBook)}
                  >
                    Add to My Books
                  </IonButton>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: "center" }}>No book selected.</p>
            )}
          </IonContent>
        </IonModal>

        {/* Toast */}
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

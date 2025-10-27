import { useState } from "react";
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSearchbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonImg, IonButton
} from "@ionic/react";
import { searchBooks } from "../services/bookService";

export default function Search() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const run = async (val: string) => {
    const v = (val || "").trim();
    setQ(v);
    if (!v || v.length < 2) return;
    setLoading(true);
    try {
      setResults(await searchBooks(v));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSearchbar
          value={q}
          debounce={500}
          placeholder="Title, author, ISBN…"
          onIonInput={(e) => run(e.detail.value!)}
        />
        {loading && <p>Searching…</p>}

        <IonGrid>
          <IonRow>
            {results.map(b => (
              <IonCol key={b.id} size="12" sizeMd="4">
                <IonCard>
                  {b.thumbnail && <IonImg
                        src={b.thumbnail || b.coverUrl}
                        alt={b.title}
                        style={{
                            width: "100px",
                            height: "150px",
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
                    <p style={{ color: "var(--ion-color-medium)" }}>{b.authors}</p>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <IonButton size="small" fill="outline" href={b.preview} target="_blank">
                        Preview
                      </IonButton>
                      {/* TODO: Add to My Books */}
                      <IonButton size="small">Add</IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
}

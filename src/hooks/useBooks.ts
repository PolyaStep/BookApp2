import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  status: "reading" | "finished" | "wishlist";
  liked?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export type FilterKey = "all" | "reading" | "finished" | "wishlist" | "liked" | "disliked";

export function useBooks(uid?: string, filter: FilterKey = "all") {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let q = query(
      collection(db, "books", uid, "items"),
      orderBy("createdAt", "desc")
    );

    // серверные фильтры по статусу
    if (filter === "reading" || filter === "finished" || filter === "wishlist") {
      q = query(collection(db, "books", uid, "items"),
        where("status", "==", filter),
        orderBy("createdAt", "desc"));
    }

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Book,"id">) }));
      setItems(list);
      setLoading(false);
    });

    return () => unsub();
  }, [uid, filter]);

  // клиентские фильтры liked / disliked
  const data = useMemo(() => {
    if (filter === "liked") return items.filter(b => b.liked === true);
    if (filter === "disliked") return items.filter(b => b.liked === false);
    return items;
  }, [items, filter]);

  return { items: data, loading };
}

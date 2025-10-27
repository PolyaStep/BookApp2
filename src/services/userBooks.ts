import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp, deleteDoc, updateDoc } from "firebase/firestore";

export type BookLite = {
  id: string;
  title: string;
  authors?: string;
  thumbnail?: string;
  description?: string;
  genres?: string[];
};

export async function addBookToUser(uid: string, book: BookLite) {
  const ref = doc(db, "books", uid, "items", book.id);
  await setDoc(ref, {
    title: book.title,
    author: book.authors || "Unknown",
    coverUrl: book.thumbnail || "",
    description: book.description || "",
    genres: book.genres || [],
    status: "wishlist",
    liked: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function removeBookFromUser(uid: string, bookId: string) {
  const ref = doc(db, "books", uid, "items", bookId);
  await deleteDoc(ref);
}

export async function setBookLike(uid: string, bookId: string, liked: boolean | null) {
  const ref = doc(db, "books", uid, "items", bookId);
  await updateDoc(ref, {
    liked,
    updatedAt: serverTimestamp(),
  });
}

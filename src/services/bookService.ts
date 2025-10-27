const API_URL = "https://www.googleapis.com/books/v1/volumes?q=";

export async function searchBooks(query: string) {
  const res = await fetch(`${API_URL}${encodeURIComponent(query)}&maxResults=12`);
  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: any) => {
    const v = item.volumeInfo || {};
    return {
      id: item.id,
      title: v.title,
      authors: v.authors?.join(", "),
      thumbnail: v.imageLinks?.thumbnail || "",
      description: v.description || "",        // ✅ описание (если есть)
      genres: v.categories || [],              // ✅ жанры (массив строк)
      preview: v.previewLink || "",
    };
  });
}

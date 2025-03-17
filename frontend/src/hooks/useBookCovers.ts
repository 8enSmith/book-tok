import { useState, useCallback } from "react";

// Define new Book type to replace WikiArticle
export interface Book {
  title: string;
  author: string;
  key: string;
  coverId: number;
  coverUrl: string;
  description?: string;
  olid?: string;
}

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = reject;
  });
};

export function useBookCovers() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [buffer, setBuffer] = useState<Book[]>([]);

  const fetchBooks = async (forBuffer = false) => {
    if (loading) return;
    setLoading(true);
    try {
      // Generate a random offset for variety in results
      const randomOffset = Math.floor(Math.random() * 1000);
      
      // Using Open Library search API to get random books
      const response = await fetch(
        `https://openlibrary.org/search.json?q=subject:fiction&limit=20&offset=${randomOffset}&has_fulltext=true`
      );

      const data = await response.json();
      
      // Process the book data
      const newBooks = data.docs
        .filter(book => book.cover_i) // Ensure books have covers
        .map((book): Book => {
          const coverId = book.cover_i;
          // Use the large cover images
          const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          console.log("coverUrl", coverUrl);
          return {
            title: book.title,
            author: book.author_name ? book.author_name[0] : "Unknown Author",
            key: book.key,
            coverId,
            coverUrl,
            description: book.first_sentence ? book.first_sentence[0] : undefined,
            olid: book.edition_key ? book.edition_key[0] : undefined
          };
        });

      await Promise.allSettled(
        newBooks.map(book => preloadImage(book.coverUrl))
      );

      if (forBuffer) {
        setBuffer(newBooks);
      } else {
        setBooks((prev) => [...prev, ...newBooks]);
        fetchBooks(true);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    }
    setLoading(false);
  };

  const getMoreBooks = useCallback(() => {
    if (buffer.length > 0) {
      setBooks((prev) => [...prev, ...buffer]);
      setBuffer([]);
      fetchBooks(true);
    } else {
      fetchBooks(false);
    }
  }, [buffer]);

  return { books, loading, fetchBooks: getMoreBooks };
}

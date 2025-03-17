import { useState, useCallback } from "react";

// Define new Book type to replace WikiArticle
export interface Book {
  title: string;
  firstPublishYear: number;
  authors: string[]; // Array of authors instead of single author
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

// Function to fetch book description from Works API
const fetchBookDescription = async (workKey: string): Promise<string | undefined> => {
  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`);
    const data = await response.json();
    
    // Try to get description from different possible formats
    if (typeof data.description === 'string') {
      return data.description;
    } else if (data.description && data.description.value) {
      return data.description.value;
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching description for ${workKey}:`, error);
    return undefined;
  }
};

export function useBookCovers() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [buffer, setBuffer] = useState<Book[]>([]);

  const fetchBooks = async (forBuffer = false) => {
    if (loading) {
      return;
    }

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
      const booksWithoutDescriptions = data.docs
        .filter(book => book.cover_i) // Ensure books have covers
        .map((book): Book => {
          const coverId = book.cover_i;
          // Use the large cover images
          const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          console.log("coverUrl", coverUrl);
          
          return {
            title: book.title,
            firstPublishYear: book.first_publish_year,
            authors: book.author_name || ["Unknown Author"],
            key: book.key,
            coverId,
            coverUrl,
            description: undefined, // Will be populated later
            olid: book.edition_key ? book.edition_key[0] : undefined
          };
        });

      // Create an array of promises for fetching descriptions in parallel
      const descriptionPromises = booksWithoutDescriptions.map(book => 
        fetchBookDescription(book.key)
      );
      
      // Fetch all descriptions in parallel
      const descriptions = await Promise.all(descriptionPromises);
      
      // Assign descriptions to the corresponding books
      const newBooks = booksWithoutDescriptions.map((book, index) => ({
        ...book,
        description: descriptions[index]
      }));

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

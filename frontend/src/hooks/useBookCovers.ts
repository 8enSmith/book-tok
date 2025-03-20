import { useState, useCallback } from 'react'

// Define new Book type to replace WikiArticle
export interface Book {
  title: string
  firstPublishYear: number
  authors: string[] // Array of authors instead of single author
  key: string
  coverId: number
  coverUrl: string
  description?: string
  olid?: string
}

const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.onload = () => resolve()
    img.onerror = reject
  })
}

// Function to fetch book description from Works API
const fetchBookDescription = async (workKey: string): Promise<string | undefined> => {
  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`)
    const data = await response.json()

    // Try to get description from different possible formats
    if (typeof data.description === 'string') {
      return data.description
    } else if (data.description && data.description.value) {
      return data.description.value
    }
    return undefined
  } catch (error) {
    console.error(`Error fetching description for ${workKey}:`, error)
    return undefined
  }
}

export function useBookCovers() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [buffer, setBuffer] = useState<Book[]>([])

  const fetchBooks = useCallback(async (forBuffer = false) => {
    if (loading) {
      return
    }

    setLoading(true)

    try {
      // Generate a random offset for variety in results
      const randomOffset = Math.floor(Math.random() * 1000)

      // Using Open Library search API to get random books
      const response = await fetch(
        `https://openlibrary.org/search.json?q=subject:fiction&limit=5&offset=${randomOffset}&has_fulltext=true`,
      )

      const data = await response.json()

      // Process the book data
      // Define interfaces for the Open Library API response
      interface OpenLibraryDoc {
        title: string
        first_publish_year: number
        author_name?: string[]
        key: string
        cover_i: number
        edition_key?: string[]
      }

      interface OpenLibrarySearchResponse {
        docs: OpenLibraryDoc[]
      }

      const booksWithoutDescriptions: Book[] = (data as OpenLibrarySearchResponse).docs
        .filter((book: OpenLibraryDoc) => book.cover_i) // Ensure books have covers
        .map((book: OpenLibraryDoc): Book => {
          const coverId: number = book.cover_i
          // Use the large cover images
          const coverUrl: string = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`

          return {
            title: book.title,
            firstPublishYear: book.first_publish_year,
            authors: book.author_name || ['Unknown Author'],
            key: book.key,
            coverId,
            coverUrl,
            description: undefined, // Will be populated later
            olid: book.edition_key ? book.edition_key[0] : undefined,
          }
        })

      // Add books to state immediately before fetching descriptions
      // This allows displaying the books faster
      if (forBuffer) {
        setBuffer(booksWithoutDescriptions)
      } else {
        setBooks(prev => [...prev, ...booksWithoutDescriptions])
      }

      // Preload the first few images immediately
      if (booksWithoutDescriptions.length > 0) {
        // Only preload the first 2-3 images immediately
        booksWithoutDescriptions
          .slice(0, 3)
          .forEach(book => preloadImage(book.coverUrl).catch(console.error))
      }

      // Fetch descriptions in the background
      const enhanceWithDescriptions = async () => {
        try {
          // Create an array of promises for fetching descriptions in parallel
          const descriptionPromises = booksWithoutDescriptions.map(book =>
            fetchBookDescription(book.key),
          )

          // Fetch all descriptions in parallel
          const descriptions = await Promise.all(descriptionPromises)

          // Assign descriptions to the corresponding books
          const enhancedBooks = booksWithoutDescriptions.map((book, index) => ({
            ...book,
            description: descriptions[index],
          }))

          // Update books with descriptions
          if (forBuffer) {
            setBuffer(enhancedBooks)
          } else {
            setBooks(prev =>
              prev.map(book => {
                const enhancedBook = enhancedBooks.find(eb => eb.key === book.key)
                return enhancedBook || book
              }),
            )
          }

          // Preload remaining images in the background
          Promise.allSettled(enhancedBooks.slice(1).map(book => preloadImage(book.coverUrl)))
        } catch (error) {
          console.error('Error enhancing books with descriptions:', error)
        }
      }

      // Start the background process
      enhanceWithDescriptions()

      // If we're loading the main list, also start preparing the buffer
      if (!forBuffer) {
        fetchBooks(true)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    }
    setLoading(false)
  }, [loading, setLoading, setBooks, setBuffer])

  const getMoreBooks = useCallback(() => {
    if (buffer.length > 0) {
      setBooks(prev => [...prev, ...buffer])
      setBuffer([])
      fetchBooks(true)
    } else {
      fetchBooks(false)
    }
  }, [buffer, fetchBooks])

  return { books, loading, fetchBooks: getMoreBooks }
}

import { useState, useCallback } from 'react'
import { BOOK_SUBJECTS } from '../data/bookSubjects'

// Define the book type
export type Book = {
  key?: string
  title?: string
  covers?: string[]
  authors?: string[]
  description?: string
  coverUrl?: string
  firstPublishYear?: number
}

// Define the OpenLibrary API book response type
interface OpenLibraryBook {
  key: string
  title: string
  cover_i?: number
  author_name?: string[]
  first_publish_year?: number
}

export const useBookCovers = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Helper function to fetch all covers for a book
  const fetchAllCoversForBook = useCallback(
    async (bookKey: string, initialCoverId?: string): Promise<string[]> => {
      try {
        // Fetch the work data to get all cover IDs
        const workResponse = await fetch(`https://openlibrary.org${bookKey}.json`)
        const workData = await workResponse.json()

        // If the work has covers, use those
        if (workData.covers && Array.isArray(workData.covers) && workData.covers.length > 0) {
          // Filter out cover IDs with value -1 before returning
          return workData.covers
            .filter((id: number) => id !== -1 && id.toString() !== '-1')
            .map((id: number) => id.toString())
        }

        // If no covers found but we have an initial cover ID, return that
        if (initialCoverId) {
          return [initialCoverId]
        }

        // Default empty array if no covers found
        return []
      } catch (error) {
        console.error('Error fetching book covers:', error)
        // Return the initial cover ID if available
        return initialCoverId ? [initialCoverId] : []
      }
    },
    [],
  )

  // Helper function to process a book
  const processBookData = useCallback(
    async (book: OpenLibraryBook) => {
      // Extract first 300 words of description if available
      let description = 'No description available'

      if (book.key) {
        try {
          const workResponse = await fetch(`https://openlibrary.org${book.key}.json`)
          const workData = await workResponse.json()
          if (workData.description) {
            if (typeof workData.description === 'string') {
              description = workData.description
            } else if (typeof workData.description.value === 'string') {
              description = workData.description.value
            }

            // Limit to roughly first 300 words
            const words = description.split(' ')
            if (words.length > 300) {
              description = words.slice(0, 300).join(' ') + '...'
            }
          }
        } catch (error) {
          console.error('Error fetching book description:', error)
        }
      }

      // Get all cover IDs for this book
      const allCovers = await fetchAllCoversForBook(book.key, book.cover_i?.toString())

      return {
        key: book.key,
        title: book.title,
        covers: allCovers,
        authors: book.author_name,
        description,
        coverUrl: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
          : undefined,
        firstPublishYear: book.first_publish_year,
      }
    },
    [fetchAllCoversForBook],
  )

  const buildSearchUrl = useCallback((subject?: string) => {
    const baseUrl = 'https://openlibrary.org/search.json'
    const subjectParam = subject ? `subject:${subject}` : ''
    const queryParam = subject ? subjectParam : 'science_fiction'

    // Get number of works for the selected subject from BOOK_SUBJECTS
    // Default to 1000 if not found or no subject selected
    let maxOffset = 1000

    if (subject) {
      const subjectInfo = BOOK_SUBJECTS.find(s => s.value === subject)
      if (subjectInfo && subjectInfo.numberOfWorks) {
        // Cap at 90% of total works to stay within bounds
        maxOffset = Math.floor(subjectInfo.numberOfWorks * 0.9)
      }
    }

    const randomOffset = Math.floor(Math.random() * maxOffset)
    return `${baseUrl}?q=${queryParam}&limit=5&offset=${randomOffset}&has_fulltext=true`
  }, [])

  const fetchAndProcessBooks = useCallback(
    async (url: string) => {
      const response = await fetch(url)
      const data = await response.json()

      if (!data.docs || !Array.isArray(data.docs)) {
        return []
      }

      const filteredBooks = data.docs.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (book: any) => book.cover_i && book.title && book.author_name && book.key,
      )

      return Promise.all(filteredBooks.map(processBookData))
    },
    [processBookData],
  )

  const fetchBooks = useCallback(
    async (subject?: string, reset: boolean = false) => {
      try {
        setLoading(true)

        if (reset) {
          setBooks([])
          setPage(1)
        }

        const url = buildSearchUrl(subject)
        const newBooks = await fetchAndProcessBooks(url)

        setBooks(prev => (reset || page === 1 ? newBooks : [...prev, ...newBooks]))
        setPage(prev => prev + 1)
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    },
    [page, buildSearchUrl, fetchAndProcessBooks],
  )

  return { books, loading, fetchBooks }
}

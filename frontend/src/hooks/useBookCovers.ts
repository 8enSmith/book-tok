import { useState, useCallback } from 'react'

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

export const useBookCovers = () => {
  const [books, setBooks] = useState<Book[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Helper function to fetch all covers for a book
  const fetchAllCoversForBook = async (
    bookKey: string,
    initialCoverId?: string,
  ): Promise<string[]> => {
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
  }

  // Helper function to process a book
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processBookData = async (book: any) => {
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
  }

  const fetchBooks = useCallback(
    async (subject?: string, reset: boolean = false) => {
      try {
        setLoading(true)

        // If reset is true, we need to clear books and reset page counter
        if (reset) {
          setBooks([])
          setPage(1)

          // Build the API URL based on whether a subject is provided
          const baseUrl = 'https://openlibrary.org/search.json'
          const subjectParam = subject ? `subject:${subject}` : ''
          const queryParam = subject ? subjectParam : 'popular' // Use 'popular' as default when no subject
          const url = `${baseUrl}?q=${queryParam}&page=1&limit=10&sort=rating`

          const response = await fetch(url)
          const data = await response.json()

          if (data.docs && Array.isArray(data.docs)) {
            const filteredBooks = data.docs.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (book: any) =>
                book.cover_i && // Must have a cover
                book.title && // Must have a title
                book.author_name && // Must have an author
                book.key, // Must have a key
            )

            // Process all books to get covers and descriptions
            const newBooks: Book[] = await Promise.all(filteredBooks.map(processBookData))

            setBooks(newBooks)
            setPage(2) // Set to page 2 for next load
          }
        } else {
          // This is the original pagination logic
          // Build the API URL based on whether a subject is provided
          const baseUrl = 'https://openlibrary.org/search.json'
          const subjectParam = subject ? `subject:${subject}` : ''
          const queryParam = subject ? subjectParam : 'popular' // Use 'popular' as default when no subject
          const url = `${baseUrl}?q=${queryParam}&page=${page}&limit=10&sort=rating`

          const response = await fetch(url)
          const data = await response.json()

          if (data.docs && Array.isArray(data.docs)) {
            const filteredBooks = data.docs.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (book: any) =>
                book.cover_i && // Must have a cover
                book.title && // Must have a title
                book.author_name && // Must have an author
                book.key, // Must have a key
            )

            // Process all books to get covers and descriptions
            const newBooks: Book[] = await Promise.all(filteredBooks.map(processBookData))

            console.log('Enhanced books:', newBooks)

            if (page === 1) {
              // If this is the first page (new subject), replace books
              setBooks(newBooks)
            } else {
              // Otherwise append to existing books
              setBooks(prev => [...prev, ...newBooks])
            }
            setPage(page + 1)
          }
        }
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    },
    [page, processBookData],
  )

  return { books, loading, fetchBooks }
}

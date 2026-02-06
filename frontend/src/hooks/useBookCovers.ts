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
  const [loading, setLoading] = useState(false)

  const extractDescription = (workData: { description?: string | { value: string } }): string => {
    if (!workData.description) return 'No description available'

    const raw =
      typeof workData.description === 'string'
        ? workData.description
        : (workData.description.value ?? 'No description available')

    const words = raw.split(' ')
    return words.length > 300 ? words.slice(0, 300).join(' ') + '...' : raw
  }

  const extractCovers = (workData: { covers?: number[] }, initialCoverId?: string): string[] => {
    if (workData.covers && Array.isArray(workData.covers) && workData.covers.length > 0) {
      return workData.covers
        .filter((id: number) => id !== -1 && id.toString() !== '-1')
        .map((id: number) => id.toString())
    }
    return initialCoverId ? [initialCoverId] : []
  }

  const processBookData = useCallback(async (book: OpenLibraryBook) => {
    let description = 'No description available'
    let allCovers: string[] = book.cover_i ? [book.cover_i.toString()] : []

    if (book.key) {
      try {
        const workResponse = await fetch(`https://openlibrary.org${book.key}.json`)
        const workData = await workResponse.json()
        description = extractDescription(workData)
        allCovers = extractCovers(workData, book.cover_i?.toString())
      } catch (error) {
        console.error('Error fetching book data:', error)
      }
    }

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
  }, [])

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
    return `${baseUrl}?q=${queryParam}&limit=3&offset=${randomOffset}&has_fulltext=true`
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
        }

        const url = buildSearchUrl(subject)
        const newBooks = await fetchAndProcessBooks(url)

        setBooks(prev => (reset ? newBooks : [...prev, ...newBooks]))
      } catch (error) {
        console.error('Error fetching books:', error)
      } finally {
        setLoading(false)
      }
    },
    [buildSearchUrl, fetchAndProcessBooks],
  )

  return { books, loading, fetchBooks }
}

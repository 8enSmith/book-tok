import { useEffect, useRef, useCallback, useState, TouchEvent, lazy, Suspense } from 'react'
import { BookCard } from './components/BookCard'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { useLikedArticles } from './hooks/useLikedArticles'
import { useBookCovers } from './hooks/useBookCovers'

injectSpeedInsights()

// Define the lazy-loaded components outside the App function
// The imports won't actually happen until the components are rendered
const LikedBooksModal = lazy(() => import('./components/LikedBooksModal'))
const AboutModal = lazy(() => import('./components/AboutModal'))

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  // Track if the user has clicked the buttons at least once
  const [hasClickedLikes, setHasClickedLikes] = useState(false)
  const [hasClickedAbout, setHasClickedAbout] = useState(false)
  const { books, loading, fetchBooks } = useBookCovers()
  const { likedArticles, toggleLike } = useLikedArticles()
  const observerTarget = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleBookId, setVisibleBookId] = useState<string | null>(null)
  const [activeCovers, setActiveCovers] = useState<Record<string, { index: number; url: string }>>(
    {},
  )
  const [forceUpdate, setForceUpdate] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // The minimum swipe distance (in px) to trigger a navigation
  const MIN_SWIPE_DISTANCE = 50

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && !loading) {
        fetchBooks()
      }
    },
    [loading, fetchBooks],
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    })

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    fetchBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredLikedArticles = likedArticles.filter(
    article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.extract.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleExport = () => {
    const simplifiedArticles = likedArticles.map(article => ({
      title: article.title,
      url: article.url,
      extract: article.extract,
      thumbnail: article.thumbnail?.source || null,
    }))

    const dataStr = JSON.stringify(simplifiedArticles, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `book-tok-favorites-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  // Track which book is currently visible in viewport
  // Handle book becoming visible in the viewport
  const handleBookVisible = useCallback(
    (bookKey: string) => {
      setVisibleBookId(bookKey)

      // Initialize the active cover for this book if not already done
      if (!activeCovers[bookKey]) {
        const book = books.find(b => b.key === bookKey)
        if (book?.covers && book.covers.length > 0) {
          const coverId = book.covers[0]
          const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          setActiveCovers(prev => ({
            ...prev,
            [bookKey]: { index: 0, url: coverUrl },
          }))
        }
      }
    },
    [books, activeCovers],
  )

  // Navigate to previous cover
  const handlePrevCover = useCallback(() => {
    if (!visibleBookId) return

    const book = books.find(b => b.key === visibleBookId)
    if (!book?.covers || book.covers.length <= 1) return

    const currentIndex = activeCovers[visibleBookId]?.index || 0
    const newIndex = (currentIndex - 1 + book.covers.length) % book.covers.length
    const newCoverId = book.covers[newIndex]
    const newCoverUrl = `https://covers.openlibrary.org/b/id/${newCoverId}-L.jpg`

    setActiveCovers(prev => ({
      ...prev,
      [visibleBookId]: { index: newIndex, url: newCoverUrl },
    }))

    // Force a re-render
    setForceUpdate(prev => prev + 1)
  }, [visibleBookId, books, activeCovers])

  // Navigate to next cover
  const handleNextCover = useCallback(() => {
    if (!visibleBookId) return

    const book = books.find(b => b.key === visibleBookId)
    if (!book?.covers || book.covers.length <= 1) return

    const currentIndex = activeCovers[visibleBookId]?.index || 0
    const newIndex = (currentIndex + 1) % book.covers.length
    const newCoverId = book.covers[newIndex]
    const newCoverUrl = `https://covers.openlibrary.org/b/id/${newCoverId}-L.jpg`

    setActiveCovers(prev => ({
      ...prev,
      [visibleBookId]: { index: newIndex, url: newCoverUrl },
    }))

    // Force a re-render
    setForceUpdate(prev => prev + 1)
  }, [visibleBookId, books, activeCovers])

  // Determine if navigation buttons should be visible
  const shouldShowNavButtons = useCallback(() => {
    if (!visibleBookId) return false

    const book = books.find(book => book.key === visibleBookId)
    return book?.covers && book.covers.length > 1
  }, [visibleBookId, books])

  // Handle touch start event
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchEnd(null) // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  // Handle touch move event
  const handleTouchMove = useCallback((e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  // Handle touch end event
  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isSignificantSwipe = Math.abs(distance) > MIN_SWIPE_DISTANCE

    if (!isSignificantSwipe || !shouldShowNavButtons()) return

    // Swipe right to left (next cover)
    if (distance > 0) {
      handleNextCover()
    }
    // Swipe left to right (previous cover)
    else {
      handlePrevCover()
    }

    // Reset touch positions
    setTouchStart(null)
    setTouchEnd(null)
  }, [touchStart, touchEnd, handleNextCover, handlePrevCover, shouldShowNavButtons])

  return (
    <div
      className="h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory hide-scroll"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => window.location.reload()}
          className="text-2xl font-bold text-white drop-shadow-lg hover:opacity-80 transition-opacity"
        >
          Book-Tok
        </button>
      </div>

      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => {
            // When the About button is clicked, mark that we've clicked it
            if (!hasClickedAbout) {
              setHasClickedAbout(true)
            }
            setShowAbout(!showAbout)
          }}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          About
        </button>
        <button
          onClick={() => {
            // When the likes button is clicked, mark that we've clicked it
            // This will trigger the conditional rendering of the LikedBooksModal
            if (!hasClickedLikes) {
              setHasClickedLikes(true)
            }
            setShowLikes(!showLikes)
          }}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          Likes
        </button>
      </div>

      {/* Left navigation button - only show when multiple covers available */}
      {shouldShowNavButtons() && (
        <button
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
          aria-label="Previous cover"
          onClick={handlePrevCover}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right navigation button - only show when multiple covers available */}
      {shouldShowNavButtons() && (
        <button
          className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors opacity-70 hover:opacity-100"
          aria-label="Next cover"
          onClick={handleNextCover}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <Suspense fallback={null}>
        {hasClickedAbout && (
          <AboutModal showAbout={showAbout} setShowAbout={setShowAbout} />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {hasClickedLikes && (
          <LikedBooksModal
            showLikes={showLikes}
            setShowLikes={setShowLikes}
            likedArticles={likedArticles}
            toggleLike={toggleLike}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredLikedArticles={filteredLikedArticles}
            handleExport={handleExport}
          />
        )}
      </Suspense>

      {books.length === 0 && loading ? (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        </div>
      ) : (
        books.map(book => {
          const bookKey = book.key || ''
          const activeCover = activeCovers[bookKey]
          const hasCoverIndex = activeCover?.index !== undefined

          // Choose the correct cover URL
          let coverUrl = book.coverUrl || '/placeholder-cover.jpg'
          let coverIndex = 0

          // If we have a stored active cover for this book, use that
          if (hasCoverIndex && activeCover.url) {
            coverUrl = activeCover.url
            coverIndex = activeCover.index
          }
          // Otherwise, if it has covers, use the first one
          else if (book.covers && book.covers.length > 0) {
            const coverId = book.covers[0]
            coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          }

          return (
            <BookCard
              key={`${bookKey}-${forceUpdate}-${coverIndex}`}
              article={{
                pageid: parseInt(book.key?.replace(/\D/g, '') || '0', 10),
                authors: book.authors || ['Unknown Author'],
                title: book.title || '',
                displaytitle: book.title || '',
                extract: book.description || 'Loading description',
                firstPublishYear: book.firstPublishYear || 0,
                url: book.key ? `https://openlibrary.org${book.key}` : '',
                thumbnail: {
                  source: coverUrl,
                  width: 300,
                  height: 450,
                },
              }}
              onVisible={() => handleBookVisible(bookKey)}
              coverIndex={coverIndex}
              totalCovers={(book.covers as unknown as number[]) || []}
            />
          )
        })
      )}

      <div ref={observerTarget} className="h-10 -mt-1" />
      {loading && books.length > 0 && (
        <div className="h-20 w-full flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      <Analytics />
    </div>
  )
}

export default App

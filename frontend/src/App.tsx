import { useEffect, useRef, useCallback, useState } from 'react'
import { BookCard } from './components/BookCard'
import { Loader2, Search, X, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Analytics } from '@vercel/analytics/react'
import { injectSpeedInsights } from '@vercel/speed-insights'
import { useLikedArticles } from './hooks/useLikedArticles'
import { useBookCovers } from './hooks/useBookCovers'

injectSpeedInsights()

function App() {
  const [showAbout, setShowAbout] = useState(false)
  const [showLikes, setShowLikes] = useState(false)
  const { books, loading, fetchBooks } = useBookCovers()
  const { likedArticles, toggleLike } = useLikedArticles()
  const observerTarget = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleBookId, setVisibleBookId] = useState<string | null>(null)
  const [activeCovers, setActiveCovers] = useState<Record<string, { index: number, url: string }>>({})
  const [forceUpdate, setForceUpdate] = useState(0)

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
  const handleBookVisible = useCallback((bookKey: string) => {
    setVisibleBookId(bookKey);
    
    // Initialize the active cover for this book if not already done
    if (!activeCovers[bookKey]) {
      const book = books.find(b => b.key === bookKey);
      if (book?.covers && book.covers.length > 0) {
        const coverId = book.covers[0];
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        setActiveCovers(prev => ({
          ...prev,
          [bookKey]: { index: 0, url: coverUrl }
        }));
      }
    }
  }, [books, activeCovers]);

  // Navigate to previous cover
  const handlePrevCover = useCallback(() => {
    if (!visibleBookId) return;
    
    const book = books.find(b => b.key === visibleBookId);
    if (!book?.covers || book.covers.length <= 1) return;
    
    const currentIndex = activeCovers[visibleBookId]?.index || 0;
    const newIndex = (currentIndex - 1 + book.covers.length) % book.covers.length;
    const newCoverId = book.covers[newIndex];
    const newCoverUrl = `https://covers.openlibrary.org/b/id/${newCoverId}-L.jpg`;
    
    setActiveCovers(prev => ({
      ...prev,
      [visibleBookId]: { index: newIndex, url: newCoverUrl }
    }));
    
    // Force a re-render
    setForceUpdate(prev => prev + 1);
  }, [visibleBookId, books, activeCovers]);

  // Navigate to next cover
  const handleNextCover = useCallback(() => {
    if (!visibleBookId) return;
    
    const book = books.find(b => b.key === visibleBookId);
    if (!book?.covers || book.covers.length <= 1) return;
    
    const currentIndex = activeCovers[visibleBookId]?.index || 0;
    const newIndex = (currentIndex + 1) % book.covers.length;
    const newCoverId = book.covers[newIndex];
    const newCoverUrl = `https://covers.openlibrary.org/b/id/${newCoverId}-L.jpg`;
    
    setActiveCovers(prev => ({
      ...prev,
      [visibleBookId]: { index: newIndex, url: newCoverUrl }
    }));
    
    // Force a re-render
    setForceUpdate(prev => prev + 1);
  }, [visibleBookId, books, activeCovers]);

  // Determine if navigation buttons should be visible
  const shouldShowNavButtons = useCallback(() => {
    if (!visibleBookId) return false;
    
    const book = books.find(book => book.key === visibleBookId);
    return book?.covers && book.covers.length > 1;
  }, [visibleBookId, books]);

  return (
    <div className="h-screen w-full bg-black text-white overflow-y-scroll snap-y snap-mandatory hide-scroll">
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
          onClick={() => setShowAbout(!showAbout)}
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          About
        </button>
        <button
          onClick={() => setShowLikes(!showLikes)}
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

      {showAbout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 z-[41] p-6 rounded-lg max-w-md relative">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">About Book-Tok</h2>
            <p className="mb-4">
              A TikTok style interface for exploring random books from Open Library.
            </p>
            <p className="text-white/70">
              Made with ❤️ by{' '}
              <a
                href="https://github.com/8enSmith"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                @8enSmith
              </a>
            </p>
            <p className="text-white/70 mt-2">
              Based on{' '}
              <a
                href="https://wikitok.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                WikiTok
              </a>
            </p>
            <p className="text-white/70 mt-2">
              Check out the code on{' '}
              <a
                href="https://github.com/8enSmith/book-tok"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                GitHub
              </a>
            </p>
            <p className="text-white/70 mt-2">
              If you enjoy this project, you can{' '}
              <a
                href="https://buymeacoffee.com/8enSmith"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                buy me a coffee
              </a>
              ! ☕
            </p>
          </div>
          <div
            className={`w-full h-full z-[40] top-1 left-1  bg-[rgb(28 25 23 / 43%)] fixed  ${
              showAbout ? 'block' : 'hidden'
            }`}
            onClick={() => setShowAbout(false)}
          ></div>
        </div>
      )}

      {showLikes && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 z-[41] p-6 rounded-lg w-full max-w-2xl h-[80vh] flex flex-col relative">
            <button
              onClick={() => setShowLikes(false)}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Liked Books</h2>
              {likedArticles.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Export liked books"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>

            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search liked books..."
                className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-5 h-5 text-white/50 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredLikedArticles.length === 0 ? (
                <p className="text-white/70">
                  {searchQuery ? 'No matches found.' : 'No liked books yet.'}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredLikedArticles.map(article => (
                    <div
                      key={`${article.pageid}-${Date.now()}`}
                      className="flex gap-4 items-start group"
                    >
                      {article.thumbnail && (
                        <img
                          src={article.thumbnail.source}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold hover:text-gray-200"
                          >
                            {article.title}
                          </a>
                          <button
                            onClick={() => toggleLike(article)}
                            className="text-white/50 hover:text-white/90 p-1 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            aria-label="Remove from likes"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-white/70 line-clamp-2">{article.extract}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            className={`w-full h-full z-[40] top-1 left-1  bg-[rgb(28 25 23 / 43%)] fixed  ${
              showLikes ? 'block' : 'hidden'
            }`}
            onClick={() => setShowLikes(false)}
          ></div>
        </div>
      )}

      {books.length === 0 && loading ? (
        <div className="h-screen w-full flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading books...</span>
        </div>
      ) : (
        books.map(book => {
          const bookKey = book.key || '';
          const activeCover = activeCovers[bookKey];
          const hasCoverIndex = activeCover?.index !== undefined;
          
          // Choose the correct cover URL
          let coverUrl = book.coverUrl || '/placeholder-cover.jpg';
          let coverIndex = 0;
          const totalCovers = book.covers?.length || 0;
          
          // If we have a stored active cover for this book, use that
          if (hasCoverIndex && activeCover.url) {
            coverUrl = activeCover.url;
            coverIndex = activeCover.index;
          } 
          // Otherwise, if it has covers, use the first one
          else if (book.covers && book.covers.length > 0) {
            const coverId = book.covers[0];
            coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
          }
          
          return (
            <BookCard
              key={`${bookKey}-${forceUpdate}-${coverIndex}`}
              article={{
                pageid: parseInt(book.key?.replace(/\D/g, '') || '0', 10),
                authors: book.authors || ['Unknown Author'],
                title: book.title || '',
                displaytitle: book.title || '',
                extract: book.description || 'Loading description...',
                firstPublishYear: book.firstPublishYear || 0,
                url: book.key ? `https://openlibrary.org${book.key}` : '',
                thumbnail: {
                  source: coverUrl,
                  width: 300,
                  height: 450
                },
              }}
              onVisible={() => handleBookVisible(bookKey)}
              coverIndex={coverIndex}
              totalCovers={totalCovers}
            />
          );
        })
      )}

      <div ref={observerTarget} className="h-10 -mt-1" />
      {loading && books.length > 0 && (
        <div className="h-20 w-full flex items-center justify-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading more...</span>
        </div>
      )}
      <Analytics />
    </div>
  )
}

export default App

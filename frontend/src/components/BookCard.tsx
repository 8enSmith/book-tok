import { Share2, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLikedArticles } from '../contexts/LikedArticlesContext'
import { extractColorsFromImage } from '../utils/colorExtractor'

export interface WikiArticle {
  title: string
  firstPublishYear: number
  displaytitle: string
  authors: string[]
  extract: string
  pageid: number
  url: string
  thumbnail: {
    source: string
    width: number
    height: number
  }
}

interface WikiCardProps {
  article: WikiArticle
}

export function BookCard({ article }: WikiCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [backgroundColors, setBackgroundColors] = useState<string[]>([
    'rgba(0,0,0,0.8)',
    'rgba(40,40,40,0.8)',
  ])
  const { toggleLike, isLiked } = useLikedArticles()

  // Extract colors when thumbnail is available
  useEffect(() => {
    if (article.thumbnail?.source) {
      extractColorsFromImage(article.thumbnail.source)
        .then(colors => {
          setBackgroundColors(colors)
        })
        .catch(error => {
          console.error('Failed to extract colors:', error)
        })
    }
  }, [article.thumbnail?.source])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.displaytitle,
          text: article.extract || '',
          url: article.url,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(article.url)
      alert('Link copied to clipboard!')
    }
  }

  // Create the background style with the extracted colors
  const backgroundStyle = {
    background: `linear-gradient(to bottom, ${backgroundColors[0]}, ${backgroundColors[1]})`,
  }

  return (
    <div
      className="h-screen w-full flex items-center justify-center snap-start relative"
      onDoubleClick={() => toggleLike(article)}
    >
      {/* Apply the gradient background at the outermost level */}
      <div className="h-full w-full absolute top-0 left-0" style={backgroundStyle}></div>

      <div className="h-full w-full relative z-10">
        {article.thumbnail ? (
          <div className="absolute inset-0 flex items-start pt-[15vh] justify-center">
            <img
              loading="lazy"
              src={article.thumbnail.source}
              alt={article.displaytitle}
              width={article.thumbnail.width}
              height={article.thumbnail.height}
              className={`max-h-[65vh] max-w-full transition-opacity duration-300 bg-white ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={e => {
                console.error('Image failed to load:', e)
                setImageLoaded(true)
              }}
              crossOrigin="anonymous"
            />
            {!imageLoaded && <div className="absolute inset-0 bg-gray-900 animate-pulse" />}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}

        {/* Content container */}
        <div className="absolute backdrop-blur-xs bg-black/30 bottom-[5vh] left-0 right-0 p-6 text-white z-20">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold drop-shadow-lg">{article.displaytitle}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => toggleLike(article)}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                  isLiked(article.pageid)
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-label="Like article"
              >
                <Heart className={`w-5 h-5 ${isLiked(article.pageid) ? 'fill-white' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                aria-label="Share article"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <h3 className="text-1xl font-bold drop-shadow-lg mb-3">{`${article.authors.join(', ')} (${article.firstPublishYear})`}</h3>
          <p className="text-gray-100 mb-4 drop-shadow-lg line-clamp-6">{article.extract}</p>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white hover:text-gray-200 drop-shadow-lg"
          >
            Read more →
          </a>
        </div>
      </div>
    </div>
  )
}

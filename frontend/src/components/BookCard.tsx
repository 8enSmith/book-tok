import React, { useEffect, useRef, useState, memo } from 'react';
import { Share2, Heart, Loader2 } from 'lucide-react'
import { useLikedArticles } from '../hooks/useLikedArticles'
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

interface BookCardProps {
  article: {
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
  onVisible?: () => void
  coverIndex: number
  totalCovers: number[]
}

// Use memo to prevent unnecessary re-renders
export const BookCard: React.FC<BookCardProps> = memo(({ 
  article, 
  onVisible,
  coverIndex,
  totalCovers
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [backgroundColors, setBackgroundColors] = useState<string[]>([
    'rgba(0,0,0,0.8)',
    'rgba(40,40,40,0.8)',
  ])
  const { toggleLike, isLiked } = useLikedArticles()
  const cardRef = useRef<HTMLDivElement>(null)
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(article.thumbnail.source);
  const [fallbackToThumbnail, setFallbackToThumbnail] = useState(false);
  
  // Reset image error state when cover index changes
  useEffect(() => {
    setImageError(false);
  }, [coverIndex]);

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

  useEffect(() => {
    if (!cardRef.current || !onVisible) return;
    
    // Store a reference to the current DOM node
    const currentElement = cardRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onVisible();
        }
      },
      { threshold: 0.7 } // Trigger when 70% of the card is visible
    );
    
    observer.observe(currentElement);
    
    return () => {
      observer.unobserve(currentElement);
    };
  }, [onVisible]);

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

  // Function to generate different sized image URLs
  const getResponsiveImageUrl = (originalUrl: string, size: string): string => {
    // Handle Open Library images
    if (originalUrl.includes('openlibrary.org')) {
      // Replace the size identifier (e.g., -L.jpg to -M.jpg)
      return originalUrl.replace(/-[SML]\.(jpg|jpeg|png)$/i, `-${size}.$1`);
    }
    
    // For general URLs, you could add more rules for other image sources
    return originalUrl;
  };

  // Convert cover ID to a proper URL
  const getCoverUrl = (coverId: number, size: string = 'L') => {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  };

  // Determine which cover to display
  let imageSource = article.thumbnail.source;
  
  if (!imageError && totalCovers.length > 0 && typeof totalCovers[coverIndex] === 'number') {
    imageSource = getCoverUrl(totalCovers[coverIndex]);
    console.log(`Using cover ID ${totalCovers[coverIndex]} at index ${coverIndex}`);
  }

  // Update image URL when cover index changes
  useEffect(() => {
    if (totalCovers.length > 0 && coverIndex >= 0 && coverIndex < totalCovers.length && !fallbackToThumbnail) {
      const coverId = totalCovers[coverIndex];
      if (coverId && typeof coverId === 'number') {
        const newUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        console.log(`Setting image URL to: ${newUrl} (index: ${coverIndex})`);
        setImageUrl(newUrl);
      }
    } else {
      setImageUrl(article.thumbnail.source);
    }
  }, [totalCovers, coverIndex, article.thumbnail.source, fallbackToThumbnail]);
  
  // Reset fallback when cover index changes
  useEffect(() => {
    setFallbackToThumbnail(false);
  }, [coverIndex]);

  const handleImageError = () => {
    console.log(`Image failed to load: ${imageUrl}`);
    setFallbackToThumbnail(true);
    setImageUrl(article.thumbnail.source);
  };

  return (
    <div
      ref={cardRef}
      className="h-screen w-full flex items-center justify-center snap-start relative"
      onDoubleClick={() => toggleLike(article)}
    >
      {/* Apply the gradient background at the outermost level */}
      <div className="h-full w-full absolute top-0 left-0" style={backgroundStyle}></div>

      <div className="h-full w-full relative z-10">
        {article.thumbnail ? (
          <div className="absolute inset-0 flex items-start pt-[15vh] justify-center">
            <picture>
              {/* Provide different source sizes */}
              <source
                media="(max-width: 640px)"
                srcSet={getResponsiveImageUrl(imageSource, 'M')}
              />
              <source
                media="(min-width: 641px)"
                srcSet={getResponsiveImageUrl(imageSource, 'L')}
              />
              <img
                src={imageError ? article.thumbnail.source : imageSource}
                alt={article.displaytitle}
                width={article.thumbnail.width}
                height={article.thumbnail.height}
                className={`max-h-[65vh] max-w-full transition-opacity duration-300 bg-white ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                srcSet={`
                  ${getResponsiveImageUrl(imageSource, 'S')} 300w,
                  ${getResponsiveImageUrl(imageSource, 'M')} 600w,
                  ${imageSource} 1200w
                `}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 75vw, 50vw"
                loading="eager"
                onLoad={() => setImageLoaded(true)}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            </picture>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-white opacity-70" />
                  <span className="text-white opacity-70 text-sm font-medium">Loading book cover...</span>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gray-900" />
        )}

        {/* Cover counter - only show when multiple covers exist */}
        {totalCovers.length > 1 && (
          <div className="absolute bottom-28 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {coverIndex + 1}/{totalCovers.length}
          </div>
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
})

// Add display name for debugging
BookCard.displayName = 'BookCard';

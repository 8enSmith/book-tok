import { createContext, useState, useEffect, ReactNode } from 'react'
import type { WikiArticle } from '../components/BookCard'
import { Heart } from 'lucide-react'
import '../assets/heartAnimation.css'

interface LikedArticlesContextType {
  likedArticles: WikiArticle[]
  toggleLike: (article: WikiArticle) => void
  isLiked: (pageid: number) => boolean
}

// Export the context so it can be imported by the hook
export const LikedArticlesContext = createContext<LikedArticlesContextType | undefined>(undefined)

export function LikedArticlesProvider({ children }: { children: ReactNode }) {
  const [likedArticles, setLikedArticles] = useState<WikiArticle[]>(() => {
    const saved = localStorage.getItem('likedArticles')
    return saved ? JSON.parse(saved) : []
  })

  const [showHeart, setShowHeart] = useState(false)

  useEffect(() => {
    localStorage.setItem('likedArticles', JSON.stringify(likedArticles))
  }, [likedArticles])

  const toggleLike = (article: WikiArticle) => {
    setLikedArticles(prev => {
      const alreadyLiked = prev.some(a => a.pageid === article.pageid)
      if (alreadyLiked) {
        return prev.filter(a => a.pageid !== article.pageid)
      } else {
        setShowHeart(true)
        setTimeout(() => setShowHeart(false), 800)
        return [...prev, article]
      }
    })
  }

  const isLiked = (pageid: number) => {
    return likedArticles.some(article => article.pageid === pageid)
  }

  return (
    <LikedArticlesContext.Provider value={{ likedArticles, toggleLike, isLiked }}>
      {children}
      {showHeart && (
        <div className="heart-animation">
          <Heart size={200} strokeWidth={0} className="fill-white" />
        </div>
      )}
    </LikedArticlesContext.Provider>
  )
}

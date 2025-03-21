import { Heart } from "lucide-react"
import { ReactNode, useState, useEffect } from "react"
import { WikiArticle } from "../components/BookCard"
import { LikedArticlesContext } from "./LikedArticlesContext"

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
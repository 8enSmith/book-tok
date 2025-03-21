import { createContext } from 'react'
import type { WikiArticle } from '../components/BookCard'
import '../assets/heartAnimation.css'

interface LikedArticlesContextType {
  likedArticles: WikiArticle[]
  toggleLike: (article: WikiArticle) => void
  isLiked: (pageid: number) => boolean
}

// Export the context so it can be imported by the hook
export const LikedArticlesContext = createContext<LikedArticlesContextType | undefined>(undefined)

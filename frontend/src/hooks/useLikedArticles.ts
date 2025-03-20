import { useContext } from 'react'
import { LikedArticlesContext } from '../contexts/LikedArticlesContext'

export function useLikedArticles() {
  const context = useContext(LikedArticlesContext)
  if (!context) {
    throw new Error('useLikedArticles must be used within a LikedArticlesProvider')
  }
  return context
}

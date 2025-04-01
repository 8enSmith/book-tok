import { createContext } from 'react'

// Context to share current background color across components
export const BackgroundColorContext = createContext<string[]>([
  'rgba(0,0,0,0.8)',
  'rgba(40,40,40,0.8)',
])

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'
import { LikedArticlesProvider } from './contexts/LikedArticlesProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LikedArticlesProvider>
      <App />
      <SpeedInsights />
    </LikedArticlesProvider>
  </StrictMode>,
)

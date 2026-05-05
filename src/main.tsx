// @ts-expect-error — no type declarations for variable font CSS import
import '@fontsource-variable/space-grotesk'
import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) {throw new Error('Root element not found')}
createRoot(rootEl).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)

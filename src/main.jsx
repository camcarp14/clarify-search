import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './styles/base.css'

const container = document.getElementById('root')

/**
 * The production build bakes the rendered app into index.html
 * (scripts/prerender.mjs), so the usual createRoot would throw that markup away
 * and rebuild it — a flash of blank page and wasted work. Hydrate it instead.
 *
 * The dev server serves an empty shell, so this falls back to createRoot there.
 * Checking for content rather than an env flag keeps the two paths honest: if
 * prerendering ever silently produces nothing, this degrades to a working
 * client render instead of hydrating against emptiness.
 */
if (container.hasChildNodes()) {
  hydrateRoot(
    container,
    <StrictMode>
      <App />
    </StrictMode>,
  )
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

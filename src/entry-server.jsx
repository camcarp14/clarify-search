import { renderToString } from 'react-dom/server'
import App from './App'

/**
 * Build-time render. Produces the markup that gets baked into index.html so the
 * page ships with its content in the HTML instead of an empty <div id="root">.
 *
 * This matters more here than on most sites: Clarify sells visibility in AI
 * answers, and the answer engines it markets against are far less reliable than
 * Googlebot at executing JavaScript before reading a page. A client-rendered
 * marketing site for an answer-engine-optimisation business is a self-inflicted
 * wound.
 *
 * Effects never run during renderToString, so every ScrollTrigger, SplitText
 * split and Lenis instance stays client-only — exactly the split the section
 * contract already required (no window/document outside useEffect).
 */
export function render() {
  return renderToString(<App />)
}

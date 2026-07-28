/**
 * Global motion debug switch.
 *
 * Turns on `markers: true` for every ScrollTrigger in the app, so you can see
 * exactly where each pin starts and ends.
 *
 * Two ways to turn it on:
 *   1. Per-visit, no rebuild:  http://localhost:5173/?motion-debug
 *   2. Per-environment:        VITE_MOTION_DEBUG=true in .env.local
 *
 * The query-string form is the one you want while tuning — it survives hot
 * reload and does not need the dev server restarted.
 */
// `import.meta.env` only exists inside Vite's pipeline. Optional-chained so
// this module can also be imported by plain Node — the build-time prerender
// step renders the app outside the dev/build define pass, and an unguarded
// read throws there, taking every module that imports DEBUG down with it.
export const DEBUG =
  import.meta.env?.VITE_MOTION_DEBUG === 'true' ||
  (typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('motion-debug'))

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

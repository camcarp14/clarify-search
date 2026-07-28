import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DEBUG, prefersReducedMotion } from './motionDebug'

gsap.registerPlugin(ScrollTrigger)

/**
 * SMOOTH — scroll feel. Tune here, not inside the component.
 */
export const SMOOTH = {
  /** Lower = heavier / more glide. 0.08 is the brief's target. */
  lerp: 0.08,
  /** Multiplies wheel delta. >1 feels faster per notch. */
  wheelMultiplier: 1,
  /** Touch is left at native speed; smoothing touch tends to feel laggy. */
  touchMultiplier: 1.6,
  /** Lenis does not smooth touch by default — keep it that way on phones. */
  smoothTouch: false,
}

/**
 * Wires Lenis to GSAP's ticker and to ScrollTrigger.
 *
 * Order matters and is the single most common source of "my pin jitters":
 *   1. Lenis tells ScrollTrigger to update on every scroll event.
 *   2. GSAP's ticker drives Lenis's rAF (one loop, not two competing ones).
 *   3. lagSmoothing off, or GSAP will skip frames mid-scrub and the pin drifts.
 *
 * Under prefers-reduced-motion Lenis is never constructed at all — the page
 * falls back to the browser's native scroll.
 */
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      lerp: SMOOTH.lerp,
      wheelMultiplier: SMOOTH.wheelMultiplier,
      touchMultiplier: SMOOTH.touchMultiplier,
      smoothWheel: true,
      smoothTouch: SMOOTH.smoothTouch,
    })

    lenis.on('scroll', ScrollTrigger.update)

    // Console handle while tuning: window.__lenis.scrollTo(y, {immediate:true})
    if (DEBUG) window.__lenis = lenis

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
    }
  }, [])

  return children
}

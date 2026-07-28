import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONDITIONS, pick, refreshSoon, setIf } from '../../motion/system'
import { MARQUEE_MOTION as MOTION } from './siteHeader.motion'
import { DEBUG } from '../../lib/motionDebug'
import './Marquee.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * The fourteen strings, in order, from legacy/index.html:1775-1784.
 *
 * Rendered from ONE array mapped TWICE (§5.8). The two <ul>s must be
 * byte-identical: `xPercent: -50` advances the track by exactly one list, so
 * the repeat frame and frame 0 are pixel-identical and the loop is invisible.
 * Add an item to one list only and a visible seam appears every 44 seconds.
 *
 * Three of these carry `&amp;` in the legacy source, which is a literal
 * ampersand — written as a plain `&` here, never as an entity.
 *
 * The `◆` separators are a CSS `li::after` content and are NOT in this data.
 */
const MARQUEE_ITEMS = [
  'Google Ads',
  'Performance Max',
  'Shopping',
  'Technical SEO',
  'Content & On-page',
  'Local SEO',
  'AI Overviews',
  'AI Mode',
  'ChatGPT & Perplexity',
  'Schema & Entities',
  'GA4',
  'Search Console',
  'Tag Manager',
  'Reporting',
]

/**
 * VELOCITY-COUPLED MARQUEE — §B.2.
 *
 * Scrolling down speeds the strip up; scrolling up drags it backwards;
 * standing still lets it ease back to its idle rate. The strip sits in the seam
 * between the hero's unpin and the first band — exactly where a static
 * decoration would announce that the cinematic part is over — so coupling its
 * rate to scroll velocity makes the transition read as one continuous machine.
 *
 * WHY THIS IS "micro" AND NOT "scrub-no-pin": its motion is an infinite loop
 * with a scroll-modulated rate, not a timeline with a start and an end state.
 * There is no progress-0 and progress-1 to author. And it is the opposite of
 * fade-in-on-enter for the simplest possible reason — it never enters. It is
 * always running.
 *
 * WHAT STAYED CSS-ONLY (§5.8), and must: `width: max-content`, the duplicated
 * list, and the fact that -50% is exactly one list. Nothing here measures a
 * width, clones a node or runs a timer. `xPercent` is a percentage of the
 * element's own box, so GSAP never reads a layout value either. Only the
 * *driver* moved from `animation: slide 44s linear infinite` to a tween,
 * because a CSS keyframe cannot be coupled to scroll velocity.
 */
export default function Marquee() {
  const rootRef = useRef(null)
  const trackRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add(CONDITIONS, (ctx) => {
      const { isMobile, isReduced } = ctx.conditions
      const root = rootRef.current
      const track = trackRef.current
      if (!root || !track) return undefined

      const cleanup = () => {
        root.classList.remove('is-live')
        delete root.dataset.motion
      }

      /* =================================================================
       * REDUCED MOTION — §B.2: "No loop tween, no velocity trigger. The
       * track sits at xPercent: 0, static, showing the first copy of the
       * list." Legacy achieved this with `animation: none`; since the driver
       * is now a tween, the branch simply never creates one — and sets the
       * final (== initial) state explicitly, per §C.8 #2.
       * ================================================================= */
      if (isReduced) {
        root.dataset.motion = 'reduced'
        setIf(track, { xPercent: 0 })
        return cleanup
      }

      /* =================================================================
       * FULL MOTION
       * ================================================================= */
      root.dataset.motion = 'full'

      const loop = gsap.to(track, {
        // Exactly half, because the list is duplicated.
        xPercent: MOTION.xPercent,
        duration: pick(MOTION.loopSeconds, isMobile),
        ease: MOTION.ease,
        repeat: -1,
      })

      /* The rate change is routed through quickTo rather than written straight
       * onto loop.timeScale(). getVelocity() is noisy frame to frame, and
       * assigning it raw makes the strip strobe even inside the clamp (§D.6).
       * quickTo reuses one tween and retargets it, so this costs one
       * interpolation per frame and no allocation. */
      const setSpeed = gsap.quickTo(loop, 'timeScale', {
        duration: MOTION.timeScaleSeconds,
        ease: MOTION.timeScaleEase,
      })

      const maxTimeScale = pick(MOTION.maxTimeScale, isMobile)
      const velocityDivisor = pick(MOTION.velocityDivisor, isMobile)

      /* ScrollTrigger only calls onUpdate while the scroll position is
       * changing. If the last update it ever sends carries a non-zero velocity,
       * the strip is left permanently fast. Under Lenis the lerp decays to
       * ~0 before it stops emitting, so this rarely fires — it is the safety
       * net for native scroll and for a flick interrupted by a tap. */
      const idle = gsap
        .delayedCall(MOTION.idleResetSeconds, () =>
          setSpeed(MOTION.idleTimeScale),
        )
        .pause()

      const st = ScrollTrigger.create({
        trigger: root,
        start: MOTION.start,
        end: MOTION.end,
        invalidateOnRefresh: true,
        markers: DEBUG,
        // Drives the will-change discipline (§C.7, §B.13 #7): the track is only
        // a promoted layer while the strip is actually near the viewport.
        onToggle: (self) => root.classList.toggle('is-live', self.isActive),
        onUpdate: (self) => {
          setSpeed(
            gsap.utils.clamp(
              -maxTimeScale,
              maxTimeScale,
              MOTION.idleTimeScale + self.getVelocity() / velocityDivisor,
            ),
          )
          idle.restart(true)
        },
      })

      // Console handle while tuning:
      //   window.__marquee.loop.timeScale()  → the live coupled rate
      if (DEBUG) window.__marquee = { loop, st }

      return () => {
        idle.kill()
        cleanup()
      }
    })

    // Coalesced with every other section's refresh (§A.2). The marquee sits
    // directly under the hero, so its trigger is measured against a document
    // that grows by 250vh the moment the hero's pin spacer is inserted (§D.3).
    refreshSoon()

    return () => mm.revert()
  }, [])

  return (
    /* A <div>, not a <section> — no landmark, no heading, no label. The whole
       strip is aria-hidden: it is decoration, and hiding it is also what stops
       the duplicated list being announced twice. */
    <div className="marquee" aria-hidden="true" ref={rootRef}>
      <div className="marquee-track" ref={trackRef}>
        {[0, 1].map((copy) => (
          <ul key={copy}>
            {MARQUEE_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

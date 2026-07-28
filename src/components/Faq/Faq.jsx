import { Fragment, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import {
  CONDITIONS,
  TRAVEL,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { DISCLOSURE_CSS_VARS, MOTION, SETTLE_DEADLINE_MS } from './faq.motion'
import { EYEBROW, FAQ_ITEMS, HEADING } from './faqData'
import { DEBUG, prefersReducedMotion } from '../../lib/motionDebug'
import './Faq.css'

// A section that forgets to register its own plugins is a bug the section
// should own, so system.js deliberately does not do it (motion-system §A.2).
gsap.registerPlugin(ScrollTrigger, SplitText)

/* ==========================================================================
   ANSWER RUNS
   faqData.js stores each answer as an ordered list of runs: a bare string is
   plain text, `{ strong }` is emphasis. Exactly one answer uses the second
   form — `<strong>whether</strong>` in answer 1, the only emphasis in the
   section and the one that carries the free-vs-paid distinction.

   The alternative everyone reaches for here is dangerouslySetInnerHTML, and it
   is banned in this section (spec R10). Index keys are safe: the data is
   static, authored, and never reordered or filtered.
   ========================================================================== */
function AnswerRuns({ runs }) {
  return runs.map((run, i) =>
    typeof run === 'string' ? (
      <Fragment key={i}>{run}</Fragment>
    ) : (
      <strong key={i}>{run.strong}</strong>
    ),
  )
}

/* ==========================================================================
   FAQ ITEM — one <details>, owning its own disclosure state
   ==========================================================================
   WHY <details> AT ALL. It is free semantics that a div + role="button" has to
   reimplement badly: <summary> is focusable by default, browsers synthesise a
   click for Enter and Space on a focused summary, the pairing is announced as
   a disclosure, find-in-page can reach the collapsed content, and it works with
   JavaScript disabled. Faq.css is written so the no-JS path is the DEFAULT and
   the enhanced two-state path is the override — see the `[data-enhanced]`
   block there.

   WHY TWO PIECES OF STATE, NOT ONE. This is the thing that looks like
   redundancy and is not (spec §3.2 / R3):

     open       drives the native `open` attribute — whether the content is
                laid out at all. It must stay TRUE for the entire collapse, or
                the browser yanks the content out of layout on the first frame
                and there is nothing left to animate.

     visualOpen drives the `faq__item--open` class — the VISUAL state: the
                border tint, the chevron rotation, and the 0fr → 1fr grid
                track. It can be dropped a frame before `open`, and that is
                the entire trick behind a smooth close.

   Collapsing these two into one boolean is the single easiest way to break
   this component, which is why they are named differently and commented here.

   WHAT IS NOT HERE. No height measurement of any kind: no scrollHeight, no
   getBoundingClientRect, no inline style.height, no ResizeObserver. The height
   animation is `grid-template-rows: 0fr → 1fr` in CSS and the browser
   interpolates the intrinsic height for us (motion-system §A.5, the sanctioned
   exception; spec §3.2 "there is NO measured pixel height anywhere").
   ========================================================================== */
function FaqItem({ item }) {
  const summaryId = `faq-q-${item.slug}`
  const bodyId = `faq-a-${item.slug}`

  const [open, setOpen] = useState(item.defaultOpen === true)
  const [visualOpen, setVisualOpen] = useState(item.defaultOpen === true)

  /** True only while a collapse is in flight. It is what tells settle()
   *  whether it is finalising a close or merely reporting the end of an open,
   *  and it is what makes a mid-collapse click re-open instead of being
   *  swallowed. A ref rather than state because nothing renders from it and a
   *  re-render between the click and the transitionend would be pure cost. */
  const collapsingRef = useRef(false)
  /** Handle for the disclosure safety net, either direction. 0 = nothing
   *  armed, which is also what makes clearSafety() idempotent. */
  const safetyRef = useRef(0)

  const clearSafety = () => {
    if (safetyRef.current) {
      clearTimeout(safetyRef.current)
      safetyRef.current = 0
    }
  }

  /* ---- expand, one frame late -------------------------------------------
   * Deferring the class by a frame is ESSENTIAL, not defensive. It forces a
   * style recalculation with the 0fr starting value committed, so 0fr → 1fr is
   * a real transition rather than an unanimated jump. Legacy does exactly this
   * with `requestAnimationFrame(() => d.classList.add('oa'))`; in React a plain
   * setState after setOpen(true) can land in the SAME commit and skip the
   * transition entirely (spec R4).
   *
   * The dependency list is [open] and only [open], which is load-bearing:
   * during a collapse `visualOpen` goes false while `open` stays true, and if
   * visualOpen were a dependency this effect would re-run and immediately
   * re-open the item it is trying to close. */
  useEffect(() => {
    if (!open) return undefined
    const raf = requestAnimationFrame(() => setVisualOpen(true))
    return () => cancelAnimationFrame(raf)
  }, [open])

  /* Nothing else needs unmount cleanup — React owns the click and transitionend
   * handlers, and the rAF above cancels itself. The timeout does not, so it
   * gets its own teardown rather than leaking a setState into a dead tree. */
  useEffect(() => () => clearSafety(), [])

  /* ---- settle -----------------------------------------------------------
   * The end of a disclosure gesture, in EITHER direction. Reached from the
   * body's transitionend, or from the safety timeout when that event never
   * arrives (backgrounded tab, an ancestor going display:none mid-animation,
   * or a browser that does not interpolate `fr` tracks and so has no
   * transition to end at all).
   *
   * Two things happen here and both are load-bearing:
   *
   * 1. A collapse finalises. `open` goes false only NOW, which is why the
   *    content stayed in the layout for the whole 1fr → 0fr shrink instead of
   *    vanishing on the first frame.
   *
   * 2. THE REFRESH OBLIGATION (motion-system §B.10c). The document just
   *    changed height, so every ScrollTrigger below this section — Contact's,
   *    the footer's, the #progress rail — is computing against a stale
   *    measurement. This applies to opening just as much as to closing.
   *    refreshSoon() coalesces to one refresh on the next frame no matter how
   *    many rows report at once, and the transition itself is the debounce.
   *    Skipping this is the bug that gets filed as "the contact form animates
   *    in the wrong place sometimes". */
  const settle = () => {
    clearSafety()
    if (collapsingRef.current) {
      collapsingRef.current = false
      setOpen(false)
    }
    refreshSoon()
  }

  /** Arm the fallback deadline for the gesture that is starting now. Cleared
   *  by settle() the moment transitionend beats it, which is the normal case. */
  const armSettleFallback = () => {
    clearSafety()
    safetyRef.current = setTimeout(settle, SETTLE_DEADLINE_MS)
  }

  const onSummaryClick = (event) => {
    // The native toggle is suppressed on EVERY activation — pointer clicks and
    // the synthetic click the browser fires for Enter/Space on a focused
    // <summary> alike, so keyboard and mouse take the identical path. From
    // here on the component owns `open`.
    event.preventDefault()

    // Read the OS setting at click time. Legacy captured it once at script
    // start and never saw a mid-session change (spec §3.4); reading it at
    // module scope would also touch matchMedia during import, which the SSR
    // rule forbids. prefersReducedMotion() already guards `typeof window`.
    if (prefersReducedMotion()) {
      // No animation, so there is no transition to wait on and nothing to
      // finalise later: both states move together in one update. The CSS half
      // of this is `.faq__body { transition: none }` under the reduced-motion
      // media query in Faq.css — belt and braces, exactly as legacy.
      clearSafety()
      collapsingRef.current = false
      const next = !open
      setOpen(next)
      setVisualOpen(next)
      refreshSoon()
      return
    }

    if (collapsingRef.current) {
      // RE-OPEN MID-COLLAPSE — a deliberate fix, not an accident.
      // Legacy swallowed this click (spec §3.4): `open` was still true so the
      // second click fell into the collapse branch again, removed an
      // already-removed class (a no-op that restarts nothing) and stacked a
      // second transitionend listener. The item finished closing and the user's
      // input vanished. That is worse for keyboard and AT users than for mouse
      // users, because they get no visible feedback that anything was
      // registered at all. `open` is still true here, so putting the visual
      // class back is all that is needed; the CSS transition interpolates from
      // wherever the shrinking track currently sits.
      collapsingRef.current = false
      setVisualOpen(true)
      armSettleFallback()
      return
    }

    if (!open) {
      // EXPAND. `open` first and alone; the class lands one frame later in the
      // effect above.
      setOpen(true)
      armSettleFallback()
      return
    }

    // COLLAPSE. Drop the visual state now — the track transitions 1fr → 0fr —
    // while `open` survives so the content stays laid out and shrinking.
    collapsingRef.current = true
    setVisualOpen(false)
    armSettleFallback()
  }

  const onBodyTransitionEnd = (event) => {
    // React's synthetic transitionend BUBBLES, unlike the native listener
    // legacy attached straight to the body element, so a transition on any
    // descendant lands here too. Both guards are required (spec R5):
    //   target/currentTarget — reject events bubbled up from children;
    //   propertyName        — the card also transitions border-color and the
    //                         chevron transitions transform, and the collapse
    //                         must only finalise on the height track.
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== 'grid-template-rows') return
    settle()
  }

  return (
    <details
      className={`faq__item${visualOpen ? ' faq__item--open' : ''}`}
      open={open}
      data-faq-row
    >
      <summary
        className="faq__summary"
        id={summaryId}
        // aria-controls and aria-expanded are ADDITIONS to legacy, which had
        // neither (spec §2). They are strictly redundant with the native
        // details/summary pairing — the UA already computes aria-expanded from
        // the `open` attribute, and both values here are derived from that same
        // `open` state so they can never disagree with it. They are written out
        // because older Safari + VoiceOver combinations did not announce the
        // native state, and because an explicit relationship is cheap. Note the
        // consequence, which is legacy's too and is accepted (spec §3.3): for
        // the ~400ms of a collapse `open` is still true, so a screen-reader
        // user querying state mid-animation is told "expanded".
        aria-controls={bodyId}
        aria-expanded={open}
        onClick={onSummaryClick}
      >
        {/* The chevron is a CSS ::after on this element — no icon, no <svg>,
            no alt text anywhere in this section. A pseudo-element is invisible
            to assistive tech by construction, which is correct: <summary>
            already announces the state. */}
        <span className="faq__question">{item.question}</span>
      </summary>

      {/* THE DOUBLE WRAPPER IS STRUCTURAL, NOT DECORATION (spec §2).
          .faq__body is the one-row grid whose track animates 0fr → 1fr;
          .faq__clip is the overflow:hidden box that clips the content as the
          track shrinks. Collapsing them into one element breaks the animation:
          a grid item cannot both define the track and clip against it. */}
      <div
        className="faq__body"
        id={bodyId}
        onTransitionEnd={onBodyTransitionEnd}
      >
        <div className="faq__clip">
          {/* Exactly one <p> per item. Its bottom padding lives INSIDE the
              clipped box, so it animates with the content and the open card
              gets its breathing room without a jump at the end. */}
          <p className="faq__answer">
            <AnswerRuns runs={item.answer} />
          </p>
        </div>
      </div>
    </details>
  )
}

/* ==========================================================================
   FAQ — tier: scrub-no-pin (motion-system §B.10)
   ==========================================================================
   SSR SAFETY. Nothing in this module touches window, document, matchMedia or
   navigator at module scope or during render. Refs start null and are never
   read during render. Every DOM read lives inside a useEffect, and the two
   client-only reads that remain — document.fonts and prefersReducedMotion() —
   are both guarded.
   ========================================================================== */
export default function Faq() {
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)

  /* ---- progressive-enhancement flag -------------------------------------
   * Faq.css defaults to the no-JS model, where the native `open` attribute is
   * the only state there is and the browser's own toggle drives everything.
   * This marks the point at which JS is running and the two-state model
   * (`open` laid out / `faq__item--open` visible) takes over.
   *
   * Written imperatively rather than through state on purpose: it must not
   * exist in the server-rendered markup (or the no-JS path would be styled by
   * rules whose class never arrives), and routing it through useState would
   * re-render all nine rows to add one attribute. React never removes an
   * attribute it did not set, so there is nothing to tear down. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    root.dataset.enhanced = 'true'
    return () => {
      delete root.dataset.enhanced
    }
  }, [])

  /* ---- the scroll timeline ---------------------------------------------- */
  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current

        // Scoped to root, never a bare document.querySelectorAll — scoping is
        // what stops twelve parallel builds from finding each other's
        // elements (motion-system §C.2).
        const rows = gsap.utils.toArray('[data-faq-row]', root)

        // SplitText must not run before the webfonts land, or the line boxes
        // it measures are the fallback font's and the masks end up the wrong
        // height. The document.fonts.ready gate at the bottom of this effect is
        // what guarantees this callback is not reached until then.
        const split = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'faq__line',
        })

        const cleanup = () => {
          split.revert()
          root.classList.remove('is-live')
          delete root.dataset.motion
        }

        /* =================================================================
         * REDUCED MOTION — motion-system §C.8
         * No timeline and NO TRIGGER AT ALL. Not scrub:false, not a shorter
         * window. Every animated target is gsap.set() to its FINAL state
         * explicitly, because the CSS default state for an animated element
         * here is its START state and "do nothing" would leave the whole
         * section invisible for exactly the people the setting protects.
         *
         * The disclosure keeps working: it is click-driven, wall-clock, and
         * takes its own reduced-motion branch inside FaqItem.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf(eyebrowRef.current, { opacity: 1, y: 0 })
          setIf(rows, { opacity: 1, y: 0 })

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — scrubbed, not played, and not pinned.
         * ================================================================= */
        root.dataset.motion = 'full'

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit long, so timeline time ===
        // scroll progress and the MOTION numbers read as the storyboard.
        // Same trick as Hero.jsx.
        tl.to({}, { duration: 1 }, 0)

        const eyebrow = MOTION.seq.eyebrow
        const heading = pick(MOTION.seq.heading, isMobile)
        const rowsWin = pick(MOTION.seq.rows, isMobile)
        const copyY = pick(TRAVEL.copy, isMobile)

        /* ---- 0.00 → 0.08 · the eyebrow rises (§B.13 #2) ----
         * Mandated to start `lead` before the H2. This H2 starts at 0.00 and a
         * [0, 1] timeline has nowhere to put -0.02, so the offset clamps. */
        tl.from(
          eyebrowRef.current,
          {
            y: copyY,
            opacity: 0,
            duration: eyebrow.duration,
            ease: eyebrow.ease,
          },
          Math.max(0, heading.start - eyebrow.lead),
        )

        /* ---- 0.00 → 0.20 · H2 masked line rise ----
         * The site's signature gesture (§A.6), identical numbers everywhere.
         * fit() keeps the tween inside its window once the stagger spread is
         * counted: a staggered tween occupies duration + span, not duration. */
        tl.from(
          split.lines,
          {
            yPercent: MOTION.seq.heading.fromYPercent,
            duration: fit(
              heading.end - heading.start,
              (split.lines.length - 1) * MOTION.seq.heading.staggerEach,
            ),
            ease: MOTION.seq.heading.ease,
            stagger: MOTION.seq.heading.staggerEach,
          },
          heading.start,
        )

        /* ---- 0.20 → 0.95 · the nine rows are dealt ----
         * `amount`, not `each`: nine rows at each.base would occupy 0.24 on
         * stagger alone and eat the section (§STAGGER, §B.10). */
        tl.from(
          rows,
          {
            y: copyY,
            opacity: 0,
            duration: fit(
              rowsWin.end - rowsWin.start,
              rowsWin.staggerAmount,
            ),
            ease: MOTION.seq.rows.ease,
            stagger: { amount: rowsWin.staggerAmount },
          },
          rowsWin.start,
        )

        /* immediateRender, deliberately left at the default on all three
         * tweens (motion-system §C.6). The rule is that the FIRST tween
         * touching a given property on a given target keeps immediateRender so
         * it paints progress-0, and every LATER tween on that same property
         * and target must set it false or it stomps that state during the
         * build. Here the three tweens touch three disjoint target sets — the
         * eyebrow span, the split lines, the nine rows — and no property is
         * written twice, so there is nothing to stomp. Setting
         * immediateRender:false on the rows tween would be the actual bug: it
         * is the only tween on those elements, so the rows would sit at full
         * opacity until the scrub first reached 0.20 and then jump. */

        // Console handles while tuning:
        //   window.__faq.st.progress       → where the scrub is
        //   window.__faq.tl.progress(0.5)  → jump the storyboard
        if (DEBUG) window.__faq = { tl, st: tl.scrollTrigger, rows }

        return cleanup
      })

      // Coalesced with every other section's refresh (motion-system §A.2).
      refreshSoon()
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start)
    else start()

    return () => {
      cancelled = true
      // matchMedia owns cleanup: it reverts the SplitText, kills the trigger
      // and undoes every gsap.set. No manual ScrollTrigger.kill() loops here.
      if (mm) mm.revert()
    }
  }, [])

  return (
    <section
      className="faq band tinted"
      // Load-bearing and public. `#faq` is the target of the header nav link,
      // the footer links and sitemap.xml. Do not rename it.
      id="faq"
      ref={rootRef}
      // Not in legacy, which had no role and no labelling on this section.
      // Added to match the convention the rest of the build uses (Hero's
      // aria-labelledby="heroTitle") so the twelve sections expose one
      // consistent outline. Flagged as an addition in the handoff notes.
      aria-labelledby="faqTitle"
      // The disclosure's wall-clock timings, published from faq.motion.js so
      // Faq.css and the component's own timers read one set of numbers.
      style={DISCLOSURE_CSS_VARS}
    >
      <div className="shell faq__grid">
        {/* `.lede` is the shared two-row stack from components.css (display
            grid, gap 14px) — legacy declared it twice and the shared layer
            already collapsed the duplicate. Not re-declared in Faq.css. */}
        <div className="faq__lede lede">
          <span className="mono-label faq__eyebrow" ref={eyebrowRef}>
            {EYEBROW}
          </span>
          <h2 id="faqTitle" ref={headingRef}>
            {HEADING}
          </h2>
        </div>

        {/* The nine <details> are DIRECT children of the list. Legacy's stagger
            ladder depended on that through nth-child; this build drives the
            stagger from GSAP instead, but the grid gap still does, and a
            wrapper element per row would change the layout. */}
        <div className="faq__list">
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}

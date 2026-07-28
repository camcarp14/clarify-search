import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import {
  CONDITIONS,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { MOTION } from './coverage.motion'
import { ORGANIC, PAID, SPINE } from './coverageData'
import { DEBUG } from '../../lib/motionDebug'
import './Coverage.css'

// A section that forgets to register its own plugins is a bug the section
// should own, so system.js deliberately does not do it (motion-system §A.2).
gsap.registerPlugin(ScrollTrigger, SplitText)

/* ==========================================================================
   CURSOR SPOTLIGHT
   Legacy behaviour, ported from legacy/index.html 2935-2944 (spec §3.2).

   Legacy ran a page-wide querySelectorAll for the legacy spotlight class once
   at script time and attached a raw pointermove listener to every match on the
   page — including two panels this file does not own. Two things
   make that wrong in React: it is a cross-component reach into markup this
   file does not own, and the elements it collects unmount. So the hook is
   scoped to this component and the listener is attached through React's
   synthetic `onPointerMove`, which means React owns teardown.

   The writes stay imperative on purpose. Routing pointer coordinates through
   useState would re-render both panels on every mouse move; `setProperty` on
   the element is the correct React answer for a high-frequency style write
   (spec R3). No state, no re-render.

   Deliberate divergences from legacy, both listed in spec §3.2 / R4:
     - Legacy snapshots `(pointer: fine)` and `(prefers-reduced-motion)` once,
       imperatively, at script run, and never listens for `change`. Reading
       matchMedia during render is an SSR hazard AND a stale-value hazard, so
       both queries are read inside an effect and subscribed to. Plugging in a
       mouse or flipping the OS motion setting now takes effect immediately;
       in legacy it did nothing until reload.
     - NOT diverging on throttling: legacy is unthrottled and so is this. A rAF
       wrapper would add a frame of lag to a cursor-tracking effect to save two
       property writes. Reproduced as-is (spec R3 offers the rAF version as
       optional; declined).
     - NOT diverging on pointerleave: legacy has no reset, so the gradient
       centre is stale for one frame when the pointer re-enters. Reproduced
       (spec R11).
   ========================================================================== */
function useSpotlight() {
  // SSR SAFETY: starts false on the server and on the first client render, so
  // markup matches. The real answer lands in the effect, client-only.
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const fine = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    // The double gate is legacy's: fine pointer AND motion not reduced.
    const sync = () => setEnabled(fine.matches && !reduced.matches)
    sync()

    fine.addEventListener('change', sync)
    reduced.addEventListener('change', sync)
    return () => {
      fine.removeEventListener('change', sync)
      reduced.removeEventListener('change', sync)
    }
  }, [])

  const onPointerMove = useCallback((event) => {
    const el = event.currentTarget
    // Element-relative pixels from a fresh rect per event, exactly as legacy.
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--cov-mx', `${event.clientX - rect.left}px`)
    el.style.setProperty('--cov-my', `${event.clientY - rect.top}px`)
  }, [])

  // Returning undefined when the gate is closed means React never attaches the
  // handler at all, rather than attaching one that early-returns.
  return enabled ? onPointerMove : undefined
}

/* ==========================================================================
   PANEL
   Returns the <article> as its ROOT — not a fragment wrapping it, not a <div>
   around it. `.cov-grid` is `grid-template-columns: 1fr 218px 1fr` and must
   have exactly three element children in the order paid → spine → org. Any
   wrapper inserted here collapses the three-column grid (spec R5).
   ========================================================================== */
function CovPanel({ data, panelRef, onPointerMove }) {
  return (
    <article
      className={`cov-panel ${data.modifier}`}
      ref={panelRef}
      onPointerMove={onPointerMove}
    >
      {/* The outer span is the mask; the inner span is the thing that
          translates. Both are display:block in Coverage.css. */}
      <span className="cov-tag">
        <span className="coverage__tag-inner" data-cov-tag>
          {data.tag}
        </span>
      </span>
      <h3>{data.heading}</h3>
      <p>{data.copy}</p>
      <ul className="cov-list">
        {data.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  )
}

export default function Coverage() {
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)
  const paidPanelRef = useRef(null)
  const orgPanelRef = useRef(null)
  const railVRef = useRef(null)
  const railHRef = useRef(null)
  const spineTitleRef = useRef(null)

  const onSpotlightMove = useSpotlight()

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current
        const { seq } = MOTION

        // Scoped queries ONLY. Twelve sections are being built in parallel
        // against this DOM; a bare document.querySelectorAll would find another
        // builder's elements (motion-system §C.2).
        const nodes = gsap.utils.toArray('[data-spine-node]', root)
        const tags = gsap.utils.toArray('[data-cov-tag]', root)
        const panels = [paidPanelRef.current, orgPanelRef.current]
        // Both rails are tweened in BOTH branches. See the note on the axis
        // split further down — the CSS orientation breakpoint (1080px) and the
        // motion breakpoint (900px) are deliberately different, so between
        // 900px and 1080px the desktop storyboard runs against a stacked
        // layout. Driving both rails from the same window means whichever one
        // CSS has chosen to display is always at the correct progress.
        const rails = [railVRef.current, railHRef.current]

        const split = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'coverage__line',
        })

        const cleanup = () => {
          split.revert()
          root.classList.remove('is-live')
        }

        /* =================================================================
         * REDUCED MOTION — everything resolves to its final state.
         * No timeline, no ScrollTrigger, and (this section never pins) no
         * pin to suppress either.
         *
         * This branch MUST gsap.set() explicitly. The CSS resting state of an
         * animated element is its START state, so "do nothing here" leaves
         * half the section invisible for exactly the people the setting exists
         * to protect (motion-system §C.8 #2).
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf([eyebrowRef.current, ledeRef.current, spineTitleRef.current], {
            opacity: 1,
            y: 0,
          })
          setIf(panels, { x: 0, y: 0, opacity: 1 })
          setIf(rails, { scaleX: 1, scaleY: 1 })
          setIf(nodes, { opacity: 1, scale: 1 })
          setIf(tags, { yPercent: 0 })

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — one scrubbed timeline, no pin.
         * ================================================================= */
        root.dataset.motion = 'full'

        /* ---- axis of the convergence ----------------------------------
         * Desktop: the panels sit side by side, so they converge on X.
         * Mobile: the grid collapses and they stack, so they converge on Y —
         * §B.4 mobile. `pick()` exists so the mobile distance is the AUTHORED
         * TRAVEL.converge.mobile and never the desktop number scaled. */
        const converge = pick(seq.panels.from, isMobile)
        const axis = isMobile ? 'y' : 'x'
        const idleAxis = isMobile ? 'x' : 'y'
        const separate = (i) => (i === 0 ? -converge : converge)

        /* ---- progress-0 state, written explicitly ----------------------
         * Every tween below except the headline is a fromTo carrying
         * immediateRender:false, so none of them paints the start state at
         * build time. These sets are what the user sees at progress 0. Same
         * discipline as Hero.jsx's resolve block (motion-system §C.6). */
        setIf(eyebrowRef.current, {
          opacity: 0,
          y: pick(seq.eyebrow.fromY, isMobile),
        })
        setIf(ledeRef.current, { opacity: 0, y: pick(seq.lede.fromY, isMobile) })
        setIf(panels, { [idleAxis]: 0, [axis]: separate, opacity: 1 })
        setIf(railVRef.current, { scaleX: 1, scaleY: 0 })
        setIf(railHRef.current, { scaleX: 0, scaleY: 1 })
        setIf(spineTitleRef.current, {
          opacity: 0,
          y: pick(seq.spineTitle.fromY, isMobile),
        })
        setIf(nodes, { opacity: 0, scale: seq.nodes.fromScale })
        setIf(tags, { yPercent: seq.tags.fromYPercent })

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit long, so timeline time
        // === scroll progress and the MOTION numbers read as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* ---- ~0.00 · eyebrow rises (§B.13 #2) --------------------------
         * The mandate is "0.02 before its H2". The H2 starts at 0.00 and a
         * normalised timeline has no negative time, so this clamps to 0. The
         * lead stays a named constant in coverage.motion.js so the offset
         * applies for free if the headline ever moves later. */
        const eb = seq.eyebrow
        const ebStart = Math.max(0, seq.heading.start - eb.lead)
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: pick(eb.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: eb.span,
            ease: eb.ease,
            immediateRender: false,
          },
          ebStart,
        )

        /* ---- 0.00 → 0.22 · H2 masks up, line by line -------------------
         * THE SIGNATURE GESTURE (§A.6). This is the one tween in the section
         * that keeps GSAP's default immediateRender:true — it is what paints
         * the lines below their masks at progress 0, and it cannot be replaced
         * by a gsap.set because a `from` tween reads its END value off the
         * live DOM. Everything after it is immediateRender:false. */
        const h = seq.heading
        tl.from(
          split.lines,
          {
            yPercent: h.fromYPercent,
            duration: fit(
              h.end - h.start,
              (split.lines.length - 1) * h.staggerEach,
            ),
            ease: h.ease,
            stagger: h.staggerEach,
          },
          h.start,
        )

        /* ---- 0.06 · lede paragraph rises (§B.13 #3) --------------------- */
        const ld = seq.lede
        tl.fromTo(
          ledeRef.current,
          { opacity: 0, y: pick(ld.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: ld.span,
            ease: ld.ease,
            immediateRender: false,
          },
          seq.heading.start + ld.offset,
        )

        /* ---- 0.15 → 0.50 · the panels converge -------------------------
         * Opacity is NOT in this tween and that is the point: the panels are
         * positioned, not revealed. They are legible at progress 0 and the
         * only thing the scroll changes is where they are. No stagger — one
         * symmetric event. */
        const pn = seq.panels
        tl.fromTo(
          panels,
          { [axis]: separate },
          {
            [axis]: 0,
            duration: pn.end - pn.start,
            ease: pn.ease,
            immediateRender: false,
          },
          pn.start,
        )

        /* ---- 0.35 → 0.68 · the spine DRAWS -----------------------------
         * A gauge, not a flourish. EASE.rail ('none') is mandatory: this
         * element must track the finger exactly, because the claim it makes is
         * that it MEASURES what the two panels share (§B.4, §B.13 #6).
         *
         * transform-origin lives in CSS: 50% 0 on the vertical rule so it
         * draws downward, 0 50% on the horizontal one so it draws left to
         * right. Only scale is animated here — transform and opacity only. */
        const sp = seq.spine
        const spDur = sp.end - sp.start
        tl.fromTo(
          railVRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            duration: spDur,
            ease: sp.ease,
            immediateRender: false,
          },
          sp.start,
        )
        tl.fromTo(
          railHRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: spDur,
            ease: sp.ease,
            immediateRender: false,
          },
          sp.start,
        )

        /* ---- 0.35 · the spine title ------------------------------------
         * Addition, flagged in coverage.motion.js: §B.4 does not list this
         * label as a beat, but leaving it static in a fully scrubbed section
         * reads as a bug. Fires with the rule it titles. */
        const st = seq.spineTitle
        tl.fromTo(
          spineTitleRef.current,
          { opacity: 0, y: pick(st.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: st.span,
            ease: st.ease,
            immediateRender: false,
          },
          st.start,
        )

        /* ---- 0.50 → 0.85 · the spine nodes arrive ----------------------
         * Offsets come from node INDEX, never from measurement (§B.4). One
         * staggered tween IS "node i starts at 0.50 + i * STAGGER.each.base",
         * and it stays correct if the node count changes.
         *
         * Mobile gets a grid stagger on the y axis instead: below 1080px the
         * spine is a 2x2, and both nodes in a row share a delay, so the four
         * nodes arrive as the two beats §B.4 asks for. Its `each` is an
         * authored mobile number, not the desktop one scaled. */
        const nd = seq.nodes
        const nodeStagger = isMobile ? MOTION.mobile.nodeStagger : nd.staggerEach
        const nodeSpread = isMobile
          ? (MOTION.mobile.nodeRows - 1) * MOTION.mobile.nodeStagger.each
          : (nodes.length - 1) * nd.staggerEach
        tl.fromTo(
          nodes,
          { opacity: 0, scale: nd.fromScale },
          {
            opacity: 1,
            scale: 1,
            duration: fit(nd.end - nd.start, nodeSpread),
            ease: nd.ease,
            stagger: nodeStagger,
            immediateRender: false,
          },
          nd.start,
        )

        /* ---- 0.80 → 1.00 · the tags mask up last -----------------------
         * The labels are the closing statement, so they are the last thing to
         * resolve. Same mask mechanics as the H2, hand-built: single lines
         * with a fixed shape have nothing to measure. */
        const tg = seq.tags
        tl.fromTo(
          tags,
          { yPercent: tg.fromYPercent },
          {
            yPercent: 0,
            duration: fit(
              tg.end - tg.start,
              (tags.length - 1) * tg.staggerEach,
            ),
            ease: tg.ease,
            stagger: tg.staggerEach,
            immediateRender: false,
          },
          tg.start,
        )

        // Console handle while tuning:
        //   window.__coverage.st.progress    → where the scrub is
        //   window.__coverage.tl.progress(.5) → park the storyboard mid-gesture
        if (DEBUG) {
          window.__coverage = { tl, st: tl.scrollTrigger, nodes, tags, rails }
        }

        return cleanup
      })

      // Coalesced across all twelve sections — one refresh on the next frame,
      // not twelve full layout passes of a ~15,000px document in one.
      refreshSoon()
    }

    // SplitText must not run before the webfonts land, or the line boxes it
    // measures are the fallback font's and the masks end up the wrong height.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start)
    } else {
      start()
    }

    return () => {
      cancelled = true
      // matchMedia owns cleanup: it reverts every tween, every gsap.set and
      // every ScrollTrigger created inside its callbacks, and runs the cleanup
      // function each branch returned. No manual kill loops.
      if (mm) mm.revert()
    }
  }, [])

  return (
    <section
      className="band tinted coverage"
      id="coverage"
      ref={rootRef}
      aria-labelledby="coverageTitle"
    >
      <div className="shell">
        <div className="section-head">
          <div className="lede">
            <span className="mono-label" ref={eyebrowRef}>
              Coverage — what you buy
            </span>
            <h2 id="coverageTitle" ref={headingRef}>
              Three surfaces. <span className="ital">Two you buy.</span>
            </h2>
          </div>
          <p ref={ledeRef}>
            Your business can appear in three places on one results page: the AI
            answer, the ads, and the rankings.{' '}
            <strong>You buy two of them</strong> — paid and organic. The third
            is earned from the same work, which is why it isn't sold separately.
            Pick a side or run both.
          </p>
        </div>

        {/* Exactly three element children, in the order paid → spine → org.
            The three-column grid depends on it (spec R5). */}
        <div className="cov-grid">
          <CovPanel
            data={PAID}
            panelRef={paidPanelRef}
            onPointerMove={onSpotlightMove}
          />

          {/* ACCESSIBILITY FIX, not a port. Legacy ships this as a bare
              <div aria-label="Shared across both channels"> with no role —
              and a div with an aria-label and no role is not exposed by most
              screen readers, so the label announces to nobody. role="group"
              is the minimal fix named in spec §2 and it changes nothing
              visually. */}
          <div
            className="cov-spine"
            role="group"
            aria-label={SPINE.ariaLabel}
          >
            {/* The drawn rule. Legacy paints it with .cov-spine::before, which
                GSAP cannot target, so it is a real element here — same
                geometry, same amber→mint gradient, same .4 opacity. Two of
                them because the CSS orientation flips at 1080px while the
                motion branch flips at 900px; CSS displays one, the timeline
                drives both. */}
            <span
              className="coverage__rail coverage__rail--v"
              aria-hidden="true"
              ref={railVRef}
            />
            <span
              className="coverage__rail coverage__rail--h"
              aria-hidden="true"
              ref={railHRef}
            />

            <p className="spine-title" ref={spineTitleRef}>
              {SPINE.title}
            </p>

            {SPINE.nodes.map((label) => (
              <div className="spine-node" data-spine-node key={label}>
                <strong>{SPINE.lead}</strong>{label}
              </div>
            ))}
          </div>

          <CovPanel
            data={ORGANIC}
            panelRef={orgPanelRef}
            onPointerMove={onSpotlightMove}
          />
        </div>
      </div>
    </section>
  )
}

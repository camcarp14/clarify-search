import { useEffect, useId, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
/* Eases are not imported here on purpose: every one this section uses is
 * composed into MOTION in aiBuild.motion.js, so the owner retimes and re-eases
 * the storyboard from one file. TRAVEL.maskYPercent is the exception — it is
 * the signature gesture's own constant (§A.6) and reads better at the call
 * site than behind another name. */
import {
  CONDITIONS,
  TRAVEL,
  counter,
  fit,
  pick,
  pinnedTrigger,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { MOTION } from './aiBuild.motion'
import {
  ALSO_CHIPS,
  ALSO_LABEL,
  BUILD_CARDS,
  EYEBROW,
  FEED_ROWS,
  MOCK,
  SPARK,
  STATUS,
  STRIP,
} from './aiBuildData'
import { DEBUG } from '../../lib/motionDebug'
import './AiBuild.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const { seq, travel } = MOTION

/** Framer Motion is scoped to component-level micro-interaction only — the
 *  scroll work is entirely GSAP's. Copied from Hero.jsx rather than imported,
 *  because there is no shared export for it yet and a section must not reach
 *  into another section's directory (§C.3). Worth hoisting to a shared module
 *  when someone owns that commit.
 *
 *  This REPLACES legacy's `.mag` magnetic-button loop on this CTA (legacy
 *  2609-2627). §D.9 routes CTA magnetism to Framer Motion and components.css §6
 *  says outright: "If you use Framer Motion, drop `.mag` — FM sets
 *  will-change." Dropping it also removes the one permanent `will-change`
 *  offender §C.7 names by name. Two owners of one transform channel is a fight
 *  nobody wins — legacy already had magnetism and a CSS `:hover` lift writing
 *  the same property. */
const PRESS = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 420, damping: 30 },
}

export default function AiBuild() {
  /* Refs start null and are never read during render — the component must
   * prerender with no window / document / matchMedia access (SSR safety).
   * Everything that touches the DOM lives inside the effect. */
  const rootRef = useRef(null)
  const stageRef = useRef(null)

  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)

  const mockRef = useRef(null)
  const lineRef = useRef(null)
  const areaRef = useRef(null)
  const dotRef = useRef(null)
  const hoursRef = useRef(null)
  const deltaRef = useRef(null)

  const stripRef = useRef(null)
  const priceRef = useRef(null)

  /* The SVG gradient is referenced by `fill="url(#…)"`, which is a
   * document-global id. Legacy hard-codes `mkFill`; a second instance of this
   * mock anywhere on the page would make the second gradient win for both
   * (spec risk 17). useId is SSR-stable, and the colons React puts in it are
   * legal in an id but awkward in a URL fragment, so they are stripped. */
  const rawId = useId()
  const gradientId = `aib-mk-fill-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current

        /* Every group query is SCOPED to this section's root. A bare
         * document.querySelectorAll would find the other eleven sections'
         * elements — that is the failure mode a twelve-way parallel build is
         * built to avoid (§C.2). */
        const cards = gsap.utils.toArray('[data-build-card]', root)
        const idxRest = gsap.utils.toArray('[data-idx-rest]', root)
        const idxAccent = gsap.utils.toArray('[data-idx-accent]', root)
        const alsoItems = gsap.utils.toArray('[data-also-item]', root)
        const statusFaces = gsap.utils.toArray('[data-status-face]', root)
        const chipNums = gsap.utils.toArray('[data-chip-num]', root)
        const allFeedRows = gsap.utils.toArray('[data-feed-row]', root)

        /* §B.8 mobile: three rows, not five. The extra two are hidden by a
         * CSS media query at the same breakpoint (AiBuild.css, "FEED LENGTH")
         * so the pinned frame's LAYOUT agrees with the timeline; slicing here
         * keeps the timeline from spending two beats on rows nobody sees. */
        const feedRows = allFeedRows.slice(0, pick(MOTION.feed.rowsShown, isMobile))

        /* Counters are built here, not at module scope: `counter()` reads its
         * element at call time and the refs are only populated after mount.
         * `decimals` is passed explicitly on every one of them — §D.10 names
         * this section as the known trap, because the hero's shipped
         * `Math.round(readout.v)` would ship "11" where the copy says
         * "11.4". */
        const hoursCounter = counter({
          el: hoursRef.current,
          to: seq.hours.to,
          decimals: seq.hours.decimals,
        })
        const chipCounters = seq.chips.values.map((v, i) =>
          counter({ el: chipNums[i], to: v.to, decimals: v.decimals }),
        )

        let headSplit = null

        const cleanup = () => {
          if (headSplit) headSplit.revert()
          root.classList.remove('is-live')
          delete root.dataset.pin
        }

        /* ==================================================================
         * REDUCED MOTION — every target at its FINAL state. No timeline, no
         * trigger, NO PIN (§C.8). The section occupies exactly its own height
         * and the page scrolls past it normally.
         *
         * This branch must gsap.set() explicitly even where the CSS already
         * agrees. AiBuild.css deliberately holds the FINAL state of every
         * animated property (so a prerendered page that never hydrates shows
         * finished content), but the moment a future edit moves a start state
         * back into CSS, "do nothing here" would leave this section blank for
         * exactly the people the setting exists to protect (§C.8 #2, §D.13 #4).
         *
         * No SplitText is created on this branch: the heading's natural DOM
         * state IS its final state, so splitting it would only add mask
         * wrappers that can mis-wrap on a resize — matchMedia does not re-run
         * unless the 900px boundary is crossed — for no visual gain.
         * ================================================================== */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf([eyebrowRef.current, ledeRef.current], { opacity: 1, y: 0 })
          setIf(cards, { opacity: 1, y: 0 })
          setIf(alsoItems, { opacity: 1, y: 0 })
          /* The 01–03 cross-fade resolves to the accent face. */
          setIf(idxRest, { opacity: 0 })
          setIf(idxAccent, { opacity: 1 })

          setIf(mockRef.current, { opacity: 1, y: 0 })
          /* §B.8 reduced motion: "Sparkline at stroke-dashoffset: 0." */
          setIf(lineRef.current, { strokeDashoffset: 0 })
          setIf(areaRef.current, { opacity: 1 })
          setIf(dotRef.current, { scale: 1 })
          setIf(deltaRef.current, { yPercent: 0 })

          /* §B.8: "Counters set to 11.4 / 94 / 2 directly." */
          hoursCounter.set()
          chipCounters.forEach((c) => c.set())

          /* §B.8: "Status line shows variant 1 only" — the first variant, the
           * one legacy paints into #mkNow as static markup. */
          setIf(statusFaces, { opacity: (i) => (i === 0 ? 1 : 0) })

          /* §B.8: "Feed fully rendered, all rows visible." ALL of them, not
           * `feedRows` — the three-row mobile cut exists to keep five rows
           * from pushing the strip out of a PINNED frame, and there is no pin
           * on this branch. The CSS rule that hides rows 4-5 is scoped to
           * `prefers-reduced-motion: no-preference` for the same reason. */
          setIf(allFeedRows, { opacity: 1, y: 0 })

          setIf(stripRef.current, { opacity: 1, y: 0 })
          setIf(priceRef.current, { yPercent: 0 })

          return cleanup
        }

        /* ==================================================================
         * FULL MOTION — pinned, scrubbed storyboard.
         * ================================================================== */
        root.dataset.motion = 'full'

        /* §D.1 mitigation 3, as a switch rather than a rewrite: the mobile
         * breakpoint can run the identical timeline on the standard scrub
         * window instead of holding the viewport. AiBuild.css keys the
         * 100svh stage off this attribute, so turning the pin off also stops
         * the stage claiming a full viewport it no longer needs. */
        const pinned = !isMobile || MOTION.pinMobile
        root.dataset.pin = pinned ? 'on' : 'off'

        headSplit = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'aib__line',
        })

        const copyY = pick(travel.copy, isMobile)
        const cardY = pick(travel.card, isMobile)
        const panelY = pick(travel.panel, isMobile)

        const tl = gsap.timeline({
          scrollTrigger: pinned
            ? pinnedTrigger({
                trigger: root, //              the SECTION
                pinTarget: stageRef.current, // an INNER element, never the trigger
                vh: pick(MOTION.pin, isMobile),
                root,
              })
            : scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        /* Normalises the timeline to exactly 1 unit long, so timeline time ===
         * scroll progress and every number in aiBuild.motion.js reads as the
         * storyboard. Same trick as Hero. Nothing below may end after 1.0 or
         * this stops being true. */
        tl.to({}, { duration: 1 }, 0)

        /* --------------------------------------------------------------- *
         * IMMEDIATERENDER LEDGER (§C.6)
         * A scrubbed timeline is built all at once, then seeked. The FIRST
         * fromTo touching a given property on a given element keeps the
         * default immediateRender:true — that is what paints progress 0.
         * Every later tween on that same property carries
         * immediateRender:false or it stomps the painted state during the
         * build, and progress-0 shows the LAST tween's `from` values.
         *
         * In this section exactly one group is touched twice: the four
         * stacked status faces, each of which fades in on its own switch and
         * out on the next one. Those are the only immediateRender:false
         * flags below, and each is annotated at its call site.
         * --------------------------------------------------------------- */

        /* ---- 0.00 → 0.15 · the section head ---- */
        const hd = seq.head
        const h2Start = hd.start + hd.eyebrowLead
        const h2Dur = hd.end - h2Start

        /* §A.6 THE SIGNATURE GESTURE — identical numbers on every h2 on the
         * site. yPercent 110 (not 100) so descenders and the Instrument Serif
         * italic's tail clear the mask edge completely. */
        tl.fromTo(
          headSplit.lines,
          { yPercent: TRAVEL.maskYPercent },
          {
            yPercent: 0,
            duration: fit(h2Dur, (headSplit.lines.length - 1) * hd.lineStaggerEach),
            ease: hd.lineEase,
            stagger: hd.lineStaggerEach,
          },
          h2Start,
        )

        /* §B.13 #2 — the eyebrow leads its h2 by `eyebrowLead`. */
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: copyY },
          { opacity: 1, y: 0, duration: hd.copyDur, ease: hd.copyEase },
          hd.start,
        )

        /* §B.13 #3 — the lede trails the h2's START by `ledeLag`. */
        tl.fromTo(
          ledeRef.current,
          { opacity: 0, y: copyY },
          { opacity: 1, y: 0, duration: hd.copyDur, ease: hd.copyEase },
          h2Start + hd.ledeLag,
        )

        /* ---- 0.15 → 0.35 · the three build cards arrive ---- */
        const cd = seq.cards
        const cardStagger = pick(cd.staggerEach, isMobile)
        tl.fromTo(
          cards,
          { opacity: 0, y: cardY },
          {
            opacity: 1,
            y: 0,
            duration: fit(cd.end - cd.start, (cards.length - 1) * cardStagger),
            ease: cd.ease,
            stagger: cardStagger,
          },
          cd.start,
        )

        /* 0.22 → 0.35 · 01–03 cross-fade muted → iris. Two stacked faces, both
         * tweened: fading only the accent one in leaves the muted glyph
         * showing through the antialiasing and the pair reads as a double
         * image (§A.4 rule 2, §B.13 #5). */
        const idxDur = fit(cd.idxEnd - cd.idxStart, (cards.length - 1) * cardStagger)
        tl.fromTo(
          idxAccent,
          { opacity: 0 },
          {
            opacity: 1,
            duration: idxDur,
            ease: cd.idxEase,
            stagger: cardStagger,
          },
          cd.idxStart,
        )
        tl.fromTo(
          idxRest,
          { opacity: 1 },
          {
            opacity: 0,
            duration: idxDur,
            ease: cd.idxEase,
            stagger: cardStagger,
          },
          cd.idxStart,
        )

        /* ---- 0.26 → 0.38 · the "Also built" row ripples in ----
         * Label plus six chips on one tight cascade. See the note in
         * aiBuild.motion.js: §B.8's table has no beat for this row, and a
         * static block inside a pinned frame is the one thing §0 forbids. */
        const al = seq.also
        tl.fromTo(
          alsoItems,
          { opacity: 0, y: copyY },
          {
            opacity: 1,
            y: 0,
            duration: fit(al.end - al.start, al.staggerAmount),
            ease: al.ease,
            /* `amount` — a TOTAL spread, not a per-item one. Seven targets
             * (the label plus six chips) is over §A.2's boundary, and `each`
             * there would occupy more of the timeline than the beat owns. */
            stagger: { amount: al.staggerAmount },
          },
          al.start,
        )

        /* ---- 0.32 → 0.44 · the mock arrives as ONE unit ----
         * One tween on the <figure>, no internal stagger: the window bar
         * cannot rise independently of the panel it is welded to without the
         * mock visibly tearing. Its window chrome — dots, title, `live` pill —
         * rides along, which is what §B.8's "as one unit" asks for. The pill's
         * pulse is a CSS animation gated on `.is-live`, never a GSAP target. */
        const ch = seq.chrome
        tl.fromTo(
          mockRef.current,
          { opacity: 0, y: panelY },
          {
            opacity: 1,
            y: 0,
            duration: ch.end - ch.start,
            ease: ch.ease,
          },
          ch.start,
        )

        /* ---- 0.44 → 0.72 · THE SPARKLINE DRAWS ----
         * stroke-dashoffset is sanctioned exception 1 (§A.5) — there is no
         * transform that reveals a path along its own length. EASE.rail is
         * mandatory: this is a gauge the user must read as attached to the
         * finger, and an eased rail reads as input lag (§B.13 #6). */
        const sp = seq.spark
        const sparkDur = sp.end - sp.start
        tl.fromTo(
          lineRef.current,
          { strokeDashoffset: sp.dashFrom },
          { strokeDashoffset: 0, duration: sparkDur, ease: sp.lineEase },
          sp.start,
        )

        /* The area under the line cross-fades on OPACITY, never on dashoffset
         * — the other half of the §A.5 rule. */
        tl.fromTo(
          areaRef.current,
          { opacity: 0 },
          { opacity: 1, duration: sparkDur, ease: sp.areaEase },
          sp.start,
        )

        /* 0.70 → 0.78 · the head dot pops once the line has reached it. */
        tl.fromTo(
          dotRef.current,
          { scale: 0 },
          { scale: 1, duration: sp.dotDur, ease: sp.dotEase },
          sp.dotStart,
        )

        /* 0.44 → 0.72 · the hours counter runs WITH the line. Same window,
         * same ease — the number and the sparkline are one datum drawn twice,
         * and a disagreement at the midpoint reads as the mock being fake.
         * immediateRender:false because the JSX already renders "0.0", which
         * is legacy's own progress-0 text (§1.4); letting the tween paint it
         * would be a second owner of the same string. */
        const hr = seq.hours
        tl.fromTo(
          hoursCounter.readout,
          hoursCounter.from,
          {
            ...hoursCounter.to,
            duration: hr.end - hr.start,
            ease: hr.ease,
            immediateRender: false,
          },
          hr.start,
        )

        /* ---- 0.66 → 0.74 · "▲ 3.2 more than last week" masks up ----
         * The signature gesture on one line, hand-rolled: the element sits in
         * an overflow-hidden wrapper (AiBuild.css `.aib__mask`) and rides
         * yPercent out of it. Same distance and ease as every masked line on
         * the site. */
        const dl = seq.delta
        tl.fromTo(
          deltaRef.current,
          { yPercent: TRAVEL.maskYPercent },
          { yPercent: 0, duration: dl.end - dl.start, ease: dl.ease },
          dl.start,
        )

        /* ---- 0.72 → 0.88 · the two stat-chip counters ----
         * Each counter is its own object, so each is the first tween on its
         * own target and the ledger above does not apply to them.
         * immediateRender:false for the same reason as the hours counter. */
        const cp = seq.chips
        const chipStagger = pick(cp.staggerEach, isMobile)
        const chipDur = fit(
          cp.end - cp.start,
          (chipCounters.length - 1) * chipStagger,
        )
        chipCounters.forEach((c, i) => {
          tl.fromTo(
            c.readout,
            c.from,
            {
              ...c.to,
              duration: chipDur,
              ease: cp.ease,
              immediateRender: false,
            },
            cp.start + i * chipStagger,
          )
        })

        /* ---- the status line walks its four stacked variants ----
         * Four layers, opacity, EASE.tint — never a textContent swap, because
         * a text mutation cannot be scrubbed backwards (§D.9). Variant i takes
         * over at `switchAt[i]`, so the section closes on variant 3.
         *
         * THE ONE PLACE IN THIS SECTION WHERE §C.6 BITES: each face is touched
         * by two opacity tweens — its own fade-in, and the fade-out that the
         * NEXT switch triggers. The fade-in is created first and keeps the
         * default immediateRender, which is what paints progress 0; every
         * fade-out carries immediateRender:false so it cannot stomp it. */
        const st = seq.status
        st.switchAt.forEach((at, i) => {
          if (i > 0) {
            tl.fromTo(
              statusFaces[i - 1],
              { opacity: 1 },
              {
                opacity: 0,
                duration: st.dur,
                ease: st.ease,
                immediateRender: false,
              },
              at,
            )
          }
          tl.fromTo(
            statusFaces[i],
            { opacity: 0 },
            { opacity: 1, duration: st.dur, ease: st.ease },
            at,
          )
        })

        /* ---- 0.82 → 0.97 · the feed rows drop in ----
         * Authored data revealed by the scrub, not a ticker (§B.8). Legacy's
         * 4600ms interval and the `feedIn` keyframe it relied on are both
         * gone; the rows' opacity and y belong to this tween and to nothing
         * else, which is what keeps the §0.1 flicker out of the section. */
        const fd = seq.feed
        tl.fromTo(
          feedRows,
          { opacity: 0, y: copyY },
          {
            opacity: 1,
            y: 0,
            duration: fit(
              fd.end - fd.start,
              (feedRows.length - 1) * fd.staggerEach,
            ),
            ease: fd.ease,
            stagger: fd.staggerEach,
          },
          fd.start,
        )

        /* ---- 0.90 → 1.00 · the strip rises, then the price masks up last ---- */
        const sr = seq.strip
        tl.fromTo(
          stripRef.current,
          { opacity: 0, y: panelY },
          {
            opacity: 1,
            y: 0,
            duration: sr.panelDur,
            ease: sr.panelEase,
          },
          sr.start,
        )
        tl.fromTo(
          priceRef.current,
          { yPercent: TRAVEL.maskYPercent },
          { yPercent: 0, duration: sr.priceDur, ease: sr.priceEase },
          sr.priceStart,
        )

        /* Console handle while tuning:
         *   window.__aibuild.st.progress        → where the scrub is
         *   window.__aibuild.tl.progress(0.55)  → jump the storyboard
         * §C.10 #10: park it at 0.25 / 0.50 / 0.75 and check every gesture is
         * visibly PARTIAL at each. Anything that reads 0 or 1 at all three is
         * fade-in-on-enter wearing a scrub. */
        if (DEBUG) {
          window.__aibuild = { tl, st: tl.scrollTrigger, feedRows, statusFaces }
        }

        return cleanup
      })

      refreshSoon()
    }

    /* SplitText must not run before the webfonts land, or the line boxes it
     * measures are the fallback font's and the masks end up the wrong
     * height. Same guard as Hero.jsx (§A.6). */
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start)
    } else {
      start()
    }

    return () => {
      cancelled = true
      if (mm) mm.revert()
    }
  }, [])

  return (
    /* `id="ai-build"` is load-bearing: the header nav's "AI Builds" link, the
     * footer and sitemap.xml all point at it (§B, spec risk 24).
     * `data-accent="iris"` is the shared accent contract from components.css
     * §3 — it publishes --acc / --acc-soft / --acc-rgb for this subtree, which
     * is exactly what legacy's `#ai-build { --acc: var(--iris) … }` did by
     * hand. Reused rather than re-declared. */
    <section
      className="band tinted aib"
      id="ai-build"
      data-accent="iris"
      ref={rootRef}
      aria-labelledby="aiBuildTitle"
    >
      <div className="aib__stage" ref={stageRef}>
        <div className="shell">
          <div className="section-head">
            <div className="lede">
              <span className="mono-label" ref={eyebrowRef}>
                {EYEBROW}
              </span>
              {/* One inline `.ital` span, exactly where legacy puts it. Written
                  as JSX children rather than an HTML string so the emphasis
                  boundary and the surrounding spaces cannot drift (risk 1). */}
              <h2 id="aiBuildTitle" ref={headingRef}>
                Machines decide how you're found. Now they can{' '}
                <span className="ital">do the work too</span>.
              </h2>
            </div>
            <p ref={ledeRef}>
              Same operator, same flat-fee terms, other side of the same problem.
              Search is about being legible to machines. This is about putting them
              to work inside the business.
            </p>
          </div>

          <div className="build-grid">
            {BUILD_CARDS.map((card) => (
              <article className="build-card" key={card.num} data-build-card>
                {/* Decorative numbering, aria-hidden in legacy and kept that
                    way — which is also what makes the stacked accent twin
                    free: neither face is announced. */}
                <span className="build-idx" aria-hidden="true">
                  <span className="aib__idx-face aib__idx-face--rest" data-idx-rest>
                    {card.num}
                  </span>
                  <span className="aib__idx-face aib__idx-face--accent" data-idx-accent>
                    {card.num}
                  </span>
                </span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

          {/* In legacy the "Also built: " label is a bare text node inside the
              <p>. It is a <span> here so the timeline can stagger it with the
              chips; AiBuild.css strips the chip pill styling back off it,
              declaration for declaration, so it renders identically (risk 23). */}
          <p className="build-also">
            <span className="aib__also-label" data-also-item>
              {ALSO_LABEL}
            </span>
            {ALSO_CHIPS.map((chip) => (
              <span key={chip} data-also-item>
                {chip}
              </span>
            ))}
          </p>

          {/* aria-labelledby="mockCap" makes the figcaption the figure's
              accessible name. The literal id is preserved rather than
              generated: there is one instance on the page, and both halves of
              the association have to come from the same source (risk 20). */}
          <figure className="mock" aria-labelledby="mockCap" ref={mockRef}>
            <div className="mock-bar" aria-hidden="true">
              <span className="mock-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="mock-title">{MOCK.title}</span>
              <span className="mock-live">{MOCK.live}</span>
            </div>

            <div className="mock-grid">
              <div className="mk-left">
                <span className="mk-label">{MOCK.hoursLabel}</span>
                <span className="mk-hero">
                  <b className="mk-num" ref={hoursRef}>
                    {MOCK.heroInitial}
                  </b>
                  <em>{MOCK.hoursUnit}</em>
                </span>
                {/* Mask wrapper for the delta's line rise. The top margin
                    moves onto the wrapper so the mask edge sits tight to the
                    type instead of 7px above it. */}
                <span className="aib__mask aib__mask--delta">
                  <span className="mk-delta" ref={deltaRef}>
                    {MOCK.delta}
                  </span>
                </span>

                <svg
                  className="mk-spark"
                  viewBox={SPARK.viewBox}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SPARK.fillFrom} />
                      <stop offset="100%" stopColor={SPARK.fillTo} />
                    </linearGradient>
                  </defs>
                  <path
                    className="mk-area"
                    ref={areaRef}
                    d={SPARK.area}
                    fill={`url(#${gradientId})`}
                  />
                  <path className="mk-line" ref={lineRef} d={SPARK.line} />
                  <circle
                    className="mk-dot"
                    ref={dotRef}
                    cx={SPARK.dot.cx}
                    cy={SPARK.dot.cy}
                    r={SPARK.dot.r}
                  />
                </svg>

                <div className="mk-chips">
                  {MOCK.chips.map((chip) => (
                    <div className="mk-chip" key={chip.label}>
                      <b className="mk-num" data-chip-num>
                        {chip.initial}
                      </b>
                      <em>{chip.unit}</em>
                      <span>{chip.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mk-right">
                <div className="mk-now">
                  <span className="mk-pulse" aria-hidden="true" />
                  {/* Four stacked variants in one grid cell, identical type
                      metrics, cross-faded on opacity (§A.4 rule 2). Variant 0
                      keeps the legacy id and stays in the accessibility tree;
                      the other three are aria-hidden so the same sentence is
                      not announced four times. Deliberately NOT aria-live —
                      a 3.3s announcement cadence would be hostile (risk 19). */}
                  <span className="aib__status">
                    <span
                      className="mk-now-txt aib__status-face"
                      id="mkNow"
                      data-status-face
                    >
                      {STATUS[0]}
                    </span>
                    {STATUS.slice(1).map((line) => (
                      <span
                        className="mk-now-txt aib__status-face"
                        key={line}
                        aria-hidden="true"
                        data-status-face
                      >
                        {line}
                      </span>
                    ))}
                  </span>
                </div>

                <ul className="mk-feed" id="mkFeed" aria-label={MOCK.feedLabel}>
                  {FEED_ROWS.map((row) => (
                    <li key={row.id} data-feed-row>
                      <span className="mf-t">{row.time}</span>
                      {/* `em` is the one entry that carries markup in legacy
                          (`<b>Tue 3:00pm</b>`). It is data here, not an HTML
                          string — no dangerouslySetInnerHTML for one <b>. */}
                      <span className="mf-d">
                        {row.pre}
                        {row.em ? <b>{row.em}</b> : null}
                        {row.post}
                      </span>
                      <span className={`mf-tag ${row.tag}`}>{row.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <figcaption id="mockCap" className="mock-cap">
              Illustration, not a real client. Yours gets built around the jobs your
              team actually repeats — and{' '}
              <strong>nothing sends without your say-so</strong> until you decide it
              should.
            </figcaption>
          </figure>

          <div className="build-strip" ref={stripRef}>
            <div className="bs-main">
              <span className="bs-kicker">{STRIP.kicker}</span>
              {/* The <strong> stops after "begins." — the emphasis boundary is
                  copy, not styling (§C.9). */}
              <p>
                <strong>
                  A free scoping call, then a fixed price before any work begins.
                </strong>{' '}
                If automation isn't worth it for your case, you'll be told that —
                it's a faster answer than a proposal.
              </p>
            </div>
            <div className="bs-side">
              <span className="aib__mask aib__mask--price">
                <span className="bs-price" ref={priceRef}>
                  <span className="from">{STRIP.priceFrom}</span>
                  {STRIP.price}
                </span>
              </span>
              {/* `data-offer` is the forward contract with #contact's
                  `#lf-service` select (risk 15). The section is not built yet;
                  dropping the attribute in the meantime would silently delete
                  the handshake. Matching is by option-TEXT equality, so the em
                  dash in the value matters. */}
              <motion.a
                className="cta"
                href="#contact"
                data-offer={STRIP.offer}
                {...PRESS}
              >
                {STRIP.cta}
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
/* Eases, beats, staggers and travel distances are NOT imported here — they are
 * composed into MOTION in diagnosis.motion.js, so the storyboard reads as one
 * object and the owner tunes by editing numbers in one file. Only the helpers
 * and the canonical trigger factory are needed at this level. */
import {
  CONDITIONS,
  counter,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system.js'
import { MOTION } from './diagnosis.motion.js'
import { DEBUG } from '../../lib/motionDebug.js'
import './Diagnosis.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

/* ==========================================================================
   COPY
   Every string below is byte-exact from legacy/index.html lines 1786-1825.
   The only non-ASCII character anywhere in this section is the em dash
   U+2014, and it appears exactly THREE times: the lede paragraph, card 2's
   body, and the standard-strip paragraph. (The section spec says "twice" —
   that is a miscount in the spec, verified against the legacy source.)
   Every apostrophe is a straight ASCII ' — do NOT "typographically
   improve" them to U+2019; this section has none, and the one curly apostrophe
   in the whole legacy file lives in AI Build. `optimizes` and `prioritized`
   are US spellings and are shipped copy.
   ========================================================================== */

const PAIN_POINTS = [
  {
    id: 'overlap',
    title: 'Paying for clicks you already earn.',
    body: 'Ad budget quietly bids on terms the site already ranks for, because nobody checks the overlap.',
  },
  {
    id: 'tracking',
    title: 'Tracking is lying.',
    body: 'Duplicated or missing conversions poison both channels — Google optimizes ads and content toward bad data.',
  },
  {
    id: 'rankings',
    title: "Rankings that don't pay rent.",
    body: "Organic traffic lands on pages that can't convert; content chases volume instead of buyers.",
  },
  {
    id: 'vendors',
    title: 'Two vendors, no strategy.',
    body: "The ads person and the SEO person have never spoken. The results page doesn't care about your org chart.",
  },
]

/** `value` is the RESTING string and is what prerender / no-JS renders. The two
 *  numeric ones are overwritten by the scrubbed counters at runtime; `1:1` is a
 *  literal colon between two ones, not a ratio glyph, and is never counted. */
const METRICS = [
  { id: 'hours', value: '48h', label: 'Audit target' },
  { id: 'contracts', value: '0', label: 'Long contracts' },
  { id: 'contact', value: '1:1', label: 'Direct contact' },
]

/**
 * SplitText runs with the default `aria: 'auto'`, which aria-hides every line
 * wrapper and republishes the heading's accessible name from
 * `element.textContent`. This heading carries a decorative stacked twin of the
 * words "one page" (the ink layer of the cross-fade), so textContent would
 * announce "…Google runs it as one pageone page." — a real regression.
 *
 * Compute the name from a detached clone with the aria-hidden layer stripped,
 * and write it back after the split. The copy string itself still lives in
 * exactly one place (the JSX below); nothing is duplicated into JS.
 */
const accessibleHeadingText = (el) => {
  const clone = el.cloneNode(true)
  clone.querySelectorAll('[data-onepage-ink]').forEach((n) => n.remove())
  return (clone.textContent || '').replace(/\s+/g, ' ').trim()
}

export default function Diagnosis() {
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)
  const gridRef = useRef(null)
  const seamRef = useRef(null)
  const onePageInkRef = useRef(null)
  const stripRef = useRef(null)

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      // Refs are only read here — never during render, never at module scope.
      if (cancelled || !rootRef.current || !headingRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current
        const grid = gridRef.current
        const heading = headingRef.current
        const seq = MOTION.seq

        /* ---- scoped queries ONLY. A bare document.querySelectorAll here is
         *      how twelve parallel sections start finding each other's nodes. */
        const cards = gsap.utils.toArray('[data-pain]', root)
        const metricInners = gsap.utils.toArray('[data-metric-inner]', root)
        const hoursEl = root.querySelector('[data-metric="hours"]')
        const contractsEl = root.querySelector('[data-metric="contracts"]')

        /* ---- headline lines (§A.6, the site's one repeated gesture) ----
         * `ignore` is passed the ink twin as an ELEMENT, not a selector —
         * SplitText resolves selector strings against the whole document. */
        const label = accessibleHeadingText(heading)
        const split = new SplitText(heading, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'diagnosis__line',
          ignore: onePageInkRef.current,
        })
        heading.setAttribute('aria-label', label)

        /* ---- counters (§B.13 #4 — shared readout, explicit decimals) ---- */
        const cfg = MOTION.counters
        const cHours = counter({
          el: hoursEl,
          from: cfg.hours.from,
          to: cfg.hours.to,
          decimals: cfg.hours.decimals,
          suffix: cfg.hours.suffix,
        })
        const cContracts = counter({
          el: contractsEl,
          from: cfg.contracts.from,
          to: cfg.contracts.to,
          decimals: cfg.contracts.decimals,
          suffix: cfg.contracts.suffix,
        })

        /* ---- which silo each card belongs to, MEASURED not assumed ----
         * The CSS column ladder (4-across > 1080px, 2x2 at 761-1080px, single
         * column <= 760px) and the motion breakpoint (899px) do not line up, so
         * a hard-coded "cards 1-2 are the left silo" is wrong between 900 and
         * 1080px, where the grid is already 2x2 and the left silo is cards 1
         * and 3. offsetLeft / offsetTop are LAYOUT positions and are unaffected
         * by the transforms this timeline writes, so they stay correct mid-tween.
         *
         * Re-measured on every ScrollTrigger refresh, same pattern as Hero.jsx,
         * so a resize across a column breakpoint re-pairs the cards. */
        const axis = pick(MOTION.split.axis, isMobile)
        const vertical = axis === 'y'
        const geom = new Map()
        const measure = () => {
          if (!grid) return
          const counts = [0, 0]
          const centre = (vertical ? grid.clientHeight : grid.clientWidth) / 2
          cards.forEach((el) => {
            const mid = vertical
              ? el.offsetTop + el.offsetHeight / 2
              : el.offsetLeft + el.offsetWidth / 2
            const silo = mid < centre ? 0 : 1
            geom.set(el, { sign: silo === 0 ? -1 : 1, order: counts[silo]++ })
          })
        }
        measure()
        ScrollTrigger.addEventListener('refreshInit', measure)

        const cleanup = () => {
          ScrollTrigger.removeEventListener('refreshInit', measure)
          split.revert()
          root.classList.remove('is-live')
          delete root.dataset.motion
        }

        /* =================================================================
         * REDUCED MOTION
         * Everything resolves to its FINAL state. No timeline, no trigger, no
         * pin (this section never pins anyway). Every animated target is set
         * explicitly: two of them — the seam and the ink twin — have a CSS
         * resting state that is their START state, so "do nothing" would leave
         * a lit seam across the card grid forever and "one page" permanently
         * muted. That is the regression §C.8 #2 exists to prevent.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf(
            [eyebrowRef.current, ledeRef.current, stripRef.current],
            { opacity: 1, y: 0 },
          )
          setIf(cards, { x: 0, y: 0 })
          setIf(seamRef.current, { opacity: 0 })
          setIf(onePageInkRef.current, { opacity: 1 })
          setIf(metricInners, { yPercent: 0 })
          cHours.set()
          cContracts.set()

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — scrubbed, NOT pinned.
         *
         * IMMEDIATE RENDER (§C.6): every tween below is the first and only one
         * to touch its property on its target, so each keeps GSAP's default
         * immediateRender:true — that is what paints progress 0 (silos apart,
         * seam lit, "one page" muted, strip low, metrics under their masks).
         * The two counter tweens are the exception: they are handed a painted
         * progress-0 state by hand and therefore opt out. If you add a SECOND
         * tween to any target here, it must carry immediateRender:false or it
         * will stomp the progress-0 frame during the build.
         * ================================================================= */
        root.dataset.motion = 'full'

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit, so timeline time === scroll
        // progress and diagnosis.motion.js reads as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* ---- 0.00 → 0.08 · eyebrow ---- */
        const eb = seq.eyebrow
        if (eyebrowRef.current) {
          tl.from(
            eyebrowRef.current,
            {
              opacity: 0,
              y: pick(eb.travel, isMobile),
              duration: eb.duration,
              ease: eb.ease,
            },
            eb.start,
          )
        }

        /* ---- 0.00 → 0.22 · H2 masks up, line by line (§A.6) ---- */
        const hd = seq.heading
        if (split.lines.length) {
          tl.from(
            split.lines,
            {
              yPercent: hd.fromYPercent,
              duration: fit(
                hd.end - hd.start,
                (split.lines.length - 1) * hd.staggerEach,
              ),
              ease: hd.ease,
              stagger: hd.staggerEach,
            },
            hd.start,
          )
        }

        /* ---- 0.06 → 0.21 · lede paragraph ---- */
        const ld = seq.lede
        if (ledeRef.current) {
          tl.from(
            ledeRef.current,
            {
              opacity: 0,
              y: pick(ld.travel, isMobile),
              duration: ld.duration,
              ease: ld.ease,
            },
            ld.start,
          )
        }

        /* ---- 0.18 → 0.55 · the two silos travel together ----
         * One transform channel only: x on desktop, y on mobile. The cards
         * never change opacity — they are being POSITIONED, not revealed. The
         * pain grid keeps its `overflow: hidden` (it is what draws the rounded
         * slab and the 1px hairlines), so the outermost card in each silo is
         * clipped by the frame at progress 0. That is the intended read: two
         * slabs sliding under one frame, not four cards fading up. */
        const si = seq.silos
        if (cards.length) {
          const dist = pick(si.travel, isMobile)
          const siloStagger = pick(MOTION.split.stagger, isMobile)
          const siloSpan =
            Math.max(0, ...cards.map((el) => geom.get(el)?.order ?? 0)) *
            siloStagger

          tl.fromTo(
            cards,
            { [axis]: (i, el) => (geom.get(el)?.sign ?? 0) * dist },
            {
              [axis]: 0,
              duration: fit(si.end - si.start, siloSpan),
              ease: si.ease,
              // Stagger WITHIN a silo, not across all four: card 1 leads card
              // 2 and card 3 leads card 4, so the two halves move as a pair.
              stagger: (i, el) => (geom.get(el)?.order ?? 0) * siloStagger,
            },
            si.start,
          )
        }

        /* ---- 0.30 → 0.55 · the seam closes ----
         * Finishes at exactly the progress the silos meet. The seam vanishing
         * IS "they sit in the seam between them". */
        const sm = seq.seam
        if (seamRef.current) {
          tl.fromTo(
            seamRef.current,
            { opacity: 1 },
            { opacity: 0, duration: sm.end - sm.start, ease: sm.ease },
            sm.start,
          )
        }

        /* ---- 0.42 → 0.60 · "one page" cross-fades muted → ink ----
         * Two stacked layers, opacity only (rule 2 / §B.13 #5), exactly the
         * hero's `.hero__face--neutral` / `.hero__face--coded` mechanism. Never
         * a colour tween: a colour tween repaints text on every frame and the
         * midpoint of a colour interpolation between two warm neutrals is mud. */
        const op = seq.onePage
        if (onePageInkRef.current) {
          tl.fromTo(
            onePageInkRef.current,
            { opacity: 0 },
            { opacity: 1, duration: op.end - op.start, ease: op.ease },
            op.start,
          )
        }

        /* ---- 0.62 → 0.85 · the standard strip rises ---- */
        const st = seq.strip
        if (stripRef.current) {
          tl.fromTo(
            stripRef.current,
            { opacity: 0, y: pick(st.travel, isMobile) },
            {
              opacity: 1,
              y: 0,
              duration: st.end - st.start,
              ease: st.ease,
            },
            st.start,
          )
        }

        /* ---- 0.78 → 1.00 · the three metrics mask up ---- */
        const mt = seq.metrics
        const metricStagger = pick(MOTION.metrics.stagger, isMobile)
        if (metricInners.length) {
          tl.from(
            metricInners,
            {
              yPercent: mt.fromYPercent,
              duration: fit(
                mt.end - mt.start,
                (metricInners.length - 1) * metricStagger,
              ),
              ease: mt.ease,
              stagger: metricStagger,
            },
            mt.start,
          )
        }

        /* ---- 0.78 → 1.00 · …and two of them count ----
         * `48h` counts up from 0. `0` counts DOWN from 12 — the copy claims
         * zero long contracts and the joke only lands if you watch it get
         * there. Both are gauges, so both ride EASE.rail: a number that stops
         * tracking the finger near the ends of its window reads as input lag.
         *
         * Progress 0 is painted by hand with `.set(from)`, so these two opt out
         * of immediateRender rather than relying on GSAP's build-time render of
         * an onUpdate-driven text write. */
        cHours.set(cfg.hours.from)
        cContracts.set(cfg.contracts.from)
        if (hoursEl) {
          tl.fromTo(
            cHours.readout,
            cHours.from,
            {
              ...cHours.to,
              duration: mt.end - mt.start,
              ease: cfg.hours.ease,
              immediateRender: false,
            },
            mt.start,
          )
        }
        if (contractsEl) {
          tl.fromTo(
            cContracts.readout,
            cContracts.from,
            {
              ...cContracts.to,
              duration: mt.end - mt.start,
              ease: cfg.contracts.ease,
              immediateRender: false,
            },
            mt.start,
          )
        }

        // Console handle while tuning:
        //   window.__diagnosis.st.progress      → where the scrub is
        //   window.__diagnosis.tl.progress(0.4) → park the storyboard
        if (DEBUG) {
          window[MOTION.debugKey] = { tl, st: tl.scrollTrigger, cards, geom }
        }

        return cleanup
      })

      // Coalesced with every other section's refresh — see system.js.
      refreshSoon()
    }

    // SplitText must not run before the webfonts land, or the line boxes it
    // measures belong to the fallback font and the masks end up the wrong
    // height. Same guard as Hero.jsx.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start)
    else start()

    return () => {
      cancelled = true
      if (mm) mm.revert()
    }
  }, [])

  return (
    /* `id` is a public URL fragment (sitemap.xml, header nav, footer) and is
       preserved from legacy exactly. `border-top: 0` is NOT an inline style
       here — it is `.diagnosis` in Diagnosis.css. It exists because the marquee
       directly above already draws a border-bottom; if <Marquee /> is not
       rendered above <Diagnosis /> this section loses its top edge entirely.
       See the note in Diagnosis.css. */
    <section className="band diagnosis" id="diagnosis" ref={rootRef}>
      <div className="shell">
        <div className="section-head">
          <div className="lede">
            <span className="mono-label" ref={eyebrowRef}>
              Diagnosis
            </span>
            <h2 ref={headingRef}>
              Most businesses run search as two silos. Google runs it as{' '}
              {/* Two stacked layers, per rule 2. The in-flow span is the real,
                  announced text and starts muted; the absolutely-positioned
                  twin is aria-hidden, unselectable, and fades in over it. The
                  wrapper is white-space: nowrap so SplitText can never need to
                  clone it across a line break. */}
              <span className="ital diagnosis__onepage">
                <span className="diagnosis__onepage-face">one page</span>
                <span
                  className="diagnosis__onepage-face diagnosis__onepage-face--ink"
                  data-onepage-ink
                  aria-hidden="true"
                  ref={onePageInkRef}
                >
                  one page
                </span>
              </span>
              .
            </h2>
          </div>
          {/* Must stay a DIRECT child of .section-head — the shared rule is
              `.section-head > p`, and wrapping it silently drops its styling. */}
          <p ref={ledeRef}>
            The expensive problems are rarely inside either channel. They sit in
            the seam between them — which is exactly where nobody is looking.
          </p>
        </div>

        <div className="diagnosis__pain-grid" ref={gridRef}>
          {PAIN_POINTS.map((p) => (
            <article className="diagnosis__pain" key={p.id} data-pain>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
          {/* Decorative. Absolutely positioned, so it takes no grid cell. */}
          <span
            className="diagnosis__seam"
            aria-hidden="true"
            ref={seamRef}
          />
        </div>

        <div className="diagnosis__standard" ref={stripRef}>
          <p>
            <strong>The Clarify standard:</strong> every engagement leaves a
            trail — written diagnosis, prioritized fixes, documented changes.
          </p>
          <div className="diagnosis__metrics">
            {METRICS.map((m) => (
              <div className="diagnosis__metric" key={m.id}>
                <span className="diagnosis__metric-inner" data-metric-inner>
                  <strong
                    className="diagnosis__metric-value"
                    data-metric={m.id}
                  >
                    {m.value}
                  </strong>
                  <span className="diagnosis__metric-label">{m.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

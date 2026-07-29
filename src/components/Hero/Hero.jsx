import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { MOTION, MOBILE_QUERY, DESKTOP_QUERY } from './hero.motion'
import { QUERY, ROWS, VERDICT_LABEL } from './heroSerp'
import { counter as makeCounter, setIf } from '../../motion/system'
import { DEBUG } from '../../lib/motionDebug'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const { seq, pin, intro, counter } = MOTION

/** Framer Motion is scoped to component-level micro-interaction only — the
 *  scroll work is entirely GSAP's. */
const PRESS = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 420, damping: 30 },
}

export default function Hero() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const headlineRef = useRef(null)
  const panelRef = useRef(null)
  const queryRef = useRef(null)
  const caretRef = useRef(null)
  const railRef = useRef(null)
  const counterRef = useRef(null)
  const counterLineRef = useRef(null)
  const resolveRef = useRef(null)

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(
        {
          isDesktop: `${DESKTOP_QUERY} and (prefers-reduced-motion: no-preference)`,
          isMobile: `${MOBILE_QUERY} and (prefers-reduced-motion: no-preference)`,
          isReduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { isMobile, isReduced } = ctx.conditions
          const root = rootRef.current
          const panel = panelRef.current

          const rowEls = gsap.utils.toArray('[data-row]', panel)
          const byId = (id) => rowEls.find((el) => el.dataset.row === id)
          const paidRow = byId('paid')
          const ownedRow = byId('org1')
          const leakRow = paidRow

          const marks = gsap.utils.toArray('[data-verdict]', panel)
          const strike = panel.querySelector('[data-strike]')
          const resolveItems = gsap.utils.toArray(
            '[data-resolve-item]',
            resolveRef.current,
          )

          /* ---- headline lines ---- */
          const split = new SplitText(headlineRef.current, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'hero__line',
          })

          /* ---- the query, split into characters for the type-on ---- */
          const qSplit = new SplitText(queryRef.current, {
            type: 'chars',
            charsClass: 'hero__qchar',
          })

          const readout = makeCounter({
            el: counterRef.current,
            to: counter.to,
            suffix: counter.suffix,
          })

          let detachMeasure = null
          const cleanup = () => {
            split.revert()
            qSplit.revert()
            if (detachMeasure) detachMeasure()
            root.classList.remove('is-live')
          }

          /* =================================================================
           * REDUCED MOTION — the finished frame, no pin, no timeline.
           * ================================================================= */
          if (isReduced) {
            root.dataset.motion = 'reduced'
            setIf(qSplit.chars, { opacity: 1 })
            setIf(caretRef.current, { opacity: 0 })
            setIf(marks, { opacity: 1, x: 0 })
            setIf(railRef.current, { scaleY: 1 })
            // The leak is shown already resolved: struck through and gone.
            setIf(strike, { scaleX: 1 })
            setIf(leakRow, { display: 'none' })
            setIf([counterLineRef.current, ...resolveItems], { opacity: 1, y: 0 })
            readout.set()
            return cleanup
          }

          /* =================================================================
           * FULL MOTION
           * ================================================================= */
          root.dataset.motion = 'full'
          const pinVh = isMobile ? pin.mobileVh : pin.desktopVh

          // Everything the scrub or the intro animates starts explicitly set,
          // so no tween has to infer a "from" off the stylesheet.
          setIf(qSplit.chars, { opacity: 0 })
          setIf(marks, { opacity: 0, x: seq.mark.labelFromX })
          setIf(railRef.current, { scaleY: 0 })
          setIf(strike, { scaleX: 0 })
          setIf([counterLineRef.current, ...resolveItems], {
            opacity: 0,
            y: seq.resolve.copyFromY,
          })

          /* ---------------- INTRO — once, on load ---------------- */
          const eyebrow = root.querySelector('.hero__eyebrow')
          const tlIn = gsap.timeline({ delay: intro.startDelay })

          tlIn.from(
            split.lines,
            {
              yPercent: intro.headlineFromYPercent,
              duration: intro.headlineDuration,
              ease: intro.ease,
              stagger: intro.headlineStagger,
            },
            0,
          )
          if (eyebrow) {
            tlIn.from(
              eyebrow,
              { opacity: 0, y: 10, duration: intro.eyebrowDuration, ease: intro.ease },
              0,
            )
          }
          tlIn.from(
            panel,
            {
              opacity: 0,
              y: intro.panelFromY,
              scale: intro.panelFromScale,
              duration: intro.panelDuration,
              ease: intro.ease,
            },
            intro.eyebrowDuration * 0.4,
          )
          tlIn.from(
            rowEls,
            {
              opacity: 0,
              y: intro.rowFromY,
              duration: intro.rowDuration,
              ease: intro.ease,
              stagger: intro.rowStagger,
            },
            intro.eyebrowDuration * 0.4 + 0.25,
          )

          /* ---------------- SCRUB ---------------- */
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => `+=${pinVh}%`,
              pin: stageRef.current,
              pinSpacing: true,
              scrub: pin.scrub,
              anticipatePin: pin.anticipatePin,
              invalidateOnRefresh: true,
              markers: DEBUG,
              onToggle: (self) => root.classList.toggle('is-live', self.isActive),
            },
          })

          // Normalises the timeline to exactly 1 unit, so timeline time IS
          // scroll progress and the numbers in hero.motion.js read as written.
          tl.to({}, { duration: 1 }, 0)

          /* ---- 0.00 → 0.22 · the query types in ---- */
          const q = seq.query
          tl.to(
            qSplit.chars,
            {
              opacity: 1,
              duration: 0.001,
              ease: q.ease,
              stagger: { amount: q.end - q.start },
              immediateRender: false,
            },
            q.start,
          )
          tl.to(
            caretRef.current,
            { opacity: 0, duration: 0.04, immediateRender: false },
            q.end,
          )

          /* ---- 0.22 → 0.50 · mark the overlap ---- */
          const mk = seq.mark
          const markDur = Math.max(mk.end - mk.start - mk.stagger, 0.05)
          tl.to(
            [paidRow, ownedRow],
            {
              '--verdict': 1,
              duration: markDur,
              ease: mk.ease,
              stagger: mk.stagger,
              immediateRender: false,
            },
            mk.start,
          )
          tl.to(
            marks,
            {
              opacity: 1,
              x: 0,
              duration: markDur,
              ease: mk.ease,
              stagger: mk.stagger,
              immediateRender: false,
            },
            mk.start,
          )
          tl.to(
            railRef.current,
            {
              scaleY: 1,
              duration: mk.railEnd - mk.railStart,
              ease: mk.railEase,
              immediateRender: false,
            },
            mk.railStart,
          )

          /* ---- 0.50 → 0.78 · strike the bought click, collapse it out ---- */
          const cu = seq.cull
          tl.to(
            strike,
            {
              scaleX: 1,
              duration: cu.strikeEnd - cu.start,
              ease: cu.strikeEase,
              immediateRender: false,
            },
            cu.start,
          )
          tl.to(
            leakRow,
            {
              opacity: 0,
              x: cu.exitX,
              duration: cu.end - cu.strikeEnd,
              ease: cu.collapseEase,
              immediateRender: false,
            },
            cu.strikeEnd,
          )
          // Closing the gap is a REFLOW OF THE ROWS BELOW, not a height tween
          // on the row leaving. scaleY collapses the culled row visually but
          // reclaims none of its space — it shipped leaving a white hole where
          // the sponsored result had been. Sliding the survivors up by the
          // culled row's measured height closes it for real, and stays
          // transform-only so no frame triggers layout.
          let leakH = leakRow.offsetHeight
          const measureLeak = () => {
            leakH = leakRow.offsetHeight
          }
          ScrollTrigger.addEventListener('refreshInit', measureLeak)
          detachMeasure = () =>
            ScrollTrigger.removeEventListener('refreshInit', measureLeak)
          measureLeak()

          const below = rowEls.slice(rowEls.indexOf(leakRow) + 1)
          tl.to(
            leakRow,
            {
              scaleY: 0,
              transformOrigin: 'top center',
              duration: cu.end - cu.strikeEnd,
              ease: cu.reflowEase,
              immediateRender: false,
            },
            cu.strikeEnd,
          )
          if (below.length) {
            tl.to(
              below,
              {
                y: () => -leakH,
                duration: cu.end - cu.strikeEnd,
                ease: cu.reflowEase,
                immediateRender: false,
              },
              cu.strikeEnd,
            )
          }

          // A DELIBERATE, SCOPED EXCEPTION to transform-and-opacity-only.
          // The rows reflow by transform, but the panel is a box sized by three
          // rows and keeps that height — leaving 103px of blank inside the card
          // once one row leaves, which reads as a rendering bug rather than as
          // a result being removed. Closing the container is the one case a
          // height tween is the honest answer, and this is ONE element, so
          // there is no layout storm: the rule exists to stop dozens of
          // elements triggering layout per frame, not to ban a single box from
          // ever resizing.
          tl.to(
            panel,
            {
              height: () => panel.offsetHeight - leakH,
              duration: cu.end - cu.strikeEnd,
              ease: cu.reflowEase,
              immediateRender: false,
            },
            cu.strikeEnd,
          )
          tl.to(
            railRef.current,
            {
              opacity: 0,
              duration: (cu.end - cu.strikeEnd) * 0.5,
              immediateRender: false,
            },
            cu.strikeEnd,
          )

          /* ---- 0.78 → 1.00 · counter, copy, unpin ---- */
          const rs = seq.resolve
          tl.to(
            counterLineRef.current,
            { opacity: 1, y: 0, duration: 0.05, ease: rs.ease, immediateRender: false },
            rs.start,
          )
          tl.fromTo(
            readout.readout,
            readout.from,
            {
              ...readout.to,
              duration: rs.counterEnd - rs.start,
              ease: rs.counterEase,
              immediateRender: false,
            },
            rs.start,
          )
          tl.to(
            resolveItems,
            {
              opacity: 1,
              y: 0,
              duration: Math.max(rs.end - rs.copyStart, 0.04),
              ease: rs.ease,
              stagger: rs.copyStaggerEach,
              immediateRender: false,
            },
            rs.copyStart,
          )

          if (DEBUG) window.__hero = { tl, tlIn, st: tl.scrollTrigger, rowEls }

          return cleanup
        },
      )

      ScrollTrigger.refresh()
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
      if (mm) mm.revert()
    }
  }, [])

  return (
    <section className="hero" id="top" ref={rootRef} aria-labelledby="heroTitle">
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__content">
          <div className="hero__top">
            <span className="hero__eyebrow">
              <span className="hero__dot hero__dot--a" aria-hidden="true" />
              <span className="hero__dot hero__dot--b" aria-hidden="true" />
              <span className="hero__dot hero__dot--c" aria-hidden="true" />
              Paid · organic · AI search · Chicago
            </span>

            <h1 id="heroTitle" className="hero__headline" ref={headlineRef}>
              Own more of the results page — the clicks you{' '}
              <em className="ital pay">buy</em> and the ones you{' '}
              <em className="ital earn">earn</em>.
            </h1>
          </div>

          {/* The artifact. aria-hidden because it is an illustration of a
              results page, and every claim it makes is stated in the copy
              around it. */}
          <div className="hero__serp" ref={panelRef} aria-hidden="true">
            <div className="hero__serp-bar">
              <span className="hero__serp-dots">
                <i />
                <i />
                <i />
              </span>
              <span className="hero__serp-omni">
                <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
                  <circle
                    cx="7"
                    cy="7"
                    r="4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M10.5 10.5 14 14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="hero__serp-query" ref={queryRef}>
                  {QUERY}
                </span>
                <span className="hero__serp-caret" ref={caretRef} />
              </span>
            </div>

            <div className="hero__serp-rows">
              {/* The rail linking the click you bought to the one you owned. */}
              <span className="hero__serp-rail" ref={railRef} />

              {ROWS.map((r) => (
                <div
                  key={r.id}
                  className={`hero__serp-row is-${r.kind}${
                    r.verdict ? ` has-verdict is-${r.verdict}` : ''
                  }`}
                  data-row={r.id}
                >
                  <span className="hero__serp-tag">
                    {r.tag}
                    {r.badge ? <em className="hero__serp-badge">{r.badge}</em> : null}
                  </span>

                  {r.url ? <span className="hero__serp-url">{r.url}</span> : null}

                  <span className="hero__serp-title">
                    {r.title}
                    {r.trailing ? (
                      <span className="hero__serp-trailing"> {r.trailing}</span>
                    ) : null}
                    {r.leak ? <span className="hero__serp-strike" data-strike /> : null}
                  </span>

                  {r.note ? <span className="hero__serp-note">{r.note}</span> : null}

                  {r.verdict ? (
                    <span className="hero__serp-verdict" data-verdict>
                      {VERDICT_LABEL[r.verdict]}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="hero__resolve" ref={resolveRef}>
            <p className="hero__counter-line" ref={counterLineRef}>
              <span className="hero__counter" ref={counterRef}>
                0%
              </span>
              <span className="hero__counter-label">
                Est. spend waste · example account
              </span>
            </p>

            <p className="hero__copy" data-resolve-item>
              Clarify audits how your business shows up in Google —{' '}
              <strong>paid ads, organic rankings, and AI answers</strong> — then
              fixes what&rsquo;s leaking. Flat fees, month-to-month, no agency
              theater.
            </p>

            <div className="hero__actions" data-resolve-item>
              <motion.a className="cta" href="#pricing" {...PRESS}>
                Get a free leak check →
              </motion.a>
              <motion.a className="secondary-cta" href="#method" {...PRESS}>
                See how it works
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

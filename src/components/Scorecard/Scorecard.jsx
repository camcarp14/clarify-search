import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import {
  CONDITIONS,
  counter as makeCounter,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { MOTION } from './scorecard.motion'
import {
  BUSINESS,
  CHANNELS,
  CIRC,
  DISCLAIMER,
  EYEBROW,
  HEADLINE_ITAL,
  HEADLINE_LEAD,
  INST,
  LEDE,
  LVL_LABEL,
} from './scorecardData'
import './Scorecard.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

/** Dash offset for a given 0-100 score on the r=52 ring. */
const offsetFor = (score) => CIRC - (CIRC * score) / 100

export default function Scorecard() {
  const [channel, setChannel] = useState('paid')
  const data = INST[channel]

  const rootRef = useRef(null)
  const headingRef = useRef(null)
  const panelRef = useRef(null)
  const ledeRef = useRef(null)
  const ringRef = useRef(null)
  const ringNumRef = useRef(null)
  const verdictRef = useRef(null)
  const rowsRef = useRef(null)
  const liveRef = useRef(null)
  /** Set once the scroll reveal has run, so a channel swap afterwards animates
   *  from the revealed state instead of re-running the entrance. */
  const revealedRef = useRef(false)

  /* ---------------------------------------------------------------- scroll */
  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return
      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current

        const split = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'sc__line',
        })

        const ring = ringRef.current
        const verdictItems = gsap.utils.toArray('[data-vitem]', verdictRef.current)
        const rowEls = gsap.utils.toArray('[data-scrow]', rowsRef.current)
        const bars = rowEls.map((r) => r.querySelector('[data-bar]'))

        const readout = makeCounter({ el: ringNumRef.current, to: data.score })

        const cleanup = () => {
          split.revert()
          root.classList.remove('is-live')
        }

        /* ---- reduced motion: the finished frame ---- */
        if (isReduced) {
          revealedRef.current = true
          setIf(ring, { strokeDashoffset: offsetFor(data.score) })
          setIf([panelRef.current, ledeRef.current], { opacity: 1, y: 0 })
          setIf(verdictItems, { opacity: 1, y: 0 })
          setIf(rowEls, { opacity: 1, y: 0 })
          bars.forEach((b, i) => setIf(b, { scaleX: data.rows[i].s / 100 }))
          readout.set()
          return cleanup
        }

        /* ---- explicit starting state ---- */
        setIf(ring, { strokeDashoffset: CIRC })
        setIf([panelRef.current, ledeRef.current], {
          opacity: 0,
          y: MOTION.panel.fromY,
        })
        setIf(verdictItems, { opacity: 0, y: MOTION.verdict.fromY })
        setIf(rowEls, { opacity: 0, y: MOTION.rows.fromY })
        bars.forEach((b) => setIf(b, { scaleX: 0 }))

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({
            trigger: root,
            root,
            isMobile,
            extra: {
              // Once the reveal has played through, later channel swaps drive
              // the ring and bars directly rather than through this timeline.
              onUpdate: (self) => {
                if (self.progress > 0.98) revealedRef.current = true
              },
            },
          }),
        })
        tl.to({}, { duration: 1 }, 0)

        const hd = MOTION.heading
        tl.from(
          split.lines,
          {
            yPercent: hd.fromYPercent,
            duration: Math.max(
              hd.end - hd.start - (split.lines.length - 1) * hd.staggerEach,
              0.05,
            ),
            ease: hd.ease,
            stagger: hd.staggerEach,
          },
          hd.start,
        )

        const pn = MOTION.panel
        tl.to(
          [panelRef.current, ledeRef.current],
          {
            opacity: 1,
            y: 0,
            duration: pn.end - pn.start,
            ease: pn.ease,
            stagger: (pn.end - pn.start) * 0.25,
            immediateRender: false,
          },
          pn.start,
        )

        const rg = MOTION.ring
        tl.to(
          ring,
          {
            strokeDashoffset: offsetFor(data.score),
            duration: rg.end - rg.start,
            ease: rg.ease,
            immediateRender: false,
          },
          rg.start,
        )
        tl.fromTo(
          readout.readout,
          readout.from,
          {
            ...readout.to,
            duration: rg.end - rg.start,
            ease: rg.numEase,
            immediateRender: false,
          },
          rg.start,
        )

        const vd = MOTION.verdict
        tl.to(
          verdictItems,
          {
            opacity: 1,
            y: 0,
            duration: Math.max(
              vd.end - vd.start - (verdictItems.length - 1) * vd.staggerEach,
              0.05,
            ),
            ease: vd.ease,
            stagger: vd.staggerEach,
            immediateRender: false,
          },
          vd.start,
        )

        const rw = MOTION.rows
        const rowDur = Math.max(
          rw.end - rw.start - (rowEls.length - 1) * rw.staggerEach,
          0.06,
        )
        tl.to(
          rowEls,
          {
            opacity: 1,
            y: 0,
            duration: rowDur,
            ease: rw.ease,
            stagger: rw.staggerEach,
            immediateRender: false,
          },
          rw.start,
        )
        bars.forEach((bar, i) => {
          tl.to(
            bar,
            {
              scaleX: data.rows[i].s / 100,
              duration: rowDur,
              ease: rw.barEase,
              immediateRender: false,
            },
            rw.start + rw.barOffset + i * rw.staggerEach,
          )
        })

        return cleanup
      })

      ScrollTrigger.refresh()
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start)
    else start()

    return () => {
      cancelled = true
      if (mm) mm.revert()
    }
    // The reveal is built for the channel that was current when it mounted;
    // swaps afterwards are handled imperatively below, so this must not re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* --------------------------------------------------------------- channel */
  const swap = useCallback(
    (next) => {
      if (next === channel) return
      setChannel(next)
      const d = INST[next]
      if (liveRef.current) {
        liveRef.current.textContent = `${d.sub}. Score ${d.score} out of 100. ${d.flag}.`
      }
    },
    [channel],
  )

  /**
   * Re-animate the instrument AFTER a channel swap has committed.
   *
   * This cannot live in the click handler. The rows are keyed by title, so
   * switching channel replaces every row node — the handler would tween the
   * outgoing DOM while the incoming bars sat at their CSS default of scaleX(0),
   * which is exactly what shipped: ring and copy correct, all four bars empty.
   *
   * Skipped on mount, and skipped until the scroll reveal has finished, since
   * until then the section's timeline still owns these properties.
   */
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (!revealedRef.current) return

    const d = INST[channel]
    const s = MOTION.swap

    if (ringRef.current) {
      gsap.to(ringRef.current, {
        strokeDashoffset: offsetFor(d.score),
        duration: s.ringSeconds,
        ease: s.ease,
        overwrite: 'auto',
      })
    }
    if (ringNumRef.current) {
      const c = makeCounter({ el: ringNumRef.current, to: d.score })
      c.readout.v = Number(ringNumRef.current.textContent) || 0
      gsap.to(c.readout, {
        ...c.to,
        duration: s.ringSeconds,
        ease: s.ease,
        overwrite: 'auto',
      })
    }

    const rowEls = gsap.utils.toArray('[data-scrow]', rowsRef.current)
    gsap.fromTo(
      rowEls,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: s.fadeSeconds * 2,
        ease: s.ease,
        stagger: s.fadeSeconds * 0.4,
        overwrite: 'auto',
      },
    )
    rowEls.forEach((row, i) => {
      const bar = row.querySelector('[data-bar]')
      if (!bar || !d.rows[i]) return
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: d.rows[i].s / 100,
          duration: s.barSeconds,
          ease: s.ease,
          delay: i * s.fadeSeconds * 0.4,
          overwrite: 'auto',
        },
      )
    })
  }, [channel])

  const onKeyDown = (e) => {
    const i = CHANNELS.findIndex((c) => c.key === channel)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      swap(CHANNELS[(i + 1) % CHANNELS.length].key)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      swap(CHANNELS[(i - 1 + CHANNELS.length) % CHANNELS.length].key)
    }
  }

  return (
    <section className="band sc" id="scorecard" ref={rootRef} data-ch={channel}>
      <div className="shell">
        <div className="section-head">
          <div className="lede">
            <span className="mono-label">{EYEBROW}</span>
            <h2 ref={headingRef}>
              {HEADLINE_LEAD}
              <span className="ital">{HEADLINE_ITAL}</span>.
            </h2>
          </div>
          <p ref={ledeRef}>{LEDE}</p>
        </div>

        <div className="sc__panel" ref={panelRef}>
          <div className="sc__top">
            <span className="mono-label">Account scorecard</span>
            <div
              className="sc__tabs"
              role="radiogroup"
              aria-label="Scorecard channel"
              onKeyDown={onKeyDown}
            >
              {CHANNELS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={`sc__tab is-${c.key}`}
                  role="radio"
                  aria-checked={channel === c.key}
                  tabIndex={channel === c.key ? 0 : -1}
                  onClick={() => swap(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <header className="sc__head">
            <strong className="sc__biz">{BUSINESS}</strong>
            <span className="sc__sub">{data.sub}</span>
          </header>

          {/* Two columns from 1080px up: the instrument (ring + verdict) on a
              left rail, the graded rows on the right. Below that it collapses
              back to a single stack. Without this the panel capped at 780px in
              a 1200px shell and left 420px of blank paper beside it. */}
          <div className="sc__body">
            <div className="sc__score">
              <div className="sc__ring" role="img" aria-label={`Score ${data.score} out of 100`}>
                <svg viewBox="0 0 120 120" width="118" height="118" aria-hidden="true">
                  <defs>
                    <linearGradient id="scRingGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="var(--amber)" />
                      <stop offset="1" stopColor="var(--mint)" />
                    </linearGradient>
                  </defs>
                  <circle className="sc__ring-track" cx="60" cy="60" r="52" />
                  <circle
                    className="sc__ring-fill"
                    ref={ringRef}
                    cx="60"
                    cy="60"
                    r="52"
                    transform="rotate(-90 60 60)"
                    style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC }}
                  />
                </svg>
                <div className="sc__ring-label" aria-hidden="true">
                  <strong ref={ringNumRef}>0</strong>
                  <span>/ 100</span>
                </div>
              </div>

              <div className="sc__verdict" ref={verdictRef}>
                <span className="sc__flag" data-vitem>
                  {data.flag}
                </span>
                <p data-vitem>{data.verdict}</p>
                <div className="sc__minis" data-vitem>
                  {data.minis.map((m) => (
                    <div key={m.l}>
                      <strong className={m.cls}>{m.v}</strong>
                      <span>{m.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <ul className="sc__rows" ref={rowsRef}>
              {data.rows.map((r) => (
                <li className="sc__row" key={r.t} data-scrow>
                  <div className="sc__row-top">
                    <span className="sc__row-title">{r.t}</span>
                    <span className={`sc__row-value is-${r.lvl}`}>
                      {LVL_LABEL[r.lvl]} · {r.s}
                    </span>
                  </div>
                  <div className="sc__bar" aria-hidden="true">
                    <i className={`sc__bar-fill is-${r.lvl}`} data-bar />
                  </div>
                  <p className="sc__row-note">{r.n}</p>
                </li>
              ))}
            </ul>
          </div>

          <p className="sc__foot">{DISCLAIMER}</p>
        </div>

        <span className="sr-only" role="status" aria-live="polite" ref={liveRef} />
      </div>
    </section>
  )
}

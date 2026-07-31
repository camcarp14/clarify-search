import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { counter as makeCounter, setIf } from '../../motion/system'
import { MOTION } from './scorecard.motion'
import {
  BUSINESS,
  CHANNELS,
  CIRC,
  DISCLAIMER,
  INST,
  LVL_LABEL,
} from './scorecardData'
import './Scorecard.css'

/** Dash offset for a given 0-100 score on the r=52 ring. */
const offsetFor = (score) => CIRC - (CIRC * score) / 100

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * ============================================================================
 * THE ACCOUNT SCORECARD — panel only
 * ============================================================================
 * This was a full section of its own between #method and #pricing, with its own
 * heading ("Score, reason, fix. Every audit reads like this.") and lede. It now
 * lives in the hero, directly under the SERP mock, and the section is gone.
 *
 * The reason is in the data: the hero's "18% · Est. spend waste" callout was the
 * SAME number as this panel's first mini-stat. The hero was quoting one cell of
 * an artifact that sat 8,000px further down the page. Put together, the SERP mock
 * states the problem — a click bought on a term already ranked #1 — and this
 * states what comes back for it. The 18% callout is retired; it is in here.
 *
 * WHAT CHANGED IN THE MOVE: the scroll-scrubbed entrance is gone. This is above
 * the fold now, so there is no scroll to scrub — it reveals once on load, on a
 * delay the hero passes in, and is then a finished instrument. The channel
 * toggle is the only thing that moves afterwards.
 * ============================================================================
 */
/**
 * `compact` hands the panel a class; Scorecard.css decides what it costs.
 *
 * It used to skip rendering the four per-row explanation sentences outright,
 * because the panel then sat in a 650px column beside the SERP mock and the two
 * together put 198 words above the fold. It does not sit there any more — it has
 * its own full-width row and lays out as four columns, where the same four
 * sentences are the difference between a report and a row of numbers with a lot
 * of air around them.
 *
 * So the notes always render, and the narrow layouts drop them with
 * `display: none` rather than by omission. That is not the compromise it looks
 * like: `display: none` removes an element from the accessibility tree as
 * completely as never rendering it, so a screen reader on a phone hears exactly
 * what it heard before.
 */
export default function ScorecardPanel({ delay = 0, compact = false }) {
  const [channel, setChannel] = useState('paid')
  const data = INST[channel]

  const panelRef = useRef(null)
  const ringRef = useRef(null)
  const ringNumRef = useRef(null)
  const rowsRef = useRef(null)
  const liveRef = useRef(null)
  /** Set once the entrance has finished, so a channel swap before then cannot
   *  fight the intro for the same properties. */
  const revealedRef = useRef(false)

  /* --------------------------------------------------------------- entrance */
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return undefined

    const ring = ringRef.current
    const rowEls = gsap.utils.toArray('[data-scrow]', rowsRef.current)
    const bars = rowEls.map((r) => r.querySelector('[data-bar]'))
    const readout = makeCounter({ el: ringNumRef.current, to: data.score })

    /* Reduced motion: the finished frame, no timeline. */
    if (prefersReduced()) {
      revealedRef.current = true
      setIf(ring, { strokeDashoffset: offsetFor(data.score) })
      setIf(panel, { opacity: 1, y: 0 })
      setIf(rowEls, { opacity: 1, y: 0 })
      bars.forEach((b, i) => setIf(b, { scaleX: data.rows[i].s / 100 }))
      readout.set()
      return undefined
    }

    const intro = MOTION.intro
    const ctx = gsap.context(() => {
      gsap.set(panel, { opacity: 0, y: intro.fromY })
      gsap.set(rowEls, { opacity: 0, y: intro.rowFromY })
      gsap.set(ring, { strokeDashoffset: CIRC })
      bars.forEach((b) => gsap.set(b, { scaleX: 0 }))

      const tl = gsap.timeline({
        delay,
        onComplete: () => {
          revealedRef.current = true
        },
      })

      tl.to(panel, { opacity: 1, y: 0, duration: intro.panelSeconds, ease: intro.ease }, 0)

      /* The arc is a gauge — linear, because an eased gauge reads as lag. The
         number gets an ease so it decelerates into its final value. */
      tl.to(
        ring,
        {
          strokeDashoffset: offsetFor(data.score),
          duration: intro.ringSeconds,
          ease: intro.ringEase,
        },
        intro.ringAt,
      )
      tl.fromTo(
        readout.readout,
        readout.from,
        { ...readout.to, duration: intro.ringSeconds, ease: intro.ease },
        intro.ringAt,
      )

      tl.to(
        rowEls,
        {
          opacity: 1,
          y: 0,
          duration: intro.rowSeconds,
          ease: intro.ease,
          stagger: intro.rowStagger,
        },
        intro.rowsAt,
      )
      bars.forEach((bar, i) => {
        tl.to(
          bar,
          {
            scaleX: data.rows[i].s / 100,
            duration: intro.barSeconds,
            ease: intro.barEase,
          },
          intro.rowsAt + intro.barOffset + i * intro.rowStagger,
        )
      })
    }, panel)

    return () => ctx.revert()
    // Built for the channel that was current on mount; swaps are handled
    // imperatively below, so this must not re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay])

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
   * Re-animate AFTER a channel swap has committed.
   *
   * This cannot live in the click handler. The rows are keyed by title, so
   * switching channel replaces every row node — the handler would tween the
   * outgoing DOM while the incoming bars sat at their CSS default of scaleX(0),
   * which is exactly what shipped once: ring and copy right, all four bars empty.
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
    <div className={`sc${compact ? ' sc--compact' : ''}`} data-ch={channel}>
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

            <div className="sc__verdict">
              <span className="sc__flag">{data.flag}</span>
              <p>{data.verdict}</p>
              <div className="sc__minis">
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
                  {/* Three spans, not the string "Fair · 58".
                      Narrow layouts render them inline and read exactly as
                      before. The instrument strip sets the score as a display
                      figure with the grade beside it — four KPI cells rather
                      than four captions — which needs the number and the word to
                      be separately styleable. The separator is a real text node
                      so the inline case keeps its spacing; the strip drops it. */}
                  <span className={`sc__row-value is-${r.lvl}`}>
                    <span className="sc__row-grade">{LVL_LABEL[r.lvl]}</span>
                    <span className="sc__row-sep"> · </span>
                    <span className="sc__row-score">{r.s}</span>
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
  )
}

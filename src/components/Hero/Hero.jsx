import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { MOTION, MOBILE_QUERY, DESKTOP_QUERY } from './hero.motion'
import { QUERY, ROWS, VERDICT_LABEL } from './heroSerp'
import ScorecardPanel from '../Scorecard/ScorecardPanel'
import { setIf } from '../../motion/system'
import { DEBUG } from '../../lib/motionDebug'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const { seq, pin, intro } = MOTION

/**
 * When the scorecard reveals, in seconds from load.
 *
 * It lands with the SERP mock, not after the argument. The first version waited
 * for 62% of the sequence on the theory that the problem should be marked before
 * the deliverable arrives — which put the panel at 4.5s and its last row at
 * roughly 6s, and read exactly as "the scorecard comes in way too late".
 *
 * The theory was wrong for what this is. The scorecard is not a beat in the SERP
 * argument; it is the hero's second artifact, sitting beside the first. A reader
 * scanning the fold should find both there. The SERP sequence still owns its own
 * clock and runs for 5.6s after this.
 */
const SCORECARD_DELAY = MOTION.intro.startDelay + 1.0

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
  const replayRef = useRef(null)
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

          let detachReplay = null
          const cleanup = () => {
            split.revert()
            qSplit.revert()
            if (detachReplay) detachReplay()
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
            // The leak rests struck through and dimmed — NOT removed. Under
            // reduced motion the still frame is the only frame there is, so it
            // has to carry the whole argument; see seq.cull.
            setIf(strike, { scaleX: 1 })
            setIf(leakRow, { opacity: seq.cull.dimOpacity })
            setIf(resolveItems, { opacity: 1, y: 0 })
            // No replay affordance under reduced motion: there is no sequence to
            // replay, and offering one would promise motion the user opted out of.
            if (replayRef.current) replayRef.current.hidden = true
            return cleanup
          }

          /* =================================================================
           * FULL MOTION
           * ================================================================= */
          root.dataset.motion = 'full'

          // Everything the scrub or the intro animates starts explicitly set,
          // so no tween has to infer a "from" off the stylesheet.
          setIf(qSplit.chars, { opacity: 0 })
          setIf(marks, { opacity: 0, x: seq.mark.labelFromX })
          setIf(railRef.current, { scaleY: 0 })
          setIf(strike, { scaleX: 0 })

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

          /* ---- the copy and CTAs, WITH THE INTRO ----
           *
           * These used to land at 0.78 of the scrubbed sequence, which after the
           * sequence slowed to 5.6s meant the paragraph and both buttons sat at
           * opacity 0 for SEVEN SECONDS. On a phone, where the layout stacks,
           * that reserved 278px of blank between the replay control and the
           * scorecard and read as a rendering fault — which is exactly what it
           * was reported as.
           *
           * They belong here. The 0.78 placement existed to land the 18% counter
           * after the argument had been made; that counter went with the callout,
           * and nothing about a paragraph of positioning copy or the primary CTA
           * should wait on a SERP animation. The sequence now owns only the SERP.
           */
          tlIn.from(
            resolveItems,
            {
              opacity: 0,
              y: seq.resolve.copyFromY,
              duration: intro.panelDuration,
              ease: intro.ease,
              stagger: intro.rowStagger,
            },
            intro.eyebrowDuration * 0.4 + 0.35,
          )

          /* ---------------- THE SEQUENCE — plays on arrival ----------------
           * NOT scrubbed, and no longer pinned.
           *
           * It was a 175vh pin scrubbed by scroll, which ties the sequence to
           * the scroll position in BOTH directions: scroll up and the query
           * un-types, the marks lift, the culled row comes back. That is the
           * turntable behaviour being removed, and latching a pin does not fix
           * it — the viewport would stay held for 175vh with a frozen frame.
           *
           * So the hero performs once, on arrival, and is then a finished
           * frame that scrolling cannot touch. A hero is the one place where
           * autoplay is right: the reader has not asked for anything yet.
           *
           * `seq` is still authored in 0-1 progress units, so the storyboard
           * reads the same; SEQ_SECONDS converts the whole thing to wall clock
           * in one place. */
          const tl = gsap.timeline({ delay: intro.startDelay + intro.sequenceGap })
          const at = (u) => u * MOTION.sequenceSeconds
          const dur = (a, b) => Math.max((b - a) * MOTION.sequenceSeconds, 0.05)
          tl.to({}, { duration: MOTION.sequenceSeconds }, 0)

          /* ---- 0.00 → 0.22 · the query types in ---- */
          const q = seq.query
          tl.to(
            qSplit.chars,
            {
              opacity: 1,
              duration: 0.001,
              ease: q.ease,
              stagger: { amount: at(q.end) - at(q.start) },
              immediateRender: false,
            },
            at(q.start),
          )
          tl.to(
            caretRef.current,
            { opacity: 0, duration: 0.2, immediateRender: false },
            at(q.end),
          )

          /* ---- 0.22 → 0.50 · mark the overlap ---- */
          const mk = seq.mark
          const markDur = dur(mk.start, mk.end - mk.stagger)
          const markStagger = at(mk.stagger)
          tl.to(
            [paidRow, ownedRow],
            {
              '--verdict': 1,
              duration: markDur,
              ease: mk.ease,
              stagger: markStagger,
              immediateRender: false,
            },
            at(mk.start),
          )
          tl.to(
            marks,
            {
              opacity: 1,
              x: 0,
              duration: markDur,
              ease: mk.ease,
              stagger: markStagger,
              immediateRender: false,
            },
            at(mk.start),
          )
          tl.to(
            railRef.current,
            {
              scaleY: 1,
              duration: dur(mk.railStart, mk.railEnd),
              ease: mk.railEase,
              immediateRender: false,
            },
            at(mk.railStart),
          )

          /* ---- 0.50 → 0.78 · strike the bought click, dim it in place ----
           * It does NOT leave the panel. See seq.cull in hero.motion.js for why
           * removing it was the wrong ending: the struck "you paid for this
           * click" sitting directly above "you already ranked #1 for it" is the
           * argument, and it only reads if both rows are still on screen when
           * the sequence stops. */
          const cu = seq.cull
          tl.to(
            strike,
            {
              scaleX: 1,
              duration: dur(cu.start, cu.strikeEnd),
              ease: cu.strikeEase,
              immediateRender: false,
            },
            at(cu.start),
          )
          tl.to(
            leakRow,
            {
              opacity: cu.dimOpacity,
              duration: dur(cu.strikeEnd, cu.end),
              ease: cu.dimEase,
              immediateRender: false,
            },
            at(cu.strikeEnd),
          )
          /* The connector rail STAYS. It links the row you paid for to the row
           * you already owned, which is the thing the reader is meant to be
           * looking at in the resting frame. It used to fade out here, because
           * the row it pointed at was leaving. */


          /* THE REPLAY CONTROL.
           *
           * "If you didn't catch it right away, you'll be confused as to what
           * you're looking at" — the resting frame now answers that on its own
           * (seq.cull), and this is the other half: a way to just watch it again.
           *
           * Restarting the sequence timeline is enough. The intro (headline,
           * panel rise, row stagger) is deliberately NOT replayed — re-running
           * the headline reveal on a button press reads as the page reloading.
           * Only the argument replays: query, marks, strike, resolve.
           *
           * The button is disabled while the sequence runs so a second click
           * cannot restart it mid-wipe, which looks like a stutter. */
          const replayBtn = replayRef.current
          if (replayBtn) {
            const setBusy = (busy) => {
              replayBtn.disabled = busy
              replayBtn.dataset.busy = busy ? 'true' : 'false'
            }
            tl.eventCallback('onStart', () => setBusy(true))
            tl.eventCallback('onComplete', () => setBusy(false))
            const onReplay = () => {
              // Put the sequence's targets back to their start values first:
              // restart() alone replays from wherever a from-tween last landed.
              tl.pause(0).invalidate()
              // restart() WITHOUT includeDelay. The timeline carries
              // `intro.startDelay + intro.sequenceGap` (~1.05s) so it waits for
              // the panel to land on first load; replaying through that delay
              // left the button dead for a second after the click, which reads
              // as the control not working.
              tl.restart()
            }
            replayBtn.addEventListener('click', onReplay)
            detachReplay = () => replayBtn.removeEventListener('click', onReplay)
          }

          if (DEBUG) window.__hero = { tl, tlIn, rowEls }

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
          {/* FOUR DIRECT CHILDREN, placed by grid-template-areas above 1240px:

                  headline | copy + CTAs
                  SERP mock| scorecard

              The two artifacts sit side by side, which is the point — the mock
              states the problem (a click bought on a term already ranked #1) and
              the scorecard states what comes back for it.

              This replaced a version that stacked both artifacts in one column.
              That made the hero 1,150px tall and put a 500px hole in the left
              column, because a 480px stack of copy was being centred against a
              1,000px stack of panels. Side by side the tallest row is the
              scorecard's 561px and the hero is ~850px.

              No wrapper elements and no `display: contents`: all four are direct
              children, so the single-column case below is just `order`. */}
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

            {/* The "18% · Est. spend waste" callout that used to sit here is
                gone. It was the same figure as the scorecard's first mini-stat,
                so the hero was quoting one cell of an artifact that lived 8,000px
                further down the page. The scorecard is in the aside now and the
                number is in it. */}
            <div className="hero__resolve" ref={resolveRef}>
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

          <div className="hero__aside">
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

            {/* Replay. A real <button>, outside the aria-hidden panel so it is
                reachable, and labelled for what it does rather than what it looks
                like. It replays the argument only — see the handler for why the
                headline reveal is deliberately not part of it. */}
            <button
              type="button"
              className="hero__replay"
              ref={replayRef}
              data-busy="false"
            >
              <span className="hero__replay-icon" aria-hidden="true">
                ↺
              </span>
              Replay
            </button>

          </div>

          {/* THE DELIVERABLE, beside the problem. This used to be its own section
              8,000px down the page, quoting the same 18% the hero had already
              spent as a one-line callout. */}
          <ScorecardPanel delay={SCORECARD_DELAY} />
        </div>
      </div>
    </section>
  )
}

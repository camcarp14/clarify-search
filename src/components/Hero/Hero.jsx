import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { MOTION, MOBILE_QUERY, DESKTOP_QUERY } from './hero.motion'
import { buildChips, subsetChips, layoutChips } from './heroChips'
import { DEBUG } from '../../lib/motionDebug'
import './Hero.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const { chips: CHIPS, scatter, drift, seq, pin, counter } = MOTION

/** Keep a tween inside its window once its stagger spread is accounted for. */
const fit = (windowLen, staggerSpan, min = 0.04) =>
  Math.max(windowLen - staggerSpan, min)

/** gsap.set() on an empty array logs "GSAP target not found". That happens
 *  legitimately here — at the desktop breakpoint every chip is in play, so the
 *  parked list is empty — and a warning that fires on the happy path trains you
 *  to ignore the console. */
const setIf = (targets, vars) => {
  const list = Array.isArray(targets) ? targets.filter(Boolean) : targets
  if (list && (!Array.isArray(list) || list.length)) gsap.set(list, vars)
}

/** Framer Motion is scoped to component-level micro-interaction only — the
 *  scroll work is entirely GSAP's. Matches the press physics in
 *  saas-polish-system. */
const PRESS = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 420, damping: 30 },
}

export default function Hero() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const fieldRef = useRef(null)
  const headlineRef = useRef(null)
  const counterRef = useRef(null)
  const counterLineRef = useRef(null)
  const resolveRef = useRef(null)

  // Identity is built once. Coordinates are per-breakpoint, inside matchMedia.
  const chips = useMemo(
    () => buildChips({ count: CHIPS.desktopCount, scatter, drift }),
    [],
  )

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
          const field = fieldRef.current
          const byId = new Map(chips.map((c) => [c.id, c]))
          const chipOf = (el) => byId.get(el.dataset.chipId)

          /* ---- which chips are in play at this breakpoint ---- */
          const allSlots = gsap.utils.toArray('.hero__slot', field)
          const activeChips = isMobile
            ? subsetChips(chips, CHIPS.mobileCount)
            : chips
          const activeIds = new Set(activeChips.map((c) => c.id))
          const slots = allSlots.filter((el) => activeIds.has(el.dataset.chipId))
          const parked = allSlots.filter((el) => !activeIds.has(el.dataset.chipId))

          setIf(parked, { display: 'none' })
          setIf(slots, { display: '' })

          /* ---- coordinates for this breakpoint ---- */
          const cols = isMobile ? CHIPS.grid.mobileCols : CHIPS.grid.desktopCols
          const coords = layoutChips(activeChips, {
            cols,
            bounds: isMobile ? CHIPS.bounds.mobile : CHIPS.bounds.desktop,
            tight: isMobile ? CHIPS.tight.mobile : CHIPS.tight.desktop,
          })

          // Home slot is set with left/top ONCE, at layout time. Nothing
          // animates it — the timeline only ever touches transform/opacity.
          slots.forEach((el) => {
            const c = coords.get(el.dataset.chipId)
            gsap.set(el, {
              left: `${c.homeX}%`,
              top: `${c.homeY}%`,
              xPercent: -50,
              yPercent: -50,
            })
          })

          /* ---- field size, re-measured on every refresh ---- */
          let FW = 0
          let FH = 0
          const measure = () => {
            const r = field.getBoundingClientRect()
            FW = r.width
            FH = r.height
          }
          measure()
          ScrollTrigger.addEventListener('refreshInit', measure)

          const deltaX = (el) => {
            const c = coords.get(el.dataset.chipId)
            return c.tightX === null ? 0 : ((c.tightX - c.homeX) / 100) * FW
          }
          const deltaY = (el) => {
            const c = coords.get(el.dataset.chipId)
            return c.tightY === null ? 0 : ((c.tightY - c.homeY) / 100) * FH
          }

          /* ---- headline lines ---- */
          const split = new SplitText(headlineRef.current, {
            type: 'lines',
            mask: 'lines',
            linesClass: 'hero__line',
          })

          const codedFaces = slots.map((el) =>
            el.querySelector('.hero__face--coded'),
          )
          const reds = slots.filter((el) => el.dataset.kind === 'waste')
          const greens = slots.filter((el) => el.dataset.kind === 'convert')
          const resolveItems = gsap.utils.toArray(
            '[data-resolve-item]',
            resolveRef.current,
          )

          const cleanup = () => {
            ScrollTrigger.removeEventListener('refreshInit', measure)
            split.revert()
            field.classList.remove('is-live')
          }

          /* =================================================================
           * REDUCED MOTION — everything resolves to its final state.
           * No pin, no timeline, no Lenis (SmoothScroll skips it too).
           * ================================================================= */
          if (isReduced) {
            root.dataset.motion = 'reduced'

            setIf(codedFaces, { opacity: 1 })
            setIf(reds, { display: 'none' })
            setIf(greens, {
              x: (i, el) => deltaX(el),
              y: (i, el) => deltaY(el),
              rotation: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
            })
            setIf([counterLineRef.current, ...resolveItems], {
              opacity: 1,
              y: 0,
            })
            if (counterRef.current) {
              counterRef.current.textContent = `${counter.to}${counter.suffix}`
            }

            return cleanup
          }

          /* =================================================================
           * FULL MOTION — pinned, scrubbed storyboard.
           * ================================================================= */
          root.dataset.motion = 'full'
          const pinVh = isMobile ? pin.mobileVh : pin.desktopVh

          // Resolve block starts hidden; its tweens are immediateRender:false
          // so they must not be the thing that establishes the state.
          setIf([counterLineRef.current, ...resolveItems], {
            opacity: 0,
            y: seq.resolve.copyFromY,
          })

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              // "%" in a ScrollTrigger end string is a share of the viewport
              // height, so 250% === 250vh. Function form so it re-evaluates
              // when the viewport is resized.
              end: () => `+=${pinVh}%`,
              pin: stageRef.current,
              pinSpacing: true,
              scrub: pin.scrub,
              anticipatePin: pin.anticipatePin,
              invalidateOnRefresh: true,
              markers: DEBUG,
              onToggle: (self) =>
                field.classList.toggle('is-live', self.isActive),
            },
          })

          // Normalises the timeline to exactly 1 unit long, so timeline time
          // === scroll progress and the MOTION numbers read as the storyboard.
          tl.to({}, { duration: 1 }, 0)

          /* ---- 0.00 → 0.25 · headline masks up, line by line ---- */
          const hl = seq.headline
          tl.from(
            split.lines,
            {
              yPercent: hl.fromYPercent,
              duration: fit(
                hl.end - hl.start,
                (split.lines.length - 1) * hl.staggerEach,
              ),
              ease: hl.ease,
              stagger: hl.staggerEach,
            },
            hl.start,
          )

          /* ---- 0.25 → 0.50 · chips converge into the ordered grid ----
           * This fromTo carries immediateRender (the default), which is what
           * paints the scattered field at progress 0. Every tween after this
           * one must set immediateRender:false or it will stomp that state. */
          const cv = seq.converge
          tl.fromTo(
            slots,
            {
              x: (i, el) => chipOf(el).scatterX * FW,
              y: (i, el) => chipOf(el).scatterY * FH,
              rotation: (i, el) => chipOf(el).scatterRotation,
              scale: (i, el) => chipOf(el).scatterScale,
              opacity: scatter.opacity,
              filter: CHIPS.blurEnabled
                ? `blur(${scatter.blurPx}px)`
                : 'blur(0px)',
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              opacity: 1,
              filter: 'blur(0px)',
              duration: fit(cv.end - cv.start, cv.staggerAmount),
              ease: cv.ease,
              stagger: {
                amount: cv.staggerAmount,
                from: cv.staggerFrom,
                grid: [Math.ceil(activeChips.length / cols), cols],
              },
            },
            cv.start,
          )

          // Idle drift amplitude falls away as the field orders itself.
          tl.to(
            field,
            {
              '--drift-amp': 0,
              duration: (cv.end - cv.start) * cv.driftFadeEnd,
              ease: 'none',
              immediateRender: false,
            },
            cv.start,
          )

          /* ---- 0.50 → 0.70 · colour-code, with a scale punch on the flip ---- */
          const co = seq.colour
          const coDur = fit(co.end - co.start, co.staggerAmount)
          const punchUp = coDur * co.punchSplit
          const punchDown = coDur - punchUp

          tl.fromTo(
            codedFaces,
            { opacity: 0 },
            {
              opacity: 1,
              duration: coDur,
              ease: co.ease,
              stagger: { amount: co.staggerAmount },
              immediateRender: false,
            },
            co.start,
          )
          tl.fromTo(
            slots,
            { scale: 1 },
            {
              scale: co.punchScale,
              duration: punchUp,
              ease: 'power2.out',
              stagger: { amount: co.staggerAmount },
              immediateRender: false,
            },
            co.start,
          )
          tl.fromTo(
            slots,
            { scale: co.punchScale },
            {
              scale: 1,
              duration: punchDown,
              ease: 'power2.inOut',
              stagger: { amount: co.staggerAmount },
              immediateRender: false,
            },
            co.start + punchUp,
          )

          /* ---- 0.70 → 0.85 · red falls out, green tightens to fill ---- */
          const cu = seq.cull
          tl.fromTo(
            reds,
            { y: 0, rotation: 0, opacity: 1 },
            {
              y: () => (cu.fallDistance / 100) * FH,
              rotation: (i, el) => chipOf(el).fallSign * cu.fallRotation,
              opacity: 0,
              duration: fit(cu.end - cu.start, cu.staggerAmount),
              ease: cu.fallEase,
              stagger: { amount: cu.staggerAmount },
              immediateRender: false,
            },
            cu.start,
          )
          tl.fromTo(
            greens,
            { x: 0, y: 0 },
            {
              x: (i, el) => deltaX(el),
              y: (i, el) => deltaY(el),
              duration: fit(
                cu.end - cu.start - cu.tightenOffset,
                cu.staggerAmount,
              ),
              ease: cu.tightenEase,
              stagger: { amount: cu.staggerAmount },
              immediateRender: false,
            },
            cu.start + cu.tightenOffset,
          )

          /* ---- 0.85 → 1.00 · counter runs, copy fades up, unpin ---- */
          const rs = seq.resolve
          const readout = { v: 0 }

          tl.fromTo(
            counterLineRef.current,
            { opacity: 0, y: rs.copyFromY },
            {
              opacity: 1,
              y: 0,
              duration: 0.04,
              ease: rs.ease,
              immediateRender: false,
            },
            rs.start,
          )
          tl.fromTo(
            readout,
            { v: 0 },
            {
              v: counter.to,
              duration: rs.counterEnd - rs.start,
              ease: rs.counterEase,
              immediateRender: false,
              onUpdate: () => {
                if (counterRef.current) {
                  counterRef.current.textContent = `${Math.round(readout.v)}${counter.suffix}`
                }
              },
            },
            rs.start,
          )
          tl.fromTo(
            resolveItems,
            { opacity: 0, y: rs.copyFromY },
            {
              opacity: 1,
              y: 0,
              duration: fit(
                rs.end - rs.copyStart,
                (resolveItems.length - 1) * rs.copyStaggerEach,
                0.03,
              ),
              ease: rs.ease,
              stagger: rs.copyStaggerEach,
              immediateRender: false,
            },
            rs.copyStart,
          )

          // Console handle while tuning:
          //   window.__hero.st.progress  → where the scrub is
          //   window.__hero.tl.progress(0.5)  → jump the storyboard
          if (DEBUG) {
            window.__hero = { tl, st: tl.scrollTrigger, slots, reds, greens }
          }

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
  }, [chips])

  return (
    <section className="hero" ref={rootRef} aria-labelledby="heroTitle">
      <div className="hero__stage" ref={stageRef}>
        <div className="hero__field" ref={fieldRef} aria-hidden="true">
          {chips.map((c) => (
            <div
              className="hero__slot"
              key={c.id}
              data-chip-id={c.id}
              data-kind={c.kind}
            >
              <div
                className="hero__drift"
                style={{
                  '--drift-dur': `${c.driftDur}s`,
                  '--drift-delay': `${c.driftDelay}s`,
                  '--dx1': `${c.driftX1}px`,
                  '--dy1': `${c.driftY1}px`,
                  '--dr1': `${c.driftR1}deg`,
                  '--dx2': `${c.driftX2}px`,
                  '--dy2': `${c.driftY2}px`,
                  '--dr2': `${c.driftR2}deg`,
                }}
              >
                <span className="hero__chip">
                  <span className="hero__face hero__face--neutral">{c.text}</span>
                  <span className="hero__face hero__face--coded">{c.text}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

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

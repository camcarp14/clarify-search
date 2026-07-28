import { useEffect, useRef } from 'react'
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
import { MOTION } from './why.motion'
import {
  PILL_CHANNEL_CLASS,
  WHY_CARDS,
  WHY_EYEBROW,
  WHY_HEADING,
  WHY_LEDE,
  WHY_PILLS,
} from './whyData'
import { DEBUG } from '../../lib/motionDebug'
import './Why.css'

// Sections register their own plugins. system.js deliberately does not, so a
// section that forgets owns the bug.
gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * WHY CLARIFY — `<section class="band" id="why">`, legacy markup 2233-2261.
 *
 * Tier: scrub-no-pin (motion-system §B.9). The whole timeline is a continuous
 * function of scroll position across the standard SCRUB_WINDOW — park the
 * scroll anywhere and you get a legible half-state (a half-fanned deck, a
 * half-tinted pill). Nothing here is triggered by a boolean crossing; the whole
 * timeline is scrubbed. The legacy blur-fade class system and its
 * IntersectionObserver are retired (§0.1) and are not ported — none of their
 * class names, custom properties or observer logic appear anywhere in this
 * directory.
 *
 * SSR: nothing touches window / document / matchMedia at module scope or during
 * render. Refs start null and are only read inside the effect.
 */
export default function Why() {
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current
        const seq = MOTION.seq

        /* ---- timeline targets. SCOPED to root, always. -------------------
         * A bare document.querySelectorAll here is how twelve parallel builds
         * find each other's elements (§C.2). */
        const cards = gsap.utils.toArray('[data-why-card]', root)
        const pills = gsap.utils.toArray('[data-why-pill]', root)

        // Only the six channel pills have a colour to cross-fade into; the two
        // bare measurement pills (GA4, Search Console) stay neutral by design
        // and render no second layer at all.
        const channelPills = gsap.utils.toArray('[data-channel]', root)
        const neutralFaces = channelPills
          .map((el) => el.querySelector('.why__pill-face--neutral'))
          .filter(Boolean)
        const codedFaces = channelPills
          .map((el) => el.querySelector('.why__pill-face--coded'))
          .filter(Boolean)

        /* ---- masked line reveals ----------------------------------------
         * `mask: 'lines'` wraps each line in an overflow:hidden sleeve, which
         * is what turns a translate into a wipe. Both splits use the same
         * linesClass so one CSS rule covers them. */
        const headingSplit = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'why__line',
        })
        const ledeSplit = new SplitText(ledeRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'why__line',
        })

        // matchMedia owns cleanup — no gsap.context, no manual kill loops.
        // Both splits must revert or a breakpoint change leaves the copy
        // permanently shredded into line divs.
        const cleanup = () => {
          headingSplit.revert()
          ledeSplit.revert()
          root.classList.remove('is-live')
        }

        /* =================================================================
         * REDUCED MOTION — every target resolved to its FINAL state.
         * No timeline, no ScrollTrigger, nothing to scrub.
         *
         * This branch must gsap.set() explicitly. Two of the states below are
         * held by CSS at their START value on purpose — `.why__pill-face--coded`
         * is opacity 0 so the pill has somewhere to cross-fade FROM — and
         * "do nothing" would ship a section whose pills never take their
         * channel colour to exactly the people the setting exists to protect.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(headingSplit.lines, { yPercent: 0 })
          setIf(ledeSplit.lines, { yPercent: 0 })
          setIf(eyebrowRef.current, { opacity: 1, y: 0 })
          setIf(cards, { x: 0, y: 0, rotation: 0, scale: 1 })
          setIf(pills, { opacity: 1, scale: 1 })
          setIf(codedFaces, { opacity: 1 })
          setIf(neutralFaces, { opacity: 0 })

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — one scrubbed timeline, no pin.
         * ================================================================= */
        root.dataset.motion = 'full'

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit long, so timeline time ===
        // scroll progress and the MOTION numbers read as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* ---- 0.00 → 0.08 · eyebrow rises (§B.13 #2) ---------------------
         * First tween on this target, so it keeps the default
         * immediateRender:true — that is what paints the progress-0 frame. */
        const eb = seq.eyebrow
        tl.from(
          eyebrowRef.current,
          {
            opacity: eb.fromOpacity,
            y: pick(eb.fromY, isMobile),
            duration: eb.end - eb.start,
            ease: eb.ease,
          },
          eb.start,
        )

        /* ---- 0.02 → 0.20 · H2 masks up line by line (§A.6) --------------
         * fit() keeps the tween inside its window once the stagger spread is
         * counted: a staggered tween occupies duration + span, not duration. */
        const hd = seq.heading
        tl.from(
          headingSplit.lines,
          {
            yPercent: hd.fromYPercent,
            duration: fit(
              hd.end - hd.start,
              (headingSplit.lines.length - 1) * hd.staggerEach,
            ),
            ease: hd.ease,
            stagger: hd.staggerEach,
          },
          hd.start,
        )

        /* ---- 0.15 → 0.55 · the deck un-stacks ---------------------------
         * The agency wrapper coming off: a fanned stack of decks becomes two
         * plain statements. Function-based `from` values so each card reads its
         * own geometry out of MOTION.deck by index — card 0 is the front of the
         * stack, card 1 sits behind and above it.
         *
         * Note what is NOT in the `to` vars: opacity. The cards were always
         * there; they were just stacked. */
        const dk = seq.deck
        const geo = isMobile ? MOTION.deck.mobile : MOTION.deck.desktop
        const cardAt = (i) => (i === 0 ? geo.front : geo.back)

        tl.fromTo(
          cards,
          {
            x: (i) => cardAt(i).x,
            y: (i) => cardAt(i).y,
            rotation: (i) => cardAt(i).rotation,
            scale: (i) => cardAt(i).scale,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: fit(
              dk.end - dk.start,
              Math.max(cards.length - 1, 0) * dk.staggerEach,
            ),
            ease: dk.ease,
            stagger: dk.staggerEach,
          },
          dk.start,
        )

        /* ---- 0.50 → 0.85 · the eight pills arrive -----------------------
         * `amount` is a TOTAL spread shared across all eight, so the gesture
         * stays inside its beat however many pills whyData.js grows to. */
        const pl = seq.pills
        const pillStagger = pick(pl.staggerAmount, isMobile)

        tl.fromTo(
          pills,
          { opacity: pl.fromOpacity, scale: pl.fromScale },
          {
            opacity: 1,
            scale: 1,
            duration: fit(pl.end - pl.start, pillStagger),
            ease: pl.ease,
            stagger: { amount: pillStagger },
          },
          pl.start,
        )

        /* ---- 0.60 → 0.85 · the channel colour lands ---------------------
         * A two-layer opacity cross-fade between stacked faces, never a
         * colour/border-color tween (§A.4 rule 2). The coded layer fades IN as
         * the neutral layer fades OUT, so the finished pill is pixel-identical
         * to legacy's single `.pill.p-paid` element rather than two
         * semi-transparent borders sitting on top of one another.
         *
         * immediateRender:false on both. Their progress-0 states are owned by
         * Why.css (`--coded` at opacity 0, `--neutral` at its natural 1); an
         * immediate render here would stomp that during the timeline build,
         * which is the one bug §C.6 says everybody ships once. */
        if (codedFaces.length) {
          const tintStart = pl.start + pl.tint.offset
          const tintDuration = fit(pl.end - tintStart, pillStagger)

          tl.fromTo(
            codedFaces,
            { opacity: 0 },
            {
              opacity: 1,
              duration: tintDuration,
              ease: pl.tint.ease,
              stagger: { amount: pillStagger },
              immediateRender: false,
            },
            tintStart,
          )
          tl.fromTo(
            neutralFaces,
            { opacity: 1 },
            {
              opacity: 0,
              duration: tintDuration,
              ease: pl.tint.ease,
              stagger: { amount: pillStagger },
              immediateRender: false,
            },
            tintStart,
          )
        }

        /* ---- 0.80 → 1.00 · the lede masks up and closes the section ----- */
        const ld = seq.lede
        tl.from(
          ledeSplit.lines,
          {
            yPercent: ld.fromYPercent,
            duration: fit(ld.end - ld.start, ld.staggerAmount),
            ease: ld.ease,
            stagger: { amount: ld.staggerAmount },
          },
          ld.start,
        )

        // Console handle while tuning:
        //   window.__why.st.progress        → where the scrub is
        //   window.__why.tl.progress(0.4)   → park the storyboard mid-fan
        if (DEBUG) {
          window.__why = { tl, st: tl.scrollTrigger, cards, pills }
        }

        return cleanup
      })

      // Coalesced across all twelve sections — one refresh on the next frame,
      // after the last caller, instead of twelve full layout recalculations.
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
      if (mm) mm.revert()
    }
  }, [])

  return (
    /* `band` is the shared page-section rhythm (components.css). `why` is the
       block class the motion system needs for `.why.is-live`. NOT `tinted`:
       #why is the untinted band between #ai-build and #faq, and the alternation
       is the page rhythm.

       #why carries no role, no aria-label and no aria-labelledby — legacy has
       none, and #why is not a nav target. The id itself is public URL surface
       and is preserved exactly. */
    <section className="band why" id="why" ref={rootRef}>
      <div className="shell why-grid">
        <div className="why-copy">
          <span className="mono-label" ref={eyebrowRef}>
            {WHY_EYEBROW}
          </span>

          {/* The <span className="ital"> is a typographic swap (display sans →
              Instrument Serif italic), not semantic stress — it stays a span,
              it does not become an <em>, and it is real JSX rather than
              dangerouslySetInnerHTML. The trailing full stop is outside it. */}
          <h2 ref={headingRef}>
            {WHY_HEADING.before}
            <span className="ital">{WHY_HEADING.ital}</span>
            {WHY_HEADING.after}
          </h2>

          <p ref={ledeRef}>{WHY_LEDE}</p>

          {/* Deliberately a div of spans, not a <ul>. It is a keyword strip;
              announcing "list, 8 items" would be worse, and flex-wrap is the
              layout. `.pill-row` / `.pill` / the three modifiers all live in
              src/styles/components.css §8 — nothing here re-declares them. */}
          <div className="pill-row">
            {WHY_PILLS.map((pill) => (
              <span
                className="why__pill"
                key={pill.id}
                data-why-pill
                data-channel={pill.channel ?? undefined}
              >
                <span className="pill why__pill-face why__pill-face--neutral">
                  {pill.text}
                </span>

                {/* The stacked tint layer, same markup shape as the hero's
                    chips. aria-hidden because it is a duplicate of the text
                    above it and exists only so the colour change can be an
                    opacity cross-fade — the accessibility tree stays exactly
                    as legacy left it, one label per pill. */}
                {pill.channel && (
                  <span
                    className={`pill ${PILL_CHANNEL_CLASS[pill.channel]} why__pill-face why__pill-face--coded`}
                    aria-hidden="true"
                  >
                    {pill.text}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="why-cards">
          {WHY_CARDS.map((card) => (
            /* `card` is the shared opt-in base (components.css §9): 1px --line
               border, --surface fill, 18px radius — the exact three values
               `.why-card` used to declare for itself. `.why-card` now only
               carries its own deltas. <article>, not <div>: each card is
               self-contained prose. */
            <article className="card why-card" key={card.id} data-why-card>
              <h3>{card.heading}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

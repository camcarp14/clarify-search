import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
/* Eases, beats, staggers, travels and scales are NOT imported here — they are
 * composed into MOTION in method.motion.js, so the storyboard reads as one
 * object and the owner tunes by editing numbers in one file. Only the helpers
 * and the canonical trigger factory are needed at this level. */
import {
  CONDITIONS,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system.js'
import { MOTION } from './method.motion.js'
import { DEBUG } from '../../lib/motionDebug.js'
import './Method.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

/* ==========================================================================
   COPY
   Every string below is byte-exact from legacy/index.html lines 1950-1992.

   NON-ASCII AUDIT of that range, verified against the source with `cat -A`:
   exactly two kinds of non-ASCII character appear anywhere in this section —
     U+2014 EM DASH  '—'  x3   (the lede, step 02's body, step 03's body)
     U+25AA BLACK SMALL SQUARE  '▪'  x4   (one per artifact row)
   There are NO curly apostrophes here (the single U+2019 in the whole legacy
   file lives in AI Build), no en dashes, no ellipses, no non-breaking spaces.
   Do not "typographically improve" anything.

   The only HTML entities in the legacy markup are `&amp;` x2, both inside tier
   badges. In JSX those are LITERAL ampersands — writing `&amp;` in a JSX text
   node renders the five characters `&amp;` on screen (spec §5 risk 7).

   The `▪` is pasted as the literal U+25AA character, never `&#9642;`.
   ========================================================================== */

/**
 * Four steps, in order. `n` is the step's ordinal and is REAL TEXT, not
 * decoration — the lede copy refers to "steps 01 and 02", so a screen reader
 * has to be able to hear it.
 *
 * `tier` is which rung of the pricing ladder the step belongs to: 01 and 02 are
 * free, 03 and 04 are paid. That distinction is load-bearing for the section's
 * whole argument ("The free check is steps 01 and 02 — stop there and owe
 * nothing") and it survives the port as a colour AND as the badge text.
 *
 * Every field is a plain string. None of them contains markup, so nothing here
 * needs dangerouslySetInnerHTML — the only inline markup in this section is in
 * the section head, and that is authored directly in the JSX below.
 */
const STEPS = [
  {
    n: '01',
    tier: 'free',
    tierLabel: 'Free & paid',
    title: 'Send read-only access.',
    body: 'Google Ads, GA4, and Search Console viewer access is enough. Admin only if Clarify implements.',
    artifact: 'ARTIFACT: ACCESS CHECKLIST',
  },
  {
    n: '02',
    tier: 'free',
    tierLabel: 'Where free stops',
    title: 'Get a scored diagnosis.',
    body: 'Free gets three checks and one number on a single channel. The audit scores every channel you choose — including how ready you are to be cited in AI answers.',
    artifact: 'ARTIFACT: SCORECARD, THEN FULL REPORT',
  },
  {
    n: '03',
    tier: 'paid',
    tierLabel: 'Cleanup & management',
    title: 'Fix the top leaks.',
    body: 'Negatives from real queries, tracking repairs, technical and on-page fixes — highest impact first. This is where diagnosis turns into changed settings.',
    artifact: 'ARTIFACT: CHANGE LOG + FIX LIST',
  },
  {
    n: '04',
    tier: 'paid',
    tierLabel: 'Audit onward',
    title: 'Decide the next move.',
    body: 'Fix it yourself, have Clarify do it, or go month-to-month. The roadmap is yours either way. No pressure.',
    artifact: 'ARTIFACT: 90-DAY ROADMAP',
  },
]

export default function Method() {
  /* Refs start null and are NEVER read during render — only inside the effect.
     Build-time prerendering renders this component with no DOM, so a `.current`
     read in the render body would throw there. Same rule for window/document/
     matchMedia/navigator: none of them appear at module scope or in render. */
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)
  const railRef = useRef(null)

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current || !headingRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current
        const heading = headingRef.current
        const seq = MOTION.seq
        const stepCfg = MOTION.steps

        /* ---- scoped queries ONLY. A bare document.querySelectorAll here is
         *      how twelve parallel sections start finding each other's nodes. */
        const stepEls = gsap.utils.toArray('[data-step]', root)
        const inkFaces = gsap.utils.toArray('[data-step-ink]', root)
        const tiers = gsap.utils.toArray('[data-step-tier]', root)
        const copyEls = gsap.utils.toArray('[data-step-copy]', root)
        const artifacts = gsap.utils.toArray('[data-artifact]', root)

        /* ---- headline lines (§A.6, the site's one repeated gesture) ----
         * The H2 here carries no stacked twin (unlike Diagnosis's "one page"),
         * so SplitText's default `aria: 'auto'` republishes the heading's
         * accessible name from textContent unchanged, and no fix-up is needed.
         * The `<span class="ital">artifact</span>` is a single word and cannot
         * wrap mid-word, so SplitText never has to clone it across a line. */
        const split = new SplitText(heading, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'method__line',
        })

        const cleanup = () => {
          split.revert()
          root.classList.remove('is-live')
          delete root.dataset.motion
        }

        /* =================================================================
         * REDUCED MOTION
         * Everything resolves to its FINAL state. No timeline, no trigger, no
         * pin (this section never pins anyway) — not `scrub: false`, not a
         * shortened window. §C.8.
         *
         * Almost every target here has a CSS resting state that already IS its
         * final state (see the header of Method.css), so most of the sets below
         * are belt-and-braces. TWO are not, and they are the reason this branch
         * cannot be skipped:
         *   - the split lines, which SplitText has just wrapped in masks;
         *   - `[data-step-ink]`, whose CSS resting state is opacity 0 so that a
         *     pre-hydration render does not double-print the ordinals.
         * Doing nothing would leave all four step numbers permanently muted —
         * exactly the regression §C.8 #2 exists to prevent.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf([eyebrowRef.current, ledeRef.current], { opacity: 1, y: 0 })
          setIf(railRef.current, { scaleX: 1, scaleY: 1 })
          setIf(inkFaces, { opacity: 1 })
          setIf(tiers, { opacity: 1 })
          setIf(copyEls, { opacity: 1, y: 0 })
          setIf(artifacts, { opacity: 1, scale: 1, rotation: 0 })

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — scrubbed, NOT pinned.
         *
         * IMMEDIATE RENDER (§C.6): every tween below is the first AND ONLY one
         * to touch its property on its target — the four steps are scheduled in
         * a loop over distinct elements, so nothing overlaps — and each
         * therefore keeps GSAP's default immediateRender:true. That default is
         * what paints progress 0 (rail undrawn, numbers muted, badges out, copy
         * low, artifacts unstamped). If you add a SECOND tween to any target
         * here it MUST carry immediateRender:false, or it will stomp the
         * progress-0 frame while the timeline is being built.
         * ================================================================= */
        root.dataset.motion = 'full'

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit, so timeline time === scroll
        // progress and method.motion.js reads as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* ---- 0.00 → 0.08 · eyebrow (§B.13 #2) ---- */
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

        /* ---- 0.00 → 0.20 · H2 masks up, line by line (§A.6) ----
         * `fit` keeps the tween inside its authored window once the stagger
         * spread is counted: a staggered tween occupies duration + span, not
         * duration, and a 3-line heading would otherwise run 0.11 past 0.20 and
         * eat the rail's start. */
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

        /* ---- 0.06 → 0.21 · lede paragraph (§B.13 #3) ---- */
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

        /* ---- 0.15 → 0.90 (0.96 mobile) · THE RAIL DRAWS ----
         * The section's spine and its progress gauge. One transform channel —
         * scaleX while the grid is 4-across, scaleY once the steps stack — with
         * transform-origin pinned to the start edge in CSS.
         *
         * EASE.rail ('none') is mandatory (§B.13 #6). This is the element the
         * user reads as attached to the scroll; easing it would make the pixels
         * stop tracking the finger at both ends of the draw, which is
         * indistinguishable from input lag. */
        const rl = seq.rail
        const railStart = pick(rl.start, isMobile)
        const railEnd = pick(rl.end, isMobile)
        const railAxis = pick(rl.axis, isMobile)
        if (railRef.current) {
          tl.from(
            railRef.current,
            {
              [railAxis]: 0,
              duration: railEnd - railStart,
              ease: rl.ease,
            },
            railStart,
          )
        }

        /* ---- THE FOUR STEPS ----
         * Each step is a set of beats anchored to the progress at which the
         * rail reaches it, NOT one staggered tween: 0.17 is a beat boundary,
         * not a stagger, and hiding it inside `stagger:` would misrepresent
         * four storyboard beats as one gesture.
         *
         * Every query below is scoped to the step element, so step 3's tweens
         * can never pick up step 4's nodes. */
        const firstStart = pick(stepCfg.firstStart, isMobile)
        const spacing = pick(stepCfg.spacing, isMobile)
        const copyTravel = pick(stepCfg.copy.travel, isMobile)
        const stampRotation = pick(stepCfg.artifact.fromRotation, isMobile)

        stepEls.forEach((step, i) => {
          const stepStart = firstStart + i * spacing

          const ink = step.querySelector('[data-step-ink]')
          const tier = step.querySelector('[data-step-tier]')
          const copy = gsap.utils.toArray('[data-step-copy]', step)
          const artifact = step.querySelector('[data-artifact]')

          /* stepStart → +BEAT.xs · the ordinal cross-fades muted → ink.
           * Two stacked layers, opacity only (rule 2 / §B.13 #5) — the same
           * mechanism as the hero's .hero__face--neutral / --coded pair. Never
           * a colour tween: the ink layer is a gradient clipped to the glyphs,
           * and there is no colour value to interpolate toward.
           *
           * `fromTo`, not `from`, and this one is not stylistic. The ink face is
           * the section's ONE element whose CSS resting state is its START state
           * (Method.css §4 says why), so a bare `from({ opacity: 0 })` would read
           * the current computed 0 as the destination and tween 0 → 0. Every
           * other tween in this effect can use `from` precisely because its CSS
           * rest is already the finished state. */
          const nm = stepCfg.number
          if (ink) {
            tl.fromTo(
              ink,
              { opacity: 0 },
              { opacity: 1, duration: nm.duration, ease: nm.ease },
              stepStart + nm.offset,
            )
          }

          /* stepStart → +BEAT.xs · the tier badge, on the SAME beat as the
           * ordinal. The two are one piece of information: which step, and
           * whether it costs anything. */
          const tr = stepCfg.tier
          if (tier) {
            tl.from(
              tier,
              { opacity: 0, duration: tr.duration, ease: tr.ease },
              stepStart + tr.offset,
            )
          }

          /* stepStart + 0.02 → +BEAT.sm · <h3> and <p> rise together. */
          const cp = stepCfg.copy
          if (copy.length) {
            tl.from(
              copy,
              {
                opacity: 0,
                y: copyTravel,
                duration: cp.duration,
                ease: cp.ease,
              },
              stepStart + cp.offset,
            )
          }

          /* stepStart + 0.09 → +BEAT.xs · THE ARTIFACT STAMPS.
           * Ink hitting paper: it lands from slightly too close (1.04) and a
           * fraction of a degree off square, and settles on EASE.punchOut. The
           * tilt alternates by index so four receipts down a column do not read
           * as one skewed block. */
          const ar = stepCfg.artifact
          if (artifact) {
            const sign = ar.rotationSigns[i] ?? 1
            tl.from(
              artifact,
              {
                opacity: 0,
                scale: ar.fromScale,
                rotation: sign * stampRotation,
                duration: ar.duration,
                ease: ar.ease,
              },
              stepStart + ar.offset,
            )
          }
        })

        // Console handle while tuning:
        //   window.__method.st.progress      → where the scrub is
        //   window.__method.tl.progress(0.5) → park the storyboard mid-stamp
        if (DEBUG) {
          window[MOTION.debugKey] = { tl, st: tl.scrollTrigger, steps: stepEls }
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
    /* `id="method"` is a public URL fragment — the header nav's "Method" link,
       the hero's "See how it works" secondary CTA and sitemap.xml all resolve
       to it. Preserved from legacy exactly; do not rename.

       This section is plain `band`, NOT `band tinted`. #ai-visibility above it
       is plain and #pricing below it is tinted, so the untinted background here
       is deliberate rhythm, not an omission. It also keeps `section.band`'s
       1px top hairline, which is what separates it from #ai-visibility. */
    <section
      className="band method"
      id="method"
      ref={rootRef}
      aria-labelledby="methodTitle"
    >
      <div className="shell">
        <div className="section-head">
          <div className="lede">
            <span className="mono-label" ref={eyebrowRef}>
              Method
            </span>
            {/* h2, not h1 — the page has exactly one h1 and it is the hero's.
                `.ital` is a purely typographic serif accent, so it is a <span>,
                NOT an <em>: <em> carries stress semantics the legacy markup
                deliberately avoids here. The full stop is OUTSIDE the span. */}
            <h2 id="methodTitle" ref={headingRef}>
              Four steps. Every one leaves an{' '}
              <span className="ital">artifact</span>.
            </h2>
          </div>
          {/* Must stay a DIRECT child of .section-head — the shared rule is
              `.section-head > p`, and wrapping it silently drops its styling.
              It must also stay AFTER .lede in source order; it is grid
              column 2. */}
          <p ref={ledeRef}>
            No six-week onboarding. Every step leaves you something durable.{' '}
            <strong>The free check is steps 01 and 02</strong> — stop there and
            owe nothing.
          </p>
        </div>

        <div className="method__body">
          {/* THE RAIL. A resting hairline track with the drawn gradient rule
              overlaid on it, so progress 0 shows a real element rather than a
              gap. Horizontal above the grid on desktop; a vertical spine down
              the left of the stack below 900px. Decorative — the sequence it
              measures is already carried by the numbered headings — so the
              whole track is out of the accessibility tree. */}
          <div className="method__track" aria-hidden="true">
            <span className="method__rail" ref={railRef} />
          </div>

          {/* Exactly four direct <article> children. Each step is
              self-contained content, so <article> is intentional, and the
              order 01 → 04 is meaningful. .map() returns a flat array, which
              produces no wrapper element — do not wrap its output in a div. */}
          <div className="method__grid">
            {STEPS.map((s) => (
              <article className="method__step" key={s.n} data-step>
                {/* Child order is load-bearing: number → tier → h3 → p →
                    artifact. Below 760px .method__step becomes a grid and the
                    placement rules depend on exactly this sequence. */}
                <div className="method__number">
                  {/* Two stacked layers for the cross-fade. The in-flow face is
                      the real, announced text and rests muted; the absolutely
                      positioned twin carries the gradient treatment, is
                      aria-hidden so the ordinal is not read twice, and fades in
                      over it. Identical type metrics on both, or the cross-fade
                      shimmers. */}
                  <span className="method__number-face">{s.n}</span>
                  <span
                    className="method__number-face method__number-face--ink"
                    aria-hidden="true"
                    data-step-ink
                  >
                    {s.n}
                  </span>
                </div>

                <span
                  className={`method__tier method__tier--${s.tier}`}
                  data-step-tier
                >
                  {s.tierLabel}
                </span>

                {/* h3 under the section's h2. Correct outline: h1 (hero) →
                    h2 (section) → h3 (step). Do not promote or demote. */}
                <h3 data-step-copy>{s.title}</h3>
                <p data-step-copy>{s.body}</p>

                <div className="method__artifact" data-artifact>
                  {/* ACCESSIBILITY FIX (see Method.css §5): legacy ships this
                      bullet as a bare <span> with no aria-hidden, so screen
                      readers announce "black small square" before every
                      artifact label. It is pure decoration — the meaning is
                      entirely in the sibling text. The visible character is
                      unchanged. */}
                  <span aria-hidden="true">▪</span>
                  {s.artifact}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
/* Eases are not imported here on purpose: every one this section uses is
 * composed into MOTION in aiVisibility.motion.js, so the owner retimes and
 * re-eases the storyboard from one file. TRAVEL.maskYPercent is the exception —
 * it is the signature gesture's own constant (§A.6) and reads better at the
 * call site than behind another name. */
import {
  CONDITIONS,
  TRAVEL,
  fit,
  pick,
  refreshSoon,
  setIf,
  pinnedTrigger,
} from '../../motion/system'
import { MOTION } from './aiVisibility.motion'
import { AI_CARDS, CITE_COUNT, SERP_LABEL, SERP_QUERY, SERP_ROWS } from './aiVisibilityData'
import { DEBUG } from '../../lib/motionDebug'
import './AiVisibility.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

const { seq, travel } = MOTION

export default function AiVisibility() {
  /* Refs start null and are never read during render — the component must
   * prerender with no window / document / matchMedia access (SSR safety). */
  const rootRef = useRef(null)
  const stageRef = useRef(null)

  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)

  const queryRef = useRef(null)
  const rowAiRef = useRef(null)
  const rowPaidRef = useRef(null)
  const rowOrgRef = useRef(null)
  const paidTagRef = useRef(null)
  const underlayRef = useRef(null)

  const noteRef = useRef(null)
  const noteTextRef = useRef(null)

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
        const rowAi = rowAiRef.current
        const rowPaid = rowPaidRef.current
        const rowOrg = rowOrgRef.current
        const cards = gsap.utils.toArray('[data-ai-card]', root)
        const numsRest = gsap.utils.toArray('[data-num-rest]', root)
        const numsAccent = gsap.utils.toArray('[data-num-accent]', root)
        const dots = gsap.utils.toArray('[data-cite-dot]', root)
        const citesLabel = gsap.utils.toArray('[data-cites-label]', root)

        /* ------------------------------------------------------------------
         * MEASUREMENT
         * The three rows push each other down by each other's HEIGHT. §B.5 is
         * explicit that this is a function-based value read from the DOM, not
         * a literal — a literal is wrong the moment the copy rewraps at a
         * different width.
         *
         * offsetHeight, not getBoundingClientRect(): the rows carry live
         * transforms by the time a refresh happens, and getBoundingClientRect
         * reports the TRANSFORMED box. offsetHeight is layout-only and
         * therefore immune to the very transforms this measurement feeds.
         * ------------------------------------------------------------------ */
        const H = { ai: 0, paid: 0, org: 0 }

        const measure = () => {
          H.ai = rowAi ? rowAi.offsetHeight : 0
          H.paid = rowPaid ? rowPaid.offsetHeight : 0
          H.org = rowOrg ? rowOrg.offsetHeight : 0

        }
        measure()
        ScrollTrigger.addEventListener('refreshInit', measure)

        /* Where each row rests at each stage of the assembly. Functions, so
         * invalidateOnRefresh re-evaluates them against the measured heights
         * after a resize or a font swap. */
        const orgAlone = () => -(H.ai + H.paid) // only row on screen
        const orgUnderPaid = () => -H.ai //        paid has landed above it
        const paidAlone = () => -H.ai //           top row until ai lands

        let headSplit = null
        let querySplit = null
        let noteSplit = null

        const cleanup = () => {
          ScrollTrigger.removeEventListener('refreshInit', measure)
          if (headSplit) headSplit.revert()
          if (querySplit) querySplit.revert()
          if (noteSplit) noteSplit.revert()
          root.classList.remove('is-live')
        }

        /* ==================================================================
         * REDUCED MOTION — every target at its FINAL state. No timeline, no
         * trigger, NO PIN (§C.8). The section occupies exactly its own height
         * and the page scrolls past it normally.
         *
         * No SplitText is created on this branch. The C.4 skeleton splits
         * first and flattens the lines afterwards; here the heading's natural
         * DOM state IS its final state, so splitting it would only add mask
         * wrappers that can mis-wrap on a resize (matchMedia does not re-run
         * unless the 900px boundary is crossed) for no visual gain.
         * ================================================================== */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf([eyebrowRef.current, ledeRef.current, noteRef.current], {
            opacity: 1,
            y: 0,
          })
          setIf([rowAi, rowPaid, rowOrg], { y: 0, opacity: 1, scale: 1 })
          setIf(cards, { opacity: 1, y: 0 })
          setIf(numsRest, { opacity: 0 })
          setIf(numsAccent, { opacity: 1 })
          /* §B.5: "connectors at scaleY: 1". */
          setIf(underlayRef.current, { opacity: 1 })
          setIf(dots, { opacity: 1 })
          setIf(citesLabel, { opacity: 1 })
          /* §B.5 is explicit that the Sponsored tag stays at FULL opacity
           * under reduced motion — the closing dim is a motion beat, and a
           * permanently dimmed label is a contrast problem, not a statement. */
          setIf(paidTagRef.current, { opacity: 1 })

          /* The organic underlay is deliberately NOT set here. Its final state
           * is breakpoint-dependent (0 on desktop, 1 on mobile, where it
           * stands in for the connector rails) and this branch cannot see the
           * width — `isMobile` is false under reduced motion by construction,
           * because CONDITIONS.isMobile requires no-preference. AiVisibility.css
           * owns it instead, via a reduce + max-width media query. Writing an
           * inline opacity here would beat that rule and blank it on phones. */

          return cleanup
        }

        /* ==================================================================
         * FULL MOTION — pinned, scrubbed storyboard.
         * ================================================================== */
        root.dataset.motion = 'full'

        headSplit = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'aiviz__line',
        })
        querySplit = new SplitText(queryRef.current, {
          type: 'chars',
          charsClass: 'aiviz__char',
        })
        noteSplit = new SplitText(noteTextRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'aiviz__note-line',
        })

        const rowY = pick(travel.row, isMobile)
        const cardY = pick(travel.card, isMobile)
        const copyY = pick(travel.copy, isMobile)

        const tl = gsap.timeline({
          scrollTrigger: pinnedTrigger({
            trigger: root, //           the SECTION
            pinTarget: stageRef.current, // an INNER element, never the trigger
            vh: pick(MOTION.pin, isMobile),
            root,
          }),
        })

        /* Normalises the timeline to exactly 1 unit long, so timeline time ===
         * scroll progress and every number in aiVisibility.motion.js reads as
         * the storyboard. Same trick as Hero. */
        tl.to({}, { duration: 1 }, 0)

        /* --------------------------------------------------------------- *
         * IMMEDIATERENDER LEDGER (§C.6)
         * A scrubbed timeline is built all at once, then seeked. The FIRST
         * fromTo touching a given property on a given element keeps the
         * default immediateRender:true — that is what paints progress 0.
         * Every later tween on that same property carries immediateRender:
         * false or it stomps the painted state during the build. The three
         * SERP rows are the only elements here with more than one tween on
         * one property; each is annotated below.
         * --------------------------------------------------------------- */

        /* ---- 0.00 → 0.14 · the section head ---- */
        const hd = seq.head
        const h2Start = hd.start + hd.eyebrowLead
        const h2Dur = hd.end - h2Start

        /* §A.6 THE SIGNATURE GESTURE — identical numbers on every h2 on the
         * site. yPercent 110 (not 100) so descenders clear the mask edge. */
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

        /* ---- 0.10 → 0.20 · the query types in ----
         * Scrubbed per char, so scrolling back UN-types it. A wall-clock
         * typewriter cannot do that and is banned (§B.5). */
        const q = seq.query
        const qStagger = pick(q.staggerAmount, isMobile)
        tl.fromTo(
          querySplit.chars,
          { opacity: 0, yPercent: q.fromYPercent },
          {
            opacity: 1,
            yPercent: 0,
            duration: fit(q.end - q.start, qStagger),
            ease: q.ease,
            stagger: { amount: qStagger },
          },
          q.start,
        )

        /* ---- 0.20 → 0.38 · r-org arrives FIRST, alone ----
         * The organic result is the thing that actually exists. It sits in the
         * top slot of an otherwise empty rows region and is pushed down twice
         * by the rows that arrive above it.
         * FIRST tween on rowOrg's y/opacity — immediateRender stays default. */
        const og = seq.org
        tl.fromTo(
          rowOrg,
          { y: () => orgAlone() + rowY, opacity: 0 },
          {
            y: () => orgAlone(),
            opacity: 1,
            duration: og.end - og.start,
            ease: og.ease,
          },
          og.start,
        )

        /* ---- 0.38 → 0.54 · r-paid slides in ABOVE it ---- */
        const pd = seq.paid
        /* FIRST tween on rowPaid's y/opacity — immediateRender default. */
        tl.fromTo(
          rowPaid,
          { y: () => paidAlone() - rowY, opacity: 0 },
          {
            y: () => paidAlone(),
            opacity: 1,
            duration: pd.end - pd.start,
            ease: pd.ease,
          },
          pd.start,
        )
        /* …and r-org is pushed down by exactly the paid row's measured height.
         * SECOND tween on rowOrg.y — immediateRender MUST be false. */
        tl.fromTo(
          rowOrg,
          { y: () => orgAlone() },
          {
            y: () => orgUnderPaid(),
            duration: pd.end - pd.start,
            ease: pd.pushEase,
            immediateRender: false,
          },
          pd.start,
        )

        /* ---- 0.54 → 0.74 · r-ai drops in above both ----
         * The section's whole argument in one beat: the answer on top is built
         * out of the result underneath. */
        const ai = seq.ai
        const aiDur = ai.end - ai.start
        const dropDur = aiDur * ai.dropShare
        const punchDur = aiDur - dropDur
        const punchUp = punchDur * ai.punchSplit
        const punchDown = punchDur - punchUp

        /* FIRST tween on rowAi's y/opacity — immediateRender default. */
        tl.fromTo(
          rowAi,
          { y: -rowY, opacity: 0 },
          { y: 0, opacity: 1, duration: dropDur, ease: ai.dropEase },
          ai.start,
        )
        /* The landing swell. FIRST tween on rowAi's scale — default. */
        tl.fromTo(
          rowAi,
          { scale: 1 },
          {
            scale: pick(ai.punchScale, isMobile),
            duration: punchUp,
            ease: ai.punchUpEase,
          },
          ai.start + dropDur,
        )
        /* …and the settle. SECOND tween on rowAi's scale — false. */
        tl.fromTo(
          rowAi,
          { scale: pick(ai.punchScale, isMobile) },
          { scale: 1, duration: punchDown, ease: ai.punchDownEase, immediateRender: false },
          ai.start + dropDur + punchUp,
        )
        /* The stack is pushed down again, by the AI row's measured height.
         * THIRD tween on rowOrg.y and SECOND on rowPaid.y — both false. */
        tl.fromTo(
          rowPaid,
          { y: () => paidAlone() },
          { y: 0, duration: dropDur, ease: ai.pushEase, immediateRender: false },
          ai.start,
        )
        tl.fromTo(
          rowOrg,
          { y: () => orgUnderPaid() },
          { y: 0, duration: dropDur, ease: ai.pushEase, immediateRender: false },
          ai.start,
        )

        /* ---- 0.62 → 0.76 · the citation lands ----
         * `seq.rails` still names this window; it is the citation beat. It used
         * to drive three 1px connector rails hanging from the dots down through
         * the sponsored row — those are gone (they read as scratches across the
         * one row that is NOT the source). The dots plus the organic row's wash
         * below carry it now. */
        const rl = seq.rails
        tl.fromTo(
          dots,
          { opacity: 0 },
          {
            opacity: 1,
            duration: fit(rl.end - rl.start, (dots.length - 1) * rl.staggerEach),
            ease: rl.dotEase,
            stagger: rl.staggerEach,
          },
          rl.start,
        )

        /* The citation link, on BOTH breakpoints now. Was the mobile-only
         * substitute for the three connector rails; it is the whole treatment
         * since the rails were removed for reading as scratches across the
         * sponsored row. */
        const ul = seq.orgUnderlay
        tl.fromTo(
          underlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: ul.end - ul.start, ease: ul.ease },
          ul.start,
        )

        /* ---- 0.72 → 0.82 · "3 sources cited" ---- */
        const cl = seq.citesLabel
        tl.fromTo(
          citesLabel,
          { opacity: 0 },
          { opacity: 1, duration: cl.end - cl.start, ease: cl.ease },
          cl.start,
        )

        /* ---- 0.74 → 0.90 · the four cards ----
         * Desktop: four beats, STAGGER.each.base.
         * Mobile: a 2×2 arriving in TWO beats — a function stagger pairs the
         * cards by row without depending on GSAP's grid inference (§B.5). */
        const cd = seq.cards
        const cardStagger = isMobile
          ? (i) => Math.floor(i / 2) * cd.staggerEachMobile
          : cd.staggerEach
        const cardSpread = isMobile
          ? cd.staggerEachMobile
          : (cards.length - 1) * cd.staggerEach

        tl.fromTo(
          cards,
          { opacity: 0, y: cardY },
          {
            opacity: 1,
            y: 0,
            duration: fit(cd.end - cd.start, cardSpread),
            ease: cd.ease,
            stagger: cardStagger,
          },
          cd.start,
        )

        /* 01–04 cross-fade muted → accent between two stacked faces (§A.4
         * rule 2). BOTH faces tween: fading only the accent in leaves the
         * muted glyph showing through the antialiasing and the pair reads as a
         * double image rather than as one number changing colour. */
        const numDur = fit(cd.numEnd - cd.numStart, cardSpread)
        tl.fromTo(
          numsAccent,
          { opacity: 0 },
          { opacity: 1, duration: numDur, ease: cd.numEase, stagger: cardStagger },
          cd.numStart,
        )
        tl.fromTo(
          numsRest,
          { opacity: 1 },
          { opacity: 0, duration: numDur, ease: cd.numEase, stagger: cardStagger },
          cd.numStart,
        )

        /* ---- 0.86 → 1.00 · the closing note masks up ----
         * The panel rises and fades over one short beat so it is present
         * before its words start wiping; the sentence then masks up out of its
         * line masks across the whole window. The mask is on the TEXT, not on
         * the panel — masking the panel would clip its own border and
         * gradient. */
        const nt = seq.note
        tl.fromTo(
          noteRef.current,
          { opacity: 0, y: copyY },
          { opacity: 1, y: 0, duration: nt.panelDur, ease: nt.panelEase },
          nt.start,
        )
        tl.fromTo(
          noteSplit.lines,
          { yPercent: TRAVEL.maskYPercent },
          {
            yPercent: 0,
            duration: fit(
              nt.end - nt.start,
              (noteSplit.lines.length - 1) * nt.lineStaggerEach,
            ),
            ease: nt.lineEase,
            stagger: nt.lineStaggerEach,
          },
          nt.start,
        )

        /* ---- 0.86 → 1.00 · "Sponsored" dims while the AI row holds full ----
         * No slot to bid on. */
        const sp = seq.sponsored
        tl.fromTo(
          paidTagRef.current,
          { opacity: 1 },
          {
            opacity: sp.toOpacity,
            duration: sp.end - sp.start,
            ease: sp.ease,
          },
          sp.start,
        )

        /* Console handle while tuning:
         *   window.__aiviz.st.progress        → where the scrub is
         *   window.__aiviz.tl.progress(0.54)  → jump to the r-ai beat */
        if (DEBUG) {
          window.__aiviz = { tl, st: tl.scrollTrigger, rows: { rowAi, rowPaid, rowOrg }, H }
        }

        return cleanup
      })

      /* Coalesced with the other eleven sections' refreshes (§A.2). */
      refreshSoon()
    }

    /* SplitText must not run before the webfonts land, or the line boxes it
     * measures belong to the fallback font and every mask is the wrong height
     * (§A.6). Guarded exactly as Hero.jsx guards it. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start)
    else start()

    return () => {
      cancelled = true
      if (mm) mm.revert()
    }
  }, [])

  return (
    <section className="band aiviz" id="ai-visibility" ref={rootRef}>
      <div className="aiviz__stage" ref={stageRef}>
        <div className="shell">
          <div className="section-head">
            <div className="lede">
              <span className="mono-label" ref={eyebrowRef}>
                The third surface — included, not sold
              </span>
              <h2 ref={headingRef}>
                The surface you <span className="ital">can't buy your way onto</span>.
              </h2>
            </div>
            <p ref={ledeRef}>
              AI Overviews, AI Mode, ChatGPT and Perplexity answer before the links load. No
              slot to bid on, no ranking to climb — models cite what they can parse and trust,
              which your search work already builds. Included in both, never a fourth line
              item.
            </p>
          </div>

          <div className="ai-grid">
            {/*
              Stays an <aside>, keeps its aria-label. The label is the only
              thing a screen-reader user gets from the whole mock; turning this
              into a <div> silently deletes it, because aria-label on a
              role-less div is ignored (spec R-13).
            */}
            <aside className="serp" aria-label={SERP_LABEL}>
              <div className="serp-bar" aria-hidden="true">
                <span className="serp-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="serp-q">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <span className="aiviz__typed">
                    <span className="aiviz__query" ref={queryRef}>
                      {SERP_QUERY}
                    </span>
                    {/* Stacked caret. CSS blink, never a GSAP target (§B.5). */}
                    <span className="aiviz__caret" />
                  </span>
                </span>
              </div>

              {/*
                Clip container for the assembly. Rows enter from above their
                slots and must be cut off at the top of the results area rather
                than sliding over the omnibox.
                A plain wrapper — it carries no role and no copy.
              */}
              <div className="aiviz__rows">
                <div className="serp-row r-ai" ref={rowAiRef}>
                  <span className="serp-tag">
                    {SERP_ROWS.ai.tag}
                    <span className="serp-new">{SERP_ROWS.ai.badge}</span>
                  </span>
                  <p className="serp-ai-copy">
                    Three practices stand out for family care in the area, based on{' '}
                    <span className="cite">reviews</span>,{' '}
                    <span className="cite">published hours</span> and{' '}
                    <span className="cite">service pages</span>…
                  </p>
                  <span className="serp-cites">
                    {Array.from({ length: CITE_COUNT }, (_, i) => (
                      <i key={i} data-cite-dot="" />
                    ))}
                    <em data-cites-label="">{SERP_ROWS.ai.citesLabel}</em>
                  </span>
                  <span className="serp-note">{SERP_ROWS.ai.note}</span>

                </div>

                <div className="serp-row r-paid" ref={rowPaidRef}>
                  <span className="serp-tag" ref={paidTagRef}>
                    {SERP_ROWS.paid.tag}
                  </span>
                  <span className="serp-url">{SERP_ROWS.paid.url}</span>
                  {/* Deliberately empty skeleton bars. Do not "clean up" (R-4). */}
                  <span className="serp-title" />
                  {SERP_ROWS.paid.lines.map((w, i) => (
                    <span className="serp-line" key={i} style={{ '--w': w }} />
                  ))}
                  <span className="serp-note">{SERP_ROWS.paid.note}</span>
                </div>

                <div className="serp-row r-org" ref={rowOrgRef}>
                  {/* The citation link, on every breakpoint. A soft mint wash
                      over the row the AI answer is actually built from — which
                      is what this row's own note says. Replaced three 1px
                      verticals that hung off the citation dots: they had to
                      cross the SPONSORED row to get here, and a hairline
                      cutting through the one row that is NOT the source read as
                      a scratch on the artifact rather than as a connector. */}
                  <span className="aiviz__org-underlay" aria-hidden="true" ref={underlayRef} />
                  <span className="serp-tag">{SERP_ROWS.org.tag}</span>
                  <span className="serp-url">{SERP_ROWS.org.url}</span>
                  <span className="serp-title" />
                  {SERP_ROWS.org.lines.map((w, i) => (
                    <span className="serp-line" key={i} style={{ '--w': w }} />
                  ))}
                  <span className="serp-note">{SERP_ROWS.org.note}</span>
                </div>
              </div>
            </aside>

            {/* The right column: the four cards and the note they build to.
                A wrapper, not three siblings of .ai-grid — the grid is two
                columns, so a bare third child would drop into row 2 / column 1,
                under the SERP mock. */}
            <div className="ai-col">
              <div className="ai-cards">
                {AI_CARDS.map((card) => (
                  <article className="ai-card" key={card.num} data-ai-card="">
                    <span className="ai-num">
                      <span className="aiviz__num-face aiviz__num-face--rest" data-num-rest="">
                        {card.num}
                      </span>
                      <span
                        className="aiviz__num-face aiviz__num-face--accent"
                        data-num-accent=""
                        aria-hidden="true"
                      >
                        {card.num}
                      </span>
                    </span>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>

              {/* The note lives INSIDE the right column, under the cards, rather
                  than spanning the grid below it. Two reasons, one visual and one
                  structural: full-width it set as a single line and left the card
                  column ending 130px short of the SERP mock beside it, and it is
                  the conclusion the four cards build to — it belongs with them,
                  not floating under both columns. DOM order is unchanged: mock →
                  cards → note. */}
              <div className="ai-note" ref={noteRef}>
                <span className="ai-note-mark" aria-hidden="true">
                  ✦
                </span>
                <span ref={noteTextRef}>
                  <strong>Nobody controls what a model says.</strong> The honest goal is being the
                  clearest, best-structured source for it to reach for.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

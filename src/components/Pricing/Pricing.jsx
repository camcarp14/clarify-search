import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import {
  CONDITIONS,
  counter,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { MOTION } from './pricing.motion'
import {
  CAPTIONS,
  CH_INDEX,
  CH_ORDER,
  COMPARE,
  COMPARE_COLUMNS,
  COMPARE_MUTED_ROW,
  COMPARE_NOTE,
  COMPARE_REGION_LABEL,
  COMPARE_ROWS,
  EYEBROW,
  FEATURED_BADGE,
  FEATURED_TIER,
  FINEPRINT,
  FREE,
  FREE_BADGE,
  FREE_CTA,
  FREE_PRICE,
  FREE_TITLE,
  HEADLINE,
  INITIAL_CHANNEL,
  LEDE,
  MARK_NO,
  MARK_YES,
  PRICING,
  SEG_GROUP_LABEL,
  SEG_LABEL,
  SEG_SAVE,
  SOFTWARE,
  TIERS,
  TIER_CTA,
  TIER_INTRO,
  TIER_ORDER,
  channelAnnouncement,
  comparePrice,
  tierOffer,
} from './pricing.data'
import { DEBUG } from '../../lib/motionDebug'
import './Pricing.css'

// A section that forgets to register its own plugins is a bug the section
// should own, so system.js deliberately does not do it (motion-system §A.2).
gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * Channel → the shared accent contract in components.css §3, which already
 * publishes `--acc / --acc-soft / --acc-rgb` for amber / mint / blue.
 *
 * Legacy declared those three custom properties a fourth time, locally, as
 * `#pricing[data-ch="organic"] { --acc: var(--mint); … }`. Reusing the shared
 * declaration instead of re-declaring it is the "reuse, never duplicate" rule;
 * the VALUES are identical, so nothing renders differently.
 *
 * `data-ch` still ships alongside it, because three rules in Pricing.css key
 * off the channel DIRECTLY rather than through --acc (the two .seg-thumb
 * tints, the `both`-only .seg-save colour, and the `both`-only gradient on
 * .price .number) and those cannot be expressed through the accent trio.
 */
const ACCENT = { paid: 'amber', organic: 'mint', both: 'blue' }

const { control, seq } = MOTION

/** Press physics, identical to Hero.jsx's. Framer Motion is scoped to
 *  component-level micro-interaction only — the scroll work is entirely
 *  GSAP's. A button has to feel the same wherever it appears on the site. */
const PRESS = {
  whileHover: { y: control.press.hoverY },
  whileTap: { scale: control.press.tapScale },
  transition: control.press.spring,
}

/**
 * A write-only stand-in for a DOM node, looked up fresh on every write.
 *
 * system.js's `counter()` captures `el` once, at creation. This section's
 * `.number` spans REMOUNT on every channel change — that remount is what
 * replays the CSS `priceIn` keyframe, and it is the React replacement for
 * legacy's `classList.remove('swap'); void offsetWidth; classList.add('swap')`
 * forced-reflow hack. A node captured at timeline-build time would therefore
 * go stale on the first channel switch and the counter would spend the rest of
 * the session writing into a detached element.
 */
const liveTarget = (get) => ({
  set textContent(value) {
    const el = get()
    if (el) el.textContent = value
  },
})

/**
 * Format a partially-counted price.
 *
 * `t` is the counter's normalised 0 → 1 progress; `priceString` is the
 * AUTHORED string from pricing.data.js, commas and all. The comma is stripped
 * to get a number and put back on the way out, so at t === 1 the rendered
 * value is byte-identical to the data — '1,099' round-trips exactly. That
 * matters because pricing.data.js's contract is that prices are strings and
 * are never run through Intl.NumberFormat.
 *
 * `decimals` is passed in from MOTION rather than assumed. It is 0 for every
 * price on this page, and §D.10 still requires the field to exist and be
 * explicit: the trap it was written to catch is a builder copying the hero's
 * `Math.round(readout.v)` into AI Build's 11.4 counter and silently shipping
 * "11".
 */
const countTo = (priceString, t, decimals, group) => {
  const target = Number(String(priceString).replace(/,/g, ''))
  const n = target * t
  const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
  return group ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : fixed
}

/* ==========================================================================
   POINTER EFFECTS GATE

   Legacy gates both the cursor spotlight (index.html 2935) and the magnetic
   buttons (2609) on `(pointer: fine)` AND `!prefers-reduced-motion`, but reads
   both queries ONCE, imperatively, at script parse time, and never listens for
   `change`. Two problems in React: reading matchMedia during render is an SSR
   hazard, and the snapshot goes stale when a user plugs in a mouse or flips
   the OS motion setting mid-session.

   Both queries are therefore read inside an effect and subscribed to. Starting
   `false` means the server render and the first client render agree.
   ========================================================================== */
function usePointerEffects() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const fine = window.matchMedia('(pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = () => setEnabled(fine.matches && !reduced.matches)
    sync()

    fine.addEventListener('change', sync)
    reduced.addEventListener('change', sync)
    return () => {
      fine.removeEventListener('change', sync)
      reduced.removeEventListener('change', sync)
    }
  }, [])

  return enabled
}

/**
 * Cursor spotlight on the three tier cards.
 *
 * The writes stay imperative on purpose: routing pointer coordinates through
 * useState would re-render all three cards on every mouse move. `setProperty`
 * on the element is the correct React answer for a high-frequency visual write
 * — it is not state, and nothing else reads it.
 *
 * Unthrottled, exactly as legacy is: a rAF wrapper would add a frame of lag to
 * a cursor-tracking effect in order to save two property writes. Legacy also
 * has no pointerleave reset, so the gradient centre is stale for one frame on
 * re-entry; reproduced rather than "fixed".
 */
function useSpotlight(enabled) {
  const onPointerMove = useCallback((event) => {
    const el = event.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--pricing-mx', `${event.clientX - rect.left}px`)
    el.style.setProperty('--pricing-my', `${event.clientY - rect.top}px`)
  }, [])

  // Returning undefined when the gate is shut means React never attaches a
  // handler at all, rather than attaching one that early-returns.
  return enabled ? onPointerMove : undefined
}

/* ==========================================================================
   MAGNETIC CTA

   The two anchors legacy marked `.mag` — #cta-free and the software CTA.

   Legacy ran a hand-rolled rAF loop writing `el.style.transform` directly.
   That cannot coexist with the press physics the rest of the site's buttons
   get from Framer Motion: two owners of one transform channel is a fight
   nobody wins, and components.css §6 names the Framer route explicitly ("or
   Framer Motion useMotionValue + a spring on x/y. If you use Framer Motion,
   drop `.mag` — FM sets will-change").

   So `.mag` is NOT used here. Dropping it also removes the one permanent
   `will-change: transform` that motion-system §C.7 calls out as a legacy
   offender — Framer applies and removes it around the actual animation.

   The two pull factors are legacy's, verbatim. The lerp is a spring; see
   MOTION.control.magnetic.

   whileHover is deliberately absent on these two: the magnetic pull IS the
   hover response, and a -1px lift fighting a live y motion value would make
   the button jitter at rest.
   ========================================================================== */
function MagneticCta({ className, id, offer, enabled, children }) {
  const { magnetic, press } = control
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, magnetic.spring)
  const springY = useSpring(y, magnetic.spring)

  const onPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * magnetic.pullX)
    y.set((event.clientY - (rect.top + rect.height / 2)) * magnetic.pullY)
  }

  const release = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.a
      className={className}
      id={id}
      href="#contact"
      data-offer={offer}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: press.tapScale }}
      transition={press.spring}
      onPointerMove={enabled ? onPointerMove : undefined}
      onPointerLeave={enabled ? release : undefined}
      onBlur={release}
    >
      {children}
    </motion.a>
  )
}

/* ==========================================================================
   TIER CARD

   Returns the <article> as its ROOT. `.offers-grid` is `repeat(3, 1fr)` and
   must have exactly three element children; any wrapper inserted here breaks
   the grid.
   ========================================================================== */
function TierCard({ tier, channel, numberRef, onPointerMove }) {
  const data = PRICING[channel][tier]
  const isFeatured = tier === FEATURED_TIER

  return (
    <article
      className={`offer${isFeatured ? ' featured' : ''}`}
      data-tier-card={tier}
      onPointerMove={onPointerMove}
    >
      {/* STRUCTURAL FIX, not a port (spec R12). Legacy paints the featured
          card's animated conic border with `.offer.featured::before` at
          `z-index: -1`, which only works while NO ancestor creates a stacking
          context. This card is a GSAP target — the entrance tween leaves a
          transform on it — so a z-index:-1 pseudo-element would be painted
          behind the card's own background and the ring would simply vanish.
          It is a real child element here instead, at z-index 0, with the card
          content lifted to z-index 1. Same geometry, same gradient, same spin. */}
      {isFeatured ? (
        <span className="pricing__ring" aria-hidden="true" />
      ) : null}

      {isFeatured ? <p className="offer-badge">{FEATURED_BADGE}</p> : null}

      <div className="offer-top">
        <h3>{TIERS[tier]}</h3>
        <p className="offer-intro">{TIER_INTRO[tier]}</p>

        {/* key= is the React replacement for legacy's forced-reflow animation
            restart (`remove('swap'); void offsetWidth; add('swap')`). Changing
            the key remounts the node, so the CSS `priceIn` keyframe replays on
            every channel switch with no layout thrash. `swap` is permanent in
            the className, exactly as it is permanent in legacy after the first
            render — and the reduced-motion rule targets `.price.swap`, so
            removing it would silently disable that override. */}
        <div className="price swap" id={`price-${tier}`} key={`${tier}-${channel}`}>
          <span className="currency">$</span>
          <span
            className="number"
            ref={(el) => {
              numberRef.current[tier] = el
            }}
          >
            {data.price}
          </span>
          {/* Always present, often empty. .price is a baseline flex row and
              dropping the span would change the gap arithmetic. */}
          <span className="period">{data.period}</span>
        </div>

        {/* Keyed for the same reason: .save-pill shares the priceIn keyframe
            and only exists on the `both` channel. The leading {' '} reproduces
            the space legacy put between the note text and the pill markup. */}
        <p className="price-note" id={`note-${tier}`} key={`note-${tier}-${channel}`}>
          {data.note}
          {data.save ? (
            <>
              {' '}
              <span className="save-pill">{data.save}</span>
            </>
          ) : null}
        </p>
      </div>

      {/* Keying each <li> on its own string remounts the whole list when the
          channel changes, which is what replays the `flIn` entry animation —
          legacy achieved the same thing by replacing innerHTML wholesale. `--i`
          is the per-item 45ms delay the CSS reads; React writes custom
          properties from the style object unchanged, and it must stay
          unitless. */}
      <ul className="feature-list" id={`feats-${tier}`}>
        {data.feats.map((feat, i) => (
          <li className="fl-in" style={{ '--i': i }} key={feat}>
            {feat}
          </li>
        ))}
      </ul>

      {/* The featured card gets the primary .cta; the other two get
          .secondary-cta. Neither is magnetic — legacy marked only #cta-free
          and the software CTA with `.mag`. */}
      <motion.a
        className={isFeatured ? 'cta' : 'secondary-cta'}
        id={`cta-${tier}`}
        href="#contact"
        data-offer={tierOffer(tier, channel)}
        {...PRESS}
      >
        {TIER_CTA[tier]}
      </motion.a>
    </article>
  )
}

/* ==========================================================================
   COMPARISON TABLE

   A real <table> with <thead>/<tbody>, scope="col" on the header cells and
   scope="row" on the row labels. The wrapper carries role="region" +
   aria-label + tabindex="0" together — that trio is what makes an
   overflow container keyboard-scrollable AND announced; tabindex alone would
   create an unnamed tab stop.

   ⚠️ `.compare thead th:nth-child(3)` and `.compare tbody td:nth-child(3)`
   highlight the Audit column positionally. A <colgroup>, a wrapper, or any
   extra node in a row shifts the highlight one column. React fragments add no
   DOM nodes, so the .map() below is safe — but do not "improve" the markup
   without moving that CSS with it.
   ========================================================================== */
function CompareTable({ channel }) {
  const dynamic = COMPARE[channel]

  return (
    <div
      className="compare-scroll"
      tabIndex={0}
      role="region"
      aria-label={COMPARE_REGION_LABEL}
    >
      <table className="compare">
        <thead>
          <tr>
            {COMPARE_COLUMNS.map((col) => (
              <th scope="col" key={col.head}>
                <span className="ct-h">{col.head}</span>
                {/* The header price is derived from the same PRICING object
                    the card reads. Legacy kept them in step with a cross-tree
                    `document.querySelector('[data-cmp]')` write from
                    renderTier; one source of truth removes the write and the
                    class of bug it existed to prevent. data-cmp is kept as a
                    hook because the spec names it. */}
                {col.tier ? (
                  <span className="ct-p" data-cmp={col.tier}>
                    {comparePrice(PRICING[channel][col.tier])}
                  </span>
                ) : null}
                {col.price ? (
                  <span className={`ct-p${col.free ? ' ct-free' : ''}`}>
                    {col.price}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row) => (
            <tr key={row.label} data-row={row.dynamic}>
              <th scope="row">{row.label}</th>

              {/* Three cell shapes, one row shape. Legacy shipped the two
                  dynamic rows as four empty <td>s and filled them from JS on
                  load; rendering them from data means there is no empty
                  first-paint state to flash. */}
              {row.dynamic
                ? dynamic[row.dynamic].map((value, i) => (
                    <td key={row.label + i}>
                      {/* The free column of the SCOPE row only is muted: it is
                          a limit, not a feature, and that limit is the whole
                          argument for the combined audit. The free column of
                          the TURNAROUND row ('3 days') stays plain. */}
                      {i === 0 && row.dynamic === COMPARE_MUTED_ROW ? (
                        <span className="no">{value}</span>
                      ) : (
                        value
                      )}
                    </td>
                  ))
                : null}

              {row.marks
                ? row.marks.map((yes, i) => (
                    <td className={yes ? 'y' : 'n'} key={row.label + i}>
                      {yes ? MARK_YES : MARK_NO}
                    </td>
                  ))
                : null}

              {row.cells
                ? row.cells.map((value, i) => (
                    <td key={row.label + i}>{value}</td>
                  ))
                : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ========================================================================== */

export default function Pricing() {
  const [channel, setChannel] = useState(INITIAL_CHANNEL)

  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)
  const segWrapRef = useRef(null)
  const thumbRef = useRef(null)
  const freeStripRef = useRef(null)
  const softwareRef = useRef(null)
  const fineprintRef = useRef(null)

  /** slot → the live `.number` node. Written by ref callbacks, read by the
   *  counters. See liveTarget(). */
  const numberRefs = useRef({})
  /** channel → the live radio button, for programmatic focus. */
  const btnRefs = useRef({})
  /** slot → the counter object, so the channel effect can re-paint them at the
   *  current scrub position after a switch. Emptied by the matchMedia cleanup. */
  const countersRef = useRef({})
  /** Mirrors `channel` for the counters, which live inside a matchMedia
   *  callback built once and must read the CURRENT channel on every frame. */
  const channelRef = useRef(channel)
  /** Set by the keyboard handler only. Arrow keys move focus with selection;
   *  a mouse click must not. */
  const focusPending = useRef(false)

  const pointerFx = usePointerEffects()
  const onSpotlightMove = useSpotlight(pointerFx)

  /* ----------------------------------------------------------------------
     CHANNEL COMMIT
     One effect, because the order inside it matters: channelRef has to be
     current before the counters re-read it.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    channelRef.current = channel

    // Re-paint every counter at the timeline's CURRENT position. Two cases
    // this covers: the user switched channel while parked mid-count (the
    // remounted .number span shows React's full price, which is wrong for that
    // scroll position), and the user switched before the counters have run at
    // all (the span must go back to 0, not sit at the new full price).
    const counters = countersRef.current
    Object.keys(counters).forEach((slot) => counters[slot].write())

    // Feature lists are 4 or 5 items depending on the channel, and the compare
    // rows re-wrap, so a switch changes the document height. Every trigger
    // below this section is now measuring against stale numbers. Coalesced
    // across the whole page — one refresh on the next frame, not one per
    // section (motion-system §A.2).
    refreshSoon()
  }, [channel])

  /* ----------------------------------------------------------------------
     PROGRAMMATIC FOCUS
     Runs only after a keyboard-driven change, and never on mount. By the time
     an effect runs React has committed, so the target button already carries
     tabIndex={0} — which is the ordering the roving-tabindex pattern requires
     and the reason this is not called inline in the handler.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    const el = btnRefs.current[channel]
    if (el) el.focus()
  }, [channel])

  /* ----------------------------------------------------------------------
     THE SEGMENTED-CONTROL THUMB — click-driven, WALL-CLOCK, never scrubbed.

     §B.7: "The segmented control is NOT scroll-driven." A scrubbed thumb would
     mean the user's own selection slid around as they scrolled, which is the
     worst thing this section could do.

     GSAP owns `--pricing-thumb-x` (an integer 0/1/2); CSS owns the geometry
     (`translateX(calc(var(--pricing-thumb-x) * 100%))` on a thumb exactly one
     third of the padded track wide). The property is @property-registered as a
     <number> in Pricing.css — without that registration it is a plain string
     to the engine and would jump 0 → 1 instead of easing. Same precedent as
     Hero.css's --drift-amp.

     Nothing renders `--pricing-thumb-x` as an inline style, deliberately: its
     registered initial-value is 0, which is the paid channel, so first paint
     is correct with no React-vs-GSAP contest over the same property.
     ---------------------------------------------------------------------- */
  useEffect(() => {
    const thumb = thumbRef.current
    if (!thumb || typeof window === 'undefined') return undefined

    const x = CH_INDEX[channel]

    // Legacy expresses this as `@media (prefers-reduced-motion: reduce) {
    // .seg-thumb { transition: none } }` — the thumb teleports. GSAP owns the
    // property now, so the branch has to live here too.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(thumb, { '--pricing-thumb-x': x })
      return undefined
    }

    const tween = gsap.to(thumb, {
      '--pricing-thumb-x': x,
      duration: control.thumb.duration,
      ease: control.thumb.ease,
      overwrite: 'auto',
    })
    return () => tween.kill()
  }, [channel])

  /* ----------------------------------------------------------------------
     THE SCROLL TIMELINE
     ---------------------------------------------------------------------- */
  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current

        // Scoped queries ONLY. Twelve sections are being built in parallel
        // against this DOM; a bare document.querySelectorAll would find
        // another builder's elements (motion-system §C.2).
        //
        // NOTE the attribute name: `data-tier-card`, not `data-offer`.
        // `data-offer` is already taken — it is the functional attribute on
        // every CTA whose value must string-match an <option> on the contact
        // form — and reusing it as a timeline hook would collect five anchors
        // as well as three cards.
        const cards = gsap.utils.toArray('[data-tier-card]', root)
        const featuredCard = cards.find(
          (el) => el.dataset.tierCard === FEATURED_TIER,
        )
        const plainCards = cards.filter(
          (el) => el.dataset.tierCard !== FEATURED_TIER,
        )
        const compareCopy = gsap.utils.toArray('[data-compare-copy]', root)

        const split = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'pricing__line',
        })

        /* ---- counters -------------------------------------------------
         * Built on system.js's counter(), which is the hero's `readout`
         * object + onUpdate pattern that §B.13 #4 makes mandatory.
         *
         * They run on a NORMALISED 0 → 1 rail rather than counting straight to
         * a price, for two reasons, both about the segmented control:
         *
         *   1. The target follows the channel. Switching paid → both while the
         *      scrub is parked mid-count has to retarget 599 → 1,099 without
         *      rebuilding the timeline. Rebuilding would tear down and
         *      re-create the ScrollTrigger on a button click, and re-split the
         *      H2 with it.
         *   2. The value at progress 1 has to be the AUTHORED STRING, commas
         *      included. countTo() strips the separator to get a number and
         *      puts it back on the way out, so '1,099' round-trips exactly.
         *
         * `format` is system.js's documented full override,
         * "(formattedString, rawNumber) => string". decimals/group are handed
         * to countTo rather than to counter() because countTo does the
         * formatting — passing them to both would leave one copy silently
         * ignored, which is worse than passing them once. */
        const priceOf = (slot) =>
          slot === 'software'
            ? SOFTWARE.price
            : PRICING[channelRef.current][slot].price

        const makeCounter = (slot, cfg) =>
          counter({
            el: liveTarget(() => numberRefs.current[slot]),
            from: cfg.from,
            to: 1,
            format: (_shown, t) =>
              countTo(priceOf(slot), t, cfg.decimals, cfg.group),
          })

        const counters = {}
        TIER_ORDER.forEach((tier) => {
          counters[tier] = makeCounter(tier, seq.counters)
        })
        counters.software = makeCounter('software', seq.softwareCounter)
        countersRef.current = counters

        const cleanup = () => {
          split.revert()
          // Identity-checked rather than unconditionally cleared: on a
          // breakpoint crossing matchMedia may have already installed the new
          // branch's counters, and blindly emptying the ref here would leave
          // the channel effect with nothing to re-paint.
          if (countersRef.current === counters) countersRef.current = {}
          root.classList.remove('is-live')
        }

        /* =================================================================
         * REDUCED MOTION — everything resolves to its final state.
         * No timeline, no ScrollTrigger, and (this section never pins) no pin
         * to suppress either.
         *
         * This branch MUST gsap.set() explicitly. The CSS resting state of an
         * animated element is its START state, so "do nothing here" leaves the
         * entire pricing table invisible for exactly the people the setting
         * exists to protect (motion-system §C.8 #2). On a page whose whole
         * argument is "every price on the page", that failure mode is not a
         * cosmetic one.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf(
            [
              eyebrowRef.current,
              ledeRef.current,
              segWrapRef.current,
              fineprintRef.current,
              ...compareCopy,
            ],
            { opacity: 1, y: 0 },
          )
          setIf(
            [freeStripRef.current, softwareRef.current, ...cards],
            { opacity: 1, y: 0, scale: 1 },
          )
          // set() with no argument jumps to the counter's `to`, which is 1 on
          // the normalised rail — i.e. the full authored price.
          Object.keys(counters).forEach((slot) => counters[slot].set())

          return cleanup
        }

        /* =================================================================
         * FULL MOTION — one scrubbed timeline, no pin.
         * ================================================================= */
        root.dataset.motion = 'full'

        /* ---- progress-0 state, written explicitly ----------------------
         * Every tween below except the headline is a fromTo carrying
         * immediateRender:false, so none of them paints its start state at
         * build time. These sets are what the user sees at progress 0. Same
         * discipline as Hero.jsx's resolve block (motion-system §C.6).
         *
         * The counters are part of this. React renders the full price into
         * .number for SSR and for the no-JS case; without the explicit set(0)
         * below the price would sit at $299 until the scrub reached 0.35 and
         * then SNAP to $0 before counting back up. */
        setIf(eyebrowRef.current, {
          opacity: 0,
          y: pick(seq.eyebrow.fromY, isMobile),
        })
        setIf(ledeRef.current, { opacity: 0, y: pick(seq.lede.fromY, isMobile) })
        setIf(segWrapRef.current, {
          opacity: 0,
          y: pick(seq.segWrap.fromY, isMobile),
        })
        setIf(freeStripRef.current, {
          opacity: 0,
          y: pick(seq.freeStrip.fromY, isMobile),
          scale: seq.freeStrip.fromScale,
        })
        setIf(cards, {
          opacity: 0,
          y: pick(seq.cards.fromY, isMobile),
          scale: seq.cards.fromScale,
        })
        setIf(compareCopy, {
          opacity: 0,
          y: pick(seq.compareCopy.fromY, isMobile),
        })
        setIf(softwareRef.current, {
          opacity: 0,
          y: pick(seq.software.fromY, isMobile),
          scale: seq.software.fromScale,
        })
        setIf(fineprintRef.current, {
          opacity: 0,
          y: pick(seq.fineprint.fromY, isMobile),
        })
        Object.keys(counters).forEach((slot) => counters[slot].set(0))

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({ trigger: root, root, isMobile }),
        })

        // Normalises the timeline to exactly 1 unit long, so timeline time ===
        // scroll progress and the MOTION numbers read as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* ---- ~0.00 · eyebrow rises (§B.13 #2) --------------------------
         * The mandate is "0.02 before its H2". The H2 starts at 0.00 and a
         * normalised timeline has no negative time, so this clamps to 0. The
         * lead stays a named constant so the offset applies for free if the
         * headline is ever moved later in the storyboard. */
        const eb = seq.eyebrow
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: pick(eb.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: eb.span,
            ease: eb.ease,
            immediateRender: false,
          },
          Math.max(0, seq.heading.start - eb.lead),
        )

        /* ---- 0.00 → 0.22 · H2 masks up, line by line -------------------
         * THE SIGNATURE GESTURE (§A.6, §B.13 #1). This is the one tween in the
         * section that keeps GSAP's default immediateRender:true — it is what
         * paints the lines below their masks at progress 0, and it cannot be
         * replaced by a gsap.set because a `from` tween reads its END value off
         * the live DOM. Everything after it is immediateRender:false. */
        const h = seq.heading
        tl.from(
          split.lines,
          {
            yPercent: h.fromYPercent,
            duration: fit(
              h.end - h.start,
              (split.lines.length - 1) * h.staggerEach,
            ),
            ease: h.ease,
            stagger: h.staggerEach,
          },
          h.start,
        )

        /* ---- 0.06 · lede paragraph rises (§B.13 #3) --------------------- */
        const ld = seq.lede
        tl.fromTo(
          ledeRef.current,
          { opacity: 0, y: pick(ld.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: ld.span,
            ease: ld.ease,
            immediateRender: false,
          },
          seq.heading.start + ld.offset,
        )

        /* ---- 0.08 · the segmented control rises ------------------------- */
        const sg = seq.segWrap
        tl.fromTo(
          segWrapRef.current,
          { opacity: 0, y: pick(sg.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: sg.span,
            ease: sg.ease,
            immediateRender: false,
          },
          sg.start,
        )

        /* ---- 0.12 → 0.30 · THE FREE STRIP IS THE FLOOR ------------------
         * Before the paid cards, on purpose. The section's argument is "start
         * free, then decide", and the motion states the reading order before
         * the copy gets a chance to. */
        const fs = seq.freeStrip
        tl.fromTo(
          freeStripRef.current,
          {
            opacity: 0,
            y: pick(fs.fromY, isMobile),
            scale: fs.fromScale,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: fs.end - fs.start,
            ease: fs.ease,
            immediateRender: false,
          },
          fs.start,
        )

        /* ---- 0.20 → 0.50 · THE RECOMMENDATION ARRIVES LAST AND BIGGEST --
         * The two plain cards ride one staggered tween. The featured card gets
         * its own pair, starting BEAT.xs later and overshooting past 1 before
         * settling — it arrives last and momentarily largest because it is the
         * recommendation. The motion is the sales argument.
         *
         * The overshoot is a POSITION ON THE TIMELINE, not a transition-delay:
         * park the scroll mid-window and the card sits visibly larger than its
         * neighbours; scroll up and the overshoot un-happens. */
        const cd = seq.cards
        tl.fromTo(
          plainCards,
          {
            opacity: 0,
            y: pick(cd.fromY, isMobile),
            scale: cd.fromScale,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: fit(
              cd.end - cd.start,
              (plainCards.length - 1) * cd.staggerEach,
            ),
            ease: cd.ease,
            stagger: cd.staggerEach,
            immediateRender: false,
          },
          cd.start,
        )

        if (featuredCard) {
          const ft = cd.featured
          const ftStart = cd.start + ft.offset
          const ftSpan = cd.end - ftStart
          const ftUp = ftSpan * ft.split
          const ftDown = ftSpan - ftUp

          tl.fromTo(
            featuredCard,
            {
              opacity: 0,
              y: pick(cd.fromY, isMobile),
              scale: cd.fromScale,
            },
            {
              opacity: 1,
              y: 0,
              scale: pick(ft.overshoot, isMobile),
              duration: ftUp,
              ease: ft.easeIn,
              immediateRender: false,
            },
            ftStart,
          )
          tl.to(
            featuredCard,
            {
              scale: 1,
              duration: ftDown,
              ease: ft.easeSettle,
              immediateRender: false,
            },
            ftStart + ftUp,
          )
        }

        /* ---- 0.35 → 0.62 · EVERY PRICE COUNTS ---------------------------
         * One tween per card rather than one staggered tween, because each
         * counter drives its own readout object. The offsets are computed from
         * card INDEX, which is exactly what "staggered by card" means and stays
         * correct if a tier is ever added or removed. */
        const cn = seq.counters
        const cnDur = fit(
          cn.end - cn.start,
          (TIER_ORDER.length - 1) * cn.staggerEach,
        )
        TIER_ORDER.forEach((tier, i) => {
          const c = counters[tier]
          tl.fromTo(
            c.readout,
            c.from,
            {
              ...c.to,
              duration: cnDur,
              ease: cn.ease,
              immediateRender: false,
            },
            cn.start + i * cn.staggerEach,
          )
        })

        /* ---- 0.58 → 0.73 · the comparison block's two paragraphs --------
         * ⚠️ §D.11: the scroll container is NOT a target here and must never
         * become one. `.compare tbody th` is position:sticky, and a transform
         * on any ancestor gives it a new containing block — which is how the
         * sticky row-label column, the thing that makes the table readable on a
         * phone, silently stops sticking. Only the paragraphs outside
         * `.compare-scroll` move. */
        const cc = seq.compareCopy
        tl.fromTo(
          compareCopy,
          { opacity: 0, y: pick(cc.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: fit(
              cc.span,
              (compareCopy.length - 1) * cc.staggerEach,
            ),
            ease: cc.ease,
            stagger: cc.staggerEach,
            immediateRender: false,
          },
          cc.start,
        )

        /* ---- 0.70 → 0.90 · the software block --------------------------- */
        const sw = seq.software
        tl.fromTo(
          softwareRef.current,
          {
            opacity: 0,
            y: pick(sw.fromY, isMobile),
            scale: sw.fromScale,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: sw.end - sw.start,
            ease: sw.ease,
            immediateRender: false,
          },
          sw.start,
        )

        /* ---- 0.74 → 0.94 · the $149 counter ----------------------------
         * Co-timed with the block it lives in rather than with the card
         * counters. See the note in pricing.motion.js: at 0.35 this block is
         * about two viewports below the fold, so counting it there would run
         * the whole gesture where nobody can see it. */
        const sc = seq.softwareCounter
        const swc = counters.software
        tl.fromTo(
          swc.readout,
          swc.from,
          {
            ...swc.to,
            duration: sc.end - sc.start,
            ease: sc.ease,
            immediateRender: false,
          },
          sc.start,
        )

        /* ---- 0.92 → 1.00 · the fineprint closes the timeline ------------ */
        const fp = seq.fineprint
        tl.fromTo(
          fineprintRef.current,
          { opacity: 0, y: pick(fp.fromY, isMobile) },
          {
            opacity: 1,
            y: 0,
            duration: fp.span,
            ease: fp.ease,
            immediateRender: false,
          },
          fp.start,
        )

        // Console handle while tuning:
        //   window.__pricing.st.progress     → where the scrub is
        //   window.__pricing.tl.progress(.45) → park mid-overshoot
        if (DEBUG) {
          window.__pricing = { tl, st: tl.scrollTrigger, cards, counters }
        }

        return cleanup
      })

      // Coalesced across all twelve sections — one refresh on the next frame,
      // not twelve full layout passes of a ~15,000px document in one.
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
      // matchMedia owns cleanup: it reverts every tween, every gsap.set and
      // every ScrollTrigger created inside its callbacks, and runs the cleanup
      // function each branch returned. No manual kill loops.
      if (mm) mm.revert()
    }
  }, [])

  /* ----------------------------------------------------------------------
     ROVING-TABINDEX KEYBOARD BEHAVIOUR

     One keydown listener on the radiogroup container, not one per button —
     synthetic events bubble, so this behaves identically to legacy's
     `seg.addEventListener('keydown', …)`.

     Reproduced exactly:
       - the index read is CH_INDEX[selected channel], not the index of the
         focused button. Selection follows focus here so the two are always
         equal, but the implementation reads STATE.
       - ArrowRight AND ArrowDown → next; ArrowLeft AND ArrowUp → previous.
         Both axes are wired even though the group is horizontal.
       - wrap-around is arithmetic: (i + 1) % 3 forward, (i + 2) % 3 back.
       - Home → always the first channel, End → always the last, regardless of
         current selection.
       - preventDefault fires ONLY when a handled key matched, so Tab, Enter
         and Space keep native behaviour. Space/Enter on a focused <button>
         fire a native click, which routes through the click path below and
         therefore does NOT force focus.
     ---------------------------------------------------------------------- */
  const onSegKeyDown = (event) => {
    const idx = CH_INDEX[channel]
    let next = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = CH_ORDER[(idx + 1) % CH_ORDER.length]
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = CH_ORDER[(idx + CH_ORDER.length - 1) % CH_ORDER.length]
    }
    if (event.key === 'Home') next = CH_ORDER[0]
    if (event.key === 'End') next = CH_ORDER[CH_ORDER.length - 1]

    if (!next) return
    event.preventDefault()

    // Home on the first channel (or End on the last) selects what is already
    // selected. React bails out of a same-value setState, so the focus effect
    // would never fire and the pending flag would leak onto the NEXT change.
    // Focus directly and do not arm the flag.
    if (next === channel) {
      const el = btnRefs.current[next]
      if (el) el.focus()
      return
    }

    focusPending.current = true
    setChannel(next)
  }

  const free = FREE[channel]

  return (
    <section
      className="band tinted pricing"
      id="pricing"
      data-ch={channel}
      data-accent={ACCENT[channel]}
      ref={rootRef}
      aria-labelledby="pricingTitle"
    >
      <div className="shell">
        <div className="section-head">
          <div className="lede">
            <span className="mono-label" ref={eyebrowRef}>
              {EYEBROW}
            </span>
            {/* ACCESSIBILITY FIX, not a port. Legacy ships <section id="pricing">
                with no accessible name, so the landmark announces as an unnamed
                region. The id is new; the heading text is untouched. */}
            <h2 id="pricingTitle" ref={headingRef}>
              {HEADLINE}
            </h2>
          </div>
          <p ref={ledeRef}>{LEDE}</p>
        </div>

        <div className="seg-wrap" ref={segWrapRef}>
          {/* An ARIA radiogroup, not a tablist: these are three mutually
              exclusive values of one setting, and the panels below are not
              tabpanels. aria-describedby points at the visible caption so the
              group's explanation reaches a screen reader when focus enters —
              legacy left the caption orphaned. */}
          <div
            className="seg"
            role="radiogroup"
            aria-label={SEG_GROUP_LABEL}
            aria-describedby="segCaption"
            id="seg"
            onKeyDown={onSegKeyDown}
          >
            <span className="seg-thumb" aria-hidden="true" ref={thumbRef} />

            {CH_ORDER.map((ch) => (
              <button
                className="seg-btn"
                type="button"
                role="radio"
                aria-checked={ch === channel}
                data-ch={ch}
                // Roving tabindex: exactly one 0, the rest -1. aria-checked is
                // load-bearing twice — it is the ARIA state AND the selector
                // `.seg-btn[aria-checked="true"]` that colours the active
                // label. Do not swap either for a class.
                tabIndex={ch === channel ? 0 : -1}
                key={ch}
                ref={(el) => {
                  btnRefs.current[ch] = el
                }}
                // No programmatic focus on click — the browser's own click
                // focus applies, and forcing it would fight a mouse user.
                onClick={() => setChannel(ch)}
              >
                {SEG_LABEL[ch]}
                {ch === 'both' ? (
                  <>
                    {' '}
                    <span className="seg-save">{SEG_SAVE}</span>
                  </>
                ) : null}
              </button>
            ))}
          </div>

          <p className="seg-caption" id="segCaption">
            {CAPTIONS[channel]}
          </p>

          {/* A live region must exist in the DOM BEFORE its text changes or the
              announcement is dropped. It is rendered always, never keyed, never
              conditionally mounted, and its initial value is the paid string —
              identical to what the static markup ships, so mounting announces
              nothing. */}
          <p className="sr-only" role="status" aria-live="polite" id="segLive">
            {channelAnnouncement(channel)}
          </p>
        </div>

        <div className="free-strip" id="freeStrip" ref={freeStripRef}>
          <div className="fs-main">
            <div className="fs-head">
              <span className="fs-badge">{FREE_BADGE}</span>
              <h3>{FREE_TITLE}</h3>
            </div>

            {/* The emphasis inside these sentences is modelled as data, so
                there is no dangerouslySetInnerHTML anywhere in this section.
                See the note on FREE in pricing.data.js. */}
            <p className="fs-intro" id="fsIntro">
              {free.intro.map((part, i) =>
                part.strong ? (
                  <strong key={i}>{part.t}</strong>
                ) : (
                  <Fragment key={i}>{part.t}</Fragment>
                ),
              )}
            </p>

            {/* These <li>s carry `fl-in` and `--i` exactly as legacy writes
                them, and — exactly as in legacy — no animation runs, because
                the keyframe rule is scoped to `.feature-list li.fl-in` and this
                is a `.fs-list`. Reproduced as-is rather than "fixed": widening
                that selector would start animating the free-strip bullets,
                which is a visual change, not a bug fix. */}
            <ul className="fs-list" id="fsFeats">
              {free.feats.map((feat, i) => (
                <li className="fl-in" style={{ '--i': i }} key={feat}>
                  {feat}
                </li>
              ))}
            </ul>

            {/* {' — '} is an explicit expression so JSX whitespace collapsing
                cannot eat a space around the em dash. */}
            <p className="fs-stop" id="fsStop">
              <b>{free.stopLabel}</b>
              {' — '}
              {free.stop}
            </p>
          </div>

          <div className="fs-side">
            {/* Static on every channel and never counted — $0 counting to $0
                is not a gesture. No `swap` class either: legacy's renderTier
                never touches this node, so it never receives one. */}
            <div className="price" id="price-free">
              <span className="currency">{FREE_PRICE.currency}</span>
              <span className="number">{FREE_PRICE.price}</span>
              <span className="period">{FREE_PRICE.period}</span>
            </div>

            <MagneticCta
              className="cta"
              id="cta-free"
              offer={free.offer}
              enabled={pointerFx}
            >
              {FREE_CTA}
            </MagneticCta>
          </div>
        </div>

        {/* Exactly three element children, one per tier. */}
        <div className="offers-grid">
          {TIER_ORDER.map((tier) => (
            <TierCard
              key={tier}
              tier={tier}
              channel={channel}
              numberRef={numberRefs}
              onPointerMove={onSpotlightMove}
            />
          ))}
        </div>

        <div className="compare-wrap">
          <p className="compare-lead" data-compare-copy>
            What you actually get.{' '}
            <span>
              Free tells you <em>if</em> you're leaking. The audit tells you{' '}
              <em>why</em>. Cleanup <em>fixes</em> it. Management <em>keeps</em>{' '}
              it fixed.
            </span>
          </p>

          <CompareTable channel={channel} />

          <p className="compare-note" data-compare-copy>
            {COMPARE_NOTE}
          </p>
        </div>

        <div className="software-block" id="software" ref={softwareRef}>
          <div className="sw-head">
            <span className="sw-kicker">{SOFTWARE.kicker}</span>
            <h3>
              {SOFTWARE.titleLead}
              <span className="ital">{SOFTWARE.titleItal}</span>
              {SOFTWARE.titleTail}
            </h3>
            <p>{SOFTWARE.copy}</p>
          </div>

          <div className="sw-price">
            <span className="sw-amount">
              <span className="sw-cur">{SOFTWARE.currency}</span>
              {/* STRUCTURAL ADDITION: legacy leaves 149 as a bare text node
                  between the currency span and the <em>, and GSAP cannot write
                  into a bare text node. A wrapper span with no styling of its
                  own changes nothing visually — it is inline, inherits
                  everything, and adds no box. */}
              <span
                className="pricing__sw-number"
                ref={(el) => {
                  numberRefs.current.software = el
                }}
              >
                {SOFTWARE.price}
              </span>
              <em>{SOFTWARE.period}</em>
            </span>
            <span className="sw-terms">{SOFTWARE.terms}</span>
          </div>

          <div className="sw-foot">
            <MagneticCta
              className="cta"
              offer={SOFTWARE.offer}
              enabled={pointerFx}
            >
              {SOFTWARE.cta}
            </MagneticCta>
          </div>
        </div>

        <p className="pricing-fineprint" ref={fineprintRef}>
          {FINEPRINT}
        </p>
      </div>
    </section>
  )
}

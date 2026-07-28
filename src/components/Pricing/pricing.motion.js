/**
 * ============================================================================
 * PRICING MOTION CONFIG  —  tier: SCRUB-NO-PIN  (motion-system §B.7)
 * ============================================================================
 * Every duration, ease, distance, scale and offset this section uses is a
 * named constant in this file. Tune Pricing by editing numbers here; nothing
 * in Pricing.jsx should need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * WHY THE NUMBERS ARE PROGRESS UNITS, NOT MILLISECONDS
 * ---------------------------------------------------------------------------
 * This timeline is scrubbed, not played. Pricing.jsx normalises it to exactly
 * 1.0 with `tl.to({}, { duration: 1 }, 0)`, so *timeline time === scroll
 * progress*: `seq.counters.start = 0.35` means literally "35% of the way
 * through the section's scrub window". A scrubbed tween has no wall-clock
 * duration — it advances only as fast as the finger moves — so "120ms" is not
 * something this timeline can honour.
 *
 * To sanity-check a spacing value, convert with REFERENCE_TRAVERSAL_MS_NOPIN
 * (900ms per progress unit for a scrub-no-pin section, vs 2200ms in a pin):
 *
 *     STAGGER.each.base  0.030 units ≈  27ms here   (≈66ms inside a pin)
 *     STAGGER.each.loose 0.055 units ≈  50ms here   (≈120ms inside a pin)
 *
 * That the same constant reads ~2.4x faster here than in a pinned set-piece is
 * INTENTIONAL (motion-system §A.1): pinned set-pieces are slow and deliberate,
 * workhorse sections are brisk. Pricing is the workhorse. Do not inflate these
 * to "match" the hero.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS SECTION DOES NOT PIN  (motion-system §B.7)
 * ---------------------------------------------------------------------------
 * Verbatim from the contract: "The user's job in this section is to compare
 * and click. A pin steals scroll from someone trying to read a nine-row
 * comparison table on a phone, and it makes the segmented control — which
 * changes the content above and below the fold simultaneously — happen inside
 * a frozen frame where they cannot see the effect. Pinning a purchase decision
 * is a conversion bug wearing craft as a disguise."
 *
 * There is therefore NO pin length in this file, and there must never be one.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD
 * ---------------------------------------------------------------------------
 * From §B.7 (the three named moves) and §B.13 (the cross-section mandates for
 * every section head). Windows overlap on purpose.
 *
 *   0.00 → 0.15   Eyebrow rises. §B.13 #2 — 0.02 BEFORE the H2, clamped to 0.
 *   0.00 → 0.22   H2 masked line rise — THE SIGNATURE GESTURE (§A.6).
 *   0.06 → 0.21   Lede paragraph rises. §B.13 #3 — 0.06 after the H2's start.
 *   0.08 → 0.23   Segmented control rises.            [addition, see below]
 *   0.12 → 0.30   THE FREE STRIP IS THE FLOOR. It rises before the paid cards,
 *                 so the reading order is free-then-paid.
 *   0.20 → 0.50   THE RECOMMENDATION ARRIVES LAST AND BIGGEST. Three cards
 *                 rise and scale in; the FEATURED card starts half a beat
 *                 later and overshoots past 1 before settling. The motion is
 *                 the sales argument.
 *   0.35 → 0.62   EVERY PRICE COUNTS. Each .price .number is a scrubbed
 *                 counter, 0 → 299 / 599 / 750. Scrub back and they count
 *                 back down. "Every price on the page", made physical.
 *   0.58 → 0.73   Comparison lead + note rise.        [addition, see below]
 *   0.70 → 0.90   Software block rises.               [addition, see below]
 *   0.74 → 0.94   The $149 counter runs.
 *   0.92 → 1.00   Fineprint rises.                    [addition, see below]
 *
 * ---------------------------------------------------------------------------
 * THE FOUR ADDITIONS, FLAGGED
 * ---------------------------------------------------------------------------
 * §B.7 names three moves. Legacy, however, carried SIX `.reveal` blocks in
 * this section (.section-head, .seg-wrap, .free-strip, .offers-grid,
 * .compare-wrap, .software-block) and §0.1 retires that whole system. Three of
 * the six are covered by §B.7 + §B.13; leaving the other three — plus the
 * fineprint — permanently static inside a fully scrubbed section reads as a
 * bug, not as restraint. Each addition is therefore the minimum scrubbed
 * equivalent of a reveal that already shipped: one TRAVEL.copy or TRAVEL.panel
 * rise, no new gesture vocabulary. Delete the block and its tween if the owner
 * disagrees; nothing else depends on them.
 *
 * §D.11 constrains one of them: the comparison block's SCROLL CONTAINER must
 * never be transformed, because `.compare tbody th` is `position: sticky` and
 * a transformed ancestor changes its containing block. So `compareCopy` targets
 * `.compare-lead` and `.compare-note` — the two paragraphs OUTSIDE
 * `.compare-scroll` — and never `.compare-wrap`.
 *
 * ---------------------------------------------------------------------------
 * HOW THIS IS NOT FADE-IN-ON-ENTER (motion-system §0)
 * ---------------------------------------------------------------------------
 * Park the scroll at 45% and the featured card is mid-overshoot, physically
 * larger than its neighbours, and the three prices read something like $214,
 * $429 and $537. One notch up and they count back down. Every value is a
 * continuous function of scroll position, not a boolean crossing — which is
 * exactly why the counter is the right gesture for a section whose headline is
 * "Every price on the page".
 *
 * ---------------------------------------------------------------------------
 * ⚠️ ONE THING THE OWNER SHOULD KNOW BEFORE TUNING
 * ---------------------------------------------------------------------------
 * This is by some distance the tallest section on the site (~3 viewports on
 * desktop, more on a phone). The standard SCRUB_WINDOW is `top 85%` →
 * `bottom 55%`, so the window length is roughly the section's own height —
 * which means one progress unit here buys a LOT more scroll than it does in a
 * short section, and an element near the bottom of the section is only on
 * screen during the last ~20% of progress. The windows above were chosen so
 * each beat fires while its subject is actually in frame; if the section's
 * height changes materially, re-check that pairing before re-tuning anything
 * else. `?motion-debug` puts the trigger markers on screen.
 * ============================================================================
 */

import { BEAT, EASE, SCALE, STAGGER, TRAVEL } from '../../motion/system'

/**
 * The featured card's overshoot, as a { desktop, mobile } pair so `pick()` can
 * read it — the same shape TRAVEL and PIN use.
 *
 * Hoisted to module scope rather than written inline so the AUTHORED mobile
 * number has exactly one home. Both MOTION.seq.cards.featured.overshoot and
 * MOTION.mobile read from here; there is no second copy to drift.
 *
 * desktop 1.025 = SCALE.punchSoft. punchSoft rather than punch, because 1.09
 * on a 600px card is a 54px growth and reads as a zoom, not a punch (§A.2).
 *
 * mobile 1.014 is AUTHORED, not derived — §A.4 #6 forbids `desktop * 0.6`
 * anywhere in this build. Reasoning: on a 390px viewport the cards go
 * full-width single column, so 2.5% is ~9px of growth on each side, enough to
 * visibly break the gutter alignment against the free strip directly above it.
 * 1.4% is ~5px, which still reads as a swell without the card appearing to
 * escape the page margin.
 */
const FEATURED_OVERSHOOT = { desktop: SCALE.punchSoft, mobile: 1.014 }

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — all values are progress units (0 → 1 across the scrub window)  */
  /* ----------------------------------------------------------------------- */
  seq: {
    /**
     * The eyebrow (`.mono-label`, "Pricing").
     *
     * §B.13 #2 is a cross-section mandate: every eyebrow on the site rises
     * pick(TRAVEL.copy) on EASE.reveal starting 0.02 BEFORE its H2.
     *
     * ⚠️ CLAMP: this section's H2 starts at 0.00, and a timeline normalised to
     * [0, 1] has nowhere to put -0.02. Pricing.jsx computes
     * `Math.max(0, seq.heading.start - seq.eyebrow.lead)`, so the lead
     * resolves to 0 here. `lead` stays a named number anyway: if the H2 is ever
     * pushed later in the storyboard, the mandated offset applies with no code
     * change.
     */
    eyebrow: {
      lead: 0.02,
      /** BEAT.sm — "a short move: copy masking up". */
      span: BEAT.sm,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * 0.00 → 0.22 — the H2 masks up line by line.
     *
     * THE SIGNATURE GESTURE (§A.6). Identical numbers on the hero H1 and on the
     * H2 of nine other sections: yPercent 110, EASE.reveal, STAGGER.each.loose.
     * §B.13 #1 forbids varying it — the variation is meant to live in what
     * happens AFTER the headline, and in this section that is the counters.
     */
    heading: {
      start: 0.0,
      end: 0.22,
      /** Per-line, not total: an H2 is 1-3 lines and n is fixed by design. */
      staggerEach: STAGGER.each.loose,
      /** 110 not 100, so descenders clear the mask edge on a subpixel bound. */
      fromYPercent: TRAVEL.maskYPercent,
      ease: EASE.reveal,
    },

    /**
     * The lede paragraph. §B.13 #3: every lede under a section head rises
     * pick(TRAVEL.copy) starting 0.06 AFTER its H2's start.
     */
    lede: {
      offset: 0.06,
      span: BEAT.sm,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * ADDITION (see the header note). The segmented control.
     *
     * It rises as copy, not as a card: it is a control the user is about to
     * read, and TRAVEL.panel on a 460px pill reads as a slot machine. It lands
     * before the free strip so the choice is legible before the offer is.
     *
     * NOTE: only the WRAPPER moves. The thumb inside it is click-driven and is
     * animated on wall-clock time (see `thumb` below) — a scrubbed thumb would
     * mean the user's own selection slid around as they scrolled, which is the
     * single worst thing this section could do.
     */
    segWrap: {
      start: 0.08,
      span: BEAT.sm,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * 0.12 → 0.30 — THE FREE STRIP IS THE FLOOR (§B.7 move 3).
     *
     * Deliberately BEFORE the paid cards. The section's argument is "start
     * free, then decide", and the motion states the reading order before the
     * copy gets a chance to: the free offer is on screen and resolved while the
     * three paid tiers are still arriving.
     *
     * TRAVEL.panel because this is the heaviest object in the section — a
     * full-width two-column strip. Perceived speed is displacement relative to
     * the object's own size (§A.2), so a panel that travelled TRAVEL.copy
     * would read as a twitch.
     */
    freeStrip: {
      start: 0.12,
      end: 0.3,
      fromY: TRAVEL.panel,
      fromScale: SCALE.riseFrom,
      ease: EASE.reveal,
    },

    /**
     * 0.20 → 0.50 — THE RECOMMENDATION ARRIVES LAST AND BIGGEST (§B.7 move 1).
     *
     * The two plain cards enter together on STAGGER.each.base. `each` (not
     * `amount`) because n is 3 and fixed by the design (§A.2).
     *
     * SCALE.riseFrom (0.96) is "an object approaching" — just under 1. Below
     * ~0.9 it reads as a modal popping in, which is the wrong verb for a price.
     */
    cards: {
      start: 0.2,
      end: 0.5,
      staggerEach: STAGGER.each.base,
      fromY: TRAVEL.card,
      fromScale: SCALE.riseFrom,
      ease: EASE.reveal,

      /**
       * The featured card — "Audit + Cleanup", the one carrying
       * `Best first engagement`.
       *
       * It is offset half a beat behind its neighbours and overshoots past 1
       * before settling, so it arrives last and momentarily largest. That is
       * the whole point: the motion is the sales argument, and it is a POSITION
       * ON THE TIMELINE, not a CSS transition-delay — scrub backwards and the
       * overshoot un-happens.
       *
       * `offset` is BEAT.xs, the system's "punctuation" beat: the smallest
       * gesture that is still perceptible at scrub speed. Half of BEAT.sm
       * would be 0.075 and functionally identical; BEAT.xs is used because it
       * composes from the shared scale instead of inventing a number.
       *
       * `overshoot` is a { desktop, mobile } pair read through `pick()`; both
       * values and their reasoning live on FEATURED_OVERSHOOT above.
       *
       * `split` reuses SCALE.punchSplit (0.4) — fast up, slow settle, the same
       * asymmetry as the hero's colour flip. Reversing it reads as a bounce,
       * which is a different feeling.
       */
      featured: {
        offset: BEAT.xs,
        overshoot: FEATURED_OVERSHOOT,
        split: SCALE.punchSplit,
        /** The arrival half — the card is entering, so it uses the entrance
         *  curve rather than the hero's punchOut. */
        easeIn: EASE.reveal,
        /** The settle half. EASE.punchIn is the "settle after an overshoot"
         *  curve, shared with the hero's colour flip. */
        easeSettle: EASE.punchIn,
      },
    },

    /**
     * 0.35 → 0.62 — EVERY PRICE COUNTS (§B.7 move 2).
     *
     * Each `.price .number` is a scrubbed counter: 0 → 299, 0 → 599, 0 → 750.
     * Scrub back and they count back down. This is the section headline
     * ("Every price on the page") rendered as motion.
     *
     * `decimals: 0` is MANDATORY and is not decoration (§D.10, §B.13 #4). The
     * hero's shipped counter pattern is `Math.round(readout.v)`, and a builder
     * copying it for AI Build's 11.4 would silently ship "11". Every counter on
     * this site therefore carries an explicit decimals field, including the
     * ones where it happens to be 0 — the field existing is the point.
     *
     * `group: true` puts the thousands separator back, which is what makes the
     * `both` channel's '1,099' and '1,350' land byte-identical to the data at
     * progress 1.0.
     *
     * EASE.reveal, not EASE.rail: a price is not a gauge. It should feel like
     * it is resolving to a figure, not like it is attached to the wheel.
     */
    counters: {
      start: 0.35,
      end: 0.62,
      staggerEach: STAGGER.each.base,
      decimals: 0,
      group: true,
      from: 0,
      ease: EASE.reveal,
    },

    /**
     * The software block's $149 counter.
     *
     * §B.7 lists `0 → 149` in the same sentence as the three card counters and
     * their 0.35 → 0.62 window. It gets its own window here for one concrete
     * reason: at progress 0.35 the software block is roughly two viewports
     * below the fold in this very tall section, so counting it there would run
     * the entire gesture where nobody can see it — which is the one failure
     * mode "every price counts" is meant to avoid. It is instead co-timed with
     * the block's own arrival, and finishes just after it lands.
     *
     * Same decimals/group contract as the card counters.
     */
    softwareCounter: {
      start: 0.74,
      end: 0.94,
      decimals: 0,
      group: true,
      from: 0,
      ease: EASE.reveal,
    },

    /**
     * ADDITION. The comparison block's two paragraphs.
     *
     * ⚠️ §D.11: this tween must NEVER target `.compare-wrap` or
     * `.compare-scroll`. `.compare tbody th` is `position: sticky; left: 0`,
     * and a transform on any ancestor creates a containing block that changes
     * how sticky and scroll anchoring behave inside it. The sticky row-label
     * column is what makes the table readable on a phone. Only the two
     * paragraphs outside the scroll container move.
     */
    compareCopy: {
      start: 0.58,
      span: BEAT.sm,
      staggerEach: STAGGER.each.base,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * ADDITION. The software block — the second product, in its own amber
     * frame. A full panel, so TRAVEL.panel, matching the free strip.
     */
    software: {
      start: 0.7,
      end: 0.9,
      fromY: TRAVEL.panel,
      fromScale: SCALE.riseFrom,
      ease: EASE.reveal,
    },

    /**
     * ADDITION. The fineprint. The last line in the section, at BEAT.xs —
     * punctuation, closing the timeline exactly at 1.0.
     */
    fineprint: {
      start: 0.92,
      span: BEAT.xs,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },
  },

  /* ----------------------------------------------------------------------- */
  /* CLICK-DRIVEN STATE — NOT scrubbed                                        */
  /* ----------------------------------------------------------------------- */
  /**
   * The segmented control is the one piece of real state in this section, and
   * §B.7 is explicit that it is NOT scroll-driven. These are WALL-CLOCK
   * seconds, not progress units — the only numbers in this file that are.
   */
  control: {
    /**
     * The thumb slides on a custom property (`--pricing-thumb-x`, an integer
     * 0/1/2) which CSS turns into `translateX(calc(var(…) * 100%))`. GSAP owns
     * the property; CSS owns the geometry.
     *
     * 0.24s and EASE.cssOut come straight from §B.7. EASE.cssOut ('expo.out')
     * is GSAP's twin of the `--e-out` token, and its docstring in system.js
     * names this exact control as its reason for existing: the thumb is GSAP
     * and the surrounding card swap is CSS, and if the two used different
     * curves the halves of one interaction would disagree by a few frames,
     * which reads as a bug.
     *
     * NOT EASE.cssSpring, even though legacy's CSS transition used
     * `--e-spring`. A back-ease overshoot on a 42px-tall thumb inside a 4px
     * padded track visibly clips past the pill's inner edge; the shipping
     * legacy value overshot because the transition was the only motion in the
     * control. Flagged as a deliberate divergence.
     */
    thumb: { duration: 0.24, ease: EASE.cssOut },

    /**
     * Magnetic pull on the two CTAs legacy marked `.mag` (#cta-free and the
     * software CTA). Legacy computed
     *   tx = (pointerX - centreX) * 0.28
     *   ty = (pointerY - centreY) * 0.34
     * and lerped toward it at 0.18 per frame in a hand-rolled rAF loop.
     *
     * The two pull factors are legacy's, verbatim. The lerp is replaced by a
     * Framer Motion spring, because Framer already owns the transform channel
     * on these anchors (press physics) and two owners of one transform is a
     * fight nobody wins — see the note in Pricing.jsx. The spring below is
     * tuned to land near the same settle time as a 0.18/frame lerp (~7 frames
     * to 75%); it is not a transcription and the owner should feel free to
     * retune it.
     */
    magnetic: {
      pullX: 0.28,
      pullY: 0.34,
      spring: { stiffness: 260, damping: 26, mass: 0.6 },
    },

    /**
     * Press physics on all five CTAs. Same values as Hero.jsx, deliberately —
     * a button must feel identical wherever it appears on the site.
     * Framer Motion is scoped to component-level micro-interaction only; the
     * scroll work is entirely GSAP's.
     */
    press: {
      hoverY: -1,
      tapScale: 0.97,
      spring: { type: 'spring', stiffness: 420, damping: 30 },
    },
  },

  /* ----------------------------------------------------------------------- */
  /* MOBILE — AUTHORED VALUES, NOT SCALED DESKTOP ONES                        */
  /* ----------------------------------------------------------------------- */
  /**
   * Every number below was chosen for a phone. None of them is a desktop
   * number multiplied by something — motion-system §A.4 #6 forbids writing
   * `x * 0.6` anywhere, and `pick()` exists so it never has to be written.
   *
   * The beat boundaries in `seq` are shared across breakpoints on purpose: the
   * STORYBOARD is the same argument at both sizes. Only its geometry changes.
   * §B.7 mobile is explicit that "counters keep the same windows" and that the
   * featured card keeps its late-and-big treatment, "because that is the
   * argument".
   *
   * Travel distances are already per-breakpoint through TRAVEL.copy / .card /
   * .panel, so the only value that needs authoring locally is the overshoot,
   * and it lives on FEATURED_OVERSHOOT at the top of this file so the pair
   * `pick()` reads and the mobile number a tuner edits are the same object.
   * Restated here because "where are the mobile numbers" is the first question
   * anyone opens this block to answer.
   */
  mobile: {
    /** §B.7 mobile: "overshoot drops to a lower value in pricing.motion.js".
     *  Single source — edit FEATURED_OVERSHOOT.mobile, not a copy. */
    featuredOvershoot: FEATURED_OVERSHOOT.mobile,
  },
}

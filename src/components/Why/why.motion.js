/**
 * ============================================================================
 * WHY MOTION CONFIG — section 9, tier: SCRUB-NO-PIN (motion-system §B.9)
 * ============================================================================
 * Every duration, stagger, ease, distance and scale the section uses lives in
 * this file. Tune Why by editing numbers here; nothing in Why.jsx should need
 * to change to re-time the storyboard.
 *
 * ---------------------------------------------------------------------------
 * READ THIS FIRST: the numbers are progress units, not milliseconds
 * ---------------------------------------------------------------------------
 * This timeline is SCRUBBED, not played. Its total duration is normalised to
 * 1.0 in Why.jsx (`tl.to({}, { duration: 1 }, 0)`), so *timeline time ===
 * scroll progress*. `seq.pills.start = 0.50` means exactly "half way through
 * the section's scrub window".
 *
 * A scrubbed tween has no wall-clock duration — it advances only as fast as the
 * user scrolls — so "120ms" is not something this timeline can honour. Staggers
 * are therefore in progress units. To sanity-check one, use the NO-PIN
 * traversal constant from the shared system:
 *
 *     REFERENCE_TRAVERSAL_MS_NOPIN = 900     (motion/system.js)
 *     0.030 units × 900ms ≈ 27ms
 *     0.090 units × 900ms ≈ 81ms
 *
 * That is roughly 2.4× faster than the same constant reads inside a pin, and
 * that is CORRECT and deliberate (§A.1): pinned set-pieces are slow and
 * deliberate, workhorse bands like this one are brisk. Do not inflate the
 * staggers here to "match" the hero.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD — "the wrapper comes off" (§B.9)
 * ---------------------------------------------------------------------------
 * The copy's image is a polished deck hiding a person. So the deck is the thing
 * that animates: the two cards start fanned as a stack and separate into their
 * two grid positions. They never fade — they were always there, they were just
 * stacked. That is what makes this section reversible and legible at any parked
 * scroll position, and it is why it is not fade-in-on-enter (§0).
 *
 *   0.00 → 0.08   eyebrow rises            (BEAT.xs)
 *   0.02 → 0.20   H2 masked line rise      (the signature gesture, §A.6)
 *   0.15 → 0.55   the deck un-stacks       (the section's argument)
 *   0.50 → 0.85   eight pills arrive
 *   0.60 → 0.85     …and take their channel colour (two-layer cross-fade)
 *   0.80 → 1.00   the lede paragraph masks up, closing the section
 *
 * Overlaps are deliberate. The deck starts while the headline is still
 * resolving so the sentence and the gesture land together; the pills start
 * before the deck has finished settling so the section never has a dead frame.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS IMPORTED vs WHAT IS AUTHORED
 * ---------------------------------------------------------------------------
 * Anything that defines "how Clarify moves" is imported from motion/system.js
 * and composed — never re-typed as a literal, because the day the site's feel
 * is retuned, one edit there must move all twelve sections together.
 *
 * The literals below are the ones that are genuinely specific to THIS
 * storyboard: the beat boundaries, and the deck's fan geometry.
 * ============================================================================
 */

import { BEAT, EASE, SCALE, STAGGER, TRAVEL } from '../../motion/system'

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — all values are progress units (0 → 1 across the scrub window) */
  /* ----------------------------------------------------------------------- */
  seq: {
    /**
     * 0.00 → 0.08 · the `.mono-label` eyebrow rises.
     *
     * §B.13 #2 is a cross-section mandate: every eyebrow rises pick(TRAVEL.copy)
     * on EASE.reveal, starting 0.02 BEFORE its H2.
     *
     * RECONCILIATION, because two parts of the contract collide at exactly this
     * point: §B.9 gives the H2 the window 0.00 → 0.20, and a timeline
     * normalised to [0, 1] cannot hold a tween at -0.02. So the eyebrow takes
     * 0.00 and the H2 is nudged to 0.02 — the 0.02 lead is preserved exactly,
     * the H2's end lands exactly where §B.9 put it, and only the H2's start
     * moves, by two hundredths of a scroll window. If you would rather have the
     * H2 at a hard 0.00, set `heading.start` to 0 and delete `lead` — but then
     * the eyebrow and headline start together and Why stops matching the other
     * eight scrubbed bands.
     */
    eyebrow: {
      start: 0.0,
      /** BEAT.xs is the punctuation beat — the right size for a 11px label. */
      end: BEAT.xs,
      /** { desktop, mobile } pair; the component reads it through pick().
       *  Mobile is TRAVEL's own authored 14px, never a scaled 18. */
      fromY: TRAVEL.copy,
      /** The eyebrow has no mask, so a pure translate would read as a slide
       *  with no arrival. Opacity is what makes it "rise" rather than "slide". */
      fromOpacity: 0,
      ease: EASE.reveal,
    },

    /**
     * 0.02 → 0.20 · H2 masked line rise. THE SIGNATURE GESTURE (§A.6, §B.13 #1).
     *
     * Identical numbers in all ten sections that own an H2: yPercent 110,
     * EASE.reveal, STAGGER.each.loose. Do not vary it "for interest" — the
     * variation on this site lives in what happens AFTER the headline.
     *
     * NOTE FOR ANYONE DIFFING AGAINST LEGACY: legacy's `.why-copy h2` did NOT
     * do the mask wipe (the `clip-path` start state was scoped to
     * `.section-head h2, .contact-copy h2`, which #why is neither of). The
     * motion contract overrides that: §A.6 lists Why's H2 explicitly. This is a
     * deliberate upgrade, not a porting accident.
     */
    heading: {
      start: 0.02,
      end: 0.2,
      /** % of the line's own height. 110 not 100 so descenders clear the mask
       *  edge on a subpixel boundary. */
      fromYPercent: TRAVEL.maskYPercent,
      /** Per line. ≈120ms at pin traversal, ≈50ms here. Deliberate, readable,
       *  one line at a time — this is a sequence the reader is meant to count. */
      staggerEach: STAGGER.each.loose,
      ease: EASE.reveal,
    },

    /**
     * 0.15 → 0.55 · THE DECK UN-STACKS. The section's whole argument.
     *
     * EASE.settle (power3.inOut), not EASE.reveal: this is the last
     * repositioning of two objects that have mass, and settle is slower to
     * leave and slower to arrive, so the frame settles instead of stopping.
     *
     * NO OPACITY. The cards are at opacity 1 for the entire window. They are
     * *positioned*, not *revealed* — two cards fading up side by side is the
     * single most generic treatment available and this is the section where the
     * site makes its differentiation argument.
     */
    deck: {
      start: 0.15,
      end: 0.55,
      ease: EASE.settle,
      /**
       * Deliberately 0. There are exactly two cards and §B.9 authors them as
       * ONE gesture — a wrapper coming off, not two cards arriving in turn. A
       * stagger here splits the gesture in half and the metaphor stops reading.
       * Raise it to STAGGER.each.tight (0.018) if you want texture; anything
       * larger and it becomes a sequence.
       */
      staggerEach: 0,
    },

    /**
     * 0.50 → 0.85 · the eight capability pills arrive, then take their colour.
     *
     * `amount`, not `each`: eight items at STAGGER.each.base would occupy 0.21
     * of the timeline and blow straight through the 0.35 window on top of the
     * tween's own duration. `amount` is a TOTAL spread and stays inside the
     * beat no matter how many pills the data grows to (§STAGGER).
     */
    pills: {
      start: 0.5,
      end: 0.85,
      ease: EASE.reveal,
      /** Just under 1 — the pill reads as approaching, not as a popup. */
      fromScale: SCALE.riseFrom,
      fromOpacity: 0,
      /**
       * AUTHORED PER BREAKPOINT, not scaled (§A.4 rule 6). Mobile takes the
       * tight amount because §B.9 says so and the reason is spatial: eight
       * pills in a single narrow column wrap to four-plus rows, and a wide
       * spread there reads as a slow list being typed out rather than as one
       * capability strip landing.
       */
      staggerAmount: {
        desktop: STAGGER.amount.base,
        mobile: STAGGER.amount.tight,
      },
      /**
       * The channel colour lands as a TWO-LAYER OPACITY CROSS-FADE (§A.4 rule 2,
       * §B.13 #5) — the same mechanism as the hero's chip colour-coding, same
       * markup shape, same ease. This is the second place on the site where the
       * paid/organic/AI palette carries meaning, and the two must move
       * identically or the colour system reads as decoration.
       */
      tint: {
        /**
         * How far into the pill window the tint begins. The pill therefore
         * ARRIVES neutral and THEN takes its colour, which mirrors the hero
         * exactly (chips converge 0.25-0.50 neutral, colour-code 0.50-0.70).
         * A tint that starts at the same instant as the arrival is not a
         * colour-coding beat, it is just a coloured pill fading in.
         */
        offset: 0.1,
        /** Near-linear. Anything with a curve makes the cross-fade midpoint go
         *  muddy — both layers sit near 0.7 at once and the colour reads as
         *  neither one nor the other. */
        ease: EASE.tint,
      },
    },

    /**
     * 0.80 → 1.00 · the lede paragraph masks up, and the section is finished.
     *
     * WHY THE PARAGRAPH IS LAST AND NOT SECOND. §B.13 #3 puts a lede `<p>`
     * 0.06 after its H2 — but that rule is written for a `.section-head`, and
     * `#why` has no `.section-head`; it is a two-column `.why-grid` whose left
     * column is a copy stack. §B.9 storyboards this paragraph explicitly as the
     * closing beat, the same way Coverage closes on its `.cov-tag`s. The
     * section-specific storyboard wins over the generic default.
     *
     * `amount`, not `each`: the line count of a paragraph is a function of the
     * viewport, which makes it data, not design. `each` at 0.055 would occupy
     * 0.22 at five lines and overrun the end of the timeline.
     */
    lede: {
      start: 0.8,
      end: 1.0,
      fromYPercent: TRAVEL.maskYPercent,
      staggerAmount: STAGGER.amount.base,
      ease: EASE.reveal,
    },
  },

  /* ----------------------------------------------------------------------- */
  /* DECK GEOMETRY — where the two cards sit at progress 0                    */
  /* ----------------------------------------------------------------------- */
  /**
   * Both breakpoints are AUTHORED IN FULL. There is no `desktop * 0.6` here and
   * there must never be — the day mobile wants a bigger rotation than desktop,
   * a ratio would be a bug rather than a number to edit (§A.4 rule 6).
   *
   * `back` is card 2 (`Two practices. One thesis.`), `front` is card 1
   * (`Agency-trained rigor.`). Card 1 renders first in the DOM and is given a
   * higher `z-index` in Why.css so the stack reads front-to-back rather than
   * bottom-to-top — see the note there.
   *
   * Everything resolves to 0 / 0 / 0deg / 1, which is the plain two-row grid.
   * Rotation is in DEGREES, x and y in PIXELS.
   */
  deck: {
    desktop: {
      /** Card 1: nothing but a slight counter-rotation, so the pair reads as a
       *  fanned stack rather than as one card that drifted. */
      front: { x: 0, y: 0, rotation: -1.2, scale: 1 },
      /**
       * Card 2 sits behind and above card 1.
       * `y` is the shared card travel, negated — the card starts ABOVE its home
       * row, overlapping card 1, which is what makes it a deck.
       * `x: 8` is the deck's lateral offset. Small on purpose: it has to stay
       * inside `.shell`'s narrowest desktop gutter (40px at ≤1240px) or the
       * fanned frame nudges the document width.
       */
      back: { x: 8, y: -TRAVEL.card.desktop, rotation: 1.5, scale: 0.97 },
    },
    mobile: {
      front: { x: 0, y: 0, rotation: -0.9, scale: 1 },
      /**
       * The gesture works BETTER stacked (§B.9): at ≤1080px `.why-grid`
       * collapses and the cards are already one above the other, so the
       * un-stacking is mostly rotation plus a small Y separation. `x` drops to
       * 4 because a 20px `.shell` gutter has no room to fan sideways, and
       * `scale` sits nearer 1 because a 0.97 on a full-bleed phone card is a
       * ~10px growth and reads as a zoom rather than as a stack.
       */
      back: { x: 4, y: -TRAVEL.card.mobile, rotation: 1.2, scale: 0.985 },
    },
  },
}

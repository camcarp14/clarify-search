/**
 * ============================================================================
 * DIAGNOSIS MOTION CONFIG — "the seam closes"
 * ============================================================================
 * Every duration, stagger, ease, distance and beat boundary for #diagnosis
 * lives here. Tune the section by editing numbers in this file; nothing in
 * Diagnosis.jsx should need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * TIER: scrub-no-pin (motion-system §B.3). NO PIN, and no boolean crossing
 * anywhere — every value below is a position on a timeline that scroll scrubs.
 * ---------------------------------------------------------------------------
 * The timeline is normalised to 1.0 (`tl.to({}, { duration: 1 }, 0)`), so
 * *timeline time === scroll progress*. `seq.silos.start = 0.18` means exactly
 * "18% of the way through this section's scrub window".
 *
 * A scrubbed tween has no wall-clock duration — it advances only as fast as the
 * user scrolls — so staggers are in PROGRESS UNITS, never milliseconds. The
 * conversion constant for a scrub-no-pin section is
 * REFERENCE_TRAVERSAL_MS_NOPIN = 900ms per progress unit (system.js), i.e.
 * roughly 2.4x faster than the same number inside a pin. That is deliberate:
 * pinned set-pieces are slow, workhorse sections are brisk. Do NOT inflate the
 * staggers below to "match" the hero — they are supposed to read quicker.
 *
 *     STAGGER.each.base  0.030 units  ≈  27ms here  (≈66ms inside a pin)
 *     STAGGER.each.loose 0.055 units  ≈  50ms here  (≈120ms inside a pin)
 *
 * ---------------------------------------------------------------------------
 * THE ARGUMENT THIS SECTION MAKES, AND WHY THE MOTION IS WHAT IT IS
 * ---------------------------------------------------------------------------
 * The copy is spatial: "two silos" → "one page", and the money is "in the seam
 * between them". So the seam is the thing that animates. At progress 0 the four
 * pain cards are pulled apart into two silos with a lit seam down the middle;
 * they travel back together, the seam fades out at exactly the progress they
 * meet, and the phrase "one page" lands in ink as the page becomes one.
 *
 * Park the scroll at 40% and you get two half-separated silos and a half-faded
 * seam. Scroll up one notch and the silos re-open. The argument is legible only
 * BECAUSE it is reversible.
 *
 * ---------------------------------------------------------------------------
 * BEAT MAP (progress units, motion-system §B.3 verbatim)
 * ---------------------------------------------------------------------------
 *   0.00 → 0.22   H2 masked line rise (the signature gesture, §A.6)
 *   0.00 → 0.08   eyebrow rises            (§B.13 #2 — see note on `eyebrow`)
 *   0.06 → 0.21   lede paragraph rises     (§B.13 #3)
 *   0.18 → 0.55   the two silos travel to x: 0   ← overlaps the headline
 *   0.30 → 0.55   the seam cross-fades out, finishing as the silos meet
 *   0.42 → 0.60   "one page" cross-fades muted → ink
 *   0.62 → 0.85   the standard strip rises
 *   0.78 → 1.00   the three metrics mask up; two of them are counters
 * ============================================================================
 */

import { BEAT, EASE, STAGGER, TRAVEL } from '../../motion/system.js'

export const MOTION = {
  /* --------------------------------------------------------------------- */
  /* SEQUENCE — all values are progress units (0 → 1 across the scrub window) */
  /* --------------------------------------------------------------------- */
  seq: {
    /**
     * §B.13 #2 puts every `.mono-label` eyebrow 0.02 BEFORE its H2. The H2 is
     * this section's first beat (§B.3 opens at 0.00), so there is no timeline
     * in front of it and the mandated lead clamps to 0 — eyebrow and heading
     * start together. `leadBeforeHeading` is kept as a real number so the
     * relationship is visible: push `heading.start` to 0.02 and the lead comes
     * back, and every later beat still has slack.
     */
    eyebrow: {
      leadBeforeHeading: 0.02,
      start: 0.0,
      duration: BEAT.xs,
      ease: EASE.reveal,
      /** Distance pair — resolved with pick(..., isMobile) in the component. */
      travel: TRAVEL.copy,
    },

    /**
     * THE SIGNATURE GESTURE (§A.6 / §B.13 #1). SplitText lines + `mask: 'lines'`,
     * rising out of their own masks. Identical numbers on every H2 on the site —
     * yPercent 110, EASE.reveal, STAGGER.each.loose. Do not vary it "for
     * interest": the variation lives in what happens AFTER the headline.
     */
    heading: {
      start: 0.0,
      end: 0.22,
      ease: EASE.reveal,
      staggerEach: STAGGER.each.loose,
      /** % of each line's own height. 110 not 100 so descenders clear the mask. */
      fromYPercent: TRAVEL.maskYPercent,
    },

    /** §B.13 #3 — the lede starts 0.06 after its H2's start. */
    lede: {
      start: 0.06,
      duration: BEAT.sm,
      ease: EASE.reveal,
      travel: TRAVEL.copy,
    },

    /**
     * 0.18 → 0.55 — THE SILOS CLOSE.
     *
     * Starts 0.04 before the headline finishes, deliberately: the sentence and
     * the gesture are supposed to land together, so the reader is watching the
     * silos meet while still finishing "Google runs it as one page."
     *
     * EASE.travel (power2.inOut) because this is a long A→B repositioning of
     * objects with mass. They are POSITIONED, not revealed — no opacity tween
     * on the cards at all. They were always there; they were just apart.
     */
    silos: {
      start: 0.18,
      end: 0.55,
      ease: EASE.travel,
      /** Lateral (desktop) / vertical (mobile) separation at progress 0. */
      travel: TRAVEL.converge,
    },

    /**
     * 0.30 → 0.55 — THE SEAM CLOSES.
     *
     * Ends at exactly the progress the silos meet. That coincidence is the
     * whole point: the seam disappearing IS "they sit in the seam between
     * them". EASE.tint because this is a cross-fade of a stacked layer, and a
     * cross-fade wants to be near-linear or its midpoint goes muddy.
     */
    seam: {
      start: 0.3,
      end: 0.55,
      ease: EASE.tint,
    },

    /**
     * 0.42 → 0.60 — "one page" ARRIVES.
     *
     * A two-layer opacity cross-fade (rule 2 / §B.13 #5): the in-flow span is
     * muted, an absolutely-positioned aria-hidden twin in ink fades 0 → 1 over
     * it. Never a colour tween. It resolves just after the silos meet, so the
     * phrase lands a beat behind the picture rather than on top of it.
     */
    onePage: {
      start: 0.42,
      end: 0.6,
      ease: EASE.tint,
      /** Both ends are warm dark neutrals, so the interpolated midpoint is a
       *  warm dark neutral too — the usual objection to colour tweens (muddy
       *  midpoints) does not apply between these two. */
      fromColor: 'rgb(106, 96, 83)',
      toColor: 'rgb(33, 28, 22)',
    },

    /**
     * 0.62 → 0.85 — the standard strip.
     *
     * TRAVEL.panel because the strip is the heaviest object in the section, and
     * perceived speed is displacement relative to the object's own size. It
     * carries an opacity fade as well as the rise: parked at progress 0.65 a
     * panel sitting 64px low with no fade reads as broken layout rather than as
     * an arrival. (Coverage's panels deliberately do NOT fade — they are a
     * diagram being positioned. This one is a footnote arriving.)
     */
    strip: {
      start: 0.62,
      end: 0.85,
      ease: EASE.reveal,
      travel: TRAVEL.panel,
    },

    /**
     * 0.78 → 1.00 — the three metrics.
     *
     * All three mask up together on STAGGER.each.base (§B.3 assigns that
     * stagger to the non-numeric `1:1`; applying it to all three is what makes
     * them read as one row rather than as three unrelated events). The two
     * counters run across the same window — see `counters` below.
     */
    metrics: {
      start: 0.78,
      end: 1.0,
      ease: EASE.reveal,
      fromYPercent: TRAVEL.maskYPercent,
    },
  },

  /* --------------------------------------------------------------------- */
  /* BREAKPOINT-SPECIFIC VALUES — AUTHORED, NEVER DERIVED                   */
  /* --------------------------------------------------------------------- */
  /**
   * Mobile numbers are written out, not computed from the desktop ones. Where a
   * pair below currently holds the same value on both sides that is a choice,
   * not a shortcut: either can move without touching the other.
   */
  split: {
    /**
     * Which way the two silos separate.
     *
     * Desktop (≥900px) the pain grid is a row (4-across above 1080px, 2×2
     * between 900 and 1080), so the silos are LEFT and RIGHT and the seam is a
     * vertical rule. Mobile (<900px) the grid is 2×2 or a single column, so the
     * silos are TOP and BOTTOM and the seam is horizontal.
     *
     * Which card belongs to which silo is MEASURED at refresh time from
     * offsetLeft/offsetTop (Diagnosis.jsx `measure`), never hard-coded by
     * index — the CSS column ladder (1080 / 760) and the motion breakpoint
     * (899) do not line up, and a hard-coded pairing is wrong at 900-1080px.
     */
    axis: { desktop: 'x', mobile: 'y' },

    /**
     * Stagger WITHIN each silo (card 1 leads card 2, card 3 leads card 4), so a
     * pair reads as two objects moving together rather than as one block.
     * Both breakpoints authored at the card-to-card default.
     */
    stagger: { desktop: STAGGER.each.base, mobile: STAGGER.each.base },
  },

  metrics: {
    /** Metric-to-metric cascade. Authored per breakpoint; the metrics row stays
     *  horizontal at every width (there is no ≤760px override for it in the
     *  shipped CSS), so both sides hold the same value today. */
    stagger: { desktop: STAGGER.each.base, mobile: STAGGER.each.base },
  },

  /* --------------------------------------------------------------------- */
  /* COUNTERS                                                               */
  /* --------------------------------------------------------------------- */
  /**
   * §B.13 #4: every counter on the site uses the shared `counter()` readout
   * from system.js, and every one of them declares `decimals` EXPLICITLY.
   * Both of these are integers, but the field is not optional — AI Build counts
   * to 11.4 and the hero's `Math.round` pattern would silently ship "11".
   *
   * EASE.rail on both. A counter is a gauge: the user should read the number as
   * attached to the finger, and an eased number visibly stops tracking the
   * scroll near the ends of its window.
   *
   * `contracts` counts DOWN from 12 to 0 — the copy says "0 · Long contracts"
   * and the joke only lands if you watch it get there.
   */
  counters: {
    hours: { from: 0, to: 48, decimals: 0, suffix: 'h', ease: EASE.rail },
    contracts: { from: 12, to: 0, decimals: 0, suffix: '', ease: EASE.rail },
  },

  /** `window.__diagnosis` handle while tuning. Only attached when DEBUG. */
  debugKey: '__diagnosis',
}

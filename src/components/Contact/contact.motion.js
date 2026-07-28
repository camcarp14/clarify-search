/**
 * ============================================================================
 * CONTACT + FOOTER MOTION CONFIG
 * ============================================================================
 * Every duration, stagger, ease, distance and scale used by Contact.jsx and
 * Footer.jsx is a named constant in this file. Tune by editing numbers here;
 * nothing in the JSX should need to change to re-time the section.
 *
 * Two exports, because the Footer is a two-file component (Footer.jsx +
 * Footer.css) and the architecture rule is that every animated section's
 * numbers live in a `<section>.motion.js`. Contact and Footer are DOM
 * neighbours in the same directory, so they share this file rather than the
 * Footer growing a third file of its own:
 *
 *   MOTION        →  #contact          (scrub-no-pin, §B.11)
 *   FOOTER_MOTION →  footer.site-footer (micro, §B.12)
 *
 * ---------------------------------------------------------------------------
 * WHY THESE NUMBERS ARE PROGRESS UNITS, NOT MILLISECONDS
 * ---------------------------------------------------------------------------
 * Both timelines are scrubbed, not played, and both are normalised to a total
 * duration of 1.0 — so *timeline time === scroll progress* and `start: 0.25`
 * means literally "a quarter of the way through this section's scrub window".
 * A scrubbed tween has no wall-clock duration; it advances only as fast as the
 * user scrolls.
 *
 * To sanity-check a number, use the NON-PINNED reference traversal from
 * system.js: `REFERENCE_TRAVERSAL_MS_NOPIN = 900`. A scrub-no-pin section
 * crosses ~0.9 of a viewport of scroll, so
 *
 *     1.0 progress unit  ≈  900ms at a brisk scroll
 *     STAGGER.each.loose (0.055)  ≈  50ms per step here
 *
 * That is ~2.4× faster than the same constant inside a pin, and it is correct:
 * pinned set-pieces are slow and deliberate, workhorse sections are brisk
 * (§A.1). Do not inflate the staggers to "fix" it.
 *
 * ---------------------------------------------------------------------------
 * NOTHING HERE RE-DECLARES A SHARED VALUE
 * ---------------------------------------------------------------------------
 * Eases, travels, scales, staggers and the two scrub windows are IMPORTED from
 * src/motion/system.js and composed. The only literals below are this section's
 * own storyboard beat boundaries, which is exactly what §A says belongs in a
 * section motion file.
 * ============================================================================
 */

import {
  EASE,
  SCALE,
  SCRUB_WINDOW,
  SCRUB_WINDOW_SHORT,
  STAGGER,
  TRAVEL,
} from '../../motion/system'

/* ========================================================================== */
/* CONTACT (§B.11) — deliberately the quietest scrub on the page              */
/* ========================================================================== */

/**
 * DESKTOP STORYBOARD (≥900px, motion OK).
 *
 * The section's argument is "three steps, then the thing you fill in", and the
 * whole motion budget is spent making the form card feel substantial. The copy
 * column and the form card sit side by side in a .9fr / 1.1fr grid, so both are
 * on screen for the entire window and the two rails can overlap freely.
 *
 * 0.00 → 0.20  H2 masked line rise (the signature gesture, §A.6). The eyebrow
 *              leads it and the lede follows into it (§B.13 #2, #3).
 * 0.18 → 0.62  The three numbered circles light one after another — an outline
 *              layer cross-fading to a filled layer — and each step's copy
 *              masks up on the SAME beat as its own number.
 * 0.25 → 0.70  The form card rises. Longest travel and longest window on the
 *              page: it should read as the heaviest object, because it is the
 *              conversion.
 * 0.70 → 0.90  .email-inline masks up. The alternative to the form gets the
 *              last word, after the form has finished arriving.
 */
const SEQ_DESKTOP = {
  /**
   * §B.13 #2: "every .mono-label eyebrow rises pick(TRAVEL.copy) on EASE.reveal
   * starting 0.02 BEFORE its H2."
   *
   * This section's H2 starts at 0.00, so "0.02 before" would be -0.02 — not an
   * addressable position on a timeline that begins at 0. The offset is clamped
   * to 0 rather than pushing the H2 to 0.02, because §B.11 fixes the H2 window
   * at 0.00 → 0.20 and the H2 window is the more load-bearing of the two.
   * The eyebrow still leads, by finishing first.
   */
  eyebrow: { start: 0.0, end: 0.08 },

  /** The signature masked line rise. Same numbers in all ten sections that
   *  have an H2 — yPercent 110, EASE.reveal, STAGGER.each.loose (§B.13 #1). */
  heading: { start: 0.0, end: 0.2 },

  /** §B.13 #3: the lede rises starting 0.06 AFTER its H2's start. */
  lede: { start: 0.06, end: 0.21 },

  /** The numbered rail. Three states lighting in sequence; park the scroll at
   *  50% and step 2 is mid-fill. */
  steps: { start: 0.18, end: 0.62 },

  /** The heaviest object on the page. */
  formCard: { start: 0.25, end: 0.7 },

  email: { start: 0.7, end: 0.9 },
}

/**
 * MOBILE STORYBOARD (<900px, motion OK). AUTHORED, NOT SCALED.
 *
 * These are not the desktop numbers multiplied by anything. The layout is
 * genuinely different and so is the reading order: `.contact-grid` collapses to
 * one column, so the copy column stacks ABOVE the form card and `.email-inline`
 * — which lives inside the copy column — is now the LAST thing before the card
 * rather than the last thing on screen.
 *
 * So the mobile order is heading → lede → steps → email → form card, and the
 * card takes the tail of the window because it is the last thing to enter the
 * viewport. Running the desktop numbers here would resolve the card while it is
 * still below the fold and mask up the email after the card had already landed.
 *
 * The windows are also slightly tighter at the head: the mobile scrub window is
 * `top 92% → bottom 70%` (§SCRUB_WINDOW.mobile) against a much taller stacked
 * section, so a given progress unit costs more thumb travel.
 */
const SEQ_MOBILE = {
  eyebrow: { start: 0.0, end: 0.07 },
  heading: { start: 0.0, end: 0.18 },
  lede: { start: 0.05, end: 0.19 },
  steps: { start: 0.14, end: 0.48 },
  /** Ahead of the card on mobile — it is above it in the stacked flow. */
  email: { start: 0.46, end: 0.6 },
  formCard: { start: 0.55, end: 0.95 },
}

export const MOTION = {
  /** The standard scrub-no-pin window (§SCRUB_WINDOW): top 85% → bottom 55% on
   *  desktop, top 92% → bottom 70% on mobile, scrub 0.6. Not redefined here —
   *  imported, so a change to the site's scrub feel reaches this section. */
  window: SCRUB_WINDOW,

  /** Picked with `pick(MOTION.seq, isMobile)` — same { desktop, mobile } shape
   *  as TRAVEL and PIN, so the helper works unchanged. */
  seq: {
    desktop: SEQ_DESKTOP,
    mobile: SEQ_MOBILE,
  },

  travel: {
    /** Eyebrow and lede. `pick()`ed at 18px desktop / 14px mobile. */
    copy: TRAVEL.copy,

    /** The form card. TRAVEL.panel is the heaviest tier on the site (64 / 32)
     *  and this is the only place in #contact that uses it — §B.11 calls it
     *  "the longest travel on the page". */
    formCard: TRAVEL.panel,

    /** Masked reveals: the H2's lines, each step's copy, .email-inline.
     *  110% rather than 100% so a descender cannot peek below the mask edge on
     *  a subpixel boundary. */
    maskYPercent: TRAVEL.maskYPercent,
  },

  scale: {
    /** The card arrives from slightly "further away". 0.96 reads as
     *  approaching; below ~0.9 it reads as a modal popping. */
    formCardFrom: SCALE.riseFrom,
  },

  ease: {
    /** Masked line rise, copy rises, the card. Fast start, long tail. */
    reveal: EASE.reveal,
    /** The numbered circles. §B.13 #5: every colour change is a two-layer
     *  opacity cross-fade with EASE.tint. Near-linear, because a cross-fade
     *  with a strong ease goes muddy at its midpoint — both layers sit near
     *  0.7 opacity at once and the colour reads as neither. */
    tint: EASE.tint,
  },

  stagger: {
    /** Per H2 line. The site-wide headline stagger — do not vary it. */
    headingLines: STAGGER.each.loose,
    /** Per step. `loose` because these are a sequence the user is meant to
     *  COUNT: one, then two, then three. `each` and not `amount` because n is
     *  fixed at 3 by the design (§STAGGER, "choosing wrong is the most common
     *  bug in this build"). Total spread = 0.055 × 2 = 0.11. */
    steps: STAGGER.each.loose,
  },
}

/* ========================================================================== */
/* FOOTER (§B.12) — micro. One gesture, and that is all.                      */
/* ========================================================================== */

/**
 * "The footer must not be the last thing that PERFORMS. It is the exit."
 *
 * One gesture: the three footer groups mask up on STAGGER.each.tight with
 * EASE.reveal, travelling pick(TRAVEL.copy).
 *
 * It runs on SCRUB_WINDOW_SHORT (top 95% → top 45% desktop, top 97% → top 60%
 * mobile, scrub 0.5) rather than the standard window because the footer is
 * under 40vh tall — the standard `bottom 55%` end would be further away than
 * the element is tall and the gesture would resolve at ~3% per notch, which
 * reads as nothing happening at all.
 *
 * It is still a scrub, so it is still reversible and still inside the site's
 * physics. It just does not ask for any attention.
 */
export const FOOTER_MOTION = {
  window: SCRUB_WINDOW_SHORT,

  /** Whole window, one gesture. Normalised to 1.0 like every other timeline so
   *  the numbers read the same way across the site. */
  seq: {
    desktop: { groups: { start: 0.0, end: 1.0 } },
    /** Authored, not scaled. On mobile `.footer-grid` is a centred column, so
     *  the three groups are stacked and the last one is a whole line lower than
     *  it is on desktop; ending at 0.94 leaves a beat of stillness before the
     *  page runs out, which is the point of the footer. */
    mobile: { groups: { start: 0.0, end: 0.94 } },
  },

  /** Copy tier: 18px desktop / 14px mobile. */
  travel: TRAVEL.copy,

  /** ≈40ms per group at pin traversal, ~16ms here. Deliberately below the
   *  threshold at which three items read as a sequence — they should read as
   *  one object arriving with a little texture. */
  stagger: STAGGER.each.tight,

  ease: EASE.reveal,

  /** Three groups: copyright, links, disclaimer. Named so the `fit()` call in
   *  Footer.jsx does not have to measure the DOM to know the stagger spread. */
  groupCount: 3,
}

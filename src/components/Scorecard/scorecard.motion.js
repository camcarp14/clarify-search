/**
 * ============================================================================
 * SCORECARD MOTION CONFIG
 * ============================================================================
 * Progress units, 0 → 1 across the section's scrub window. The window itself is
 * SCRUB_WINDOW from the shared system, and the advance is monotonic — it tracks
 * scroll forwards and never rewinds.
 * ============================================================================
 */

import { EASE } from '../../motion/system'

export const MOTION = {
  /** 0.00 → 0.30 — the heading masks up, line by line. The site's signature
   *  gesture; identical numbers to every other H2. */
  heading: {
    start: 0.0,
    end: 0.3,
    staggerEach: 0.05,
    fromYPercent: 110,
    ease: EASE.reveal,
  },

  /** 0.10 → 0.34 — the panel and the lede arrive under it. */
  panel: {
    start: 0.1,
    end: 0.34,
    fromY: 30,
    ease: EASE.reveal,
  },

  /** 0.26 → 0.62 — the ring draws and its number counts up together. */
  ring: {
    start: 0.26,
    end: 0.62,
    /** NO EASE on the arc: it is a gauge, and an eased gauge reads as lag. */
    ease: EASE.rail,
    /** The number gets an ease so it decelerates into its final value while
     *  the arc stays linear — the arc is the instrument, the number is the
     *  headline. */
    numEase: EASE.reveal,
  },

  /** 0.34 → 0.66 — the verdict flag, sentence and the two mini stats. */
  verdict: {
    start: 0.34,
    end: 0.66,
    staggerEach: 0.05,
    fromY: 12,
    ease: EASE.reveal,
  },

  /** 0.44 → 1.00 — the four graded rows, each bar filling to its score. */
  rows: {
    start: 0.44,
    end: 1.0,
    /** Per row. Four rows, so the last starts at 0.44 + 3×0.09 = 0.71 and still
     *  has 0.29 of window to fill in. */
    staggerEach: 0.09,
    fromY: 16,
    ease: EASE.reveal,
    /** The bar is a rail — linear, like the ring. */
    barEase: EASE.rail,
    /** Bars start filling slightly after their row lands, so the row reads as
     *  arriving and THEN being scored. */
    barOffset: 0.03,
  },

  /** Wall-clock seconds for the channel swap. Not scroll-driven: it is a click,
   *  and a click must respond immediately whatever the scroll is doing. */
  swap: {
    fadeSeconds: 0.16,
    ringSeconds: 0.55,
    barSeconds: 0.5,
    ease: EASE.cssOut,
  },
}

/**
 * ============================================================================
 * SCORECARD MOTION CONFIG
 * ============================================================================
 * WALL-CLOCK SECONDS, not progress units. The scorecard used to be a section of
 * its own with a scroll-scrubbed entrance; it lives in the hero now, above the
 * fold, where there is no scroll to scrub. It reveals once on load on a delay
 * the hero passes in, and is then a finished instrument.
 * ============================================================================
 */

import { EASE } from '../../motion/system'

export const MOTION = {
  /** The entrance. Offsets below are seconds from the start of this timeline;
   *  the hero decides when that start is (see SCORECARD_DELAY in Hero.jsx). */
  intro: {
    fromY: 26,
    panelSeconds: 0.85,
    ease: EASE.reveal,

    /** The ring draws and its number counts together. NO EASE on the arc: it is
     *  a gauge, and an eased gauge reads as lag. */
    ringAt: 0.25,
    ringSeconds: 0.95,
    ringEase: EASE.rail,

    /** The four graded rows, each bar filling just after its row lands, so a row
     *  reads as arriving and THEN being scored. */
    rowsAt: 0.45,
    rowFromY: 14,
    rowSeconds: 0.5,
    rowStagger: 0.09,
    barSeconds: 0.55,
    barEase: EASE.rail,
    barOffset: 0.12,
  },

  /** Wall-clock seconds for the channel swap. It is a click, and a click must
   *  respond immediately. */
  swap: {
    fadeSeconds: 0.16,
    ringSeconds: 0.55,
    barSeconds: 0.5,
    ease: EASE.cssOut,
  },
}

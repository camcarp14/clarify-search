/**
 * ============================================================================
 * HERO MOTION CONFIG
 * ============================================================================
 * Every duration, stagger, ease, distance, scale and pin length lives here.
 * Tune the hero by editing numbers in this file. Nothing in Hero.jsx should
 * need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE TUNING: why staggers are not in milliseconds
 * ---------------------------------------------------------------------------
 * This timeline is scrubbed, not played. Its total duration is normalised to
 * 1.0, so *timeline time === scroll progress*. `seq.converge.start = 0.25`
 * means exactly "25% of the way through the pin" — the storyboard numbers map
 * 1:1 onto this file.
 *
 * A consequence: a scrubbed tween has no wall-clock duration. It advances only
 * as fast as the user scrolls, so "120ms" is not a thing the timeline can
 * honour. Staggers are therefore expressed in progress units.
 *
 * To convert, use the reference traversal below. At a 900px viewport and a
 * 250vh pin, a brisk scroll crosses the whole pin in roughly 2.2s, so:
 *
 *     1.0 progress unit  ≈  2200ms
 *     120ms              ≈  0.055 progress units   (headline line stagger)
 *      40ms              ≈  0.018 progress units   (per-chip)
 *
 * `staggerEach` is per-item. `staggerAmount` is the TOTAL spread shared across
 * all items — which is what you want for the chips, because 40 chips × 0.018
 * would be 0.72 units and the colour window is only 0.20 wide. Amount keeps
 * the gesture inside its window no matter how many chips there are.
 */

export const REFERENCE_TRAVERSAL_MS = 2200

export const MOTION = {
  /* --------------------------------------------------------------------- */
  /* PIN                                                                    */
  /* --------------------------------------------------------------------- */
  pin: {
    /** Scroll distance the hero holds the viewport for, in vh.
     *  Cut from 250 to 175: the headline reveal and the chip settle moved OUT
     *  of the scrub and into the on-load intro, so there are three beats to
     *  scrub instead of five. Holding the viewport for 250vh to play three
     *  beats is what made it feel slow. */
    desktopVh: 175,
    /** Phones get their own number — NOT the desktop value scaled. Short
     *  viewports and thumb-scrolling make a 250vh pin feel like a hostage
     *  situation, so the mobile storyboard is deliberately tighter. */
    mobileVh: 120,
    /** Seconds of catch-up smoothing. 1 = the brief's value. */
    scrub: 1,
    /** Lets ScrollTrigger pre-empt the pin so fast flicks do not flash. */
    anticipatePin: 1,
  },

  /* --------------------------------------------------------------------- */
  /* CHIP FIELD                                                             */
  /* --------------------------------------------------------------------- */
  chips: {
    desktopCount: 24,
    mobileCount: 10,
    /** Ordered grid the chips converge into.
     *  Column count is capped by chip width, not taste: a chip must fit inside
     *  its cell or the converged grid collides with itself. At 1440px with the
     *  bounds below, 6 columns gives ~216px a cell and the longest query
     *  renders ~200px. Raising this needs shorter copy in heroChips.js. */
    grid: {
      desktopCols: 4,
      mobileCols: 2,
    },
    /** Home-grid bounds as % of the field — explicit edges, not a symmetric
     *  inset, because the grid must sit BELOW the headline. `top` is the
     *  keep-out line: anything above it is the headline's air. */
    bounds: {
      desktop: { left: 7, right: 93, top: 8, bottom: 92 },
      /** Column centres must sit at least half a chip in from each edge. At
       *  390px a 159px chip needs its centre ≥ 80px in, i.e. ≥ 20% — 27/73
       *  leaves margin. Widening these past that clips chips at the stage
       *  edge, which `overflow: clip` will hide from you. */
      mobile: { left: 27, right: 73, top: 8, bottom: 92 },
    },
    /** Compact grid the surviving green chips tighten into. Lands between the
     *  headline (ends ~39%) and the resolve block (starts ~72%), so the final
     *  frame reads top-to-bottom with nothing colliding. */
    tight: {
      desktop: { cols: 4, centreX: 50, centreY: 50, spanX: 62, spanY: 52 },
      /* On a 390x844 screen the headline and the resolve block between them
       * claim roughly 23%-96%. The surviving cluster has to live in the gap,
       * so mobile keeps far fewer chips and parks them high. Widen spanY here
       * and the cluster lands on top of the counter. */
      mobile: { cols: 2, centreX: 50, centreY: 46, spanX: 46, spanY: 56 },
    },
    /** Per-chip blur costs real compositor time at 40 chips. Set false to
     *  A/B the perf hit without unpicking the timeline. */
    blurEnabled: true,
  },

  /* --------------------------------------------------------------------- */
  /* PROGRESS 0 — SCATTERED STATE                                           */
  /* --------------------------------------------------------------------- */
  scatter: {
    /** Max offset from the chip's home slot, as a fraction of field size. */
    spreadX: 0.34,
    spreadY: 0.5,
    /** Rotation range in degrees: ±25 per the storyboard. */
    rotation: 25,
    /** Pseudo-3D: chips scale between these to fake depth. */
    scaleMin: 0.72,
    scaleMax: 1.14,
    /** The storyboard asked for 8px/0.3. On this bone paper that rendered as
     *  a near-blank screen at rest — the landing frame had nothing in it. 6px
     *  and 0.42 keeps the field legible as texture while still reading as
     *  out-of-focus chaos. Push back toward 8/0.3 if you want it emptier. */
    blurPx: 6,
    opacity: 0.42,
    /** Change this to reshuffle the scatter. Deterministic — the same seed
     *  always produces the same field, so the composition is reviewable. */
    seed: 20260728,
  },

  /* --------------------------------------------------------------------- */
  /* INTRO — plays ONCE on load. Wall-clock seconds, NOT progress units.      */
  /* --------------------------------------------------------------------- */
  /**
   * The storyboard originally put the headline reveal at progress 0.00-0.25 of
   * the scrub, which meant the page LANDED with no headline and an out-of-focus
   * field — a blank-looking screen until the visitor scrolled. That is the
   * first thing anyone sees, and it read as broken rather than as restraint.
   *
   * The reveal is therefore a load animation now. Scroll starts from a composed
   * frame: headline up, field ordered and legible. Everything scroll still owns
   * (colour-coding, the cull, the resolve) is the part that actually dramatises
   * the product.
   */
  intro: {
    /** Delay before anything moves, so the first paint is stable. */
    startDelay: 0.15,
    /** Headline lines rising out of their masks. */
    headlineDuration: 0.9,
    headlineStagger: 0.09,
    headlineFromYPercent: 110,
    /** Eyebrow and the field settle under the headline. */
    eyebrowDuration: 0.6,
    fieldDuration: 1.1,
    fieldStagger: 0.035,
    /** Chips arrive from a small offset, not from across the screen. */
    fieldFromY: 26,
    fieldFromScale: 0.94,
  },

  /** Slow idle drift while the field is still settling. Runs as a CSS animation
   *  on a nested wrapper so it never fights the scrubbed transform, and its
   *  amplitude is tweened to 0 as the chips converge. */
  drift: {
    /** Seconds for one drift cycle. Randomised per chip within this range. */
    durMin: 5.5,
    durMax: 11,
    /** Max drift travel in px. */
    travel: 16,
    /** Max drift rotation in degrees. */
    rotate: 4,
  },

  /* --------------------------------------------------------------------- */
  /* SEQUENCE — all values are progress units (0 → 1 across the pin)         */
  /* --------------------------------------------------------------------- */
  seq: {
    /* The scrub now owns three beats. The headline reveal and the chip settle
     * live in `intro` above, because a page whose first frame is empty is not
     * restraint, it is a bug the visitor has to scroll to fix. */

    /** 0.00 → 0.35 — chips colour-code into waste vs converting. */
    colour: {
      start: 0.0,
      end: 0.35,
      /** Total spread across all chips, from the centre outward. */
      staggerAmount: 0.14,
      staggerFrom: 'center',
      ease: 'power1.out',
      /** Scale punch on the colour flip, then settle back to 1. */
      punchScale: 1.09,
      punchSplit: 0.4,
      /** Idle drift amplitude falls away as the field commits to an answer. */
      driftFadeEnd: 0.5,
    },

    /** 0.35 → 0.70 — waste falls out; the survivors tighten to fill the gap. */
    cull: {
      start: 0.35,
      end: 0.7,
      staggerAmount: 0.08,
      /** Gravity. power2.in reads as an accelerating fall. */
      fallEase: 'power2.in',
      /** How far below the field the red chips travel, as % of field height. */
      fallDistance: 120,
      /** Degrees of tumble on the way out, randomised in sign per chip. */
      fallRotation: 22,
      tightenEase: 'power3.inOut',
      /** Green waits a beat so the exit reads before the gap closes. */
      tightenOffset: 0.05,
    },

    /** 0.70 → 1.00 — the counter runs, subhead and CTA land, then unpin. */
    resolve: {
      start: 0.7,
      end: 1.0,
      counterEase: 'power2.out',
      counterEnd: 0.93,
      copyStart: 0.8,
      copyStaggerEach: 0.03,
      copyFromY: 18,
      ease: 'power3.out',
    },
  },

  /* --------------------------------------------------------------------- */
  /* COUNTER                                                                */
  /* --------------------------------------------------------------------- */
  counter: {
    /** 18% is the "Est. spend waste" figure already published on the site
     *  (legacy/index.html, scorecard instrument). Not invented here. */
    to: 18,
    suffix: '%',
  },
}

/** Breakpoint that separates the desktop and mobile storyboards. */
export const MOBILE_QUERY = '(max-width: 899px)'
export const DESKTOP_QUERY = '(min-width: 900px)'

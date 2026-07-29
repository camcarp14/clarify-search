/**
 * ============================================================================
 * HERO MOTION CONFIG
 * ============================================================================
 * Every duration, stagger, ease, distance, scale and pin length lives here.
 * Tune the hero by editing numbers in this file. Nothing in Hero.jsx should
 * need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * TWO CLOCKS, AND WHY
 * ---------------------------------------------------------------------------
 * `intro` runs ON LOAD and is measured in SECONDS. `seq` is SCRUBBED by scroll
 * and is measured in PROGRESS UNITS (0 → 1 across the pin).
 *
 * The split exists because the first version put the reveal inside the scrub,
 * so the page landed with no headline over an out-of-focus field — a blank
 * screen until the visitor scrolled. The reveal is a load animation now. Scroll
 * starts from a composed frame and owns only the argument.
 *
 * Progress units, not milliseconds, for anything scrubbed: a scrubbed tween has
 * no wall-clock duration, it advances only as fast as the reader scrolls. At a
 * 175vh pin and a 900px viewport a brisk scroll crosses the whole thing in
 * roughly 1.7s, so 1.0 progress unit ≈ 1700ms if you need to convert.
 * ============================================================================
 */

export const REFERENCE_TRAVERSAL_MS = 1700

export const MOTION = {
  /* --------------------------------------------------------------------- */
  /* PIN                                                                    */
  /* --------------------------------------------------------------------- */
  pin: {
    /** Four beats to scrub. 175vh gives each roughly 44vh — about two wheel
     *  notches, enough to read a beat without getting bored inside one. */
    desktopVh: 175,
    /** Authored for a short viewport and a thumb, NOT desktop × 0.7. A flick
     *  covers far more of a small screen per gesture. */
    mobileVh: 125,
    scrub: 1,
    anticipatePin: 1,
  },

  /* --------------------------------------------------------------------- */
  /* INTRO — plays once, on load. Wall-clock seconds.                       */
  /* --------------------------------------------------------------------- */
  intro: {
    startDelay: 0.15,
    headlineDuration: 0.95,
    headlineStagger: 0.09,
    headlineFromYPercent: 110,
    eyebrowDuration: 0.6,
    /** The results panel rises as one object, then its rows stagger in. */
    panelDuration: 1.05,
    panelFromY: 40,
    panelFromScale: 0.97,
    rowDuration: 0.7,
    rowStagger: 0.09,
    rowFromY: 18,
    ease: 'power3.out',
  },

  /* --------------------------------------------------------------------- */
  /* SEQUENCE — progress units, 0 → 1 across the pin                         */
  /* --------------------------------------------------------------------- */
  seq: {
    /** 0.00 → 0.22 — the query types into the omnibox, character by character. */
    query: {
      start: 0.0,
      end: 0.22,
      ease: 'none',
    },

    /** 0.22 → 0.50 — the two rows that matter get marked: the sponsored click
     *  you bought, and the #1 organic result you already owned. A rail draws
     *  between them, because the overlap IS the argument. */
    mark: {
      start: 0.22,
      end: 0.5,
      /** Gap between the paid mark and the owned mark landing. */
      stagger: 0.08,
      ease: 'power2.out',
      /** How far the verdict labels travel in, px. */
      labelFromX: 18,
      /** The connector rail linking the two marked rows. */
      railStart: 0.34,
      railEnd: 0.5,
      railEase: 'power2.inOut',
    },

    /** 0.50 → 0.78 — the bought click is struck through and collapses out.
     *  The rows below reflow up to close the gap. */
    cull: {
      start: 0.5,
      end: 0.78,
      /** The strike-through wipes across before the row goes. */
      strikeEnd: 0.62,
      strikeEase: 'power2.inOut',
      collapseEase: 'power3.inOut',
      /** How far the culled row slides out as it goes, px. */
      exitX: -40,
      reflowEase: 'power3.inOut',
    },

    /** 0.78 → 1.00 — the counter runs, subhead and CTA land, then unpin. */
    resolve: {
      start: 0.78,
      end: 1.0,
      counterEase: 'power2.out',
      counterEnd: 0.94,
      copyStart: 0.84,
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

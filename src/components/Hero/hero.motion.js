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
  /* HOW LONG THE WHOLE SEQUENCE TAKES, IN SECONDS                          */
  /* --------------------------------------------------------------------- */
  /**
   * The hero no longer pins and is no longer scrubbed. It was a 175vh pin
   * driven by scroll position, which ties the sequence to the scroll in BOTH
   * directions — scroll up and the query un-types, the marks lift, the culled
   * row returns. Latching a pin does not fix that; it just holds the viewport
   * for 175vh with a frozen frame.
   *
   * So it performs once, on arrival, and is then a finished frame that
   * scrolling cannot touch. `seq` below is still authored in 0-1 progress
   * units so the storyboard reads unchanged — this number is the only thing
   * that converts it to wall clock.
   *
   * 5.6s, up from 3.4. At 3.4 the four beats each got ~0.8s and the whole thing
   * was over before a visitor had finished reading the headline — the reported
   * experience was "the animation moves so quickly, and if you didn't catch it
   * right away you'll be confused as to what you're looking at". 5.6 gives the
   * query ~1.2s to type, the marks ~1.6s to land and the strike ~0.7s to wipe,
   * which is the pace of something being demonstrated rather than flashed.
   *
   * The other half of that fix is not a duration: the resting frame now holds
   * the whole argument on its own (see `cull` below), so missing the animation
   * costs a visitor nothing. A replay control sits under the panel for anyone
   * who wants to watch it again.
   */
  sequenceSeconds: 5.6,

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
    /** Beat between the panel's rows landing and the sequence starting, so the
     *  two do not read as one continuous smear. */
    sequenceGap: 0.9,
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

    /** 0.50 → 0.78 — the bought click is struck through and DIMMED IN PLACE.
     *
     *  It used to collapse out of the panel entirely: strike, slide left, fade,
     *  scaleY to 0, the rows below slide up by its measured height, and the panel
     *  itself height-tween down to close the gap.
     *
     *  That was the wrong ending. Deleting the row deletes the evidence — the
     *  resting frame was left showing an AI answer and a #1 organic result, with
     *  no trace of the sponsored click that the entire page is about. Anyone who
     *  arrived a second late, or scrolled straight past, saw a results page with
     *  nothing wrong with it. "You paid for this click" struck through, sitting
     *  directly above "You already ranked #1 for it", IS the argument, and it
     *  only works if both rows are still there.
     *
     *  Keeping the row also deleted a pile of machinery: the offsetHeight
     *  measurement and its refreshInit listener, the reflow of the rows below,
     *  and the documented height-tween exception on the panel. Nothing measures
     *  anything here now.
     */
    cull: {
      start: 0.5,
      end: 0.78,
      /** The strike-through wipes across, then the row settles back. */
      strikeEnd: 0.66,
      strikeEase: 'power2.inOut',
      dimEase: 'power2.out',
      /** Where the struck row rests. Low enough to read as spent, high enough
       *  that the strike, the tag and the verdict are all still legible — this
       *  row has to carry the argument in the still frame. */
      dimOpacity: 0.52,
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

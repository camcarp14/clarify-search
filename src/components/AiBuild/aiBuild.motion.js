/**
 * ============================================================================
 * AI BUILD — MOTION CONFIG   (§B.8, PIN-SCRUB, set-piece 3 of 3)
 * ============================================================================
 * Every duration, stagger, ease, distance, scale, pin length and count this
 * section uses is a named constant in this file. Tune the section by editing
 * numbers here; nothing in AiBuild.jsx should need to change to re-time it.
 *
 * Anything that belongs to the whole site is IMPORTED from ../../motion/system
 * and composed — never copied out as a literal. The only bare numbers below
 * are this section's own storyboard boundaries, its own counts, its counter
 * targets, and the mobile values §A.4 rule 6 requires to be authored rather
 * than derived from a desktop number.
 *
 * ---------------------------------------------------------------------------
 * WHY THE STAGGERS ARE NOT IN MILLISECONDS
 * ---------------------------------------------------------------------------
 * This timeline is scrubbed, not played. It is normalised to 1.0 in the JSX
 * (`tl.to({}, { duration: 1 }, 0)`), so *timeline time === scroll progress*
 * and `seq.spark.start = 0.44` means literally "44% of the way through the
 * pin". A scrubbed tween has no wall-clock duration, so staggers are in
 * progress units. To sanity-check one, use the reference traversal:
 *
 *   DESKTOP  200vh pin  ≈  1.0 unit ≈ 1760ms  (REFERENCE_TRAVERSAL_MS × 200/250)
 *   MOBILE   140vh pin  ≈  1.0 unit ≈ 1230ms  (REFERENCE_TRAVERSAL_MS × 140/250)
 *
 * That ratio is why the mobile numbers below are authored separately: the same
 * progress-unit stagger is spent ~1.4× faster on a phone.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD (§B.8) — "the copilot does a week's work while you hold the
 * scroll"
 * ---------------------------------------------------------------------------
 *   0.00 → 0.15   heading masks up, eyebrow leads it, lede trails it
 *   0.15 → 0.35   the three build cards arrive; 01–03 cross-fade muted → iris
 *   0.26 → 0.38   the "Also built" chip row ripples in
 *   0.32 → 0.44   the mock arrives as ONE unit — window chrome and all
 *   0.44 → 0.72   the sparkline DRAWS and the 11.4 counter runs with it
 *   0.66 → 0.74   "▲ 3.2 more than last week" masks up
 *   0.70 → 0.78   the sparkline's head dot pops
 *   0.72 → 0.88   the two chip counters run — 94 % and 2 min
 *   0.50/0.68/    the status line cross-fades through its four stacked
 *   0.84/0.94     variants
 *   0.82 → 0.97   the feed rows drop in, one at a time
 *   0.90 → 1.00   the build strip rises, then "Builds from $1,500" masks up
 *
 * Beats overlap on purpose (§A.2 BEAT). The sum of the windows exceeds 1.0;
 * the sum of the GAPS is zero, which is the thing that matters. Nothing ends
 * after 1.0 — a child that overruns the normalising tween would stretch the
 * timeline past one unit and every number above would stop meaning what it
 * says. The two beats that close ON 1.0 (`status` and `strip.price`) have
 * their durations chosen for exactly that reason and are flagged below.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS *NOT* HERE, DELIBERATELY
 * ---------------------------------------------------------------------------
 * Legacy drives this section with two page-lifetime setIntervals (a 4600 ms
 * feed prepend, a 3300 ms status rotation) and a one-shot IntersectionObserver
 * count-up. All three are DELETED (§B.8, §D.9). A background timer inside a
 * pinned scrubbed section desyncs the instant anyone scrolls, and it has no
 * coherent reduced-motion story. Everything below is a position on a
 * scrubbed timeline instead.
 * ============================================================================
 */

import { BEAT, EASE, PIN, STAGGER, TRAVEL } from '../../motion/system'

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* PIN                                                                      */
  /* ----------------------------------------------------------------------- */

  /**
   * 200vh desktop / 140vh mobile.
   *
   * §B.8 authors these here rather than reusing a shared preset: it calls them
   * "PIN.compact desktop nudged up", and PIN.compact is 160/110. The §B tier
   * table, the §D.1 page-length arithmetic and §B.8 itself all agree on
   * 200/140, so 200/140 is what ships. They are the third and last pin in the
   * page's budget (250 + 220 + 200 = +370vh of dead scroll, §D.1); raising
   * either number spends page length that document has already allocated.
   *
   * Keyed { desktop, mobile } — the SAME shape as PIN and TRAVEL — so
   * `pick(MOTION.pin, isMobile)` works. §B.8's prose spells them
   * `desktopVh`/`mobileVh`; system.js's PIN block carries an explicit warning
   * that those key names make `pick()` return undefined, which becomes
   * `end: '+=undefined%'` and silently collapses the pin at scroll time
   * instead of failing the build. Shape wins over spelling.
   */
  pin: { desktop: 200, mobile: 140 },

  /**
   * Whether the mobile breakpoint pins at all.
   *
   * §D.1's mitigation 3, made a switch instead of a rewrite: "Demote AI Build's
   * mobile pin to scrub-no-pin entirely — the sparkline and counters work
   * without a pin, they just do not hold." Set false and the identical
   * timeline runs on the standard SCRUB_WINDOW on phones; nothing else in the
   * section changes. Default true, which is what §B.8 specifies.
   *
   * The reason this switch exists rather than staying a paragraph: this
   * section is the tallest of the three pinned set-pieces and the mobile
   * layout stacks everything (see the fit note in AiBuild.css). If QA measures
   * the pinned frame and it does not fit a 390×844 device, this is the lever.
   */
  pinMobile: true,

  /* ----------------------------------------------------------------------- */
  /* TRAVEL — which shared tier each object belongs to                        */
  /* ----------------------------------------------------------------------- */

  travel: {
    /** Eyebrow, lede, the "Also built" chips, the feed rows. Small type. */
    copy: TRAVEL.copy,
    /** The three `.build-card` articles. */
    card: TRAVEL.card,
    /** The `<figure class="mock">` and the `.build-strip`. Both are full-width
     *  panels — the heaviest objects in the section — so they get the longest
     *  travel, which is what keeps perceived speed constant across object
     *  sizes (§A.2 TRAVEL). */
    panel: TRAVEL.panel,
  },

  /* ----------------------------------------------------------------------- */
  /* FEED                                                                     */
  /* ----------------------------------------------------------------------- */

  feed: {
    /**
     * How many of `FEED_ROWS` are visible. §B.8 mobile: "Feed shows 3 rows,
     * not 5 — five rows at 390px pushes the strip off the pinned frame."
     *
     * AiBuild.css hides rows 4 and 5 at the same breakpoint so the LAYOUT
     * agrees with the timeline; if you change this number, change that rule
     * too. It is commented at both ends.
     */
    rowsShown: { desktop: 6, mobile: 3 },
  },

  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — progress units, 0 → 1 across the pin                          */
  /* ----------------------------------------------------------------------- */

  seq: {
    /**
     * 0.00 → 0.15 — the section head.
     *
     * §B.13 fixes the internal offsets site-wide: the eyebrow leads its h2 by
     * 0.02 and the lede trails the h2's START by 0.06. §B.8 puts the whole
     * head beat at 0.00 → 0.15. Those two only reconcile if the h2 starts at
     * 0.02 rather than 0.00 — otherwise the eyebrow would sit at −0.02, and a
     * child at a negative absolute position on a normalised timeline renders
     * as already-part-played at progress 0. So: eyebrow at the beat start, h2
     * one lead later, lede 0.06 after the h2. Same reconciliation as
     * aiVisibility.motion.js, deliberately identical.
     */
    head: {
      start: 0.0,
      end: 0.15,
      /** §B.13 #2. */
      eyebrowLead: 0.02,
      /** §B.13 #3. */
      ledeLag: 0.06,
      /** Eyebrow and lede each occupy one punctuation beat. */
      copyDur: BEAT.xs,
      /** §A.6 / §B.13 #1 — THE SIGNATURE GESTURE. The same three numbers on
       *  every h2 on the site (TRAVEL.maskYPercent, EASE.reveal,
       *  STAGGER.each.loose). Do not vary them here "for interest": the
       *  variation lives in what happens after the headline. */
      lineStaggerEach: STAGGER.each.loose,
      lineEase: EASE.reveal,
      copyEase: EASE.reveal,
    },

    /**
     * 0.15 → 0.35 — the three build cards arrive.
     *
     * n is fixed at 3 by the design, so `each` is correct and `amount` would
     * be wrong (§A.2 STAGGER).
     */
    cards: {
      start: 0.15,
      end: 0.35,
      ease: EASE.reveal,
      /** Desktop: the default card-to-card cascade (§B.8).
       *  Mobile: §B.8 is explicit — "Build cards go 1-across and arrive on
       *  STAGGER.each.loose so they still read as three things." Stacked in a
       *  single column they read as one list unless the gap between them is
       *  wide enough to count, and the mobile traversal is ~1.4× faster, so
       *  the *tighter* value would collapse them into one event. */
      staggerEach: { desktop: STAGGER.each.base, mobile: STAGGER.each.loose },

      /** 0.22 → 0.35 — `.build-idx` (01–03) cross-fades muted → iris.
       *  Two stacked faces, opacity, EASE.tint (§A.4 rule 2, §B.13 #5). Both
       *  faces tween: fading only the accent one in leaves the muted glyph
       *  showing through the antialiasing and the pair reads as a double
       *  image. Starts inside the card beat so the number colours as its card
       *  settles, not after it. */
      idxStart: 0.22,
      idxEnd: 0.35,
      idxEase: EASE.tint,
    },

    /**
     * 0.26 → 0.38 — the "Also built" chip row.
     *
     * §B.8's beat table does not list this row. It is the only element in the
     * section with no authored beat, and leaving it static inside a pinned
     * frame where everything else is a scroll function would be the one place
     * the section stops obeying §0. So it gets the minimum treatment that
     * keeps it inside the physics: label plus six chips, one tight cascade,
     * seated in the gap between the cards landing (0.35) and the mock
     * arriving (0.32) so the reading order down the page is preserved.
     *
     * `amount`, not `each`: the tween's targets are the label PLUS six chips,
     * which is seven, and §A.2 puts the `each`/`amount` boundary at six. It
     * is not a stylistic call — `each.tight` across seven items is a 0.108
     * spread inside a 0.12 window, which leaves `fit()` nothing to work with
     * and pushes the tail of the gesture past the beat into the sparkline's.
     * `amount.tight` is a fixed 0.05 total however many items there are, and
     * it is described in the system file as "a quick collective ripple",
     * which is exactly what one line of small chips should be: a row
     * acquiring texture, not a sequence the user is meant to count.
     */
    also: {
      start: 0.26,
      end: 0.38,
      ease: EASE.reveal,
      staggerAmount: STAGGER.amount.tight,
    },

    /**
     * 0.32 → 0.44 — the mock arrives as one unit.
     *
     * §B.8: "Mock chrome as one unit: .mock-bar, dots, title, live pill rise
     * pick(TRAVEL.panel) with EASE.reveal." "As one unit" is taken literally —
     * a single tween on the <figure>, no internal stagger — because the bar
     * cannot rise independently of the panel it is welded to without the
     * window visibly tearing. Everything the panel contains rides along at
     * its own opacity, and the things that are DATA rather than furniture
     * (the sparkline, the three counters, the delta, the status, the feed)
     * arrive later on their own beats.
     *
     * The `live` pill's pulse starts here in the sense §B.8 means it: the CSS
     * animation is gated on the `.is-live` class that the pinned trigger's
     * onToggle writes, so it runs while the section holds the viewport and
     * at no other time. There is no GSAP target for it.
     */
    chrome: { start: 0.32, end: 0.44, ease: EASE.reveal },

    /**
     * 0.44 → 0.72 — THE SPARKLINE DRAWS.
     *
     * `stroke-dashoffset` is sanctioned exception 1 (§A.5): there is no
     * transform that reveals a path along its own length. The rules that come
     * with the exception are all honoured — one path in the section,
     * `stroke-linecap: round` and a fixed `stroke-dasharray` set once in CSS
     * and never re-measured per frame, paired with EASE.rail, and the area
     * underneath cross-fading on OPACITY rather than on dashoffset.
     *
     * EASE.rail is not a preference here. The line is a gauge: the user must
     * read it as attached to the finger, and an eased rail reads as input lag
     * (§A.2 EASE.rail, §B.13 #6).
     */
    spark: {
      start: 0.44,
      end: 0.72,
      /** The `from` value for stroke-dashoffset. Mirrors the
       *  `stroke-dasharray: 300` that AiBuild.css sets once on `.mk-line`;
       *  the path is ~296 units long, so 300 clears it completely. Legacy's
       *  number, kept. Change one of the two and change the other. */
      dashFrom: 300,
      lineEase: EASE.rail,
      /** The area fill under the line. A cross-fade, so EASE.tint — near
       *  linear, because a cross-fade midpoint on an eased curve goes muddy
       *  (§A.2 EASE.tint). */
      areaEase: EASE.tint,
      /** 0.70 → 0.78 — the head dot pops once the line has arrived at it.
       *  §B.8 says "`.mk-dot` scales 0 → 1 at 0.70"; BEAT.xs is the
       *  punctuation beat, which is what a dot landing is. */
      dotStart: 0.7,
      dotDur: BEAT.xs,
      dotEase: EASE.reveal,
    },

    /**
     * 0.44 → 0.72 — the hours counter, running WITH the sparkline.
     *
     * §D.10 names this counter as the known trap: the hero's shipped pattern
     * is `Math.round(readout.v)` and a builder copying it ships "11" where
     * the copy says "11.4". `decimals` is therefore explicit and mandatory
     * (§B.13 #4), and the section uses `counter()` from system.js, which
     * takes it as an argument rather than leaving it to the call site.
     *
     * EASE.rail, same window as the line: the number and the sparkline are
     * the same datum drawn twice. An eased number climbing against a linear
     * line disagree visibly at the midpoint, and the user reads the
     * disagreement as the mock being fake.
     */
    hours: { start: 0.44, end: 0.72, to: 11.4, decimals: 1, ease: EASE.rail },

    /**
     * 0.66 → 0.74 — "▲ 3.2 more than last week" masks up.
     *
     * The masked line rise, hand-rolled on one element rather than through
     * SplitText: it is a single short line inside a grid cell with its own
     * top margin, and SplitText would rebuild that box every refresh for one
     * line of output. The gesture and its numbers are the signature one —
     * TRAVEL.maskYPercent out of an overflow-hidden wrapper, EASE.reveal.
     */
    delta: { start: 0.66, end: 0.74, ease: EASE.reveal },

    /**
     * 0.72 → 0.88 — the two stat-chip counters.
     *
     * Targets and decimals are content: 94 % of calls handled first try, a
     * 2-minute average reply time. Both integers, and both say so explicitly
     * rather than relying on a default (§B.13 #4, §D.10).
     */
    chips: {
      start: 0.72,
      end: 0.88,
      ease: EASE.rail,
      values: [
        { to: 94, decimals: 0 },
        { to: 2, decimals: 0 },
      ],
      /** Desktop: the standard card-to-card cascade, so the two numbers land
       *  one after the other and the eye follows.
       *  Mobile: §B.8 — "the two chip counters fire together, not staggered."
       *  At 1230ms a unit the two chips sit side by side in a 390px column and
       *  a stagger reads as one of them lagging, not as a cascade. */
      staggerEach: { desktop: STAGGER.each.base, mobile: 0 },
    },

    /**
     * The status line cross-fades through its four stacked variants.
     *
     * §B.8 authors the four progress points. `switchAt[i]` is the progress at
     * which variant i becomes the active layer, so variant 0 arrives at 0.50
     * (shortly after the panel does), and the section closes on variant 3 —
     * "Reconciling yesterday’s payments", the one string in the whole legacy
     * file with a curly apostrophe.
     *
     * Four stacked layers, opacity, EASE.tint. Never a textContent swap: a
     * text mutation cannot be scrubbed backwards, and the legacy 3300 ms
     * interval that did it is deleted (§D.9).
     *
     * `dur` is 0.06, not BEAT.xs (0.08), for one arithmetic reason: the last
     * switch is at 0.94 and 0.94 + 0.08 = 1.02, which would stretch the
     * normalised timeline past one unit and quietly rescale every other
     * number in this file. 0.06 closes exactly on 1.00. It is also the floor
     * §A.2 gives for a perceptible gesture, which is right for a text
     * cross-fade — ~106ms at the desktop traversal.
     */
    status: {
      switchAt: [0.5, 0.68, 0.84, 0.94],
      dur: 0.06,
      ease: EASE.tint,
    },

    /**
     * 0.82 → 0.97 — the feed rows drop in.
     *
     * Authored data revealed by the scrub (§B.8), not a ticker. Five rows on
     * desktop, three on mobile, each arriving from `pick(TRAVEL.copy)` with
     * the standard cascade — n is fixed by `feed.rowsShown` at both
     * breakpoints and is ≤ 6, so `each` is the correct form (§A.2).
     *
     * Note what this replaces: legacy inserts a row every 4600 ms and lets the
     * CSS `feedIn` keyframe fire by virtue of the node being new. That
     * keyframe is deleted along with the interval — a CSS animation on the
     * same opacity/transform channel a GSAP tween is writing is the §0.1
     * flicker, and it is the single hardest bug in this build to trace.
     */
    feed: {
      start: 0.82,
      end: 0.97,
      ease: EASE.reveal,
      staggerEach: STAGGER.each.base,
    },

    /**
     * 0.90 → 1.00 — the build strip rises, then the price masks up last.
     *
     * The panel beat is short (BEAT.xs) so the strip is present before its
     * price starts wiping — the price is the closing statement of the section
     * and it should land on an already-settled frame, not on a moving one.
     *
     * `priceDur` is 0.06 for the same reason `status.dur` is: 0.94 + 0.06
     * closes exactly on 1.00 and nothing overruns the normalised timeline.
     */
    strip: {
      start: 0.9,
      end: 1.0,
      panelDur: BEAT.xs,
      panelEase: EASE.reveal,
      priceStart: 0.94,
      priceDur: 0.06,
      priceEase: EASE.reveal,
    },
  },
}

export default MOTION

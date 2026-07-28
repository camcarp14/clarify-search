/**
 * ============================================================================
 * AI VISIBILITY — MOTION CONFIG   (§B.5, PIN-SCRUB, set-piece 2 of 3)
 * ============================================================================
 * Every duration, stagger, ease, distance, scale and pin length this section
 * uses is a named constant in this file. Tune the section by editing numbers
 * here; nothing in AiVisibility.jsx should need to change to re-time it.
 *
 * Anything that belongs to the whole site is IMPORTED from ../../motion/system
 * and composed — never copied out as a literal. The only bare numbers below are
 * this section's own storyboard boundaries, its own counts, and the three
 * mobile values §A.4 rule 6 requires to be authored rather than derived.
 *
 * ---------------------------------------------------------------------------
 * WHY THE STAGGERS ARE NOT IN MILLISECONDS
 * ---------------------------------------------------------------------------
 * This timeline is scrubbed, not played. It is normalised to 1.0 in the JSX
 * (`tl.to({}, { duration: 1 }, 0)`), so *timeline time === scroll progress* and
 * `seq.ai.start = 0.54` means literally "54% of the way through the pin".
 *
 * A scrubbed tween has no wall-clock duration, so staggers are in progress
 * units. To sanity-check one, use the reference traversal:
 *
 *   DESKTOP  220vh pin  ≈  1.0 unit ≈ 1940ms   (REFERENCE_TRAVERSAL_MS × 220/250)
 *   MOBILE   150vh pin  ≈  1.0 unit ≈ 1320ms   (REFERENCE_TRAVERSAL_MS × 150/250)
 *
 * That ratio is why the mobile numbers below are authored separately rather
 * than reused: the same progress-unit stagger is spent ~1.5× faster on a phone.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD (§B.5) — "the results page assembles itself in the wrong
 * order, on purpose"
 * ---------------------------------------------------------------------------
 *   0.00 → 0.14   heading masks up, eyebrow leads it, lede trails it
 *   0.10 → 0.20   the query TYPES IN, per char, scrubbed (scroll back = untype)
 *   0.20 → 0.38   r-org arrives FIRST, alone in an empty frame
 *   0.38 → 0.54   r-paid slides in ABOVE it; r-org is pushed down by paid's height
 *   0.54 → 0.74   r-ai drops in above both, pushes the stack down again, lands
 *                 with a soft punch; the three citation rails draw down into
 *                 r-org; "3 sources cited" cross-fades in
 *   0.74 → 0.90   the four cards arrive; 01–04 cross-fade muted → accent
 *   0.86 → 1.00   the note masks up; "Sponsored" dims — no slot to bid on
 *
 * Beats overlap on purpose (§A.2 BEAT). The sum of the windows is greater than
 * 1.0; the sum of the *gaps* is zero, which is what matters.
 * ============================================================================
 */

import { BEAT, EASE, PIN, SCALE, STAGGER, TRAVEL } from '../../motion/system'

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* PIN                                                                      */
  /* ----------------------------------------------------------------------- */

  /** 220vh desktop / 150vh mobile, straight from the shared budget. Seven
   *  beats over 220vh is ~31vh a beat — a little under PIN.feature's stated
   *  ~37vh because two pairs of beats overlap. Passed to `pinnedTrigger` as
   *  `vh: pick(MOTION.pin, isMobile)`; do NOT inline a number here, the total
   *  page pin budget is arithmetic that lives in the system file (§D.1). */
  pin: PIN.feature,

  /* ----------------------------------------------------------------------- */
  /* TRAVEL — which shared tier each object belongs to                        */
  /* ----------------------------------------------------------------------- */

  travel: {
    /** The three SERP rows. A row is a full-width figure inside the mock, so
     *  it is a `panel`, not a `card` — at TRAVEL.card it would twitch. */
    row: TRAVEL.panel,
    /** The four `.ai-card` articles. */
    card: TRAVEL.card,
    /** Eyebrow, lede paragraph, the closing note's container. */
    copy: TRAVEL.copy,
  },

  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — progress units, 0 → 1 across the pin                          */
  /* ----------------------------------------------------------------------- */

  seq: {
    /** 0.00 → 0.14 — the section head.
     *
     *  §B.13 fixes the internal offsets site-wide: the eyebrow leads its h2 by
     *  0.02 and the lede trails the h2's START by 0.06. §B.5 puts the whole
     *  head beat at 0.00 → 0.14. Those two only reconcile if the h2 starts at
     *  0.02 rather than 0.00 — otherwise the eyebrow would have to sit at
     *  −0.02, and a child at a negative absolute position on a normalised
     *  timeline renders as already-part-played at progress 0. So: eyebrow at
     *  the beat start, h2 one lead later, lede 0.06 after the h2. */
    head: {
      start: 0.0,
      end: 0.14,
      /** §B.13 #2. */
      eyebrowLead: 0.02,
      /** §B.13 #3. */
      ledeLag: 0.06,
      /** Eyebrow and lede each occupy one punctuation beat. */
      copyDur: BEAT.xs,
      /** §A.6 / §B.13 #1 — the signature masked line rise. Same three numbers
       *  on every h2 on the site (TRAVEL.maskYPercent, EASE.reveal,
       *  STAGGER.each.loose). Do not vary them here "for interest". */
      lineStaggerEach: STAGGER.each.loose,
      lineEase: EASE.reveal,
      copyEase: EASE.reveal,
    },

    /** 0.10 → 0.20 — the query types in.
     *
     *  A wall-clock typewriter cannot be scrubbed and is therefore banned
     *  (§B.5): this is a per-char scrub, so scrolling back UN-types it. The
     *  caret is a CSS blink on a stacked layer and is never a GSAP target. */
    query: {
      start: 0.1,
      end: 0.2,
      /** TOTAL spread across all ~27 chars, not per-char (§A.2 STAGGER):
       *  `each` at even the tight value would be 0.47 units for one word.
       *  Desktop 0.06 is §B.5's number. Mobile is AUTHORED, not scaled: at
       *  1320ms a unit, 0.06 is ~79ms of type-on, which reads as a flicker
       *  rather than as typing, so the phone gets a wider spread. */
      staggerAmount: { desktop: 0.06, mobile: 0.07 },
      /** Per-char lift, in % of the char's own height. Section-specific: this
       *  is a 10px mono glyph, far below the smallest TRAVEL tier, so a px
       *  travel would be either invisible or comic. */
      fromYPercent: 40,
      ease: EASE.reveal,
    },

    /** 0.20 → 0.38 — r-org arrives FIRST, alone.
     *
     *  Beat statement: *the organic result is the thing that actually exists.*
     *
     *  "Centred in the empty frame" is implemented as "occupying the top slot
     *  of an otherwise empty rows region". That is the only reading the next
     *  two beats' arithmetic closes on: r-org starts at −(aiHeight +
     *  paidHeight), is pushed +paidHeight when paid arrives and +aiHeight when
     *  ai arrives, landing at exactly 0. Park it at the true vertical centre
     *  instead and the stack ends half a row low. */
    org: { start: 0.2, end: 0.38, ease: EASE.reveal },

    /** 0.38 → 0.54 — r-paid slides in ABOVE r-org, which is pushed down.
     *
     *  The push distance is the measured height of the arriving row, read from
     *  the DOM inside `invalidateOnRefresh` — never a literal (§B.5). It is a
     *  transform, not a layout change: the rows keep their grid slots the
     *  whole time, so the panel never resizes. */
    paid: { start: 0.38, end: 0.54, ease: EASE.reveal, pushEase: EASE.travel },

    /** 0.54 → 0.74 — r-ai drops in above both and the stack is pushed again.
     *
     *  This is the section's whole argument in one beat: the AI answer on top
     *  is built out of the organic result underneath, which is exactly what
     *  r-org's own note says in words. */
    ai: {
      start: 0.54,
      end: 0.74,
      /** Fraction of the window spent falling. The remainder is the landing
       *  punch, so the swell peaks ON the landing rather than mid-fall. */
      dropShare: 0.6,
      dropEase: EASE.reveal,
      pushEase: EASE.travel,
      /** Overshoot on the landing. `punchSoft`, not `punch`: 1.09 on a
       *  ~110px-tall full-width row is a 10px growth and reads as a zoom.
       *  Mobile is AUTHORED — at ~340px of panel width a 2.5% swell puts the
       *  row's edge into the panel's 1px border. */
      punchScale: { desktop: SCALE.punchSoft, mobile: 1.02 },
      /** Fraction of the punch spent going UP. Fast up, slow settle; reversing
       *  it reads as a bounce, which is a different feeling (§A.2 SCALE). */
      punchSplit: SCALE.punchSplit,
      punchUpEase: EASE.punchOut,
      punchDownEase: EASE.punchIn,
    },

    /** 0.62 → 0.76 — the three citation rails draw from the AI row's dots down
     *  into r-org.
     *
     *  This is a GAUGE, not a flourish: it measures the claim that the answer
     *  is assembled from the result below it, so it is `EASE.rail` and nothing
     *  else (§A.2, §B.13 #6). DESKTOP ONLY — at 390px three 1px verticals are
     *  sub-pixel mush, so mobile gets `orgUnderlay` instead, on the same
     *  window, making the same point at a legible scale (§B.5 mobile). */
    rails: {
      start: 0.62,
      end: 0.76,
      staggerEach: STAGGER.each.tight,
      ease: EASE.rail,
      /** The dots themselves fade in as their rail starts drawing. */
      dotEase: EASE.tint,
      /** How far past r-paid the rail reaches into r-org, in px. Section
       *  geometry: far enough to touch the organic row's tag line, not so far
       *  that it runs through its copy. Mobile is 0 because the rails are not
       *  rendered there at all. */
      intoOrgPx: { desktop: 22, mobile: 0 },
    },

    /** 0.62 → 0.76 — MOBILE substitute for the rails: a tinted underlay behind
     *  r-org cross-fades in, on exactly the same window. */
    orgUnderlay: { start: 0.62, end: 0.76, ease: EASE.tint },

    /** 0.72 → 0.82 — "3 sources cited" cross-fades in, after the rails have
     *  something to count. */
    citesLabel: { start: 0.72, end: 0.82, ease: EASE.tint },

    /** 0.74 → 0.90 — the four cards arrive, then 01–04 take their accent. */
    cards: {
      start: 0.74,
      end: 0.9,
      ease: EASE.reveal,
      /** Desktop: four cards, four beats, the standard card-to-card cascade.
       *  n is fixed at 4 by the design, so `each` is correct here and `amount`
       *  would be wrong (§A.2 STAGGER). */
      staggerEach: STAGGER.each.base,
      /** Mobile: "a 2×2 arriving in two beats, not four" (§B.5). Applied as a
       *  function stagger — cards 0,1 share a delay and cards 2,3 share the
       *  next — so it does not depend on GSAP's grid-inference. AUTHORED:
       *  0.05 × 1320ms ≈ 66ms between the two beats, the same *perceived* gap
       *  the desktop 0.03 gives at 1940ms. */
      staggerEachMobile: 0.05,
      /** 01–04 cross-fade from a muted stacked face to the accent one. Both
       *  faces tween: fading only the accent in leaves the muted glyph showing
       *  through the antialiasing and the pair reads as a double image. */
      numStart: 0.78,
      numEnd: 0.9,
      numEase: EASE.tint,
    },

    /** 0.86 → 1.00 — the closing note.
     *
     *  "Masks up" is the signature gesture applied to the note's sentence, not
     *  to the panel: a mask on the panel would clip its own border and
     *  gradient. So the panel rises and fades over one short beat and the
     *  words wipe up out of their line masks across the whole window. */
    note: {
      start: 0.86,
      end: 1.0,
      /** Short, so the panel is present before its words start wiping. */
      panelDur: BEAT.xs,
      panelEase: EASE.reveal,
      lineStaggerEach: STAGGER.each.base,
      lineEase: EASE.reveal,
    },

    /** 0.86 → 1.00 — the closing statement, in one property.
     *
     *  r-paid's "Sponsored" tag dims while r-ai holds full: *no slot to bid
     *  on*. This is a luminance change on one element, not a colour swap, so
     *  it is a plain opacity tween rather than a two-layer cross-fade — a
     *  stacked twin here would duplicate the word "Sponsored" in the a11y tree
     *  (the SERP rows are deliberately NOT aria-hidden) to produce a result
     *  that is identical on screen. */
    sponsored: {
      start: 0.86,
      end: 1.0,
      /** §B.5 says "~0.4". Named so it can be raised without touching the
       *  timeline — see the contrast note in AiVisibility.css. */
      toOpacity: 0.4,
      ease: EASE.tint,
    },
  },
}

export default MOTION

/**
 * ============================================================================
 * METHOD MOTION CONFIG — "the rail draws through the method,
 *                         and each artifact stamps as it passes"
 * ============================================================================
 * Every duration, stagger, ease, distance, scale and beat boundary for #method
 * lives here. Tune the section by editing numbers in this file; nothing in
 * Method.jsx should need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * TIER: scrub-no-pin (motion-system §B.6). NO PIN, and no boolean crossing
 * anywhere — every value below is a position on a timeline that scroll scrubs.
 * ---------------------------------------------------------------------------
 * The timeline is normalised to 1.0 (`tl.to({}, { duration: 1 }, 0)`), so
 * *timeline time === scroll progress*. `steps.firstStart.desktop = 0.20` means
 * exactly "20% of the way through this section's scrub window".
 *
 * A scrubbed tween has no wall-clock duration — it advances only as fast as the
 * user scrolls — so staggers and beat lengths are in PROGRESS UNITS, never
 * milliseconds. The conversion constant for a scrub-no-pin section is
 * REFERENCE_TRAVERSAL_MS_NOPIN = 900ms per progress unit (system.js), i.e.
 * roughly 2.4x faster than the same number spent inside a pin. That is
 * deliberate: pinned set-pieces are slow and deliberate, workhorse sections are
 * brisk. Do NOT inflate the numbers below to "match" the hero — this section is
 * supposed to read quicker.
 *
 *     BEAT.xs            0.080 units  ≈  72ms here  (≈176ms inside a pin)
 *     BEAT.sm            0.150 units  ≈ 135ms here  (≈330ms inside a pin)
 *     STAGGER.each.loose 0.055 units  ≈  50ms here  (≈120ms inside a pin)
 *
 * ---------------------------------------------------------------------------
 * THE ARGUMENT THIS SECTION MAKES, AND WHY THE MOTION IS WHAT IT IS
 * ---------------------------------------------------------------------------
 * The copy is "Four steps. Every one leaves an artifact." — a sequence with
 * receipts. So the motion is a sequence and a receipt:
 *
 *   THE RAIL gives you the sequence. A 1px rule runs through the four steps —
 *   horizontal on desktop, where the grid is 4-across; vertical below the
 *   motion breakpoint, where the steps stack. Its scale is a pure scroll rail
 *   (EASE.rail, transform-origin at the start edge). It is a PROGRESS GAUGE for
 *   the method itself, and it is the reason this section does not need a pin:
 *   the rail already gives the user a scrubbable readout of where they are in
 *   the sequence.
 *
 *   THE STAMP gives you the receipt. Each `.method__artifact` row lands from
 *   SCALE.stampFrom with a fraction of a degree of residual rotation, on
 *   EASE.punchOut. It reads as ink hitting paper. That is literally the
 *   section's promise, and it is the one beat here that must not be generic.
 *
 * Neither is a "staggered reveal". Park the scroll between step 2 and step 3
 * and step 3 is HALF-STAMPED — ~1.02 scale, ~0.3° of residual rotation, ~50%
 * opacity — with the rail parked half way between the two columns. Scroll up
 * one notch and it un-stamps. A fade-in cannot be parked; it plays out on its
 * own clock once tripped.
 *
 * ---------------------------------------------------------------------------
 * BEAT MAP — DESKTOP (progress units, motion-system §B.6 verbatim)
 * ---------------------------------------------------------------------------
 *   0.00 → 0.20   H2 masked line rise (the signature gesture, §A.6)
 *   0.00 → 0.08   eyebrow rises                (§B.13 #2 — see note on `eyebrow`)
 *   0.06 → 0.21   lede paragraph rises         (§B.13 #3)
 *   0.15 → 0.90   THE RAIL DRAWS, EASE.rail    ← spans almost the whole window
 *
 *   per step i (0-3), stepStart = 0.20 + i * 0.17:
 *     stepStart        → +BEAT.xs   .method__number cross-fades muted → ink
 *     stepStart        → +BEAT.xs   .method__tier badge cross-fades in
 *     stepStart + 0.02 → +BEAT.sm   <h3> and <p> rise TRAVEL.copy
 *     stepStart + 0.09 → +BEAT.xs   THE ARTIFACT STAMPS
 *
 *   which resolves to:
 *     step 01  number 0.20-0.28  copy 0.22-0.37  stamp 0.29-0.37
 *     step 02  number 0.37-0.45  copy 0.39-0.54  stamp 0.46-0.54
 *     step 03  number 0.54-0.62  copy 0.56-0.71  stamp 0.63-0.71
 *     step 04  number 0.71-0.79  copy 0.73-0.88  stamp 0.80-0.88
 *
 *   The last stamp resolves at 0.88 and the rail lands at 0.90, so the gauge
 *   closes the section a beat after the final receipt. That relationship — rail
 *   last, by a hair — is the thing to preserve if you re-time anything here.
 *
 * ---------------------------------------------------------------------------
 * BEAT MAP — MOBILE
 * ---------------------------------------------------------------------------
 * Below the 899px motion breakpoint the steps stack, so §B.6 widens the step
 * spacing to 0.19 and the travels drop to their mobile values. Everything below
 * is AUTHORED per breakpoint, never `desktop * 0.6` (§A.2, rule 6).
 *
 *   0.15 → 0.96   the rail draws (vertical, scaleY)
 *   step 01 0.20 | step 02 0.39 | step 03 0.58 | step 04 0.77
 *   last stamp 0.86 → 0.94, rail lands 0.96.
 *
 *   ⚠ The rail's mobile END is 0.96, not the 0.90 §B.6 quotes for desktop. That
 *   is arithmetic, not drift: widening the step spacing from 0.17 to 0.19 pushes
 *   the final stamp from 0.88 to 0.94, and a progress gauge that finishes BEFORE
 *   the last step it is measuring is a gauge that lies. 0.96 preserves the
 *   desktop relationship (rail lands ~0.02 after the last stamp) at the mobile
 *   spacing. Everything else in §B.6's mobile note — vertical axis, scaleY, same
 *   EASE.rail, 0.19 spacing, mobile travels — is followed exactly.
 * ============================================================================
 */

import { BEAT, EASE, SCALE, STAGGER, TRAVEL } from '../../motion/system.js'

export const MOTION = {
  /* --------------------------------------------------------------------- */
  /* SECTION HEAD + RAIL — progress units (0 → 1 across the scrub window)   */
  /* --------------------------------------------------------------------- */
  seq: {
    /**
     * §B.13 #2 puts every `.mono-label` eyebrow 0.02 BEFORE its H2. The H2 is
     * this section's first beat (§B.6 opens at 0.00), so there is no timeline
     * in front of it and the mandated lead clamps to 0 — eyebrow and heading
     * start together. `leadBeforeHeading` is kept as a real number so the
     * relationship stays visible: push `heading.start` to 0.02 and the lead
     * comes back, and every later beat still has slack.
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
     * each line rising out of its own mask. IDENTICAL numbers on every H2 on the
     * site — yPercent 110, EASE.reveal, STAGGER.each.loose. Do not vary it "for
     * interest": the variation lives in what happens AFTER the headline, which
     * here is the rail and the stamps.
     *
     * §B.6 gives this section a 0.20 headline window rather than Diagnosis's
     * 0.22, because the rail has to start at 0.15 and the first step at 0.20 —
     * the headline has to be out of the way before the sequence begins.
     */
    heading: {
      start: 0.0,
      end: 0.2,
      ease: EASE.reveal,
      staggerEach: STAGGER.each.loose,
      /** % of each line's own height. 110 not 100 so descenders clear the mask. */
      fromYPercent: TRAVEL.maskYPercent,
    },

    /** §B.13 #3 — the lede starts 0.06 after its H2's start. Runs long (BEAT.sm)
     *  so it is still settling as the rail begins to draw at 0.15, which stops
     *  the head and the sequence reading as two disconnected events. */
    lede: {
      start: 0.06,
      duration: BEAT.sm,
      ease: EASE.reveal,
      travel: TRAVEL.copy,
    },

    /**
     * 0.15 → 0.90 (0.96 mobile) — THE RAIL DRAWS.
     *
     * Long, spanning almost the whole window, because it is the section's spine.
     * It starts before the first step and ends after the last one, so at every
     * parked scroll position it reads as "you are HERE in the method".
     *
     * EASE.rail — 'none' — is MANDATORY and is not a taste call (§A.2, §B.13 #6).
     * The user is meant to perceive this element as attached to the scroll. An
     * eased rail stops tracking the finger near the ends of its window and reads
     * as input lag.
     *
     * `axis` is the GSAP property name, not a flag, so the component never has
     * to branch on the breakpoint: scaleX while the grid is 4-across, scaleY
     * once the steps stack. transform-origin is the matching START EDGE and
     * lives in Method.css (0 50% / 50% 0), because it is geometry, not timing.
     */
    rail: {
      start: { desktop: 0.15, mobile: 0.15 },
      /** See the ⚠ note in the header for why mobile ends later, not sooner. */
      end: { desktop: 0.9, mobile: 0.96 },
      ease: EASE.rail,
      axis: { desktop: 'scaleX', mobile: 'scaleY' },
    },
  },

  /* --------------------------------------------------------------------- */
  /* THE FOUR STEPS                                                         */
  /* --------------------------------------------------------------------- */
  /**
   * Each step's beats are anchored so they fire as the rail reaches that step,
   * rather than being expressed as one staggered tween. That is deliberate:
   * 0.17 is not a stagger, it is a beat boundary, and writing it as
   * `stagger: 0.17` would hide the fact that four separate storyboard beats are
   * being scheduled. It would also silently break the moment anyone changes the
   * step count.
   */
  steps: {
    /** Where step 01 begins. §B.6: `stepStart = 0.20 + i * spacing`. */
    firstStart: { desktop: 0.2, mobile: 0.2 },

    /**
     * Step-to-step spacing. §B.6 authors 0.17 desktop and widens it to 0.19 on
     * mobile, where the steps stack: a stacked card is a whole screen of its
     * own, so the reader needs more scroll between receipts.
     */
    spacing: { desktop: 0.17, mobile: 0.19 },

    /**
     * The step ordinal (01-04) cross-fades from its muted stacked twin to its
     * ink twin — a two-layer opacity cross-fade, never a colour tween
     * (rule 2 / §B.13 #5). The ink twin carries the shipped amber → mint
     * gradient-clipped treatment; the in-flow twin, which is the announced text,
     * is plain --muted. EASE.tint because a cross-fade wants to be near-linear
     * or its midpoint goes muddy.
     */
    number: {
      offset: 0,
      duration: BEAT.xs,
      ease: EASE.tint,
    },

    /**
     * The tier badge ("FREE & PAID" / "WHERE FREE STOPS" / …) arrives on the
     * SAME beat as the number, per §B.6. The two together are the step's
     * identity — the ordinal and which rung of the ladder it sits on — so they
     * must not arrive separately. Opacity only: the badge's own colour is
     * load-bearing (t-free is mint, t-paid is neutral, and that distinction
     * carries the "free stops here" argument), so nothing tints it.
     */
    tier: {
      offset: 0,
      duration: BEAT.xs,
      ease: EASE.tint,
    },

    /**
     * <h3> and <p> rise together, 0.02 after the number so the reader's eye is
     * already on the step. TRAVEL.copy — these are body-sized objects, and
     * perceived speed is displacement relative to the object's own size.
     *
     * Carries an opacity fade as well as the rise. Without it, parking the
     * scroll mid-beat leaves a heading sitting 18px low inside a card whose
     * padding has not moved, which reads as broken layout rather than as an
     * arrival. (Same call, same reasoning, as Diagnosis's standard strip.)
     */
    copy: {
      offset: 0.02,
      duration: BEAT.sm,
      ease: EASE.reveal,
      travel: TRAVEL.copy,
    },

    /**
     * THE ARTIFACT STAMPS. The one beat in this section that must not be
     * generic — the copy says every step LEAVES something, so the receipt is
     * pressed onto the card rather than faded onto it.
     *
     * scale SCALE.stampFrom (1.04) → 1 and a fraction of a degree of rotation
     * → 0, on EASE.punchOut (power2.out — the fast half of an overshoot, which
     * is what "landing" is). At 1.04 the row grows ~4.6px per side into the
     * card's 26px padding, so it never crosses the card border.
     *
     * NOT EASE.cssSpring. A back-ease on a scrubbed tween makes the element
     * travel backwards while the user scrolls forwards (§A.2), which on a stamp
     * would read as the ink bouncing off the page.
     */
    artifact: {
      offset: 0.09,
      duration: BEAT.xs,
      ease: EASE.punchOut,
      fromScale: SCALE.stampFrom,
      /**
       * Degrees of residual rotation at the start of the stamp. Both
       * breakpoints hold 0.6 and that is a CHOICE, not a shortcut — a rotation
       * is an angle, not a distance, so it does not shrink with the viewport,
       * and either side can move without touching the other.
       *
       * Sub-degree on purpose: at 1° a 250px row visibly tilts and the card
       * looks broken; at 0.6° it reads as a hand-placed stamp that did not
       * land perfectly square.
       */
      fromRotation: { desktop: 0.6, mobile: 0.6 },
      /**
       * Which way each stamp is off-square, indexed by step. Alternating, per
       * §B.6 ("sign alternating by index"), so four receipts down a column do
       * not read as one skewed block. Authored as data rather than computed
       * from `i % 2` so the owner can re-order the tilt by editing numbers.
       * One entry per step; the component falls back to +1 if this runs short.
       */
      rotationSigns: [1, -1, 1, -1],
    },
  },

  /** `window.__method` handle while tuning. Only attached when DEBUG. */
  debugKey: '__method',
}

/**
 * ============================================================================
 * COVERAGE MOTION CONFIG  —  tier: SCRUB-NO-PIN  (motion-system §B.4)
 * ============================================================================
 * Every duration, stagger, ease, distance and scale this section uses is a
 * named constant in this file. Tune Coverage by editing numbers here; nothing
 * in Coverage.jsx should need to change to re-time the sequence.
 *
 * ---------------------------------------------------------------------------
 * WHY THE NUMBERS ARE PROGRESS UNITS, NOT MILLISECONDS
 * ---------------------------------------------------------------------------
 * This timeline is scrubbed, not played. Coverage.jsx normalises it to exactly
 * 1.0 with `tl.to({}, { duration: 1 }, 0)`, so *timeline time === scroll
 * progress*: `seq.spine.start = 0.35` means literally "35% of the way through
 * the section's scrub window". A scrubbed tween has no wall-clock duration —
 * it advances only as fast as the finger moves — so "120ms" is not a thing the
 * timeline can honour.
 *
 * To sanity-check a stagger, convert with REFERENCE_TRAVERSAL_MS_NOPIN (900ms
 * per progress unit for a scrub-no-pin section, vs 2200ms for a pin):
 *
 *     STAGGER.each.base  0.030 units ≈  27ms here   (≈66ms inside a pin)
 *     STAGGER.each.loose 0.055 units ≈  50ms here   (≈120ms inside a pin)
 *
 * That the same constant reads ~2.4x faster here than in a pinned set-piece is
 * INTENTIONAL and is stated in motion-system §A.1: pinned set-pieces are slow
 * and deliberate, workhorse sections are brisk. Do not inflate these to
 * "match" the hero.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD (motion-system §B.4, verbatim)
 * ---------------------------------------------------------------------------
 *   0.00 → 0.22   H2 masked line rise — the signature gesture (§A.6).
 *   0.15 → 0.50   The two .cov-panels converge inward from ∓TRAVEL.converge.
 *                 They do NOT fade: opacity is 1 the whole way. They are
 *                 *positioned*, not *revealed*.
 *   0.35 → 0.68   The spine DRAWS. scale 0 → 1 on EASE.rail. This is a gauge,
 *                 not a flourish: it must track the scroll exactly, because
 *                 the whole claim is that it MEASURES what the two panels
 *                 share.
 *   0.50 → 0.85   The four .spine-nodes arrive, each landing as the drawing
 *                 rule reaches its Y. Offsets come from node INDEX, never from
 *                 measurement — node i starts at 0.50 + i * STAGGER.each.base.
 *   0.80 → 1.00   The two .cov-tags mask up last, so the labels are the
 *                 closing statement.
 *
 * Windows overlap on purpose. The spine starts drawing while the panels are
 * still travelling, so the rule appears to be what pulls them together.
 *
 * ---------------------------------------------------------------------------
 * HOW THIS IS NOT FADE-IN-ON-ENTER (motion-system §0)
 * ---------------------------------------------------------------------------
 * The spine is a rail. Park the scroll at 50% and it is half drawn, the panels
 * are half converged, the nodes are mid-cascade and the tags are still under
 * their masks. Scroll up one notch and the rule retracts. Every one of these
 * is a continuous function of scroll position, not a boolean crossing.
 * ============================================================================
 */

import { BEAT, EASE, SCALE, STAGGER, TRAVEL } from '../../motion/system'

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — all values are progress units (0 → 1 across the scrub window)  */
  /* ----------------------------------------------------------------------- */
  seq: {
    /**
     * The eyebrow (`.mono-label`, "Coverage — what you buy").
     *
     * §B.13 #2 is a cross-section mandate: every eyebrow on the site rises
     * pick(TRAVEL.copy) on EASE.reveal starting 0.02 BEFORE its H2.
     *
     * ⚠️ CLAMP: this section's H2 starts at 0.00 (§B.4), and a timeline
     * normalised to [0, 1] has nowhere to put -0.02. Coverage.jsx computes
     * `Math.max(0, seq.heading.start - seq.eyebrow.lead)`, so here the lead
     * resolves to 0 and the eyebrow starts level with the headline rather
     * than ahead of it. Keep `lead` as a named number anyway: if the H2 is
     * ever pushed later in the storyboard the mandated offset applies with no
     * code change.
     */
    eyebrow: {
      lead: 0.02,
      /** BEAT.sm is "a short move: copy masking up". */
      span: BEAT.sm,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * 0.00 → 0.22 — the H2 masks up line by line.
     *
     * THE SIGNATURE GESTURE (§A.6). Identical numbers on the hero H1 and on
     * the H2 of nine other sections: yPercent 110, EASE.reveal,
     * STAGGER.each.loose. Do not vary it "for interest" — the variation is
     * meant to live in what happens AFTER the headline.
     */
    heading: {
      start: 0.0,
      end: 0.22,
      /** Per-line, not total: an H2 is 1-3 lines and n is fixed by design. */
      staggerEach: STAGGER.each.loose,
      /** 110 not 100, so descenders clear the mask edge on a subpixel bound. */
      fromYPercent: TRAVEL.maskYPercent,
      ease: EASE.reveal,
    },

    /**
     * The lede paragraph. §B.13 #3: every lede under a section head rises
     * pick(TRAVEL.copy) starting 0.06 AFTER its H2's start.
     */
    lede: {
      offset: 0.06,
      span: BEAT.sm,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * 0.15 → 0.50 — the two panels converge inward.
     *
     * Deliberately overlaps the headline: the sentence and the gesture land
     * together. No stagger between the two panels — they are one symmetric
     * event, and staggering them would make one look like it arrived first.
     *
     * EASE.travel (power2.inOut) is the "long A→B repositioning" curve: it is
     * symmetric, so the panels read as objects with mass being MOVED, not as
     * objects appearing.
     *
     * `from` is the lateral separation at progress 0, in px. Desktop and
     * mobile values are AUTHORED in TRAVEL.converge — never derived by
     * multiplying the desktop number.
     *
     * AXIS: desktop converges on X (three-column grid, panels side by side);
     * mobile converges on Y (the grid collapses and they stack). Coverage.jsx
     * picks the axis; both use this same `from` pair.
     */
    panels: {
      start: 0.15,
      end: 0.5,
      from: TRAVEL.converge,
      ease: EASE.travel,
    },

    /**
     * 0.35 → 0.68 — the spine draws between the two things you buy.
     *
     * EASE.rail — 'none' — is MANDATORY here and is not a taste call (§A.2,
     * §B.13 #6). An eased rail stops tracking the finger and reads as input
     * lag. This element must feel physically attached to the scroll.
     *
     * The rule is a real element (.coverage__rail), not the legacy
     * `.cov-spine::before` pseudo-element, because GSAP cannot target a
     * pseudo-element. Same geometry, same amber→mint gradient, same opacity.
     */
    spine: {
      start: 0.35,
      end: 0.68,
      ease: EASE.rail,
    },

    /**
     * The spine title ("SHARED CORE").
     *
     * ADDITION, flagged: §B.4 lists five beats and this label is not one of
     * them. Left un-animated it is the only static element in a section where
     * everything else is scrubbed, which reads as a bug. It is treated as the
     * spine's own eyebrow — same TRAVEL.copy rise as the section eyebrow,
     * fired the instant the rule starts drawing, at BEAT.xs (punctuation).
     * Delete this block and its tween if the owner disagrees.
     */
    spineTitle: {
      start: 0.35,
      span: BEAT.xs,
      fromY: TRAVEL.copy,
      ease: EASE.reveal,
    },

    /**
     * 0.50 → 0.85 — the four spine nodes arrive.
     *
     * Each node is positioned so it lands as the drawing rule reaches its Y.
     * §B.4 is explicit that the offsets are computed FROM INDEX, not by
     * measuring: four nodes evenly spaced means node i starts at
     * 0.50 + i * STAGGER.each.base. A single staggered tween expresses exactly
     * that, and it stays correct if the node count changes.
     *
     * `each` (not `amount`) because n is 4 and fixed by the design (§A.2).
     *
     * SCALE.riseFrom (0.96) is "an object approaching" — just under 1. Below
     * ~0.9 it reads as a modal popping in, which is the wrong verb.
     */
    nodes: {
      start: 0.5,
      end: 0.85,
      staggerEach: STAGGER.each.base,
      fromScale: SCALE.riseFrom,
      ease: EASE.reveal,
    },

    /**
     * 0.80 → 1.00 — the two .cov-tags mask up last.
     *
     * STAGGER.each.loose is reserved for text lines and for sequences the user
     * is meant to COUNT (§A.2). Two labels read one after the other is exactly
     * that: "Paid — the clicks you buy", then "Organic — the clicks you earn".
     *
     * Same mask mechanics as the H2 (yPercent 110 out of an overflow-hidden
     * parent), but built by hand rather than by SplitText: these are single
     * lines with a fixed shape, so there is nothing to measure and no reason
     * to pay for a second SplitText instance or its revert.
     */
    tags: {
      start: 0.8,
      end: 1.0,
      staggerEach: STAGGER.each.loose,
      fromYPercent: TRAVEL.maskYPercent,
      ease: EASE.reveal,
    },
  },

  /* ----------------------------------------------------------------------- */
  /* MOBILE — AUTHORED VALUES, NOT SCALED DESKTOP ONES                        */
  /* ----------------------------------------------------------------------- */
  /**
   * Everything below is a number chosen for a phone, not a desktop number
   * multiplied by something (§A.2, non-negotiable #6). The beat boundaries in
   * `seq` are shared across breakpoints on purpose — the STORYBOARD is the
   * same argument at both sizes; only its geometry changes.
   */
  mobile: {
    /**
     * Below 1080px CSS the spine stops being a vertical column and becomes a
     * 2x2 grid of nodes. §B.4 mobile: "the four nodes become a 2×2 that
     * arrives as two beats." A grid stagger with `axis: 'y'` gives exactly two
     * beats — both nodes in a row share a delay — regardless of source order.
     *
     * 0.05 per ROW, not per node. Wider than the desktop per-node 0.030
     * because there are only two beats to spend the window on, and at 900ms
     * traversal a 0.030 row gap would be ~27ms, which reads as simultaneous.
     */
    nodeStagger: { each: 0.05, grid: [2, 2], axis: 'y' },
    /** Row count, so the stagger SPREAD can be computed without measuring. */
    nodeRows: 2,
  },
}

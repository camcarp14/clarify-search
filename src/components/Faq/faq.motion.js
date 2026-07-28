/**
 * ============================================================================
 * FAQ MOTION CONFIG  —  tier: SCRUB-NO-PIN  (motion-system §B.10)
 * ============================================================================
 * Every duration, stagger, ease, distance and wall-clock millisecond this
 * section uses is a named constant in this file. Tune the FAQ by editing
 * numbers here; nothing in Faq.jsx or Faq.css should need to change to re-time
 * anything. Values that come from the shared physics are IMPORTED and composed
 * (EASE, STAGGER, TRAVEL, BEAT) — never copy-pasted as literals, so a retune of
 * `EASE.reveal` in system.js follows through to this section for free.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SEQUENCE NUMBERS ARE PROGRESS UNITS, NOT MILLISECONDS
 * ---------------------------------------------------------------------------
 * The scroll timeline is scrubbed, not played. Faq.jsx normalises it to exactly
 * 1.0 with `tl.to({}, { duration: 1 }, 0)`, so *timeline time === scroll
 * progress*: `seq.rows.desktop.start = 0.20` means literally "20% of the way
 * through this section's scrub window". A scrubbed tween has no wall-clock
 * duration — it advances only as fast as the finger moves — so "120ms" is not
 * something the timeline can honour.
 *
 * To sanity-check a stagger, convert with REFERENCE_TRAVERSAL_MS_NOPIN (900ms
 * per progress unit for a scrub-no-pin section, against 2200ms inside a pin):
 *
 *     STAGGER.amount.loose 0.14 across 9 rows ≈ 0.0175 each ≈ 16ms here
 *     STAGGER.each.loose   0.055 per line              ≈ 50ms here
 *
 * The same constants read ~2.4x faster here than in a pinned set-piece. That is
 * INTENTIONAL (motion-system §A.1): pinned set-pieces are slow and deliberate,
 * workhorse sections are brisk. Do not inflate these to "match" the hero.
 *
 * ---------------------------------------------------------------------------
 * THE STORYBOARD (motion-system §B.10, plus the §B.13 cross-section mandates)
 * ---------------------------------------------------------------------------
 *   0.00 → 0.08   The `.mono-label` eyebrow rises TRAVEL.copy on EASE.reveal.
 *                 §B.13 #2 puts every eyebrow on the site 0.02 BEFORE its H2;
 *                 this H2 starts at 0.00, so the lead clamps to 0 (see below).
 *   0.00 → 0.20   H2 masked line rise — the site's signature gesture (§A.6),
 *                 same numbers as the hero: yPercent 110, EASE.reveal,
 *                 STAGGER.each.loose. No variation "for interest".
 *   0.20 → 0.95   The nine rows are DEALT. Each <details> arrives from
 *                 { y: TRAVEL.copy, opacity: 0 } on EASE.reveal, spread with
 *                 STAGGER.amount.loose.
 *
 * §B.13 #3 (a lede <p> rising 0.06 after its H2) does not apply: this section
 * has no lede paragraph. There is no copy between the heading and the list.
 *
 * WHY `amount` AND NOT `each`, restated because it is the most common bug in
 * this build: nine rows at STAGGER.each.base (0.030) would occupy 0.24 of the
 * timeline on stagger alone and blow through the beat. `amount` is a TOTAL
 * spread shared across however many rows exist, so the gesture stays inside its
 * window no matter how the list grows. Rule of thumb from §STAGGER: n > 6, or n
 * from data → `amount`.
 *
 * ---------------------------------------------------------------------------
 * HOW THIS IS NOT FADE-IN-ON-ENTER (motion-system §0)
 * ---------------------------------------------------------------------------
 * The 0.14 stagger is spread across a 0.75-wide window, so the last row is
 * still arriving while the first is long settled — the list reads as a hand
 * being dealt, one card at a time, tied to the finger. Park the scroll at 50%
 * and roughly half the rows are still under their offset with the rest landed;
 * scroll up one notch and they retract in reverse order. Row position is a
 * continuous function of scroll position, not a delay chain fired by a boolean
 * crossing.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS SECTION IS NOT PINNED (motion-system §B.10, "Why not pinned")
 * ---------------------------------------------------------------------------
 * <details> change height under the user's control. A pin spacer is sized at
 * refresh time, so content that grows after the refresh grows straight out of
 * its spacer. Pinning a disclosure list is a ScrollTrigger nightmare with no
 * upside.
 *
 * ---------------------------------------------------------------------------
 * MOBILE VALUES ARE AUTHORED, NOT DERIVED
 * ---------------------------------------------------------------------------
 * Every { desktop, mobile } pair below is written out. Nothing here is a
 * desktop number multiplied by a ratio — motion-system §A.4 #6 forbids it, and
 * `pick()` exists so it never gets written. The pairs use the same
 * { desktop, mobile } key shape as TRAVEL and PIN so `pick(pair, isMobile)`
 * works on them directly.
 * ============================================================================
 */

import { BEAT, EASE, STAGGER, TRAVEL } from '../../motion/system'

export const MOTION = {
  /* ----------------------------------------------------------------------- */
  /* SEQUENCE — progress units, 0 → 1 across the scrub window                 */
  /* ----------------------------------------------------------------------- */
  seq: {
    /**
     * The eyebrow (`.mono-label`, the string "FAQ").
     *
     * §B.13 #2 is a cross-section mandate: every eyebrow on the site rises
     * pick(TRAVEL.copy) on EASE.reveal starting `lead` BEFORE its H2.
     *
     * CLAMP: this section's H2 starts at 0.00 and a timeline normalised to
     * [0, 1] has nowhere to put -0.02, so Faq.jsx computes
     * `Math.max(0, heading.start - eyebrow.lead)` and the lead resolves to 0
     * here — the eyebrow starts level with the headline rather than ahead of
     * it. `lead` stays a named number anyway: push the H2 later in the
     * storyboard and the mandated offset applies with no code change.
     */
    eyebrow: {
      lead: 0.02,
      /** BEAT.xs is the perceptual floor — punctuation, one small object. */
      duration: BEAT.xs,
      ease: EASE.reveal,
    },

    /**
     * The H2, "Straight answers before you send access."
     *
     * The signature masked line rise (§A.6). SplitText cuts it into lines with
     * `mask: 'lines'` and each line starts TRAVEL.maskYPercent below its own
     * mask. The numbers are fixed site-wide — yPercent 110, EASE.reveal,
     * STAGGER.each.loose — and this section does not get to vary them.
     *
     * Legacy note, so nobody re-adds it: the FAQ heading lives in
     * `.faq-grid .lede`, which matched NEITHER `.section-head h2` NOR
     * `.contact-copy h2`, so it never got legacy's clip-path wipe. The masked
     * line rise replaces that whole system anyway (§0.1).
     *
     * The mobile window closes 0.02 earlier because the narrow column wraps
     * the heading onto more lines, and more lines means more stagger spread
     * competing for the same window. `fit()` in Faq.jsx absorbs the rest.
     */
    heading: {
      desktop: { start: 0.0, end: 0.2 },
      mobile: { start: 0.0, end: 0.18 },
      staggerEach: STAGGER.each.loose,
      ease: EASE.reveal,
      fromYPercent: TRAVEL.maskYPercent,
    },

    /**
     * The nine <details> rows.
     *
     * DESKTOP — 0.20 → 0.95, STAGGER.amount.loose (0.14), straight from §B.10.
     * The window is long relative to the spread on purpose: that gap is what
     * makes the list read as dealt rather than as a block arriving.
     *
     * MOBILE — 0.18 → 0.95, STAGGER.amount.base (0.09). AUTHORED, not scaled.
     * At 390px only three or four rows are on screen at once, so a spread wide
     * enough to read across nine visible rows means the rows below the fold
     * have finished their arrival before the user has scrolled far enough to
     * see them happen. A tighter total keeps each row's gesture close to the
     * moment that row is actually in frame. It also starts 0.02 earlier,
     * because the mobile scrub window (`top 92%` → `bottom 70%`) has less
     * lead-in to spend.
     *
     * `y` comes from pick(TRAVEL.copy, isMobile) at build time — 18px desktop,
     * 14px mobile — rather than being restated here, because a row of body
     * copy should travel exactly as far as body copy travels everywhere else.
     */
    rows: {
      desktop: { start: 0.2, end: 0.95, staggerAmount: STAGGER.amount.loose },
      mobile: { start: 0.18, end: 0.95, staggerAmount: STAGGER.amount.base },
      ease: EASE.reveal,
    },
  },

  /* ----------------------------------------------------------------------- */
  /* DISCLOSURE — click-driven, WALL-CLOCK, deliberately not on the scrub     */
  /* ----------------------------------------------------------------------- */

  /**
   * Two systems in this section, and they must not share a driver (§B.10).
   * Everything above is scrubbed by scroll. Everything below is milliseconds,
   * because the user is driving: a disclosure that tracked the scroll would be
   * unusable. §B.10 rationale, verbatim: "the disclosure interaction is the one
   * place on the page where the user is driving, so it must be instant and
   * wall-clock, never coupled to the scroll."
   *
   * THESE MILLISECONDS ARE THE SINGLE SOURCE OF TRUTH FOR BOTH CSS AND JS.
   * Faq.jsx publishes them onto the section root as CSS custom properties
   * (`--faq-track-dur` and friends) and Faq.css consumes them, so the
   * transition the browser runs and the timeout the component arms can never
   * drift apart. Faq.css carries the same numbers as fallbacks so the
   * stylesheet still reads correctly on its own; if you change a number here,
   * change the fallback there too or the two will disagree for anyone reading
   * the CSS.
   *
   * The height animation itself is the SANCTIONED EXCEPTION in §A.5 —
   * `grid-template-rows: 0fr → 1fr` on a click-driven disclosure. It is the
   * "preferred, no measurement at all" form: the browser interpolates the
   * intrinsic height and nothing is ever measured. There is no scrollHeight
   * read, no getBoundingClientRect, no inline style.height and no
   * ResizeObserver in this section. Never reintroduce one — §D.9 names the
   * legacy measured-height port as one of the two worst React ports in the
   * file, and §5 R13 explicitly forbids "fixing" the older-Safari fr snap by
   * switching to max-height.
   */
  disclosure: {
    /** The `grid-template-rows` transition. Legacy `.4s`. */
    trackMs: 400,
    /** The chevron rotation. Legacy `.3s`. */
    chevronMs: 300,
    /** The card's border-colour tint. Legacy `.25s`. */
    borderMs: 250,

    /**
     * Safety net for BOTH directions, and a DELIBERATE IMPROVEMENT on legacy
     * (spec §5 R6, extended to cover the expand as well).
     *
     * Two things hang off `transitionend` for `grid-template-rows`: a collapse
     * finalises there (flipping the native `open` attribute off), and either
     * direction triggers the ScrollTrigger refresh the changed document height
     * demands (§B.10c). If that event never fires, a collapsing legacy item is
     * stuck — visually collapsed to 0fr but still `open` and still occupying
     * the DOM — and an expanding one silently leaves every trigger below this
     * section measuring a document that no longer exists.
     *
     * It never fires when the tab is backgrounded, when an ancestor is
     * display:none'd mid-animation, or on a browser that does not interpolate
     * `fr` tracks at all (Firefox < 127, Safari < 16), where the change is
     * instant and there is no transition to end.
     *
     * trackMs + this grace is the fallback deadline. The grace only has to
     * cover the gap between the transition ending and the event being
     * dispatched, plus the one frame the expand spends deferring its class, so
     * it is small on purpose: too long and a stuck row sits visibly empty, too
     * short and it races a transition that is still running.
     */
    safetyGraceMs: 60,
  },
}

/** Wall-clock deadline for the disclosure safety net, in ms — the point after
 *  which Faq.jsx stops waiting for `transitionend` and settles the row itself.
 *  Derived once here rather than at the call sites in Faq.jsx. */
export const SETTLE_DEADLINE_MS =
  MOTION.disclosure.trackMs + MOTION.disclosure.safetyGraceMs

/**
 * The CSS custom properties Faq.jsx writes onto the section root, so Faq.css
 * transitions and the component's own timers read the same numbers.
 *
 * Built at module scope from constants only — no window, no document, no
 * matchMedia — so it is safe to evaluate during build-time prerendering.
 */
export const DISCLOSURE_CSS_VARS = {
  '--faq-track-dur': `${MOTION.disclosure.trackMs}ms`,
  '--faq-chevron-dur': `${MOTION.disclosure.chevronMs}ms`,
  '--faq-border-dur': `${MOTION.disclosure.borderMs}ms`,
}

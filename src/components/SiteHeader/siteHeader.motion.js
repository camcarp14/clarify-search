/**
 * ============================================================================
 * SITE SHELL MOTION CONFIG — header, scroll hairline, mobile panel, marquee
 * ============================================================================
 * Every duration, threshold, distance, ease and time-scale the shell uses is a
 * named constant in this file. Tune the shell by editing numbers here; nothing
 * in SiteHeader.jsx or Marquee.jsx should need to change to re-time it.
 *
 * Eases are IMPORTED from the shared physics (src/motion/system.js) and
 * composed, never copy-pasted as literals — §A.2 "Values that come from the
 * shared system are imported and composed".
 *
 * ---------------------------------------------------------------------------
 * WHY THERE ARE NO PROGRESS UNITS IN HERE
 * ---------------------------------------------------------------------------
 * Every other section's motion config is written in progress units, because
 * its timeline is normalised to 1.0 and scrubbed by scroll (hero.motion.js
 * explains the conversion). The shell is the one place that cannot work that
 * way, and §B.1 says so explicitly:
 *
 *   "Four moves, none of them a scrub of the header itself — the header has no
 *    progress through the viewport, so a scrub is not available to it."
 *
 * The header is `position: fixed`. It never traverses the viewport, so there is
 * no 0→1 to scrub against. Its two moves are therefore WALL-CLOCK tweens driven
 * by a ScrollTrigger's onToggle / onUpdate, and their durations are in seconds.
 *
 * The two things in the shell that ARE scroll-coupled are coupled properly:
 *   - `#progress`  — a true scrub (`scrub: true`, EASE.rail) across the whole
 *                    document. §A.7. This is the only raw document-length rail
 *                    on the page.
 *   - the marquee  — its rate is a continuous function of scroll velocity, not
 *                    a boolean crossing. §B.2.
 *
 * ---------------------------------------------------------------------------
 * MOBILE VALUES ARE AUTHORED, NOT SCALED
 * ---------------------------------------------------------------------------
 * Every `{ desktop, mobile }` pair below was chosen for that breakpoint. You
 * may not write `x.desktop * 0.6` anywhere — read them with `pick()` from
 * src/motion/system.js. The reasoning for each mobile number is in its comment.
 *
 * Two DIFFERENT breakpoints are in play and they are not interchangeable:
 *   - MOTION breakpoint  900px  (CONDITIONS / MEDIA in system.js) — decides
 *     which storyboard runs. `pick()` pairs below are read against this one.
 *   - LAYOUT breakpoint  760px  (`nav.compactQuery`) — decides whether the nav
 *     is a row or a panel, and the value of `--nav-h`. This is legacy's shell
 *     breakpoint and §4.9 is explicit that the two systems stay separate.
 * ============================================================================
 */

import { EASE } from '../../motion/system'

export const MOTION = {
  /* --------------------------------------------------------------------- */
  /* 1. THE ONE DOCUMENT-LEVEL CHROME TRIGGER                               */
  /*    Drives BOTH the plate cross-fade (onToggle) and the direction-aware */
  /*    hide (onUpdate), so there is one trigger where legacy had two raw   */
  /*    scroll listeners.                                                   */
  /* --------------------------------------------------------------------- */
  chrome: {
    /** Legacy: `header.classList.toggle('is-scrolled', window.scrollY > 8)`
     *  (index.html:2452). As a ScrollTrigger start on `document.body`,
     *  `top -8px` is the identical boundary — the body's top edge sits 8px
     *  above the viewport top. No hysteresis, exactly like legacy: it flips on
     *  and off at the same value. */
    thresholdPx: 8,

    /** The trigger must stay ACTIVE all the way to the bottom of the document,
     *  or `onToggle(false)` fires at max scroll and the header un-tints itself
     *  in the footer.
     *
     *  This is a FLAT, measurement-independent distance, deliberately. The
     *  previous version was `ScrollTrigger.maxScroll(window) + 1` in function
     *  form, on the theory that it would re-resolve on refresh once the pin
     *  spacers existed. It cannot: ScrollTrigger REVERTS pin spacing while it
     *  refreshes, so maxScroll() read from inside an end-function always sees
     *  the un-pinned document. Measured, it pinned itself to 9,988 against a
     *  real maxScroll of 16,009 — the header un-tinted two thirds down the page
     *  and section text read straight through the 82%-alpha plate.
     *
     *  A flat `+=200000` was tried next and was WORSE: ScrollTrigger grew the
     *  document to match, taking maxScroll from 16,009 to 199,101 — a 200,000px
     *  page.
     *
     *  So: the trigger now spans the whole document ('top top' → 'max') and the
     *  tint is asserted from onUpdate/onRefresh as a pure function of scroll
     *  position, never inferred from isActive. onToggle fires only when
     *  isActive CHANGES, so an instant top-to-bottom jump goes inactive →
     *  inactive, fires nothing, and leaves a transparent header over the
     *  footer — which is exactly what a cold `/#contact` deep-link does.
     *  Nothing here is measured, and nothing extends the document. */
    end: 'max',
  },

  /* --------------------------------------------------------------------- */
  /* 2. STATE CROSS-FADE — §B.1 move 1                                      */
  /*    Two stacked backdrop plates, opacity cross-faded. NOT a background   */
  /*    or border-color tween: §A.4 rule 2, "colour changes are opacity      */
  /*    cross-fades between stacked layers", applied to chrome.              */
  /* --------------------------------------------------------------------- */
  plate: {
    /** Seconds, wall-clock. §B.1 asks for ~220ms. Legacy's CSS transition was
     *  `background .22s ease, border-color .22s ease` — same number, so the
     *  header settles at exactly the speed it always did. */
    durationSeconds: 0.22,

    /** GSAP's twin of the CSS token --e-out, which is what legacy's transition
     *  used. Using EASE.reveal here would make the header disagree with the
     *  hamburger bars and the skip link, which are still CSS transitions on
     *  var(--e-out) a few pixels away. */
    ease: EASE.cssOut,

    clearOpacity: 0,
    solidOpacity: 1,
  },

  /* --------------------------------------------------------------------- */
  /* 3. DIRECTION-AWARE HIDE — §B.1 move 2                                  */
  /*    A tween, not a scrub. The header should snap out of the way, not     */
  /*    track the finger.                                                    */
  /* --------------------------------------------------------------------- */
  hide: {
    /** -100 clears the full header height whatever `--nav-h` is, which is why
     *  this is yPercent and not a pixel distance. */
    hiddenYPercent: -100,
    shownYPercent: 0,

    /** Seconds. §B.1's stated value. Long enough to read as a move, short
     *  enough that a scroll-direction change feels instant. */
    durationSeconds: 0.4,
    ease: EASE.cssOut,

    /** Scroll depth (px) below which the header NEVER hides, whatever the
     *  direction. Without it the header vanishes 9px into the page, which
     *  reads as a flicker rather than as a hide.
     *
     *  desktop 140 — roughly one and a half wheel notches past the tint
     *                threshold; the user has committed to scrolling.
     *  mobile   96 — a thumb flick covers far more of a short viewport per
     *                gesture, so arming later than ~100px means the header is
     *                still on screen when the user has already moved a full
     *                screen of content. Authored, not 140 × 0.6. */
    armAfterPx: { desktop: 140, mobile: 96 },
  },

  /* --------------------------------------------------------------------- */
  /* 4. #progress HAIRLINE — §A.7                                           */
  /*    ONE ScrollTrigger on document.body. Replaces legacy's scroll         */
  /*    listener + rAF + `progressEl.style.transform` (index.html:2512-2524).*/
  /* --------------------------------------------------------------------- */
  progress: {
    start: 'top top',
    /** 'max', not 'bottom bottom'. Both mean "the end of the document", but
     *  'bottom bottom' is resolved against document.body's measured height,
     *  and three pin spacers inflate that height AFTER this trigger is
     *  created. Measured: the rail's end computed to 9,979 while real
     *  maxScroll was 16,009, so the hairline hit 100% at 62% of the page.
     *  'max' is re-resolved from the live maximum on every refresh. */
    end: 'max',

    /** `true`, not 0.6 and not PIN.scrub. A progress hairline is a RAIL: the
     *  user must perceive it as attached to the scroll. Any catch-up smoothing
     *  at all reads as the bar lagging the page. §A.7 specifies `scrub: true`
     *  and EASE.rail together for exactly this reason. */
    scrub: true,

    fromScaleX: 0,
    toScaleX: 1,

    /** NO EASE. Mandatory for a scroll rail — §A.2 EASE.rail, §B.13 #6. */
    ease: EASE.rail,
  },

  /* --------------------------------------------------------------------- */
  /* 5. MOBILE PANEL — §B.1 move 4                                          */
  /*    Transform + opacity only. These three numbers are handed to CSS as   */
  /*    custom properties on the <nav> (the same technique Hero.jsx uses for */
  /*    its per-chip drift), so the transition stays a click-driven CSS      */
  /*    micro-interaction while its numbers still live in MOTION.            */
  /* --------------------------------------------------------------------- */
  panel: {
    /** Closed offset, as a percentage of the panel's OWN height — §B.1 says
     *  the panel animates yPercent. Legacy used a flat `translateY(-8px)`,
     *  which is a 2% nudge on a six-link panel and reads as a twitch. -6%
     *  keeps the gesture proportional if the link count ever changes. */
    fromYPercent: -6,

    /** Seconds. Legacy: `transform .3s var(--e-out), opacity .2s ease`. The
     *  opacity is deliberately shorter than the slide so the panel is fully
     *  opaque before it finishes settling. */
    slideSeconds: 0.3,
    fadeSeconds: 0.2,
  },

  /* --------------------------------------------------------------------- */
  /* 6. ANCHOR ROUTING — §5.4 / §D.4                                        */
  /*    CSS `scroll-behavior: smooth` is dead under Lenis (base.css forces   */
  /*    `scroll-behavior: auto !important` on .lenis-smooth) and Lenis        */
  /*    ignores `scroll-padding-top`, so nav clicks would hard-jump and land  */
  /*    under the fixed header. Clicks are routed through lenis.scrollTo().   */
  /* --------------------------------------------------------------------- */
  nav: {
    /** The LAYOUT breakpoint, not the motion one. Below this the nav is a
     *  fixed panel, `--nav-h` is 68px and the hamburger is visible. */
    compactQuery: '(max-width: 760px)',

    /** The scroll offset is read from the live CSS custom properties
     *  `--nav-h` + `--nav-gap` (declared in SiteHeader.css) so the number the
     *  header is LAID OUT with and the number anchors are OFFSET by can never
     *  drift apart. These are only used if the stylesheet has not applied —
     *  a prerendered first paint, or CSS still in flight.
     *
     *  --nav-h + --nav-gap reproduces legacy's `scroll-padding-top` exactly:
     *      desktop  76 + 16 = 92px   (index.html:177)
     *      ≤760px   68 + 12 = 80px   (index.html:1514) */
    heightFallbackPx: { desktop: 76, mobile: 68 },
    gapFallbackPx: { desktop: 16, mobile: 12 },

    /** Delay after document.fonts.ready before jumping to a cold #hash. One
     *  frame is enough for the pin spacers to be in the DOM; a little more
     *  buys safety on a slow first paint without being perceptible, because
     *  the jump is instant rather than animated. */
    coldHashDelaySeconds: 0.08,

    /** How long the cold-#hash jump keeps re-asserting itself across refreshes
     *  before giving up. Long enough to outlast font swap and image decode,
     *  short enough that a late refresh can never yank a parked reader. Any
     *  real input (wheel, touch, key, pointer) disarms it immediately. */
    coldHashSettleSeconds: 2.5,
  },
}

/* ------------------------------------------------------------------------- */
/* MARQUEE — §B.2, velocity-coupled                                          */
/* ------------------------------------------------------------------------- */

/**
 * The marquee is a second component but it shares this file, because the shell
 * is one piece of chrome and §5.12 puts "marquee 44s" in the same motion module
 * as the nav heights and the scroll threshold.
 *
 * WHAT IS STILL CSS-ONLY, AND MUST STAY THAT WAY (§5.8):
 *   - `width: max-content` on the track
 *   - two byte-identical <ul>s rendered from ONE array, mapped twice
 *   - the -50% offset is exactly one <ul> BECAUSE the list is duplicated
 * Nothing measures a width in JS. `xPercent: -50` is a percentage of the
 * element's own box, so GSAP never reads a layout value either.
 *
 * WHAT MOVED FROM CSS TO GSAP, AND WHY (§B.2):
 *   legacy drove the loop with `animation: slide 44s linear infinite`. A CSS
 *   keyframe cannot be coupled to scroll velocity, and this strip sits in the
 *   seam between the hero's unpin and the first band — exactly where a static
 *   decoration announces that the cinematic part is over. One tween + one
 *   trigger buys a continuous machine for almost nothing.
 */
export const MARQUEE_MOTION = {
  /** Exactly half the track, because the list is duplicated. Frame 0 and the
   *  repeat frame are pixel-identical, so the loop is invisible. Change the
   *  item count on only one list and the seam appears. */
  xPercent: -50,

  /** Seconds for one full pass.
   *  desktop 44 — legacy's tuned value for these 14 items.
   *  mobile  34 — the same 14 items render at 10px with 24px gaps instead of
   *               11px with 34px gaps, so the track is roughly 78% as wide.
   *               Holding 44s there would drop the strip to ~78% of its
   *               desktop pixels-per-second and read as sluggish. 34 keeps the
   *               perceived speed. Authored from that measurement, not scaled
   *               by a ratio. */
  loopSeconds: { desktop: 44, mobile: 34 },

  /** Linear. It is a rail — §B.13 #6. An eased marquee visibly stalls at each
   *  repeat boundary. */
  ease: EASE.rail,

  /** Idle rate. Scroll velocity is added to this, so 1 is "nobody is
   *  scrolling". */
  idleTimeScale: 1,

  /** Hard clamp on the coupled rate. §D.6: ScrollTrigger.getVelocity() under
   *  Lenis's lerp routinely spikes to ±4000px/s on a flick, and feeding that
   *  raw into timeScale makes the strip strobe.
   *  desktop 4 — 4× idle still reads as one strip moving fast.
   *  mobile  3 — a thumb flick is a much larger fraction of the viewport, and
   *              at 10px type a 4× smear is unreadable. */
  maxTimeScale: { desktop: 4, mobile: 3 },

  /** Velocity (px/s) that buys one extra unit of timeScale.
   *  desktop 1200 — a comfortable wheel scroll is ~1200px/s, so a normal
   *                 scroll doubles the strip's rate. That is the whole effect.
   *  mobile  1600 — touch velocities are routinely higher for the same
   *                 perceived effort, so the same feel needs a larger divisor.
   *                 Authored, not derived. */
  velocityDivisor: { desktop: 1200, mobile: 1600 },

  /** The quickTo that smooths the rate change. Without it the strip strobes
   *  even inside the clamp, because getVelocity() is noisy frame to frame.
   *  §B.2 and §D.6 both name 0.4s. */
  timeScaleSeconds: 0.4,
  timeScaleEase: EASE.cssOut,

  /** Seconds of no scroll updates after which the rate is eased back to idle.
   *  ScrollTrigger only calls onUpdate while the scroll position is changing;
   *  if the last update it ever sends carries a non-zero velocity the strip is
   *  left permanently fast. Under Lenis the lerp decays to ~0 before it stops
   *  emitting, so this almost never fires — it exists for native scroll and for
   *  a scroll that is interrupted by a tap. */
  idleResetSeconds: 0.35,

  /** The whole time the strip is anywhere near the viewport. Not a reveal
   *  window: there is no progress-0 and progress-1 state to author, which is
   *  why §B.2 files the marquee as micro rather than scrub-no-pin. */
  start: 'top bottom',
  end: 'bottom top',
}

/* ------------------------------------------------------------------------- */
/* PRESS — component-level micro-interaction                                 */
/* ------------------------------------------------------------------------- */

/**
 * Framer Motion press physics for the header CTA.
 *
 * BYTE-IDENTICAL to the object in Hero.jsx (lines 31-35). §3.5: "do not have
 * two different CTA feels on one page." This is the sanctioned replacement for
 * legacy's `.mag` magnetic-cursor effect (index.html:2609-2627), which the Hero
 * already dropped — components.css §6 states the rule: "If you use Framer
 * Motion, drop .mag — FM sets will-change." So the header CTA renders as
 * `class="cta"`, not `class="cta mag"`, and `.mag { will-change: transform }`
 * (the one base-rule will-change offender §C.7 names) never applies to it.
 *
 * ⚠️ DUPLICATION, DELIBERATE, TRACKED: this is the second copy of these four
 * numbers. It cannot be the shared one — lifting it would mean editing
 * Hero.jsx or adding a file to src/lib, both outside this component's
 * directory. See integrationNotes: the follow-up is one shared module that
 * both import.
 */
export const PRESS = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 420, damping: 30 },
}

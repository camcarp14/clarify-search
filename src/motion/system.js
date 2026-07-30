/**
 * ============================================================================
 * CLARIFY MOTION SYSTEM — the shared physics
 * ============================================================================
 * One set of eases, beats, staggers, travels and pin lengths for the whole
 * site. Twelve sections import from here. If two sections need the same
 * gesture to feel the same, the number lives in this file, not in both.
 *
 * WHAT BELONGS HERE
 *   - anything two or more sections share
 *   - anything that defines "how Clarify moves"
 *
 * WHAT BELONGS IN <section>.motion.js
 *   - that section's storyboard beat boundaries (start/end in progress units)
 *   - that section's pin length, if it pins
 *   - that section's counters, item counts, section-specific distances
 *
 * READ hero.motion.js FIRST. It is the worked example and its header explains
 * why staggers are in progress units rather than milliseconds.
 * ============================================================================
 */

/* These three imports exist for `setIf`, `refreshSoon`, `pinnedTrigger` and
 * `scrubbedTrigger` only. This module must NOT call gsap.registerPlugin —
 * sections do that, because a section that forgets is a bug the section
 * should own. Nothing below runs at import time: this file is constants plus
 * pure functions, so it is safe to import during SSR / prerender. */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DEBUG } from '../lib/motionDebug.js'

/** Milliseconds a brisk scroll takes to cross one full progress unit.
 *  PINNED sections: a 250vh pin at a 900px viewport ≈ 2200ms end to end.
 *  Use this to sanity-check a stagger you are about to write:
 *      0.055 units × 2200ms ≈ 120ms per line.  */
export const REFERENCE_TRAVERSAL_MS = 2200

/** Same conversion for a scrub-no-pin section using the standard window
 *  (§SCRUB_WINDOW). The element crosses ~0.9 viewport of scroll, so the same
 *  progress unit is spent about 2.4× faster. A stagger that reads as a
 *  deliberate cascade in a pin reads as a quick ripple here — which is what a
 *  workhorse section should feel like. */
export const REFERENCE_TRAVERSAL_MS_NOPIN = 900

/* ------------------------------------------------------------------------- */
/* MEDIA                                                                      */
/* ------------------------------------------------------------------------- */

/** 900px is already the hero's breakpoint (hero.motion.js MOBILE_QUERY /
 *  DESKTOP_QUERY). It is NOT the same as the legacy CSS breakpoints (760px /
 *  1080px / 1240px). Keep them separate on purpose: the CSS breakpoints are
 *  about layout reflow, this one is about which storyboard runs. Changing this
 *  changes which sections pin. Changing a CSS breakpoint does not. */
export const MEDIA = {
  mobile: '(max-width: 899px)',
  desktop: '(min-width: 900px)',
  reduced: '(prefers-reduced-motion: reduce)',
  motionOK: '(prefers-reduced-motion: no-preference)',
}

/** Pass this object straight into gsap.matchMedia().add(). Every section uses
 *  the same three condition keys, so a reviewer can read any section's effect
 *  and know exactly which branch is which. */
export const CONDITIONS = {
  isDesktop: `${MEDIA.desktop} and ${MEDIA.motionOK}`,
  isMobile: `${MEDIA.mobile} and ${MEDIA.motionOK}`,
  isReduced: MEDIA.reduced,
}

/* ------------------------------------------------------------------------- */
/* EASES                                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Named by INTENT, not by curve. A builder should be choosing "this is an
 * exit under gravity", not "this is power2.in". When the site's feel gets
 * retuned, one curve changes here and every exit on the site follows.
 *
 * Every curve below is already in use in Hero.jsx. Nothing new was invented —
 * that is the point. The hero IS the physics.
 */
export const EASE = {
  /** Primary entrance. Hero headline mask + hero resolve copy.
   *  Fast start, long tail — reads as "arriving", not "sliding". */
  reveal: 'power3.out',

  /** Long A→B repositioning. Hero chip convergence.
   *  Symmetric in/out so the object appears to have mass and to be *moved*
   *  rather than to have appeared. Use for anything crossing real distance. */
  travel: 'power2.inOut',

  /** Late, soft resolution. Hero green-chip tighten.
   *  Slower to leave and slower to arrive than `travel`. Use for the last
   *  repositioning in a sequence, so the frame settles instead of stopping. */
  settle: 'power3.inOut',

  /** Near-linear. Hero chip colour cross-fade.
   *  Cross-fades between stacked colour layers must be near-linear or the
   *  midpoint goes muddy — both layers sit at ~0.7 opacity at once and the
   *  colour reads as neither. power1.out is the least-wrong compromise. */
  tint: 'power1.out',

  /** Accelerating exit. Hero red-chip fall.
   *  Anything leaving the frame downward or being discarded. */
  gravity: 'power2.in',

  /** Punch up (the fast half of an overshoot). Hero colour-flip punch. */
  punchOut: 'power2.out',

  /** Punch down (the settle half of an overshoot). Hero colour-flip settle. */
  punchIn: 'power2.inOut',

  /** NO EASE. Mandatory for anything that is a direct rail on scroll:
   *  parallax, progress hairlines, spine draws, SVG stroke reveals, gauges.
   *  An eased rail feels like input lag, because the pixels stop tracking the
   *  finger. If the user should perceive the element as *attached to* the
   *  scroll, it is 'none'. No exceptions. */
  rail: 'none',

  /** GSAP's twin of the CSS token --e-out: cubic-bezier(.16, 1, .3, 1)
   *  (tokens.css). Use ONLY where a GSAP tween must visually match a CSS
   *  transition on a neighbouring element — e.g. the pricing segmented
   *  control, whose thumb is GSAP but whose card cross-fade is CSS. Using
   *  EASE.reveal there would make the two halves of one interaction
   *  disagree by a few frames, which reads as a bug. */
  cssOut: 'expo.out',

  /** GSAP's twin of --e-spring: cubic-bezier(.34, 1.3, .34, 1). Overshoots.
   *  Reserved for click-driven micro-interaction only — never on a scrub,
   *  because a back-ease on a scrubbed tween makes the element move
   *  *backwards* while the user scrolls forwards, which reads as broken. */
  cssSpring: 'back.out(1.6)',
}

/* ------------------------------------------------------------------------- */
/* BEATS — how much of a timeline one gesture occupies (progress units)       */
/* ------------------------------------------------------------------------- */

/**
 * Derived directly from the hero storyboard, whose windows are
 *   headline 0.25 | converge 0.25 | colour 0.20 | cull 0.15 | resolve 0.15
 *
 * A section's beats must sum to 1.0 (they are progress units across the whole
 * scrubbed timeline). Overlapping beats are fine and usually better —
 * see hero cull, where the green tighten starts 0.03 into the red fall.
 */
export const BEAT = {
  /** Punctuation. A stamp, a badge landing, a single word cross-fading.
   *  Below ~0.06 a gesture is imperceptible at scrub speed. */
  xs: 0.08,
  /** A short move: copy masking up, a counter finishing, a row entering. */
  sm: 0.15,
  /** A medium move: a colour pass, a set of cards arriving. */
  md: 0.2,
  /** A major move: the headline, a full repositioning of the frame. */
  lg: 0.25,
  /** The dominant gesture in a section that has only two or three beats.
   *  Above ~0.4 a single gesture outstays its welcome even in a pin. */
  xl: 0.35,
}

/* ------------------------------------------------------------------------- */
/* STAGGER (progress units)                                                   */
/* ------------------------------------------------------------------------- */

/**
 * TWO FORMS, AND CHOOSING WRONG IS THE MOST COMMON BUG IN THIS BUILD:
 *
 *   each   — per item. Total spread = each × (n - 1). Use when n ≤ 6 AND n is
 *            fixed by the design. Four method steps: use `each`.
 *   amount — TOTAL spread shared across all items, whatever n is. Use when
 *            n > 6, or when n comes from data. Nine FAQ rows, 40 hero chips:
 *            use `amount`. With `each` at 0.030, nine rows would occupy 0.24
 *            of the timeline and blow through their beat.
 */
export const STAGGER = {
  each: {
    /** ≈40ms at pin traversal. Items that should read as one object
     *  arriving with texture, not as a sequence. */
    tight: 0.018,
    /** ≈66ms. The default card-to-card cascade. Three or four cards. */
    base: 0.03,
    /** ≈120ms. Hero headline line stagger. Deliberate, readable, one-at-a-time.
     *  Reserve for text lines and for sequences the user is meant to COUNT. */
    loose: 0.055,
  },
  amount: {
    /** Hero cull. A quick collective ripple. */
    tight: 0.05,
    /** Hero colour pass. */
    base: 0.09,
    /** Hero converge. The widest spread that still reads as one event. */
    loose: 0.14,
  },
  /** Grid-aware origins for `stagger: { from }`. Hero converge uses 'center'
   *  so the field orders itself outward from where the eye already is. */
  from: {
    centre: 'center',
    start: 'start',
    end: 'end',
    edges: 'edges',
  },
}

/* ------------------------------------------------------------------------- */
/* TRAVEL — how far things move                                               */
/* ------------------------------------------------------------------------- */

/**
 * MOBILE VALUES ARE AUTHORED, NOT COMPUTED. You may not write
 * `TRAVEL.card.desktop * 0.6` anywhere. The mobile numbers below happen to sit
 * near 60-65% of desktop, but that is an observation, not a rule — and the day
 * one of them needs to be 0.9 the ratio must not be load-bearing.
 *
 * WHY BIGGER OBJECTS TRAVEL FURTHER: perceived speed is displacement relative
 * to the object's own size. A 400px-tall panel that moves 18px reads as a
 * twitch. An 18px line of copy that moves 64px reads as a launch. The
 * three tiers below keep perceived speed constant across object sizes.
 *
 * UNITS ARE PIXELS unless the name says otherwise. Pixels, not vh, because
 * these are *object-relative* distances and should not grow on a 4K monitor.
 * Anything that should scale with the viewport is a function-based value in
 * the section (`y: () => 0.12 * window.innerHeight`) — see §C.4.
 */
export const TRAVEL = {
  /** Body copy, labels, list items, small chips.
   *  18px is already shipped: hero.motion.js seq.resolve.copyFromY = 18. */
  copy: { desktop: 18, mobile: 14 },

  /** A card, an article, a step, a price tile. */
  card: { desktop: 34, mobile: 22 },

  /** A full panel, a figure, a mock, a form card. The heaviest objects. */
  panel: { desktop: 64, mobile: 32 },

  /** Percentage of the element's OWN height, for masked line reveals.
   *  110 (not 100) so the line clears its mask edge completely — at 100 a
   *  descender can peek below the mask on a subpixel boundary.
   *  Already shipped: hero.motion.js seq.headline.fromYPercent = 110. */
  maskYPercent: 110,

  /** Percentage of the element's own height, for depth parallax.
   *  ALWAYS paired with EASE.rail. Kept small: above ~15% the element
   *  visibly detaches from the page and the layout reads as broken rather
   *  than as depth. */
  parallax: { desktop: 12, mobile: 6 },

  /** Lateral separation for "two things become one" gestures
   *  (Diagnosis silos, Coverage panels). Expressed in px so it does not
   *  overshoot the gutter on a narrow desktop window. */
  converge: { desktop: 72, mobile: 28 },
}

/* ------------------------------------------------------------------------- */
/* SCALE                                                                      */
/* ------------------------------------------------------------------------- */

export const SCALE = {
  /** Overshoot on a state flip. Hero colour-code punch.
   *  1.09 is large enough to read at 40 small chips; on a full-width panel
   *  use `punchSoft`. */
  punch: 1.09,
  /** Overshoot for large objects. 1.09 on a 600px card is a 54px growth and
   *  reads as a zoom, not a punch. */
  punchSoft: 1.025,
  /** Fraction of the punch window spent going UP. Hero: 0.4 — fast up, slow
   *  settle. Reversing this reads as a bounce, which is a different feeling. */
  punchSplit: 0.4,
  /** Start scale for an object arriving. Just under 1 — the object reads as
   *  approaching, not as a modal appearing. Below ~0.9 it reads as a popup. */
  riseFrom: 0.96,
  /** Start scale for an object landing from "closer" — a stamp, a seal. */
  stampFrom: 1.04,
}

/* ------------------------------------------------------------------------- */
/* PIN LENGTHS                                                                */
/* ------------------------------------------------------------------------- */

/**
 * These are the extra scroll distance the section holds the viewport for,
 * in vh. In a ScrollTrigger `end` string, "%" means share of VIEWPORT height,
 * so `end: '+=220%'` is 220vh. (This trips people up — in `start`/`end`
 * position strings "%" usually means share of the *element*.)
 *
 * FLOOR: below ~140vh desktop / ~100vh mobile a pin reads as a stutter — the
 * page appears to snag and then release. That is worse than not pinning. If a
 * section's storyboard fits in less than that, it does not want a pin; demote
 * it to scrub-no-pin.
 *
 * CEILING: above ~260vh the user starts checking whether the page is broken.
 * The hero gets 250 because it is the first thing they see and they have not
 * yet spent any patience.
 *
 * MOBILE IS ~60-66% OF DESKTOP, AUTHORED. Thumb-scroll moves a much larger
 * fraction of a short viewport per gesture, so the same vh number costs the
 * user far more flicks. Also: the URL bar collapse changes vh mid-pin
 * (see §D.10).
 */
/* All PIN lengths are in vh, and are keyed { desktop, mobile } — the SAME
 * shape as TRAVEL — so `pick(PIN.feature, isMobile)` works. An earlier draft
 * keyed these { desktopVh, mobileVh }; pick() returned undefined, which became
 * `end: '+=undefined%'` and silently collapsed the pin at scroll time rather
 * than failing the build. If you add a pair here, match this shape. */
export const PIN = {
  /** Hero only. Already shipped in hero.motion.js — duplicated here so the
   *  budget is visible in one place. Do not diverge these two. */
  hero: { desktop: 250, mobile: 165 },

  /** A five-or-six-beat set-piece. 220vh gives each beat ~40vh, which is
   *  roughly two wheel notches — enough to read a beat, not enough to get
   *  bored inside one. */
  feature: { desktop: 220, mobile: 150 },

  /** A three-or-four-beat set-piece. */
  compact: { desktop: 160, mobile: 110 },

  /** Seconds of catch-up smoothing. 1 is the hero's shipped value and is
   *  right for a pin: the page is frozen, so a long lerp reads as weight
   *  rather than as lag. */
  scrub: 1,

  /** Lets ScrollTrigger pre-empt the pin so a fast flick does not flash an
   *  unpinned frame. Hero's shipped value. */
  anticipatePin: 1,
}

/* ------------------------------------------------------------------------- */
/* SCRUB WINDOWS — the scrub-no-pin standard                                  */
/* ------------------------------------------------------------------------- */

/**
 * THIS IS THE ANTI-FADE-IN CONSTANT. Nine of twelve sections use it, so if it
 * is wrong the whole site is wrong.
 *
 * start 'top 85%'   — the section's top must reach 85% down the viewport
 *                     before anything moves. That 15% of lead-in keeps the
 *                     section from starting while the *previous* section is
 *                     still the subject of the frame.
 *
 * end 'bottom 55%'  — the timeline COMPLETES when the section's bottom passes
 *                     just above the vertical centre. Deliberate: the section
 *                     finishes resolving while it is still centred, so the
 *                     user reads the finished composition. Ending at
 *                     'bottom top' would mean the last beat plays as the
 *                     section leaves and nobody ever sees the final frame.
 *
 * Window length for a viewport-tall section ≈ 0.9 viewport of scroll. That is
 * comfortably above the ~0.35-viewport floor at which a scrub degenerates into
 * a snap.
 *
 * scrub 0.6 (not 1) — the element is translating with the page AND animating.
 * A 1-second catch-up on top of that reads as the section lagging the scroll.
 * 0.6 keeps the smoothing without the drag. Pins keep 1 because the page is
 * frozen underneath them.
 */
/**
 * BOTH EDGES ARE MEASURED FROM THE SECTION'S TOP, on purpose.
 *
 * The first version ended at 'bottom 55%', which makes the window length depend
 * on how tall the section is. For the 854px Method section in a 1000px viewport
 * that put progress 1 at the moment its top sat 304px ABOVE the viewport — so
 * the last of four staggered cards finished revealing as the section scrolled
 * away, and a reader going at a normal pace saw empty cards. Measured: at the
 * moment the section's top reached the viewport top, card 04's children were
 * still at opacity 0.55 / 0.16 / 0.16 / 0.
 *
 * Anchoring both edges to the top makes the window a fixed 65% of a viewport of
 * scroll whatever the section's height, so a four-card row and a nine-row FAQ
 * reveal at the same rate, and everything has landed while the section is still
 * prominently in view.
 */
export const SCRUB_WINDOW = {
  desktop: { start: 'top 90%', end: 'top 25%' },
  /** Mobile sections are far taller because everything stacks, and a thumb
   *  covers more screen per gesture — so the window is shorter still. */
  mobile: { start: 'top 94%', end: 'top 40%' },
  scrub: 0.6,
}

/** For short elements (footer, a strip, a note) where the standard window
 *  would be longer than the element and therefore feel dead. */
/**
 * The window for what used to be the three PINNED set-pieces.
 *
 * They no longer pin. A pinned scrub is tied to the scroll position in both
 * directions by definition — scroll up and the sequence rewinds, which is the
 * "record on a turntable" behaviour being removed. Latching a pin instead is
 * worse: the viewport stays held for one to two screens while nothing moves.
 *
 * So they are ordinary sections with a long, monotonic window. It is wider than
 * SCRUB_WINDOW because these carry four or five beats rather than one reveal,
 * and each beat still needs enough scroll to read.
 */
export const SET_PIECE_WINDOW = {
  desktop: { start: 'top 88%', end: 'bottom 25%' },
  mobile: { start: 'top 94%', end: 'bottom 45%' },
  scrub: 0.6,
}

export const SCRUB_WINDOW_SHORT = {
  desktop: { start: 'top 95%', end: 'top 45%' },
  mobile: { start: 'top 97%', end: 'top 60%' },
  scrub: 0.5,
}

/* ------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Keep a tween inside its authored window once its stagger spread is counted.
 *
 * A staggered tween occupies duration + staggerSpan on the timeline, NOT
 * duration. Writing `duration: BEAT.md` with a 0.09 stagger gives you a 0.29
 * gesture in a 0.20 window, and it silently eats the next beat.
 *
 * Lifted verbatim from Hero.jsx so all twelve use one implementation.
 *
 *   duration: fit(BEAT.md, STAGGER.amount.base)
 *   duration: fit(BEAT.sm, (items.length - 1) * STAGGER.each.base)
 */
export const fit = (windowLen, staggerSpan, min = 0.04) =>
  Math.max(windowLen - staggerSpan, min)

/**
 * gsap.set() on an empty array logs "GSAP target not found". That fires on
 * legitimate happy paths (a breakpoint where a list is empty), and a warning
 * that fires when nothing is wrong trains you to ignore the console.
 * Lifted verbatim from Hero.jsx.
 */
export const setIf = (targets, vars) => {
  const list = Array.isArray(targets) ? targets.filter(Boolean) : targets
  if (list && (!Array.isArray(list) || list.length)) gsap.set(list, vars)
}

/**
 * Pick the breakpoint's value out of a { desktop, mobile } pair.
 * Exists so that `TRAVEL.card.desktop * 0.6` never gets written.
 *
 *   const y = pick(TRAVEL.card, isMobile)
 */
export const pick = (pair, isMobile) => (isMobile ? pair.mobile : pair.desktop)

/**
 * Coalesced ScrollTrigger.refresh().
 *
 * Twelve sections each calling refresh() on mount is twelve full layout
 * recalculations of a ~15,000px document in one frame. Worse, three of those
 * mounts insert pin-spacer divs, so the refreshes are not idempotent — each
 * one measures a document the next one is about to change.
 *
 * Every section calls refreshSoon(). It fires once, on the next frame, after
 * the last caller.
 */
let _refreshRaf = 0
export const refreshSoon = () => {
  if (_refreshRaf) return
  _refreshRaf = requestAnimationFrame(() => {
    _refreshRaf = 0
    ScrollTrigger.refresh()
  })
}

/**
 * Canonical config for a SET-PIECE section — the ones that used to pin.
 *
 * Keeps the same call signature (`pinTarget` and `vh` are accepted and ignored)
 * so the sections that call it did not have to change. It no longer pins and it
 * never runs backwards: `advance()` ratchets the playhead forward only, exactly
 * as it does for every other section.
 *
 * `document.documentElement.dataset.pinned` is consequently never set any more.
 * The Header reads it to suppress its hide-on-scroll during a pin; with no pins
 * that guard is simply always false, which is correct.
 */
export const pinnedTrigger = ({ trigger, root, isMobile, extra = {} }) => {
  const { onToggle: sectionToggle, onUpdate: sectionUpdate, ...rest } = extra
  const win = SET_PIECE_WINDOW
  return {
    trigger,
    start: isMobile ? win.mobile.start : win.desktop.start,
    end: isMobile ? win.mobile.end : win.desktop.end,
    toggleActions: 'none none none none',
    invalidateOnRefresh: true,
    markers: DEBUG,
    onUpdate: (self) => {
      advance(self)
      if (sectionUpdate) sectionUpdate(self)
    },
    onRefresh: (self) => advance(self),
    onToggle: (self) => {
      if (root) root.classList.toggle('is-live', self.isActive)
      if (sectionToggle) sectionToggle(self)
    },
    ...rest,
  }
}

/**
 * Canonical scrubbed number readout. §B.13 #4 makes one implementation a
 * cross-section mandate — Diagnosis (48h, 12→0), Pricing (299/599/750/149),
 * AI Build (11.4 / 94 / 2) and the scorecard ring (0→72) all animate numbers.
 *
 * It exists because the pattern builders would otherwise copy — Hero.jsx's
 * inline `Math.round(readout.v)` — is wrong for any non-integer target and
 * would ship "11" where the copy says "11.4". Pass `decimals` explicitly.
 *
 * Usage:
 *   const c = counter({ el: ref.current, to: 11.4, decimals: 1, suffix: 'x' })
 *   tl.fromTo(c.readout, c.from, { ...c.to, duration, ease,
 *                                  immediateRender: false }, at)
 * Reduced motion:
 *   c.set(11.4)   // writes the final string, no tween
 *
 * `el` is read at call time, so build it inside the matchMedia callback where
 * the ref is populated — not during render.
 */
export const counter = ({
  el,
  to,
  from = 0,
  decimals = 0,
  prefix = '',
  suffix = '',
  /** Thousands separators. Pricing needs "1,099". */
  group = false,
  /** Full override: (formattedString, rawNumber) => string */
  format,
} = {}) => {
  const readout = { v: from }

  const render = (n) => {
    const fixed = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))
    const shown = group ? fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : fixed
    return format ? format(shown, n) : `${prefix}${shown}${suffix}`
  }

  const write = () => {
    if (el) el.textContent = render(readout.v)
  }

  return {
    readout,
    from: { v: from },
    to: { v: to, onUpdate: write },
    write,
    /** Jump straight to a value and paint it. */
    set: (v = to) => {
      readout.v = v
      write()
    },
  }
}

/**
 * Canonical ScrollTrigger config for a SCRUB-NO-PIN section.
 */
/**
 * How far each section's timeline has ever been advanced. Keyed by the
 * timeline, so it survives everything except a full teardown.
 */
const PEAK = new WeakMap()

/**
 * Advance a section's timeline to the scroll position — FORWARDS ONLY.
 *
 * A plain `scrub` ties the timeline to the scroll position in both directions,
 * so scrolling back up un-reveals everything you just read and scrolling down
 * again replays it. That is the behaviour being removed: once a section has
 * revealed, it stays revealed.
 *
 * This keeps the reveal genuinely scroll-driven — progress still tracks the
 * scroll position, so it is not a fade-in-on-enter — it simply refuses to go
 * backwards. Lenis already lerps the scroll position, so setting progress
 * directly each frame reads as smooth without a second layer of smoothing.
 */
const advance = (self) => {
  const tl = self.animation
  if (!tl) return
  const peak = PEAK.get(tl) || 0
  if (self.progress <= peak) return
  PEAK.set(tl, self.progress)
  tl.progress(self.progress)
}

/**
 * Canonical ScrollTrigger config for a SCRUB-NO-PIN section.
 *
 * `toggleActions: 'none none none none'` is load-bearing: without a `scrub`,
 * ScrollTrigger would otherwise play the timeline straight through on enter,
 * and the playhead is driven by advance() instead.
 */
export const scrubbedTrigger = ({
  trigger,
  root,
  isMobile,
  window: win = SCRUB_WINDOW,
  extra = {},
}) => {
  const { onToggle: sectionToggle, onUpdate: sectionUpdate, ...rest } = extra
  return {
    trigger,
    start: isMobile ? win.mobile.start : win.desktop.start,
    end: isMobile ? win.mobile.end : win.desktop.end,
    toggleActions: 'none none none none',
    invalidateOnRefresh: true,
    markers: DEBUG,
    onUpdate: (self) => {
      advance(self)
      if (sectionUpdate) sectionUpdate(self)
    },
    // A refresh re-measures the trigger; re-assert so a resize cannot drop a
    // section back to a state the reader has already scrolled past.
    onRefresh: (self) => advance(self),
    onToggle: (self) => {
      root.classList.toggle('is-live', self.isActive)
      if (sectionToggle) sectionToggle(self)
    },
    ...rest,
  }
}

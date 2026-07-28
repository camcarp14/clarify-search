import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as SmoothScroll from '../../lib/SmoothScroll'
import { CONDITIONS, pick, refreshSoon, setIf } from '../../motion/system'
import { MOTION, PRESS } from './siteHeader.motion'
import { DEBUG } from '../../lib/motionDebug'
import './SiteHeader.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * TODO(integration) — ONE LINE IS NEEDED IN src/lib/SmoothScroll.jsx.
 *
 * The shell must route anchor clicks through Lenis (§5.4, §D.4): CSS
 * `scroll-behavior: smooth` is dead under Lenis (base.css forces
 * `.lenis.lenis-smooth { scroll-behavior: auto !important }`) and Lenis ignores
 * `scroll-padding-top`, so a native `href="#faq"` hard-jumps and lands
 * underneath the fixed header — often INSIDE a pin, which then immediately
 * scrubs the user somewhere else.
 *
 * SmoothScroll.jsx currently only exposes the instance as `window.__lenis`, and
 * only under DEBUG. Reading a debug global is not an API. What is needed:
 *
 *     export const LenisContext = createContext(null)
 *     export const useLenis = () => useContext(LenisContext)
 *     // …and SmoothScroll returns
 *     //   <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
 *     // with `lenis` held in useState so the provider re-renders once the
 *     // instance exists (and stays null under reduced motion, where Lenis is
 *     // never constructed at all).
 *
 * Until that lands, this file imports the module as a NAMESPACE rather than
 * naming the export. A static `import { useLenis }` of an export that does not
 * exist is a module-evaluation error in ESM, not a soft `undefined` — it would
 * take the whole app down rather than degrade. The namespace form falls back to
 * a null-returning hook, which is the exact same code path reduced motion
 * already takes: `lenis` is null, the handler does not preventDefault, and the
 * browser performs its native instant jump — correctly offset, because
 * SiteHeader.css gives every anchor target `scroll-margin-top`.
 *
 * The fallback is created ONCE at module scope, so the hook call below is
 * unconditional and its identity never changes between renders.
 */
const useLenis = SmoothScroll.useLenis ?? (() => null)

/**
 * Primary navigation. Six links, in this exact order (§1.3). The `href`s are
 * the shipping information architecture — §B "Every section's id is
 * load-bearing" — and stay exactly as written even while most of those targets
 * are not ported yet. A click on a missing target is a no-op by design.
 */
const NAV_LINKS = [
  { href: '#coverage', label: 'Search' },
  { href: '#ai-visibility', label: 'AI Answers' },
  { href: '#method', label: 'Method' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#ai-build', label: 'AI Builds' },
  { href: '#faq', label: 'FAQ' },
]

export default function SiteHeader() {
  const headerRef = useRef(null)
  const plateSolidRef = useRef(null)
  const progressRef = useRef(null)
  const navRef = useRef(null)
  const toggleRef = useRef(null)

  /** One piece of state — "is the menu open" — expressed three ways that must
   *  stay in sync (§3.3): `.nav-links.is-open`, `.mobile-toggle.is-open` and
   *  `aria-expanded` on the button. React serialises the boolean to the
   *  strings "true"/"false" for aria-* attributes, matching legacy exactly. */
  const [menuOpen, setMenuOpen] = useState(false)

  /** True at the LAYOUT breakpoint (≤760px), where the nav becomes a fixed
   *  panel. Not the same as the 900px motion breakpoint — §4.9 is explicit
   *  that the two systems stay separate. Populated in an effect, so nothing
   *  touches matchMedia during render (SSR). */
  const [compact, setCompact] = useState(false)

  const lenis = useLenis()

  /* GSAP's onUpdate lives in an effect that runs once, so it cannot close over
   * `menuOpen`. A ref is the only way for it to see the current value without
   * being torn down and rebuilt on every open/close. */
  const menuOpenRef = useRef(false)
  useEffect(() => {
    menuOpenRef.current = menuOpen
  }, [menuOpen])

  /**
   * Cold #hash load — someone opening a shared /#pricing or /#contact link.
   *
   * The browser performs its native jump before React has rendered anything,
   * so there is no target yet and the page settles at the top. Measured: a
   * direct load of /#contact landed at scrollY 0. Legacy had no such problem
   * because its markup was in the HTML.
   *
   * Runs after fonts (SplitText relayouts every H2) and after a frame, so the
   * three pin spacers exist and the target's position is final. `immediate`
   * because animating a 16,000px scroll on page load is disorienting, not
   * cinematic. Fires at most once, so it cannot yank a user who has already
   * started scrolling.
   */
  const didColdJump = useRef(false)
  useEffect(() => {
    if (didColdJump.current) return undefined
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (!id) return undefined

    let cancelled = false
    const jump = () => {
      if (cancelled || didColdJump.current) return
      const target = document.getElementById(id)
      if (!target) return
      if (lenis) lenis.scrollTo(target, { immediate: true })
      else target.scrollIntoView()
    }

    /* Re-assert on every ScrollTrigger refresh until the reader takes over.
     * One jump is not enough: a refresh re-lays the three pins and moves the
     * target underneath us. Measured, a single jump to #contact landed 3,872px
     * short. Disarming on the first real input means this can never fight
     * someone who has already started scrolling. */
    const disarm = () => {
      didColdJump.current = true
      ScrollTrigger.removeEventListener('refresh', jump)
      INPUTS.forEach((t) => window.removeEventListener(t, disarm))
    }
    const INPUTS = ['wheel', 'touchstart', 'keydown', 'pointerdown']
    INPUTS.forEach((t) => window.addEventListener(t, disarm, { passive: true, once: true }))
    ScrollTrigger.addEventListener('refresh', jump)

    const fonts =
      document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
    fonts.then(() => {
      if (!cancelled) gsap.delayedCall(MOTION.nav.coldHashDelaySeconds, jump)
    })
    // Belt and braces: stop re-asserting once the page has settled, so a much
    // later refresh (an image finally decoding) cannot yank a parked reader.
    const settle = gsap.delayedCall(MOTION.nav.coldHashSettleSeconds, disarm)

    return () => {
      cancelled = true
      settle.kill()
      disarm()
    }
  }, [lenis])

  /* ======================================================================= */
  /* MOTION — one gsap.matchMedia(), which owns all cleanup (§A.4 #5)        */
  /* ======================================================================= */

  useEffect(() => {
    const mm = gsap.matchMedia()

    mm.add(CONDITIONS, (ctx) => {
      const { isMobile, isReduced } = ctx.conditions
      const header = headerRef.current
      const solid = plateSolidRef.current
      const bar = progressRef.current
      // All three render unconditionally in one tree, so this is a guard
      // against a torn-down commit, not a real branch. gsap.quickTo on a null
      // target throws rather than warning, unlike gsap.set.
      if (!header || !solid || !bar) return undefined

      /* Classes and data attributes are not GSAP-managed, so matchMedia's
       * revert does not remove them. Everything else created below IS created
       * inside this callback and is therefore reverted for us — no manual
       * kill() loops, no orphaned ScrollTriggers. */
      const cleanup = () => {
        header.classList.remove('is-live')
        if (bar) bar.classList.remove('is-live')
        delete header.dataset.motion
      }

      /* =================================================================
       * REDUCED MOTION — §B.1's reduced-motion paragraph, verbatim:
       * "Solid plate always at opacity 1, no direction hiding, #progress
       * hidden, menu toggles with no transition."
       *
       * No trigger is created at all (§C.8 #1), and every animated target is
       * gsap.set() to its FINAL state explicitly (§C.8 #2) — the CSS default
       * for the solid plate is `opacity: 0`, so "do nothing" would leave the
       * header permanently untinted.
       * ================================================================= */
      if (isReduced) {
        header.dataset.motion = 'reduced'
        setIf(solid, { opacity: MOTION.plate.solidOpacity })
        setIf(header, { yPercent: MOTION.hide.shownYPercent })
        // The hairline is hidden by CSS under reduced motion (legacy already
        // shipped `#progress { display: none }`), but §C.8 #2 says set every
        // animated target regardless — a future stylesheet change must not be
        // able to expose a bar frozen at scaleX(0).
        setIf(bar, { scaleX: MOTION.progress.toScaleX })
        return cleanup
      }

      /* =================================================================
       * FULL MOTION
       * ================================================================= */
      header.dataset.motion = 'full'

      /* ---- 1 · state cross-fade (§B.1 move 1) ----
       * quickTo, not a fresh gsap.to() per toggle: the boundary has no
       * hysteresis (legacy flips at exactly scrollY > 8, and so do we), so a
       * user parked on the threshold would otherwise spawn a tween per wheel
       * notch. quickTo reuses one tween and simply retargets it. */
      const setPlate = gsap.quickTo(solid, 'opacity', {
        duration: MOTION.plate.durationSeconds,
        ease: MOTION.plate.ease,
      })

      /* ---- 2 · direction-aware hide (§B.1 move 2) ---- */
      const setY = gsap.quickTo(header, 'yPercent', {
        duration: MOTION.hide.durationSeconds,
        ease: MOTION.hide.ease,
      })
      const armAfter = pick(MOTION.hide.armAfterPx, isMobile)

      /* Legacy called onScroll() once immediately after registering its
       * listener, and it was load-bearing: it paints the correct state when the
       * browser restores a scroll position on reload, or when the page loads at
       * a #hash. Done BEFORE the trigger exists, deliberately — ScrollTrigger
       * fires onToggle during its first update, and a gsap.set landing AFTER
       * that would be overwritten by the quickTo tween onToggle just started.
       * Setting first means that tween is a no-op (1 → 1) and there is no
       * unrequested 220ms fade on load.
       *
       * The comparison reuses the same constant that builds the trigger's
       * `start` string, so the two boundaries cannot drift apart. */
      const startsScrolled = window.scrollY > MOTION.chrome.thresholdPx
      gsap.set(solid, {
        opacity: startsScrolled
          ? MOTION.plate.solidOpacity
          : MOTION.plate.clearOpacity,
      })
      header.classList.toggle('is-live', startsScrolled)

      /* The tint is a pure function of scroll position, so it is asserted from
       * onUpdate/onRefresh rather than inferred from isActive.
       *
       * onToggle fires only when isActive CHANGES. A single instant jump from
       * the top of the page to the bottom goes inactive → inactive and fires
       * nothing, leaving the plate transparent over the footer. That is not a
       * hypothetical: it is precisely what a cold `/#contact` deep-link does. */
      const applyTint = (scroll) => {
        const tinted = scroll > MOTION.chrome.thresholdPx
        setPlate(tinted ? MOTION.plate.solidOpacity : MOTION.plate.clearOpacity)
        if (!tinted) setY(MOTION.hide.shownYPercent)
        // Drives the will-change discipline (§C.7): "tinted" is exactly the
        // window in which either of the header's channels can move.
        header.classList.toggle('is-live', tinted)
        return tinted
      }

      const chrome = ScrollTrigger.create({
        trigger: document.body,
        // Spans the whole document so onUpdate fires everywhere, rather than
        // only inside a window bounded by the 8px threshold.
        start: 'top top',
        // 'max' — re-resolved from the live maximum on every refresh, and it
        // cannot extend the document the way an explicit overshoot does.
        // See MOTION.chrome.end for the two approaches this replaced.
        end: MOTION.chrome.end,
        invalidateOnRefresh: true,
        markers: DEBUG,

        // Re-assert after any refresh: the three pin spacers change the
        // document under us, and a refresh can land the page at a new scroll.
        onRefresh: (self) => applyTint(self.scroll()),

        onUpdate: (self) => {
          if (!applyTint(self.scroll())) return
          // The menu is an overlay anchored to the header. Sliding its anchor
          // out from under it is not a hide, it is a bug.
          if (menuOpenRef.current) {
            setY(MOTION.hide.shownYPercent)
            return
          }
          // §B.1: suppressed while any pin holds the viewport, because a
          // header sliding away during a pinned set-piece reads as a glitch.
          // `dataset.pinned` is published by system.js's pinnedTrigger.
          if (document.documentElement.dataset.pinned) {
            setY(MOTION.hide.shownYPercent)
            return
          }
          // Never hide in the first screenful — at 9px it reads as a flicker.
          if (self.scroll() < armAfter) {
            setY(MOTION.hide.shownYPercent)
            return
          }
          setY(
            self.direction === 1
              ? MOTION.hide.hiddenYPercent
              : MOTION.hide.shownYPercent,
          )
        },
      })

      /* ---- 3 · #progress hairline (§A.7) ----
       * ONE ScrollTrigger on document.body, scrubbed across the whole
       * document. This replaces legacy's scroll listener + rAF +
       * `progressEl.style.transform = 'scaleX(…)'` (index.html:2512-2524)
       * entirely, and it is the only raw document-length rail on the page.
       *
       * It also fixes a real legacy bug for free: `drawProgress` divided by a
       * `scrollHeight` it re-read every frame but never re-measured against
       * ScrollTrigger's pin spacers, and it clamped only the top
       * (`Math.min(…, 1)` with no `Math.max(0, …)`), so iOS rubber-band
       * overscroll drove scaleX negative. A scrubbed trigger with
       * invalidateOnRefresh is measured by ScrollTrigger and clamped 0-1 by
       * definition. */
      const progress = gsap.fromTo(
        bar,
        { scaleX: MOTION.progress.fromScaleX },
        {
          scaleX: MOTION.progress.toScaleX,
          ease: MOTION.progress.ease,
          scrollTrigger: {
            trigger: document.body,
            start: MOTION.progress.start,
            end: MOTION.progress.end,
            scrub: MOTION.progress.scrub,
            invalidateOnRefresh: true,
            markers: DEBUG,
            onToggle: (self) => bar.classList.toggle('is-live', self.isActive),
          },
        },
      )

      // Console handles while tuning:
      //   window.__shell.chrome.direction   → which way the last scroll went
      //   window.__shell.progress.progress() → where the hairline is
      if (DEBUG) window.__shell = { chrome, progress, st: progress.scrollTrigger }

      return cleanup
    })

    // Coalesced with every other section's refresh (§A.2 refreshSoon). Both of
    // the triggers above are measured against document.body, which is exactly
    // the thing the hero's pin spacer changes after mount (§D.3).
    refreshSoon()

    return () => mm.revert()
  }, [])

  /* ======================================================================= */
  /* LAYOUT BREAKPOINT                                                       */
  /* ======================================================================= */

  /**
   * §5.6: legacy has no close-on-resize, so a menu opened at ≤760px keeps
   * `.is-open` and `aria-expanded="true"` on a button that is now
   * `display: none`. Harmless visually, wrong for assistive tech. Closing on
   * the breakpoint change is the fix.
   */
  useEffect(() => {
    const mq = window.matchMedia(MOTION.nav.compactQuery)
    const sync = () => {
      setCompact(mq.matches)
      if (!mq.matches) setMenuOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  /**
   * ACCESSIBILITY BUG #1, FIXED (flagged in §5.6).
   *
   * The closed panel ships as `opacity: 0; pointer-events: none`, neither of
   * which removes its six links from the tab order. A keyboard user tabs from
   * the brand straight into an invisible menu and loses the page.
   *
   * SiteHeader.css carries the primary fix (`visibility: hidden`, with
   * `visibility` in the transition list so it does not kill the fade). This
   * effect adds `inert` on top, which also removes the subtree from the
   * accessibility tree and blocks pointer events — belt and braces, and the
   * one that matters for screen-reader virtual cursors.
   *
   * Set as a DOM property rather than a JSX attribute: React 18 does not know
   * `inert` and would warn on a boolean. Browsers without `inert` support just
   * get a harmless expando, and the CSS fix still holds.
   */
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    nav.inert = compact && !menuOpen
  }, [compact, menuOpen])

  /* ======================================================================= */
  /* MENU DISMISSAL — all four are deliberate additions over legacy          */
  /* ======================================================================= */

  /**
   * Escape to close, and outside-click to close. Both listeners are registered
   * ONLY while the menu is open, so the page carries no idle handlers.
   * Neither exists in legacy (§3.3 #4); both are listed in §5.6 as the
   * recommended fix and are explicitly requested for this build.
   */
  useEffect(() => {
    if (!menuOpen) return undefined

    const closeAndReturnFocus = () => {
      setMenuOpen(false)
      // Focus must not be left on an element that is about to become
      // `visibility: hidden` — it would fall to <body> and the user would lose
      // their place. The toggle is the disclosure's control, so it is where
      // focus belongs.
      toggleRef.current?.focus({ preventScroll: true })
    }

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return
      closeAndReturnFocus()
    }

    const onPointerDown = (e) => {
      // A press on the toggle is the toggle's job — closing here too would
      // double-fire and immediately reopen.
      if (navRef.current?.contains(e.target)) return
      if (toggleRef.current?.contains(e.target)) return
      const focusWasInside = navRef.current?.contains(document.activeElement)
      setMenuOpen(false)
      if (focusWasInside) toggleRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [menuOpen])

  /**
   * ACCESSIBILITY BUG #2, FIXED (flagged in §5.6: "focus is never moved into
   * the panel on open").
   *
   * The nav precedes `.nav-actions` in the DOM, so the panel's links sit BEFORE
   * the toggle in tab order. Opening the menu and pressing Tab therefore skips
   * every link the user just revealed and lands in the page behind it. Moving
   * focus to the first link on open makes the disclosure actually operable, and
   * pairs with the focus return on close.
   */
  useEffect(() => {
    if (!menuOpen) return
    // The panel is position:fixed, so this cannot scroll the page — but
    // preventScroll costs nothing and removes the possibility.
    navRef.current?.querySelector('a')?.focus({ preventScroll: true })
  }, [menuOpen])

  /**
   * Scroll lock while the panel is open (§5.6). Lenis is asked to stop rather
   * than fighting it with `body { overflow: hidden }` — base.css already ships
   * `.lenis.lenis-stopped { overflow: hidden }` for exactly this.
   *
   * The class is the fallback for the paths where Lenis does not exist:
   * reduced motion (SmoothScroll returns early) and the window before the
   * useLenis export lands. Scoped to ≤760px in CSS so it can never introduce a
   * desktop scrollbar-width layout shift.
   */
  useEffect(() => {
    if (!menuOpen) return undefined
    const root = document.documentElement
    root.classList.add('is-nav-locked')
    lenis?.stop()
    return () => {
      root.classList.remove('is-nav-locked')
      lenis?.start()
    }
  }, [menuOpen, lenis])

  /* ======================================================================= */
  /* ANCHOR ROUTING (§5.4, §D.4)                                             */
  /* ======================================================================= */

  /**
   * The offset that reproduces legacy's `scroll-padding-top` (92px desktop,
   * 80px at ≤760px). Read from the live CSS custom properties rather than
   * duplicated as a JS constant, so the number the header is laid out with and
   * the number anchors are offset by cannot drift. MOTION carries fallbacks for
   * the case where the stylesheet has not applied yet.
   */
  const anchorOffset = () => {
    const cs = getComputedStyle(document.documentElement)
    const isCompact = window.matchMedia(MOTION.nav.compactQuery).matches
    const h =
      parseFloat(cs.getPropertyValue('--nav-h')) ||
      pick(MOTION.nav.heightFallbackPx, isCompact)
    const gap =
      parseFloat(cs.getPropertyValue('--nav-gap')) ||
      pick(MOTION.nav.gapFallbackPx, isCompact)
    return h + gap
  }

  /**
   * One delegated behaviour for the brand, the six nav links and the header
   * CTA. Returns true if it handled the click.
   *
   * Three no-op paths, all deliberate:
   *   - not a hash link            → let the browser navigate
   *   - target not in the document → §2.3, most sections are not ported yet.
   *                                  Falling through sets the hash and does
   *                                  nothing visible, which is the same
   *                                  no-op legacy produced.
   *   - no Lenis                   → reduced motion, where SmoothScroll never
   *                                  constructs an instance. The browser's
   *                                  native jump is CORRECT there (legacy's own
   *                                  reduced-motion rule was
   *                                  `scroll-behavior: auto`), and
   *                                  `scroll-margin-top` in SiteHeader.css
   *                                  keeps it clear of the fixed header.
   */
  const goToHash = (e) => {
    const href = e.currentTarget.getAttribute('href')
    if (!href || href.charAt(0) !== '#' || href.length < 2) return false

    const target = document.getElementById(href.slice(1))
    if (!target) return false
    if (!lenis) return false

    e.preventDefault()
    // NO `offset` here on purpose. Lenis already honours the target's
    // `scroll-margin-top`, which SiteHeader.css sets to
    // calc(var(--nav-h) + var(--nav-gap)) on every anchor target. Passing the
    // offset as well applied the clearance TWICE — measured: #pricing landed
    // 185px down instead of 92px. Keeping it in CSS also means the smooth path,
    // the reduced-motion native jump and a cold #hash load all share one
    // number, so they cannot drift apart.
    lenis.scrollTo(target)
    // Legacy updated the hash (default anchor behaviour); preserve that.
    // pushState rather than assigning location.hash, which would trigger a
    // second, native, un-offset jump.
    window.history.pushState(null, '', href)
    return true
  }

  /** Brand and header CTA: scroll only. */
  const onAnchorClick = (e) => {
    goToHash(e)
  }

  /**
   * Nav links: scroll, then close. Legacy closed the menu on any click whose
   * `e.target.tagName === 'A'` inside `#navLinks`; a per-link onClick is an
   * exact equivalent (§3.3 #3) and preserves the detail that clicking the
   * nav's own padding does NOT close it.
   */
  const onNavLinkClick = (e) => {
    goToHash(e)
    if (!menuOpen) return
    setMenuOpen(false)
    // The clicked link is about to become visibility:hidden. Hand focus back
    // to the control that opened it rather than letting it fall to <body>.
    toggleRef.current?.focus({ preventScroll: true })
  }

  /**
   * The skip link is NOT routed like the others. Its whole job is to move
   * FOCUS, and a smooth scroll that does not move focus is a broken skip link.
   * So: focus first, then jump instantly (`immediate: true` — a skip link
   * should never be animated), and only then update the hash.
   *
   * §3.8 recommends `tabindex="-1"` on `<main>` so focus actually lands on the
   * element rather than on the document. `<main>` belongs to App.jsx, so this
   * sets the attribute defensively at click time and integrationNotes asks for
   * it in the markup.
   */
  const onSkipClick = (e) => {
    const main = document.getElementById('main')
    if (!main) return
    e.preventDefault()
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
    main.focus({ preventScroll: true })
    // No explicit offset — see goToHash: Lenis applies scroll-margin-top itself
    // and passing both double-counts the header clearance.
    if (lenis) lenis.scrollTo(main, { immediate: true })
    else main.scrollIntoView()
    window.history.pushState(null, '', '#main')
  }

  /* ======================================================================= */
  /* MARKUP — tree and copy verbatim from §2.2 / §1                          */
  /* ======================================================================= */

  return (
    <>
      {/* §A.7. Decorative, hidden from assistive tech, no `progressbar` role —
          it is chrome, not a status indicator. Styled by an id selector
          (#progress, z-index 400) because everything on the page sits below
          it, including the header. */}
      <div id="progress" aria-hidden="true" ref={progressRef} />

      {/* The first focusable element in the document, even though a div
          precedes it in source order (it contains nothing focusable). */}
      <a className="skip-link" href="#main" onClick={onSkipClick}>
        Skip to content
      </a>

      <header className="site-header" id="siteHeader" ref={headerRef}>
        {/* Two stacked backdrop plates, cross-faded on opacity (§B.1 move 1).
            The clear plate is the identity layer: it carries the same box and
            the same transparent border as the solid one so the two are
            metrically identical, which is what keeps a cross-fade from
            shimmering (§A.4 #2). It renders nothing today; it exists so the
            pattern is explicit in the markup and so an unscrolled wash has
            somewhere to live. */}
        <span
          className="site-header__plate site-header__plate--clear"
          aria-hidden="true"
        />
        <span
          className="site-header__plate site-header__plate--solid"
          aria-hidden="true"
          ref={plateSolidRef}
        />

        {/* Two classes on one element: .shell is the width container (owned by
            components.css), .nav is the flex row. */}
        <div className="shell nav">
          <a
            className="brand"
            href="#top"
            aria-label="Clarify Search home"
            onClick={onAnchorClick}
          >
            {/* Both empty: the mark and the rule are drawn entirely in CSS
                with ::before / ::after and gradients. */}
            <span className="brand-symbol" aria-hidden="true" />
            <span className="brand-divider" aria-hidden="true" />
            <span className="brand-wordmark">
              {/* Source text is mixed case; CSS does the uppercasing. */}
              <span className="brand-name">Clarify</span>
              <span className="brand-subtitle">Search</span>
            </span>
          </a>

          {/* Bare <a> children of <nav>, no <ul>/<li> — the panel's
              `border-bottom` styling and `a:last-child { border-bottom: 0 }`
              depend on the anchors being direct children (§2.2).
              No aria-current and no scroll-spy: legacy never highlights the
              active section and §2.2 says not to add one.
              The three panel numbers come from MOTION and are handed to CSS as
              custom properties — same technique Hero.jsx uses for per-chip
              drift — so the transition stays a CSS micro-interaction while its
              values stay tunable in one place. */}
          <nav
            className={`nav-links${menuOpen ? ' is-open' : ''}`}
            id="navLinks"
            ref={navRef}
            aria-label="Primary navigation"
            style={{
              '--panel-y': `${MOTION.panel.fromYPercent}%`,
              '--panel-slide': `${MOTION.panel.slideSeconds}s`,
              '--panel-fade': `${MOTION.panel.fadeSeconds}s`,
            }}
          >
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={onNavLinkClick}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            {/* U+00B7 MIDDLE DOT, a single ASCII space either side. */}
            <span className="nav-price">Free check · audits from $299</span>

            {/* `class="cta mag"` in legacy. `.mag` is dropped: Framer Motion
                owns this element's transform channel now, and two owners of one
                channel is a fight nobody wins. Identical PRESS physics to the
                hero's CTAs. U+2192 RIGHTWARDS ARROW, one space before it. */}
            <motion.a
              className="cta"
              href="#pricing"
              onClick={onAnchorClick}
              {...PRESS}
            >
              Free leak check →
            </motion.a>

            {/* No text content — the three empty spans are the hamburger bars,
                and their `translateY(±6px) rotate(±45deg)` geometry assumes
                exactly 2px tall spans with 4px vertical margins. */}
            <button
              className={`mobile-toggle${menuOpen ? ' is-open' : ''}`}
              id="mobileToggle"
              type="button"
              ref={toggleRef}
              aria-expanded={menuOpen}
              aria-controls="navLinks"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  CONDITIONS,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { FOOTER_MOTION } from './contact.motion'
import { DEBUG } from '../../lib/motionDebug'
import { FOOTER, mailtoHref, useEmailAddress } from './contactData'
import './Footer.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * SITE FOOTER — micro tier (§B.12).
 *
 * "The footer must not be the last thing that PERFORMS. It is the exit."
 *
 * One gesture, on the short scrub window: the three footer groups mask up on
 * STAGGER.each.tight with EASE.reveal, travelling pick(TRAVEL.copy). It is
 * still a scrub, so it is still reversible and still inside the site's physics
 * — it just does not spend any of the user's attention.
 *
 * It lives in the Contact directory rather than one of its own because it is
 * the DOM neighbour Contact hands off to and it shares that section's data
 * module (the runtime-assembled mail address) and motion file. In the document
 * it is a sibling of <main>, not a child — <footer class="site-footer"> is a
 * direct child of <body> in legacy and carries the implicit `contentinfo`
 * landmark, which it only gets when it is NOT nested inside <main>.
 */
export default function Footer() {
  const rootRef = useRef(null)
  const addr = useEmailAddress()

  useEffect(() => {
    let mm = null
    const root = rootRef.current
    if (!root) return undefined

    mm = gsap.matchMedia()

    mm.add(CONDITIONS, (ctx) => {
      const { isMobile, isReduced } = ctx.conditions

      // Scoped to root. Three groups: copyright, links, disclaimer.
      const groups = gsap.utils.toArray('[data-footer-group]', root)

      const cleanup = () => {
        root.classList.remove('is-live')
      }

      /* ---------------- REDUCED MOTION ----------------
       * No timeline, no trigger. The groups are gsap.set() to their final
       * state explicitly — their CSS resting state is the start of the
       * gesture, so doing nothing would leave the footer masked out. */
      if (isReduced) {
        root.dataset.motion = 'reduced'
        setIf(groups, { y: 0 })
        return cleanup
      }

      root.dataset.motion = 'full'

      const seq = pick(FOOTER_MOTION.seq, isMobile)
      const y = pick(FOOTER_MOTION.travel, isMobile)

      const tl = gsap.timeline({
        scrollTrigger: scrubbedTrigger({
          trigger: root,
          root,
          isMobile,
          // SCRUB_WINDOW_SHORT, not the standard window: the footer is under
          // 40vh tall, so a `bottom 55%` end would sit further away than the
          // element is tall and the gesture would resolve at ~3% per notch —
          // which reads as nothing happening at all.
          window: FOOTER_MOTION.window,
        }),
      })

      // Normalised to exactly 1 unit, same as every other timeline on the site.
      tl.to({}, { duration: 1 }, 0)

      /* The only tween in the footer. It is the first — and only — tween to
       * touch `y` on these targets, so it keeps GSAP's default
       * `immediateRender: true`, which is what paints progress 0 (§C.6). */
      const g = seq.groups
      tl.from(
        groups,
        {
          y,
          duration: fit(
            g.end - g.start,
            (FOOTER_MOTION.groupCount - 1) * FOOTER_MOTION.stagger,
          ),
          ease: FOOTER_MOTION.ease,
          stagger: FOOTER_MOTION.stagger,
        },
        g.start,
      )

      if (DEBUG) window.__footer = { tl, st: tl.scrollTrigger }

      return cleanup
    })

    refreshSoon()

    return () => {
      if (mm) mm.revert()
    }
  }, [])

  return (
    <footer className="site-footer" ref={rootRef}>
      <div className="shell footer-grid">
        {/* Each group sits inside its own mask so the rise is a wipe rather
            than a slide. The three <div>s are unlabelled generics in legacy,
            flexed apart by .footer-grid — the masks take that role and the
            inner element is the thing that moves. */}
        <div className="footer__mask">
          <div className="footer__group" data-footer-group>
            {FOOTER.copyrightBefore}
            {/* legacy replaces a hardcoded 2026 with this at runtime, so the
                computed year IS the copy. `id="year"` is dropped with it. */}
            {new Date().getFullYear()}
            {FOOTER.copyrightAfter}
          </div>
        </div>

        <div className="footer__mask">
          <div className="footer-links footer__group" data-footer-group>
            {FOOTER.links.map((link) => (
              <a
                key={link.href + link.label}
                href={
                  link.emailSubject && addr
                    ? mailtoHref(addr, link.emailSubject)
                    : link.href
                }
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="footer__mask">
          <div className="footer__group" data-footer-group>
            {FOOTER.disclaimer}
          </div>
        </div>
      </div>
    </footer>
  )
}

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SmoothScroll from './lib/SmoothScroll'
import SiteHeader from './components/SiteHeader/SiteHeader'
import Marquee from './components/SiteHeader/Marquee'
import Hero from './components/Hero/Hero'
import Diagnosis from './components/Diagnosis/Diagnosis'
import Coverage from './components/Coverage/Coverage'
import AiVisibility from './components/AiVisibility/AiVisibility'
import Method from './components/Method/Method'
import Scorecard from './components/Scorecard/Scorecard'
import Pricing from './components/Pricing/Pricing'
import AiBuild from './components/AiBuild/AiBuild'
import Why from './components/Why/Why'
import Faq from './components/Faq/Faq'
import Contact from './components/Contact/Contact'
import Footer from './components/Contact/Footer'

/**
 * Section order mirrors legacy/index.html exactly. The order is not cosmetic:
 * the header nav, the footer links, sitemap.xml and the hero's own CTAs all
 * anchor to these sections' ids, and the motion system's "no two pinned
 * sections may be DOM-adjacent" rule is satisfied by this arrangement
 * (Hero → Marquee, Diagnosis, Coverage → AiVisibility → Method, Pricing →
 * AiBuild). Reordering can silently create adjacent pins.
 *
 * tabIndex={-1} on <main> makes it a valid skip-link target so focus actually
 * lands there rather than staying on the link.
 */
export default function App() {
  /**
   * One document-wide refresh after every section has registered its triggers.
   *
   * Three sections pin, and a pin inserts a spacer that grows the document by
   * its pin length — 370vh in total. Any trigger created before those spacers
   * exist measures a document about to get ~6,000px taller, and ScrollTrigger
   * does not re-measure on its own. Two real bugs came from exactly this: the
   * header's tint trigger ended at 9,988 against a real maxScroll of 16,009, so
   * the header un-tinted two thirds down the page and section text read
   * straight through it; and the scroll hairline reached 100% at 62%.
   *
   * React runs child effects before parent effects, and every section defers
   * its setup behind document.fonts.ready, so registering this continuation
   * last puts it after all of them — promise callbacks run in registration
   * order. The window 'load' pass catches late images changing height again.
   */
  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      if (!cancelled) ScrollTrigger.refresh()
    }

    const fonts =
      document.fonts && document.fonts.ready
        ? document.fonts.ready
        : Promise.resolve()
    fonts.then(() => {
      if (cancelled) return
      // One frame later still: sections create their triggers synchronously
      // inside the same fonts.ready callback, so yielding once guarantees the
      // spacers are in the DOM before anything is measured.
      gsap.delayedCall(0, refresh)
    })

    window.addEventListener('load', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('load', refresh)
    }
  }, [])

  return (
    <SmoothScroll>
      {/* The skip link belongs to SiteHeader, which owns the focus handling
          and the Lenis-aware jump. Rendering a second one here put two
          identical links at the top of the tab order. */}
      <SiteHeader />

      <main id="main" tabIndex={-1}>
        <Hero />
        <Marquee />
        <Diagnosis />
        <Coverage />
        <AiVisibility />
        <Method />
        {/* Directly after Method on purpose: its step 02 promises exactly this
            artifact ("ARTIFACT: SCORECARD, THEN FULL REPORT"), and it sits
            before Pricing so the reader sees the deliverable before the price.
            Restored from the legacy hero, which the first port dropped. */}
        <Scorecard />
        <Pricing />
        <AiBuild />
        <Why />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </SmoothScroll>
  )
}

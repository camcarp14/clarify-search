import SmoothScroll from './lib/SmoothScroll'
import Hero from './components/Hero/Hero'

export default function App() {
  return (
    <SmoothScroll>
      <main>
        <Hero />

        {/* Placeholder only. The rest of the page is deliberately not ported
            yet — the hero is being reviewed on its own first. This band exists
            so the unpin has something to hand off to and can actually be
            watched. Delete it when the next section lands. */}
        <section className="next-placeholder">
          <p>Next section lands here.</p>
        </section>
      </main>
    </SmoothScroll>
  )
}

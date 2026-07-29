import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * WHY THE ENTRY HTML LIVES IN app/
 *
 * GitHub Pages serves this repo from the ROOT of `main`. That means the file
 * Pages hands to a visitor as `/index.html` must be the BUILT html — and Vite's
 * source entry is also called index.html. One path, two different files.
 *
 * So the source entry is app/index.html (Vite's `root`), and the build output
 * is copied to the repo root by `npm run deploy`. `npm run dev` is unaffected
 * because Vite serves from `root`.
 *
 * Do not move app/index.html back to the repo root. Doing so makes the next
 * deploy overwrite the source entry with its own output, and the dev server
 * then boots the built page instead of the app.
 *
 * PREVIEW_BUILD=1 changes two things and nothing else:
 *   - base './' so assets resolve relative to the HTML, which is what serving
 *     from a /user/repo/ref/dist/ CDN path requires.
 *   - a robots noindex meta tag, because that HTML is publicly reachable and an
 *     indexable second copy of the marketing site is duplicate content aimed at
 *     the same keywords as clarifysearch.com. Headers cannot reach a CDN URL,
 *     so the instruction has to travel inside the document.
 */
const isPreview = process.env.PREVIEW_BUILD === '1'

const previewNoindex = {
  name: 'preview-noindex',
  transformIndexHtml(html) {
    if (!isPreview) return html
    return html.replace(
      '</title>',
      '</title>\n  <meta name="robots" content="noindex, nofollow, noarchive" />' +
        '\n  <!-- REVIEW BUILD. Not the live site. https://clarifysearch.com/ is canonical. -->',
    )
  },
}

export default defineConfig({
  root: 'app',
  base: isPreview ? './' : '/',
  publicDir: '../public',
  plugins: [react(), previewNoindex],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})

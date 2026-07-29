import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * PREVIEW_BUILD=1 produces a build that can be reviewed from a GitHub-backed
 * CDN (raw.githack.com) without deploying anywhere:
 *
 *   - base './' so assets resolve relative to the HTML rather than from the
 *     domain root, which is what a /gh/user/repo@branch/dist/ URL needs.
 *   - a robots meta tag, because that HTML is publicly reachable and an
 *     indexable second copy of the marketing site is duplicate content aimed
 *     at the same keywords as clarifysearch.com. Netlify's noindex header
 *     (netlify.toml) cannot help here — nothing sets headers on a CDN URL, so
 *     the instruction has to travel inside the document.
 *
 * A normal `npm run build` is unaffected: absolute base, no robots tag.
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
  base: isPreview ? './' : '/',
  plugins: [react(), previewNoindex],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})

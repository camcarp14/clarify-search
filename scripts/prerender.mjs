/**
 * Bakes the rendered app into dist/index.html.
 *
 * Runs after both builds:
 *   1. `vite build`              → dist/            (client bundle + html shell)
 *   2. `vite build --ssr ...`    → dist-ssr/        (the same app, for Node)
 *   3. this script               → dist/index.html  (shell + real markup)
 *
 * The client then hydrates that markup rather than creating it, so the page has
 * content for crawlers and for anyone whose JS fails, and the motion attaches on
 * top exactly as before.
 */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const HTML = path.join(ROOT, 'dist', 'index.html')
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js')

if (!fs.existsSync(HTML)) {
  console.error('prerender: dist/index.html missing — run the client build first')
  process.exit(1)
}
if (!fs.existsSync(SSR_ENTRY)) {
  console.error('prerender: dist-ssr/entry-server.js missing — run the ssr build first')
  process.exit(1)
}

const { render } = await import(pathToFileURL(SSR_ENTRY).href)
const markup = render()

if (!markup || markup.length < 2000) {
  // A near-empty render means the app threw during SSR and React swallowed it
  // into an empty shell. Shipping that would silently undo the whole point.
  console.error(`prerender: render() produced only ${markup ? markup.length : 0} chars — refusing to write`)
  process.exit(1)
}

const html = fs.readFileSync(HTML, 'utf8')
const MOUNT = '<div id="root"></div>'
if (!html.includes(MOUNT)) {
  console.error('prerender: could not find the mount point in dist/index.html')
  process.exit(1)
}

fs.writeFileSync(HTML, html.replace(MOUNT, `<div id="root">${markup}</div>`), 'utf8')

const kb = (Buffer.byteLength(markup, 'utf8') / 1024).toFixed(1)
console.log(`prerender: baked ${kb} kB of markup into dist/index.html`)

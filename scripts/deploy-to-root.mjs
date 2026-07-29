/**
 * Copies dist/ to the repo root, which is where GitHub Pages serves
 * clarifysearch.com from on `main`.
 *
 * Pages cannot run a build, so the built artefacts have to be committed. That
 * is why the Vite source entry lives in app/ — see vite.config.js. Running this
 * against a repo whose entry is at the root would overwrite the source with its
 * own output.
 *
 * Deliberately NOT a blanket wipe-and-copy: the root also holds CNAME,
 * robots.txt, sitemap.xml, the source tree and the legacy page. Only the files
 * the build owns are touched, and the previous assets/ is cleared first so old
 * hashed bundles do not accumulate forever.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIST = path.join(ROOT, 'dist')

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('deploy: dist/index.html missing — run `npm run build` first')
  process.exit(1)
}

// Guard: refuse to publish a shell. If prerendering silently failed we would
// otherwise ship an empty page to the live domain.
const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
if (html.includes('<div id="root"></div>')) {
  console.error('deploy: dist/index.html has an EMPTY mount point — prerendering did not run.')
  console.error('        Refusing to publish a client-only shell to the live site.')
  process.exit(1)
}

const assetsOut = path.join(ROOT, 'assets')
if (fs.existsSync(assetsOut)) fs.rmSync(assetsOut, { recursive: true, force: true })

let copied = 0
for (const entry of fs.readdirSync(DIST, { withFileTypes: true })) {
  const from = path.join(DIST, entry.name)
  const to = path.join(ROOT, entry.name)
  fs.cpSync(from, to, { recursive: true })
  copied += 1
}

console.log(`deploy: copied ${copied} entries from dist/ to the repo root`)
console.log('        commit and push to `main` to publish.')

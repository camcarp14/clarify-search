# camcarp14.github.io — clarifysearch.com

The Clarify Search marketing site: React + Vite, with scroll-driven pinned
motion (GSAP + ScrollTrigger + Lenis). Served by GitHub Pages from the ROOT of
`main` at the apex domain in `CNAME`.

| Path | Purpose |
| --- | --- |
| `index.html`, `assets/` | **Build output, committed.** Pages serves these. Never hand-edit them — the next `npm run deploy` overwrites them |
| `app/index.html` | The Vite source entry (head, meta, fonts, JSON-LD). This is the file to edit for anything in `<head>` |
| `src/components/<Name>/` | One directory per section: `Name.jsx`, `name.motion.js`, `Name.css` |
| `src/motion/system.js` | The shared physics — eases, beats, staggers, travel, pin budgets. Imported by every section |
| `src/lib/SmoothScroll.jsx` | Lenis, wired to the GSAP ticker; exports `useLenis()` |
| `scripts/prerender.mjs` | Bakes the rendered app into the HTML at build time |
| `scripts/deploy-to-root.mjs` | Copies `dist/` to the repo root for Pages |
| `legacy/index.html` | The previous single-file site. Kept as the copy reference |
| `CNAME` | `clarifysearch.com` — do not delete, Pages needs it for the custom domain |
| `robots.txt`, `sitemap.xml` | Crawl rules and sitemap |

## Working on it

```sh
npm install
npm run dev
```

Add `?motion-debug` to any URL for ScrollTrigger markers plus `window.__hero`
and `window.__lenis` in the console. `VITE_MOTION_DEBUG=true` does the same
per-environment.

Tune motion by editing numbers in a section's `*.motion.js`. Nothing in a
`.jsx` should need to change to re-time a sequence.

## Deploying

```sh
npm run build     # client + ssr + prerender
npm run deploy    # copy dist/ to the repo root
git add -A && git commit && git push origin main
```

Pages republishes in roughly 40–90 seconds. Verify with a cache-buster, because
CDN caching will otherwise show you the old page:

```sh
curl -sS -A "Mozilla/5.0 Chrome/131.0" "https://clarifysearch.com/?cb=$RANDOM" | grep "something you changed"
```

**Why the entry html lives in `app/`:** Pages serves the repo root, so root
`index.html` has to be the *built* file — and Vite's source entry is also
called `index.html`. Two different files, one path. Moving the source back to
the root makes every deploy overwrite it.

**Why the build prerenders:** without it the page ships an empty
`<div id="root">` and zero readable content. The AI answer engines this site
markets against are far less reliable than Googlebot at running JavaScript
before reading a page. `deploy-to-root.mjs` refuses to publish if the mount
point is empty, so a silent prerender failure cannot reach the domain.

**Rolling back:** `ec7e115` is the last commit of the pre-rebuild static site.
`git revert` the merge, or `git checkout ec7e115 -- index.html` and delete
`assets/` to restore it, then push.

## Open items

(1 is resolved, kept for history.)

1. ~~HTTPS~~ **Done (2026-07-18).** A certificate is provisioned, Enforce HTTPS
   is on, and `http://` 301s to `https://`. All URLs here and in `index.html`,
   `robots.txt` and `sitemap.xml` point at `https://clarifysearch.com`.

2. ~~Lead notifications~~ **Done (2026-07-18).** `submit-lead` emails
   clarifypaidsearch@gmail.com via Resend on every lead, with `reply_to` set to
   the sender so you can reply directly. Verified delivering. The lead saves
   first and a mail failure is logged, never shown to the visitor as a failure.
   The older `inbound-lead` function is retired to a 410 stub — it accepted
   POSTs from any origin with no rate limit. Restore from the Supabase
   dashboard if ever needed.

3. **`inbound_leads` row-level security — last one open.** The `anon` role can
   still `SELECT` and `UPDATE` every row. The blocker is gone: the CRM now sends
   its session token (`src/lib/supabase.js` uses `sessionToken || anon`), so the
   policies can finally be narrowed. Before running it, confirm the deployed
   CRM at clarify-outreach.netlify.app is on a build that includes that helper,
   then:

   ```sql
   drop policy "anon can read leads"   on public.inbound_leads;
   drop policy "anon can update leads" on public.inbound_leads;
   create policy "authenticated read leads"   on public.inbound_leads
     for select to authenticated using (true);
   create policy "authenticated update leads" on public.inbound_leads
     for update to authenticated using (true);
   ```

   Keep the `anon can insert leads` policy — it is what lets the public form
   write. Verify afterwards by loading the CRM's Inbound view; if it goes empty,
   the deployed bundle predates the session-token helper, so roll the policies
   back and redeploy the CRM first.

## Conventions

- The checkout is CRLF for the legacy file; everything under `src/`, `app/` and
  `scripts/` is LF.
- Motion is gated behind `prefers-reduced-motion`; keep new animation gated too.
  In the React tree that means a `gsap.matchMedia()` branch that resolves to the
  final state with no pin — see `Hero.jsx`.
- Animate transform and opacity only. Chip home positions are written once with
  `left`/`top` at layout time and never tweened.
- Every animated section keeps its timing numbers in a sibling `*.motion.js`
  config, not inline in the component.
- Pricing lives in `src/components/Pricing/pricing.data.js` (`PRICING`, `FREE`,
  `CAPTIONS`) and is rendered per channel — edit it there, not in the markup.
- CTA links use `data-offer="<Tier> — <Channel>"` and preselect the contact
  form's service dropdown **by matching the option text**. A new CTA needs a
  matching `<option>` or the preselect silently does nothing.

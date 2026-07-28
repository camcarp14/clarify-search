# camcarp14.github.io — clarifysearch.com

The Clarify Search marketing site. **Mid-migration**: moving from one static
`index.html` to React + Vite so the page can carry scroll-driven, pinned
motion (GSAP + ScrollTrigger + Lenis).

**Only the hero is ported so far.** The live site is still the legacy page.

| Path | Purpose |
| --- | --- |
| `legacy/index.html` | The site as it ships today — markup, CSS and JS in one file. Still the source of truth for all copy, and for every section not yet ported |
| `index.html` | Vite entry (head, fonts, `#root`) |
| `src/components/Hero/` | The rebuilt hero. `hero.motion.js` is the tuning surface |
| `src/lib/SmoothScroll.jsx` | Lenis, wired to the GSAP ticker and ScrollTrigger |
| `src/styles/tokens.css` | Design tokens, ported verbatim from the legacy `:root` |
| `CNAME` | `clarifysearch.com` — do not delete, GitHub Pages needs it to keep the custom domain |
| `robots.txt` | Crawl rules; explicitly allows answer-engine bots |
| `sitemap.xml` | Single-URL sitemap |

## Working on it

```sh
npm install
npm run dev
```

Add `?motion-debug` to any URL to switch on ScrollTrigger markers and expose
`window.__hero` / `window.__lenis` for poking at the timeline from the console.
`VITE_MOTION_DEBUG=true` does the same per-environment.

## Deploying — NOT cut over yet

The live site is still served from `legacy/index.html`'s content on `main`.
Do not point Pages at the Vite build until the rest of the page is ported, or
the site loses everything below the hero.

When it is time, that means a build step: GitHub Pages cannot run `vite build`
on its own, so the cutover needs an Actions workflow that builds and publishes
`dist/`. Verify with a cache-buster afterwards, because CDN caching will
otherwise show you the old page:

```sh
curl -sS -A "Mozilla/5.0 Chrome/131.0" "https://clarifysearch.com/?cb=$RANDOM" | grep "something you changed"
```

Still to port from `legacy/index.html`: the `ProfessionalService` JSON-LD
block (it describes offers this build does not render yet), the site header
and nav, and every section from Diagnosis down.

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

- The checkout is CRLF. Edits made elsewhere in LF should be converted on the
  way in (`sed 's/$/\r/'`) or the diff shows every line as changed. Files added
  under `src/` are LF.
- Motion is gated behind `prefers-reduced-motion`; keep new animation gated too.
  In the React tree that means a `gsap.matchMedia()` branch that resolves to the
  final state with no pin — see `Hero.jsx`.
- Animate transform and opacity only. Chip home positions are written once with
  `left`/`top` at layout time and never tweened.
- Every animated section keeps its timing numbers in a sibling `*.motion.js`
  config, not inline in the component.
- Pricing lives in the `PRICING` object in the inline script and is rendered per
  channel — edit it there, not in the markup, or the segmented toggle will
  overwrite you. The same applies to the free tier's `FREE` object.
- CTA links use `data-offer="<Tier> — <Channel>"` and preselect the contact
  form's service dropdown **by matching the option text**. A new CTA needs a
  matching `<option>` or the preselect silently does nothing.

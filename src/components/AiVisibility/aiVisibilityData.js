/**
 * ============================================================================
 * AI VISIBILITY — COPY
 * ============================================================================
 * Every string in this file is byte-exact from legacy/index.html lines
 * 1876–1948. Nothing here may be rewritten, shortened, re-punctuated or
 * "improved" (§C.9).
 *
 * CHARACTER INVENTORY for this section, so a diff can be checked by counting:
 *   —  U+2014 EM DASH        × 5  (eyebrow 1, lede 1, organic note 1, card 04 × 2)
 *   …  U+2026 ELLIPSIS       × 1  (end of the AI answer, glued to "pages")
 *   ✦  U+2726 FOUR-POINTED   × 1  (the note mark — lives in the JSX, decorative)
 *   '  U+0027 APOSTROPHE     × 1  ("can't" in the h2 — lives in the JSX)
 * There is NO curly apostrophe in this section. The single U+2019 in the whole
 * legacy file is in AI Build's status line, not here (§C.9). `Entity &amp;
 * structured data` is an HTML entity in legacy and therefore a literal "&" in
 * JS/JSX (R-5).
 *
 * The AI answer paragraph is NOT in this file: it interleaves three
 * `<span class="cite">` elements with the sentence, and splitting a sentence
 * into fragments to rebuild it in JSX is exactly how a space goes missing. It
 * is written inline in AiVisibility.jsx, once, in one piece.
 * ============================================================================
 */

/** aria-label on <aside class="serp">. This is the ONLY thing a screen-reader
 *  user gets from the mock, so it is load-bearing copy, not decoration. */
export const SERP_LABEL =
  'How one results page now stacks: an AI answer on top, ads below it, then rankings'

/** The fake omnibox query. Type-scrubbed per char (§B.5, beat 0.10 → 0.20). */
export const SERP_QUERY = 'best family dentist near me'

/** The three result rows, top to bottom in the FINAL composition. They do not
 *  arrive in this order — see §B.5 / aiVisibility.motion.js. `lines` are the
 *  widths of the empty `.serp-line` skeleton bars (R-3: the value must be a
 *  string, `{'--w': 74}` is silently dropped by React). */
export const SERP_ROWS = {
  ai: {
    tag: 'AI answer',
    badge: 'new top',
    citesLabel: '3 sources cited',
    note: 'Answered before anyone scrolls',
  },
  paid: {
    tag: 'Sponsored',
    url: 'competitor-dental.com',
    lines: ['74%'],
    note: 'The clicks you buy',
  },
  org: {
    tag: '#1 Organic',
    url: 'yourpractice.com',
    lines: ['88%', '52%'],
    note: 'The clicks you earn — and what the answer above is built from',
  },
}

/** The four `.ai-card` articles. `num` is rendered twice per card — once as the
 *  resting face and once as an aria-hidden accent twin — because a colour
 *  change is an opacity cross-fade between stacked layers (§A.4 rule 2). The
 *  twin is aria-hidden so "01" is not announced twice. */
export const AI_CARDS = [
  {
    num: '01',
    title: 'Entity & structured data',
    body: 'Schema and clean signals so models know exactly who you are, what you sell, and where you serve.',
  },
  {
    num: '02',
    title: 'Answer-ready content',
    body: 'Pages built to be quoted: real questions answered plainly, backed by genuine expertise and sources.',
  },
  {
    num: '03',
    title: 'Presence where models look',
    body: 'Reviews, citations, and consistent mentions across the places AI systems actually pull from.',
  },
  {
    num: '04',
    title: 'AI answer monitoring',
    body: 'Track which prompts surface you — or a competitor — and close the gaps as the answers shift.',
  },
]

/** Number of connector rails drawn from the AI row's citation dots down into
 *  the organic row. Three, because the AI answer cites three sources — the
 *  count is the argument, not a decoration budget. Desktop only (§B.5 mobile). */
export const CITE_COUNT = 3

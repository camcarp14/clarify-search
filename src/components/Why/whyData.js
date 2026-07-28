/**
 * ============================================================================
 * WHY — COPY DATA
 * ============================================================================
 * Every user-visible string in `#why` lives here, lifted character-for-character
 * from legacy/index.html lines 2233-2261. Nothing in this file is generated,
 * abbreviated or "improved".
 *
 * CHARACTER INVENTORY OF THIS SECTION (verified by codepoint scan of the legacy
 * markup range, and restated here because it is the single easiest thing to
 * lose in a port):
 *
 *   - Exactly TWO non-ASCII characters in the whole section: two U+2014 EM
 *     DASHES, both in the second card's body ("— search and AI builds —").
 *     They are SPACED: space + em dash + space. Not `&mdash;`, not `&#8212;`,
 *     not `--`, not an en dash (U+2013).
 *   - `"growth"` uses STRAIGHT ASCII DOUBLE QUOTES (U+0022) on both sides.
 *     Legacy does not use curly quotes here. Do not "fix" them to “growth”.
 *   - There are NO apostrophes anywhere in this section, straight or curly.
 *   - There is NO <strong> and NO <em> in this section. The only inline markup
 *     is the <span className="ital"> inside the <h2>, which lives in Why.jsx
 *     as JSX children (never dangerouslySetInnerHTML).
 *
 * Strings are written with backticks so that neither a straight double quote
 * nor an apostrophe can ever require escaping — an escape is exactly where a
 * well-meaning formatter mangles copy.
 * ============================================================================
 */

/**
 * The eight capability pills, in the exact legacy order (markup 2240-2247).
 *
 * ORDER IS MEANINGFUL and is the site's colour argument in miniature:
 *   amber (paid) → mint (organic) → iris (AI) → neutral (measurement tooling).
 * Do not re-sort, do not alphabetise, do not add or drop a pill.
 *
 * `channel` is null for the two bare `.pill`s. A null channel means the pill
 * has no colour to cross-fade INTO, so Why.jsx renders no stacked tint layer
 * for it — the measurement tools stay deliberately neutral, which is the point
 * they are making.
 */
export const WHY_PILLS = [
  { id: 'google-ads', text: `Google Ads`, channel: 'paid' },
  { id: 'performance-max', text: `Performance Max`, channel: 'paid' },
  { id: 'technical-seo', text: `Technical SEO`, channel: 'org' },
  { id: 'content', text: `Content`, channel: 'org' },
  { id: 'ai-overviews', text: `AI Overviews`, channel: 'ai' },
  { id: 'answer-engines', text: `Answer Engines`, channel: 'ai' },
  { id: 'ga4', text: `GA4`, channel: null },
  { id: 'search-console', text: `Search Console`, channel: null },
]

/**
 * Channel → the legacy modifier class on `.pill`.
 *
 * These three classes are declared ONCE, in src/styles/components.css §8
 * (`.pill.p-paid`, `.pill.p-org`, `.pill.p-ai`). Why.css must not re-declare
 * them. `p-ai` in particular lived 500 lines away from the other two in the
 * legacy stylesheet, which is exactly how a builder ships two unstyled pills.
 */
export const PILL_CHANNEL_CLASS = {
  paid: 'p-paid',
  org: 'p-org',
  ai: 'p-ai',
}

/**
 * The two `<article class="why-card">` cards (markup 2251-2258), in DOM order.
 *
 * `heading` renders as <h3> — NOT <h2>, NOT <h4>. The page outline is
 * h1 (hero) → h2 (per band) → h3 (per card), and #why contributes one h2 and
 * these two h3s.
 *
 * Both headings carry a TRAILING FULL STOP. Both are American spellings
 * (`rigor`, `optimization`). Leave all of it alone.
 */
export const WHY_CARDS = [
  {
    id: 'rigor',
    heading: `Agency-trained rigor.`,
    body: `Built from the standards of managing complex search accounts: clear structure, careful QA, consistent optimization, business-first recommendations.`,
  },
  {
    id: 'thesis',
    heading: `Two practices. One thesis.`,
    // Two U+2014 em dashes and two U+0022 straight quotes. See the header.
    body: `Machines decide whether customers find you, and machines can do your work. Clarify does those two things — search and AI builds — and still no social, email, web design, or "growth" bundles.`,
  },
]

/**
 * The eyebrow (`.mono-label`, markup 2236).
 *
 * Authored in TITLE CASE. `text-transform: uppercase` in components.css is
 * presentational; screen readers and copy diffs read the source string.
 */
export const WHY_EYEBROW = `Why Clarify`

/**
 * The lede paragraph (`.why-copy > p`, markup 2238).
 * No em dashes, no apostrophes, no emphasis. Plain prose.
 */
export const WHY_LEDE = `You work with the person reviewing your account, writing the findings, and making the changes. No handoffs, no junior analyst behind a polished deck.`

/**
 * The <h2> (markup 2237), split into the three parts JSX needs so the inline
 * <span className="ital"> can be real markup rather than an HTML string.
 *
 *   <h2>Senior search thinking, minus the <span class="ital">agency wrapper</span>.</h2>
 *
 * Note where the boundaries fall:
 *   - `before` ends with a SINGLE NORMAL SPACE before the span.
 *   - the trailing full stop is OUTSIDE the span, in `after`.
 * Both details are load-bearing: the span is a serif-italic type swap, and a
 * period set in Instrument Serif italic next to Space Grotesk is visibly wrong.
 */
export const WHY_HEADING = {
  before: `Senior search thinking, minus the `,
  ital: `agency wrapper`,
  after: `.`,
}

/**
 * ============================================================================
 * COVERAGE — COPY
 * ============================================================================
 * Every string below is lifted VERBATIM from legacy/index.html lines 1828-1874
 * (see specs/coverage.md §1). Nothing here may be rewritten, shortened,
 * "improved" or grammar-fixed. If a string looks wrong, it is still the
 * shipping string.
 *
 * CHARACTER NOTES — read before editing a single byte
 *   - Every dash below that is not a hyphen is U+2014 EM DASH (—), spaced
 *     as " — ". There are exactly TWO in this file (the two panel tags). The
 *     other two em dashes in the section live inline in Coverage.jsx (the
 *     mono-label eyebrow and the lede paragraph), because their surrounding
 *     <strong> emphasis has to stay visible next to the words it wraps.
 *   - The ampersands are literal "&" characters. Legacy HTML-encodes them
 *     because it is HTML; this is a JS string, so it must not. A grep for the
 *     HTML ampersand entity across this component must return zero hits.
 *   - "vs." in "Content vs. buyer intent" carries a trailing period.
 *   - There is no apostrophe in this file. The section's only apostrophe is
 *     the straight ASCII ' in "isn't" in the lede paragraph in Coverage.jsx.
 *     Legacy uses no curly right single quote anywhere in this section, so
 *     neither does this file, and U+2019 must not appear in this component at
 *     all. Do not "typographically improve" it (motion-system §C.9: the whole
 *     legacy file contains exactly ONE curly apostrophe, and it is in AI
 *     Build, not here).
 *
 * The two panels' `modifier` values are load-bearing, not decorative:
 * `.paid` / `.org` drive the --cov-acc top-rule gradient, the .cov-tag colour
 * and the em-dash bullet colour on .cov-list li::before. Both are co-required
 * with .cov-panel.
 * ============================================================================
 */

/** Left panel. */
export const PAID = {
  modifier: 'paid',
  tag: 'Paid — the clicks you buy',
  heading: 'Paid search',
  copy: 'Every dollar accounted for, every query controlled.',
  items: [
    'Search & Performance Max structure',
    'Query, match type & negatives control',
    'Bidding & budget strategy',
    'Conversion tracking & attribution',
    'Ad copy & asset QA',
  ],
}

/**
 * Centre column.
 *
 * `ariaLabel` is legacy's `aria-label="Shared across both channels"`, which in
 * legacy sits on a bare <div> with no role and is therefore NOT exposed by most
 * screen readers. Coverage.jsx adds role="group" so the label actually
 * announces — see the ACCESSIBILITY note there.
 *
 * Each node renders as <strong>One</strong> immediately followed by a bare
 * text node, with NO whitespace between them (`.spine-node strong` is
 * display:block, so "One" sits on its own line above the label). The label is
 * rendered as an explicit JS expression rather than JSX text so no formatter
 * can ever slip a leading space in.
 */
export const SPINE = {
  ariaLabel: 'Shared across both channels',
  title: 'Shared core',
  /** The word that is <strong> on every node. Same string four times. */
  lead: 'One',
  nodes: [
    'keyword map',
    'measurement setup',
    '90-day roadmap',
    'person accountable',
  ],
}

/** Right panel. */
export const ORGANIC = {
  modifier: 'org',
  tag: 'Organic — the clicks you earn',
  heading: 'Organic search',
  copy: 'A site Google can crawl, trust, and rank for buyers.',
  items: [
    'Technical health: crawl, indexation, speed',
    'Content vs. buyer intent',
    'Titles, meta & on-page',
    'Internal linking & site architecture',
    'Local visibility: GBP & citations',
  ],
}

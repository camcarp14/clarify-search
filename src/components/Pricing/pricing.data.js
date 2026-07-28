/**
 * ============================================================================
 * PRICING DATA
 * ============================================================================
 * Transcribed verbatim from legacy/index.html — the channel-toggle block at
 * lines 2760-2875 for the JS objects, and lines 1994-2142 for the strings that
 * only ever existed as static markup (tier titles, intros, comparison rows).
 *
 * COPY IS FROZEN. Every character below is load-bearing:
 *   —  U+2014 EM DASH        (the ` — ` joiner in every data-offer string)
 *   –  U+2013 EN DASH        (only in ranges: '1–2 weeks', '5–20')
 *   ·  U+00B7 MIDDLE DOT     (the ` · ` separator in every price note)
 *   −  U+2212 MINUS SIGN     (only in the '−15%' pill — NOT a hyphen)
 *   ✓  U+2713 / → U+2192 /   NO-BREAK SPACE
 *
 * There are ZERO curly apostrophes in this section. `what's`, `don't`,
 * `you're` and `committing to` all use straight ASCII U+0027. Do not
 * "typographically improve" them — the Hero already drifted on exactly this
 * (motion-system §C.9) and it must not spread.
 *
 * PRICES ARE STRINGS. '1,099' and '1,350' carry a literal comma. Never
 * parseInt them, never Intl.NumberFormat them. The one place a number is
 * derived from a price is the scrubbed counter in Pricing.jsx, and it
 * regenerates the separator so progress 1.0 is byte-identical to the string
 * here — see the note on countTo() there.
 * ============================================================================
 */

/* ------------------------------------------------------------------------- */
/* CHANNEL                                                                    */
/* ------------------------------------------------------------------------- */

/** Channel display names. Title Case, and load-bearing TWICE: they are
 *  concatenated into the `data-offer` strings that must string-match an
 *  <option> in #lf-service on the contact form, AND they are lower-cased for
 *  the aria-live announcement ("Both Channels" → "both channels"). */
export const CH_LABEL = {
  paid: 'Paid Search',
  organic: 'Organic Search',
  both: 'Both Channels',
}

/** Channel → position. Drives the segmented-control thumb offset and the
 *  arrow-key wrap-around arithmetic. Numeric, not copy. */
export const CH_INDEX = { paid: 0, organic: 1, both: 2 }

/** DOM / keyboard order of the three radios. */
export const CH_ORDER = ['paid', 'organic', 'both']

/** The channel the page ships in. The static markup === the paid render. */
export const INITIAL_CHANNEL = 'paid'

/** Tier keys, in card order. Iterated explicitly rather than via Object.keys
 *  so the order can never depend on object insertion order. */
export const TIER_ORDER = ['audit', 'cleanup', 'mgmt']

/* ------------------------------------------------------------------------- */
/* SEGMENTED CONTROL                                                          */
/* ------------------------------------------------------------------------- */

/** Visible labels on the three .seg-btn radios. The `both` label is the word
 *  `Both`, a single space, then the −15% pill — the pill is rendered as a
 *  separate <span class="seg-save"> in the JSX, so only the word lives here. */
export const SEG_LABEL = {
  paid: 'Paid search',
  organic: 'Organic search',
  both: 'Both',
}

/** U+2212 MINUS SIGN, not a hyphen-minus. */
export const SEG_SAVE = '−15%'

/** aria-label on the radiogroup. */
export const SEG_GROUP_LABEL = 'Pricing channel'

/** The line under the control. CAPTIONS.paid is also the server-rendered
 *  initial text of #segCaption, so the two can never disagree. */
export const CAPTIONS = {
  paid: 'Google Ads only — audits, cleanups, and month-to-month management.',
  organic: 'SEO only — technical, content, and on-page, without the retainer theater.',
  both: 'One keyword map, one measurement setup, one person — about 15% off the combined price.',
}

/* ------------------------------------------------------------------------- */
/* TIER CARDS                                                                 */
/* ------------------------------------------------------------------------- */

/** Tier display names. These are the <h3> text AND the left half of every
 *  generated data-offer string — one source, so the card and the contact
 *  form can never drift. */
export const TIERS = {
  audit: 'Audit',
  cleanup: 'Audit + Cleanup',
  mgmt: 'Monthly Management',
}

/** .offer-intro. Static markup in legacy — renderTier never touched these, so
 *  they do NOT change with the channel. Straight ASCII apostrophe in
 *  "what's broken". */
export const TIER_INTRO = {
  audit: "Know exactly what's broken before spending more.",
  cleanup: 'Find the leaks, fix the obvious ones, hand it back cleaner.',
  mgmt: 'Disciplined optimization without a locked-in retainer.',
}

/** Visible CTA labels. `→` is U+2192. Also static — only the CTA's
 *  `data-offer` attribute follows the channel, never its label. */
export const TIER_CTA = {
  audit: 'Request audit →',
  cleanup: 'Get audit + cleanup →',
  mgmt: 'Discuss management →',
}

/** The middle card's badge. Deliberately NOT channel-themed. */
export const FEATURED_BADGE = 'Best first engagement'

/** Which card carries .featured / the badge / the primary .cta. */
export const FEATURED_TIER = 'cleanup'

/**
 * 3 channels × 3 tiers.
 *
 * `price` is a STRING and the `$` is not in it — the currency is a separate
 * <span class="currency">. `period` is '' for one-time tiers and the span
 * still renders (empty), because .price is a baseline flex row and removing
 * the span would change the gap arithmetic.
 *
 * `save` is null on every paid and organic tier and non-null on all three
 * `both` tiers — that is what decides whether a .save-pill renders at all.
 *
 * Feature counts are deliberately uneven (4/4/4 · 5/4/5 · 5/4/5). The layout
 * has to tolerate it; do not pad them to match.
 */
export const PRICING = {
  paid: {
    audit: {
      price: '299',
      period: '',
      note: 'One-time · Written findings · 48h target',
      save: null,
      feats: [
        'Structure & campaign setup review',
        'Search terms, match types & negatives',
        'Conversion tracking sanity check',
        'Prioritized fixes + 90-day roadmap',
      ],
    },
    cleanup: {
      price: '599',
      period: '',
      note: 'One-time · Audit + implementation · Under 1 week',
      save: null,
      feats: [
        'Everything in the audit',
        'Negatives built from real query history',
        'Campaign, budget & bidding cleanup',
        'Full change log for every update',
      ],
    },
    mgmt: {
      price: '750',
      period: '/mo',
      note: 'Month-to-month · Cancel anytime',
      save: null,
      feats: [
        'Weekly query & negatives work',
        'Budget, bid & campaign optimization',
        'Monthly summary + next actions',
        'Direct email access, changes documented',
      ],
    },
  },
  organic: {
    audit: {
      price: '349',
      period: '',
      note: 'One-time · Written findings · 72h target',
      save: null,
      feats: [
        'Technical crawl: indexation, speed, errors',
        'Content vs. buyer intent gap analysis',
        'On-page, titles & internal linking review',
        'AI Overviews & answer-engine readiness',
        'Prioritized fixes + 90-day roadmap',
      ],
    },
    cleanup: {
      price: '699',
      period: '',
      // en dash U+2013 in '1–2 weeks', not a hyphen
      note: 'One-time · Audit + implementation · 1–2 weeks',
      save: null,
      feats: [
        'Everything in the audit',
        'Technical fixes shipped (or dev-ready specs)',
        'Titles, meta & money-page cleanup',
        'Full change log for every update',
      ],
    },
    mgmt: {
      price: '850',
      period: '/mo',
      note: 'Month-to-month · Cancel anytime',
      save: null,
      feats: [
        'Monthly content & on-page priorities',
        'Technical monitoring & fixes',
        'Rank + Search Console reporting',
        'AI answer monitoring & entity upkeep',
        'Direct email access, changes documented',
      ],
    },
  },
  both: {
    audit: {
      price: '549',
      period: '',
      note: 'One-time · One combined report',
      save: 'Save $99',
      feats: [
        'Paid + organic audits, one report',
        'Overlap analysis: where ads buy what you rank for',
        'Unified tracking & Search Console check',
        'AI answer readiness across the page',
        'One prioritized 90-day roadmap',
      ],
    },
    cleanup: {
      price: '1,099',
      period: '',
      note: 'One-time · Both channels, one pass',
      save: 'Save $199',
      feats: [
        'Everything in both cleanups',
        // em dash U+2014, spaces both sides
        'Overlap fixes — stop buying clicks you earn',
        'Tracking + technical repairs together',
        'A single change log across channels',
      ],
    },
    mgmt: {
      price: '1,350',
      period: '/mo',
      note: 'Month-to-month · Cancel anytime',
      // the only save value carrying a period suffix
      save: 'Save $250/mo',
      feats: [
        'Everything in both plans',
        'Budgets shift as rankings move',
        'Paid query data feeds the content plan',
        'AI answer visibility, tracked over time',
        'One monthly report, one person',
      ],
    },
  },
}

/* ------------------------------------------------------------------------- */
/* FREE STRIP                                                                 */
/* ------------------------------------------------------------------------- */

/** Static siblings of the channel-driven copy. */
export const FREE_BADGE = 'Start here — free'
export const FREE_TITLE = 'The Leak Check'
export const FREE_CTA = 'Claim a leak check →'
/** #price-free is static markup and is never touched by any render path.
 *  It stays $0 with an empty period on all three channels. */
export const FREE_PRICE = { currency: '$', price: '0', period: '' }

/**
 * The free tier is deliberately single-channel. On "both" that limit becomes
 * the argument for the combined audit, so the copy pivots instead of hiding.
 *
 * `intro` is stored as PARTS rather than as an HTML string. The legacy value
 * went through innerHTML because the emphasis sits mid-sentence; modelling the
 * emphasis as data instead means no dangerouslySetInnerHTML anywhere in this
 * section. Concatenating `t` in order reproduces the legacy string exactly —
 * the originals are reproduced above each array so a character diff against
 * legacy/index.html is a one-line comparison.
 *
 * `stop` strings BEGIN LOWER-CASE on purpose: they are rendered as
 * `<b>{stopLabel}</b> — {stop}`, so the sentence reads
 * "WHERE IT STOPS — no fix list, no roadmap, …". `stopLabel` is uppercased by
 * CSS, not by the data, so it must stay in sentence case.
 */
export const FREE = {
  paid: {
    // 'Three checks on your Google Ads account and one number: roughly what you are burning every month. <strong>No charge, no card, no call.</strong>'
    intro: [
      {
        t: 'Three checks on your Google Ads account and one number: roughly what you are burning every month. ',
      },
      { t: 'No charge, no card, no call.', strong: true },
    ],
    feats: [
      'Overlap — ads bidding on terms you already rank for',
      'Wasted spend, estimated from your real search terms',
      'Conversion tracking: pass, fail, or actively misleading',
    ],
    stopLabel: 'Where it stops',
    stop: 'no fix list, no roadmap, no campaign-by-campaign scoring. That is the audit.',
    offer: 'Free Leak Check — Paid Search',
  },
  organic: {
    // 'Three checks on your site and Search Console, and one number: roughly what you are leaving on the table every month. <strong>No charge, no card, no call.</strong>'
    intro: [
      {
        t: 'Three checks on your site and Search Console, and one number: roughly what you are leaving on the table every month. ',
      },
      { t: 'No charge, no card, no call.', strong: true },
    ],
    feats: [
      // en dash U+2013 in '5–20'
      'Striking distance — queries ranking 5–20 you could own',
      'Money pages that rank but cannot convert',
      'Indexation and crawl red flags on pages that matter',
    ],
    stopLabel: 'Where it stops',
    stop: 'no fix list, no roadmap, no page-by-page scoring. That is the audit.',
    offer: 'Free Leak Check — Organic Search',
  },
  both: {
    // 'The free check covers <strong>one channel</strong> — pick whichever worries you more. The gap between them, where ads buy clicks you already earn, needs both sides open at once.'
    intro: [
      { t: 'The free check covers ' },
      { t: 'one channel', strong: true },
      {
        t: ' — pick whichever worries you more. The gap between them, where ads buy clicks you already earn, needs both sides open at once.',
      },
    ],
    feats: [
      'Pick paid — overlap, wasted spend, tracking',
      'Or pick organic — striking distance, money pages, indexation',
      'Either way: one number, three business days',
    ],
    stopLabel: 'Why the audit exists',
    stop: 'only the combined audit reads both channels against each other. That overlap analysis is usually where the money actually is.',
    // Deliberately the PAID string: no "Free Leak Check — Both Channels"
    // option exists in #lf-service. This is not a bug.
    offer: 'Free Leak Check — Paid Search',
  },
}

/* ------------------------------------------------------------------------- */
/* COMPARISON TABLE                                                           */
/* ------------------------------------------------------------------------- */

export const COMPARE_REGION_LABEL = 'Compare what each engagement includes'
export const COMPARE_NOTE = 'Every tier stands alone. Nothing here is a bundle.'

/**
 * Column headers, in DOM order. Column 0 is the row-label column and carries a
 * NO-BREAK SPACE so the empty header keeps its height (a collapsible ordinary
 * space would not).
 *
 * `tier` links a column to PRICING so the header price is derived from the
 * same object the card reads — legacy achieved this with a cross-tree
 * querySelector('[data-cmp]') write; here it is simply one source of truth.
 *
 * NOTE the head text: '+ Cleanup', not TIERS.cleanup ('Audit + Cleanup').
 * The table abbreviates and the cards do not. Both spellings ship.
 */
export const COMPARE_COLUMNS = [
  // U+00A0 NO-BREAK SPACE, written as an escape rather than pasted: a
  // literal NBSP is invisible in a diff and the next person to touch this
  // line would "tidy" it into an ordinary space, which collapses and
  // costs the empty header cell its height.
  { head: '\u00A0' },
  { head: 'Leak Check', price: 'Free', free: true },
  { head: 'Audit', tier: 'audit' },
  { head: '+ Cleanup', tier: 'cleanup' },
  { head: 'Management', tier: 'mgmt' },
]

/**
 * The eleven <tbody> rows, in DOM order.
 *
 *   cells    — four plain-text cells, no class.
 *   marks    — four booleans: true → <td class="y">✓</td>,
 *                             false → <td class="n">—</td>
 *   dynamic  — the row's four cells come from COMPARE[channel][key] instead.
 *              Legacy shipped these as four empty <td>s and filled them from
 *              JS on load; rendering them from data means there is no empty
 *              first-paint state at all, which is strictly better.
 *
 * ⚠️ POSITIONAL CSS: `.compare thead th:nth-child(3)` and
 * `.compare tbody td:nth-child(3)` highlight the Audit column. In a body row
 * child 1 is the <th> and child 2 is Leak Check, so child 3 is Audit. Any
 * wrapper element, <colgroup> or stray node inserted into a row shifts the
 * highlight onto the wrong column.
 */
export const COMPARE_ROWS = [
  {
    label: 'You end up with',
    cells: ['A number', 'A diagnosis', 'A fixed account', 'A managed account'],
  },
  { label: 'How much of search it looks at', dynamic: 'scope' },
  { label: 'Turnaround', dynamic: 'turnaround' },
  { label: "Finds what's leaking", marks: [true, true, true, true] },
  {
    label: 'Scores every campaign, not just the account',
    marks: [false, true, true, true],
  },
  { label: 'Tells you what to fix first', marks: [false, true, true, true] },
  {
    label: 'A 90-day plan you could hand to anyone',
    marks: [false, true, true, true],
  },
  {
    label: 'Clarify makes the changes for you',
    marks: [false, false, true, true],
  },
  { label: 'Written record of every change', marks: [false, false, true, true] },
  {
    label: 'Keeps working on it every week',
    marks: [false, false, false, true],
  },
  {
    label: "What you're committing to",
    cells: ['None', 'One-time', 'One-time', 'Cancel anytime'],
  },
]

/** U+2713 and U+2014, exactly as legacy authors them. */
export const MARK_YES = '✓'
export const MARK_NO = '—'

/**
 * The comparison table has to agree with the tab above it. Saying
 * "paid, organic, or both" while Paid Search is selected reads as a
 * different page talking. Turnaround differs per channel too — the
 * organic audit targets 72h, not 48h.
 *
 * Index → column is positional: [0] Leak Check, [1] Audit, [2] + Cleanup,
 * [3] Management.
 *
 * 'Paid search' / 'Organic search' here are SENTENCE case, unlike the Title
 * Case CH_LABEL values. Both spellings ship — do not unify them.
 */
export const COMPARE = {
  paid: {
    scope: ['Paid search', 'Paid search', 'Paid search', 'Paid search'],
    turnaround: ['3 days', '48h', 'Under a week', 'Ongoing'],
  },
  organic: {
    scope: [
      'Organic search',
      'Organic search',
      'Organic search',
      'Organic search',
    ],
    turnaround: ['3 days', '72h', '1–2 weeks', 'Ongoing'],
  },
  both: {
    // the free check stays single-channel here — that limit is the
    // whole argument for the combined audit
    scope: [
      'One channel — you pick',
      'Paid + organic',
      'Paid + organic',
      'Paid + organic',
    ],
    turnaround: ['3 days', '72h', '1–2 weeks', 'Ongoing'],
  },
}

/** The free column of the SCOPE row only is muted with <span class="no">, on
 *  the grounds that it is a limit rather than a feature. The free column of
 *  the TURNAROUND row ('3 days') is plain. Reproduced exactly. */
export const COMPARE_MUTED_ROW = 'scope'

/* ------------------------------------------------------------------------- */
/* SOFTWARE BLOCK — amber in every channel, never re-tinted                    */
/* ------------------------------------------------------------------------- */

export const SOFTWARE = {
  kicker: 'Or run it yourself',
  /** The <h3> splits around a .ital serif span, so it is stored in parts. */
  titleLead: 'The same leak detection, ',
  titleItal: 'as software',
  titleTail: '.',
  copy: 'Watches your Google Ads account and flags waste, tracking breaks and query drift as they appear. You make the calls.',
  currency: '$',
  price: '149',
  period: '/mo',
  terms: 'One plan · one Google Ads account · cancel anytime',
  cta: 'Schedule an onboarding call →',
  offer: 'Clarify Software — Onboarding',
}

/* ------------------------------------------------------------------------- */
/* SECTION HEAD + FINEPRINT                                                   */
/* ------------------------------------------------------------------------- */

export const EYEBROW = 'Pricing'
export const HEADLINE = 'Every price on the page. Nothing behind a call.'
export const LEDE =
  'Pick a channel — or bundle both and save about 15%. Public pricing keeps the conversation about performance, not procurement.'
export const FINEPRINT =
  'Best fit: around $1,500+/mo in ad spend, or organic traffic worth defending. Dashboards from $299 — you own the code and the data.'

/* ------------------------------------------------------------------------- */
/* DERIVED STRINGS                                                            */
/* ------------------------------------------------------------------------- */

/**
 * data-offer for a tier CTA. Em dash, one space either side.
 *
 * A single character of drift here silently breaks the contact form's
 * preselect, which matches on exact <option> text equality and reports
 * nothing when it fails. The nine values this produces are:
 *   Audit — Paid Search / Organic Search / Both Channels
 *   Audit + Cleanup — Paid Search / Organic Search / Both Channels
 *   Monthly Management — Paid Search / Organic Search / Both Channels
 */
export const tierOffer = (tierKey, ch) => `${TIERS[tierKey]} — ${CH_LABEL[ch]}`

/** Comparison-table header price, e.g. '$1,350/mo'. STRING concatenation —
 *  the comma in '1,350' is authored, not formatted. */
export const comparePrice = (tier) => `$${tier.price}${tier.period}`

/**
 * aria-live text for #segLive. Produces exactly:
 *   Showing paid search pricing.
 *   Showing organic search pricing.
 *   Showing both channels pricing.
 *
 * The third is grammatically awkward and is nonetheless the shipping string.
 * It is derived from CH_LABEL rather than hand-written per channel so the
 * label and the announcement cannot drift.
 */
export const channelAnnouncement = (ch) =>
  `Showing ${CH_LABEL[ch].toLowerCase()} pricing.`

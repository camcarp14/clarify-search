/**
 * The dual-channel account scorecard.
 *
 * Transcribed VERBATIM from legacy/index.html (the `INST` object, lines
 * 2632-2665). This was the old hero's right-hand panel and it was the one thing
 * the React port dropped — the new hero shows the SERP overlap instead. Every
 * score, level, note and mini-stat below is the shipping copy; nothing here is
 * invented or rounded.
 *
 * It lives in its own section now rather than the hero, and that reads better:
 * the hero shows the PROBLEM (a click bought on a term already ranked #1), and
 * this shows the DELIVERABLE — the graded account someone actually receives.
 * It sits directly after Method, whose step 02 promises exactly this artifact.
 */

export const EYEBROW = 'The deliverable'
export const HEADLINE_LEAD = 'Score, reason, fix. Every audit reads like '
export const HEADLINE_ITAL = 'this'
export const LEDE =
  'Toggle the channel. Same structure either way: one number you can act on, a plain-language reason, and the specific move that closes the gap.'

export const BUSINESS = 'Lakeview Family Dental'

/** Ring circumference, r=52. Kept as the legacy literal. */
export const CIRC = 326.7256

export const LVL_LABEL = { fair: 'Fair', poor: 'Poor', good: 'Good' }

export const CHANNELS = [
  { key: 'paid', label: 'Paid' },
  { key: 'organic', label: 'Organic' },
]

export const INST = {
  paid: {
    sub: 'Google Ads · last 90 days',
    score: 72,
    flag: 'Needs work',
    verdict: 'Fixable. Several high-impact leaks with clear first moves.',
    minis: [
      { v: '18%', cls: 'v-red', l: 'Est. spend waste' },
      { v: '61%', cls: 'v-amber', l: 'Tracking confidence' },
    ],
    rows: [
      {
        t: 'Search intent control',
        lvl: 'fair',
        s: 58,
        n: 'Search terms drifting from buyer intent; negatives not tight enough.',
      },
      {
        t: 'Conversion tracking readiness',
        lvl: 'poor',
        s: 42,
        n: 'Forms and calls need cleaner attribution before decisions are reliable.',
      },
      {
        t: 'PMax & automation guardrails',
        lvl: 'fair',
        s: 63,
        n: 'Automation is on; signals, exclusions, and rules need sharper control.',
      },
      {
        t: 'Testing & change discipline',
        lvl: 'good',
        s: 74,
        n: 'Structure exists; documenting changes would sharpen optimization.',
      },
    ],
  },
  organic: {
    sub: 'Organic search · last 90 days',
    score: 64,
    flag: 'Underbuilt',
    verdict: 'Solid base. Technical debt and thin money pages are capping growth.',
    minis: [
      { v: '19%', cls: 'v-red', l: 'Pages with index issues' },
      { v: '43', cls: 'v-mint', l: 'Striking-distance terms' },
    ],
    rows: [
      {
        t: 'Technical health',
        lvl: 'fair',
        s: 61,
        n: 'Crawl and speed issues on the templates that matter most.',
      },
      {
        t: 'Content vs. buyer intent',
        lvl: 'poor',
        s: 48,
        n: 'Money pages thin; blog chasing volume instead of buyers.',
      },
      {
        t: 'On-page & internal links',
        lvl: 'fair',
        s: 66,
        n: 'Duplicated titles; orphan pages missing link equity.',
      },
      {
        t: 'Authority & local signals',
        lvl: 'good',
        s: 72,
        n: 'GBP healthy, citations consistent. Protect it.',
      },
    ],
  },
}

/** Legacy's own disclaimer under the panel. Keep it: these are not real client
 *  numbers and the page says so. */
export const DISCLAIMER = 'Illustration, not a real client.'

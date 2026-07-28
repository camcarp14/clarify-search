/**
 * ============================================================================
 * AI BUILD — COPY   (§B.8 / section spec §1)
 * ============================================================================
 * Every string in this file is byte-exact from legacy/index.html — the markup
 * at lines 2144–2231 and the `opsMock()` script block at 2526–2607. Nothing
 * here may be rewritten, shortened, re-punctuated or "improved" (§C.9).
 *
 * CHARACTER INVENTORY for this section, so a diff can be checked by counting:
 *   —  U+2014 EM DASH          × 8  (eyebrow 1, card 02 1, feed rows 4,
 *                                    strip paragraph 1, figcaption 1 — the
 *                                    last two live inline in AiBuild.jsx)
 *   ’  U+2019 RIGHT SINGLE QUOTE × 1  STATUS[3] — "yesterday’s payments".
 *                                    THIS IS THE ONLY CURLY APOSTROPHE IN THE
 *                                    ENTIRE LEGACY FILE (§C.9). Every other
 *                                    apostrophe in this section is a straight
 *                                    ASCII ' — "how you're found", "your
 *                                    team's hands", "Clarify's own monitor",
 *                                    "isn't worth it", "you'll be told",
 *                                    "it's a faster answer". Do not
 *                                    typographically "improve" them.
 *   ★  U+2605 BLACK STAR       × 2  (STATUS[1], EVENTS[2])
 *   ▲  U+25B2 BLACK UP TRIANGLE × 1 (the delta line)
 *   →  U+2192 RIGHTWARDS ARROW × 1  (the CTA label — inline in AiBuild.jsx)
 *
 * WHAT IS *NOT* IN THIS FILE, AND WHY
 * Three copy blocks carry inline emphasis — the h2's `<span class="ital">`,
 * the figcaption's `<strong>` and the build strip's `<strong>`. Splitting a
 * sentence into fragments to reassemble it in JSX is exactly how a space goes
 * missing, so those three are written inline in AiBuild.jsx, once, in one
 * piece (spec risk 1: "write those as JSX children, not HTML strings").
 *
 * The three counter TARGETS (11.4 / 94 / 2) are not here either. They are
 * simultaneously copy and motion, and §B.13 #4 requires each to carry an
 * explicit `decimals` alongside it, so they live in aiBuild.motion.js under
 * `seq.hours` / `seq.chips`. Their *units and labels* are here.
 * ============================================================================
 */

/* --------------------------------------------------------------------------
   SECTION HEAD — the eyebrow only. The h2 and the lede paragraph are inline
   in the JSX (the h2 for its `.ital` span, the lede because it sits directly
   under it and reads better as one block at the call site).
   -------------------------------------------------------------------------- */

export const EYEBROW = 'AI Solutions — the second practice'

/* --------------------------------------------------------------------------
   THE THREE BUILD CARDS
   `num` is rendered TWICE per card — once as the resting face and once as an
   accent twin — because a colour change is an opacity cross-fade between
   stacked layers (§A.4 rule 2). The whole `.build-idx` is aria-hidden in the
   markup (spec §2: "decorative numbering"), so the twin costs nothing in the
   accessibility tree.
   -------------------------------------------------------------------------- */

export const BUILD_CARDS = [
  {
    num: '01',
    title: 'Kill the repeated task.',
    body: 'The report someone rebuilds every Monday. The inbox triaged by hand. If it follows rules, it can run itself.',
  },
  {
    num: '02',
    title: 'Make your data answer questions.',
    body: 'An assistant that actually knows your pricing, your policies, your history — instead of guessing like a generic chatbot.',
  },
  {
    num: '03',
    title: "Put a tool in your team's hands.",
    body: "Internal apps built around how you already work. Clarify's own monitor started exactly this way.",
  },
]

/* --------------------------------------------------------------------------
   "ALSO BUILT" CHIP ROW
   In legacy the label is a BARE TEXT NODE inside the <p>, so it inherits the
   container's uppercase-mono styling while each chip <span> undoes it
   (spec risk 23). Here it is a <span> so the timeline can stagger it with the
   chips; AiBuild.css strips the pill styling back off it, declaration for
   declaration, so it renders exactly as the bare text node did.
   The trailing space is legacy's and is kept.
   -------------------------------------------------------------------------- */

export const ALSO_LABEL = 'Also built: '

export const ALSO_CHIPS = [
  'quote drafts from a photo',
  'missed-call text-back',
  'invoice chasing',
  'review replies for approval',
  'inventory reorder alerts',
  'onboarding paperwork',
]

/* --------------------------------------------------------------------------
   OPS COPILOT MOCK — the static furniture
   -------------------------------------------------------------------------- */

export const MOCK = {
  /** `.mock-bar` is aria-hidden in its entirety (spec §2) — fake window
   *  chrome. These two strings are decorative and never announced. */
  title: 'Lakeview Family Dental — Ops Copilot',
  live: 'live',

  /** Left panel. `heroInitial` is the text legacy paints before the count-up
   *  runs, and it is also this section's progress-0 state: the counter tween
   *  carries immediateRender:false, so the DOM text IS what the user sees at
   *  the top of the pin. */
  hoursLabel: 'Hours given back this week',
  heroInitial: '0.0',
  hoursUnit: 'hrs',
  delta: '▲ 3.2 more than last week',

  /** The two stat chips, in DOM order. `initial` is their progress-0 text for
   *  the same reason as `heroInitial`. */
  chips: [
    { initial: '0', unit: '%', label: 'Calls handled first try' },
    { initial: '0', unit: 'min', label: 'Average reply time' },
  ],

  /** aria-label on the <ul>. Deliberately NOT an aria-live region and it must
   *  not become one (spec §2 / risk 19). */
  feedLabel: 'Recent automated activity',
}

/** The sparkline geometry, lifted verbatim from the legacy <svg>. The area
 *  path closes the line back along the baseline; the line path does not. Kept
 *  as data so the two can never drift apart by a hand-edit to one of them. */
export const SPARK = {
  viewBox: '0 0 240 60',
  area: 'M0,48 L34,44 L68,46 L102,36 L136,31 L170,22 L204,14 L240,7 L240,60 L0,60 Z',
  line: 'M0,48 L34,44 L68,46 L102,36 L136,31 L170,22 L204,14 L240,7',
  dot: { cx: 240, cy: 7, r: 3.5 },
  /** The two gradient stops. These are legacy literals — a dark-theme iris
   *  (154,140,255) that does NOT match the ported --iris-rgb (106,89,219).
   *  Copied rather than tokenised, exactly as spec §4.2 / risk 21 requires:
   *  swapping them visibly changes the rendered fill. */
  fillFrom: 'rgba(154,140,255,.42)',
  fillTo: 'rgba(154,140,255,0)',
}

/* --------------------------------------------------------------------------
   STATUS LINE — the four variants
   Legacy cycles these into `#mkNow` on a 3300 ms setInterval. That interval is
   DELETED (§D.9): the four variants are stacked layers that cross-fade at
   authored timeline positions (aiBuild.motion.js `seq.status.switchAt`), so
   the status is a function of scroll position like everything else and the
   reduced-motion branch can simply hold variant 0.

   Index 3 carries the file's only curly apostrophe. Do not normalise it.
   -------------------------------------------------------------------------- */

export const STATUS = [
  'Watching the front desk inbox',
  'Drafting a reply to a 4★ review',
  'Checking tomorrow for schedule gaps',
  'Reconciling yesterday’s payments',
]

/* --------------------------------------------------------------------------
   THE FEED
   Legacy prepends a row every 4600 ms from an 8-entry ring buffer. That
   interval is DELETED too (§B.8: "the feed is authored data revealed by the
   scrub"). All eight entries are kept because all eight are shipping copy and
   anything omitted here gets invented later (§C.9) — the first five are what
   renders, and which five render is a one-line change against this array.

   Legacy stores each entry as a [descriptionHTML, tagClass, tagLabel] triple
   and injects it with `li.innerHTML`, because entry 0 carries a literal
   `<b>Tue 3:00pm</b>`. Here the markup is DATA, not a string: `pre` / `em` /
   `post`, rendered as JSX children. Only entry 0 has an `em`; the field is
   optional on the other seven (spec risk 1 — no dangerouslySetInnerHTML for
   one <b>).

   `tag` and `label` stay a pair rather than being derived from each other.
   'done' always happens to pair with 'auto' and 'wait' with 'needs you' in
   all eight entries, but legacy models them as two independent fields and a
   derived label would silently rewrite the copy the day one entry differs.
   -------------------------------------------------------------------------- */

export const EVENTS = [
  {
    pre: 'Missed call from a new patient — texted back, booked ',
    em: 'Tue 3:00pm',
    tag: 'done',
    label: 'auto',
  },
  {
    pre: 'Insurance question answered from your own coverage doc',
    tag: 'done',
    label: 'auto',
  },
  {
    pre: 'New 4★ review — reply drafted in your voice',
    tag: 'wait',
    label: 'needs you',
  },
  {
    pre: 'Weekly production report built and emailed to the front desk',
    tag: 'done',
    label: 'auto',
  },
  {
    pre: 'Two unpaid balances over 30 days — reminders queued',
    tag: 'wait',
    label: 'needs you',
  },
  {
    pre: 'Tomorrow has two schedule gaps — recall list ready to send',
    tag: 'wait',
    label: 'needs you',
  },
  {
    pre: 'New patient forms completed before the appointment',
    tag: 'done',
    label: 'auto',
  },
  {
    pre: 'Supply reorder hit its threshold — cart prepared',
    tag: 'wait',
    label: 'needs you',
  },
]

/**
 * Minutes since midnight for the five seed rows: 09:14, 09:02, 08:47, 08:31,
 * 08:05. Legacy's comment is load-bearing and is kept — "must descend or the
 * feed reads wrong": the newest row is at the TOP, so the times count
 * backwards down the list.
 */
const START = [554, 542, 527, 511, 485]

/** Legacy `hhmm()`, verbatim: zero-pads hours AND minutes, wraps hours at 24.
 *  Pure arithmetic over a frozen array — no Date, no random, no browser API —
 *  so first paint is identical on the server, in the prerender and in the
 *  browser (spec risk 8: keep it deterministic). */
const hhmm = (mins) => {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`
}

/**
 * The rendered feed. Five rows, `EVENTS[0..4]` paired positionally with
 * `START[0..4]`, exactly as legacy's first paint does.
 *
 * `id` is a stable authored key, not the array index and not the event text —
 * indices would let React reuse a DOM node across a data change and the row
 * would keep the previous row's tween state, and the texts repeat every eight
 * entries (spec risk 4).
 *
 * How many of these are VISIBLE is a breakpoint decision, not a data one:
 * §B.8 shows 5 on desktop and 3 on mobile, and that number lives in
 * aiBuild.motion.js as `feed.rowsShown`.
 */
export const FEED_ROWS = START.map((mins, i) => ({
  id: `aib-feed-${i}`,
  time: hhmm(mins),
  ...EVENTS[i],
}))

/* --------------------------------------------------------------------------
   BOTTOM CTA STRIP
   The paragraph opens with a <strong> that stops after "begins." — written
   inline in the JSX so the emphasis boundary cannot drift.
   -------------------------------------------------------------------------- */

export const STRIP = {
  kicker: 'How it starts',
  priceFrom: 'Builds from',
  price: '$1,500',
  /** Trailing space before the arrow is legacy's. → is U+2192. */
  cta: 'Scope a build →',
  /** Forward contract with #contact (spec §3.4 / risk 15): the global
   *  `[data-offer]` handler preselects the `#lf-service` <option> whose TEXT
   *  is exactly this string (legacy line 2401). Matching is string equality,
   *  so the em dash matters. The Contact section is not built yet; this
   *  attribute is the handshake and must not be dropped in the meantime. */
  offer: 'AI Solutions — Build',
}

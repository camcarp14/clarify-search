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

/* --------------------------------------------------------------------------
   THE CHART

   This was two hand-written path strings lifted verbatim from the legacy
   <svg>, kept as data only so the line and the area could not drift apart. It
   is DERIVED from a value series now, and the reason is not tidiness: a
   gridline, an axis and a "last week" reference cannot be placed on a curve
   that has no scale behind it, and without them the panel reads as a mood
   rather than a measurement.

   THE SERIES AGREES WITH THE COPY, which is the whole point of deriving it.
   The counter lands on 11.4 and the delta line states that is 3.2 more than
   last week, so the last point is 11.4 and the one before it is 8.2. Under a
   13-hour scale six of the eight points land within a pixel of where legacy
   drew them; the only two that moved are the two the arithmetic disagreed
   with. Legacy's own geometry implied 9.9 for last week — a 1.5 rise, drawn
   directly under a sentence claiming 3.2.

   `max` is 13, not 12, so the peak clears the top gridline instead of touching
   the frame.

   NOTE ON THE DASH REVEAL: `.mk-line` carries `stroke-dasharray: 300` and the
   timeline animates the offset from 300 to 0. The path is ~246 units long
   (legacy's was ~245, not the ~296 its comment claims), and any dasharray
   longer than the path hides it completely, so 300 still clears it.
   -------------------------------------------------------------------------- */

/** Hours given back, one point per week, oldest → newest. */
const SPARK_VALUES = [2.6, 3.4, 3.0, 5.2, 6.2, 7.0, 8.2, 11.4]
/** Full scale of the y axis, in hours. */
const SPARK_MAX = 13
const SPARK_W = 240
const SPARK_H = 60

const spx = (i) => +((SPARK_W * i) / (SPARK_VALUES.length - 1)).toFixed(2)
const spy = (v) => +(SPARK_H - (v / SPARK_MAX) * SPARK_H).toFixed(2)

const SPARK_POINTS = SPARK_VALUES.map((v, i) => ({ v, x: spx(i), y: spy(v) }))
const SPARK_LINE = SPARK_POINTS.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ')
const SPARK_LAST = SPARK_POINTS[SPARK_POINTS.length - 1]
const SPARK_PREV = SPARK_POINTS[SPARK_POINTS.length - 2]

export const SPARK = {
  viewBox: `0 0 ${SPARK_W} ${SPARK_H}`,
  width: SPARK_W,
  height: SPARK_H,
  /** The area closes the line back along the baseline; the line does not. */
  line: SPARK_LINE,
  area: `${SPARK_LINE} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`,
  /** Every point gets a mark. The head is the accent dot below, so the marks
   *  stop one short of it. */
  marks: SPARK_POINTS.slice(0, -1),
  dot: { cx: SPARK_LAST.x, cy: SPARK_LAST.y, r: 3.5 },
  /** Gridlines are declared in HOURS, not in pixels, so they follow the scale
   *  instead of being positions someone has to re-derive by hand.
   *
   *  5 and 10, not the obvious 4/8/12: the dashed reference sits at 8.2, and a
   *  solid rule at 8 lands nine tenths of a pixel from it. Two rules that close
   *  together do not read as a grid and a reference, they read as a rendering
   *  fault. At 5 and 10 the reference has 9px of clear air above it and 16
   *  below. Two rules is also enough — this is a 66px plot. */
  grid: [5, 10].map((v) => ({ v, y: spy(v) })),
  /** The dashed reference: last week's value, which is the figure the delta
   *  line names. It is labelled in the axis row as a legend rather than pinned
   *  to the line itself — inside a plot this short, a tag on the line crosses
   *  either the line, a gridline, or the curve, and it did all three. */
  ref: { v: SPARK_PREV.v, y: SPARK_PREV.y, label: `Last week · ${SPARK_PREV.v}` },
  /** Eight points, one per week. */
  axis: { from: '8 weeks ago', to: 'This week' },
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
 * Minutes since midnight for the seed rows: 09:14, 09:02, 08:47, 08:31, 08:05,
 * 07:52. Legacy's comment is load-bearing and is kept — "must descend or the
 * feed reads wrong": the newest row is at the TOP, so the times count
 * backwards down the list.
 *
 * The sixth is new. Legacy seeded five because a JS ticker prepended a row
 * every 4.6s and five was a starting length; nothing here ticks. What decides
 * the number now is the panel: the left column grew when the chart got a real
 * plot, and five rows left ~110px of empty feed beside it. EVENTS[5] was
 * already in this file — all eight are shipping copy — so the row is copy that
 * existed, not copy that was written to fill a gap.
 */
const START = [554, 542, 527, 511, 485, 472]

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
 * The rendered feed. `EVENTS[0..n]` paired positionally with `START[0..n]`.
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

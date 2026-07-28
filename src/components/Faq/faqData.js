/**
 * ============================================================================
 * FAQ CONTENT — the twenty verbatim strings
 * ============================================================================
 * Source of truth: legacy/index.html lines 2263-2310.
 * Section spec: specs/faq.md §1 ("COPY — verbatim").
 *
 * Twenty distinct user-visible strings live in this section: 1 eyebrow,
 * 1 heading, 9 questions, 9 answers. There is no intro paragraph, no CTA, no
 * footnote and no "still have questions?" line. Do not add one.
 *
 * ---------------------------------------------------------------------------
 * ENCODING FACTS — verified against the legacy file by codepoint dump
 * ---------------------------------------------------------------------------
 * The ONLY non-ASCII character in this entire section is U+2014 EM DASH (—),
 * three occurrences: answers 1, 2 and 8. Confirmed by
 *   sed -n '2263,2310p' legacy/index.html | grep -oP '[^\x00-\x7F]'
 * which returns three em dashes and nothing else.
 *
 * Every apostrophe here is the STRAIGHT ASCII apostrophe U+0027 ('), not
 * &rsquo; and not U+2019: "you're", "it's", "what's". This differs from
 * Hero.jsx, which renders `what&rsquo;s` where legacy has `what's`. That drift
 * is a known one-character bug in the reference implementation (motion-system
 * §C.9) and it is deliberately NOT propagated here. Strings that contain an
 * apostrophe are written with double quotes so the character survives verbatim
 * and no escaping is needed.
 *
 * Legacy question 6 is `ChatGPT &amp; Perplexity` in the HTML source. `&amp;`
 * is source encoding, not copy — the rendered text is a literal ampersand, so
 * it is a plain `&` here. Writing `&amp;` into JSX would render the five
 * characters "&amp;" on the page.
 *
 * ---------------------------------------------------------------------------
 * WHY ANSWERS ARE RUN LISTS AND NOT JSX FRAGMENTS
 * ---------------------------------------------------------------------------
 * Exactly one answer carries emphasis: `<strong>whether</strong>` in answer 1,
 * wrapping that single word and nothing else, no spaces inside the tag. It
 * carries the free-vs-paid distinction and must survive the port.
 *
 * The section spec (R10) suggests storing answers as JSX fragments. That would
 * require JSX syntax inside a data module, and the handoff convention
 * (motion-system §C.1) names data modules `<section>Data.js` — a `.js`
 * extension that this project's Vite/esbuild pipeline does not parse JSX in.
 * So each answer is an ordered list of RUNS instead:
 *
 *   a bare string  → a plain text run
 *   { strong: '…' } → a <strong> run
 *
 * Faq.jsx maps runs to elements. This keeps the naming convention, keeps the
 * file plain data, and — which is the actual point of R10 — keeps
 * dangerouslySetInnerHTML out of this section entirely. There is no innerHTML
 * anywhere in the FAQ.
 *
 * ---------------------------------------------------------------------------
 * IDS
 * ---------------------------------------------------------------------------
 * `slug` is not copy. It exists only to mint the two DOM ids each row needs to
 * wire `aria-controls` from its <summary> to its body. They are namespaced
 * `faq-q-*` / `faq-a-*` so nothing in the other eleven sections can collide.
 *
 * `defaultOpen` reproduces legacy exactly: item 1 carries both `class="faq oa"`
 * and the boolean `open` attribute; items 2-9 carry neither. There is no `name`
 * attribute on the legacy <details>, so the items are INDEPENDENT — several can
 * be open at once and opening one never closes another. Do not add exclusivity.
 * ============================================================================
 */

/** Eyebrow. `<span class="mono-label">`, not a heading and not a `<p>`. */
export const EYEBROW = 'FAQ'

/** The section's only heading. Level 2. */
export const HEADING = 'Straight answers before you send access.'

export const FAQ_ITEMS = [
  {
    slug: 'free-check',
    /** Legacy line 2270. Item 1 is the only one that starts open. */
    defaultOpen: true,
    question: 'Is the free leak check actually free?',
    answer: [
      'Yes. No card, no call, no trial that becomes a bill. One channel, five a week, and the scorecard is yours either way. It tells you ',
      // The one piece of emphasis in the section. One word, no spaces inside
      // the tag — the space before it ends the run above, the space after it
      // begins the run below.
      { strong: 'whether' },
      " you're leaking and roughly how much — the audit tells you where it's coming from and what to fix first.",
    ],
  },
  {
    slug: 'both-channels',
    question: 'Do I have to do both channels?',
    answer: [
      'No — plenty of accounts start with one. The bundle exists because paid queries reveal what content should target, and rankings tell ads what not to buy. Each stands alone.',
    ],
  },
  {
    slug: 'monthly-commitment',
    question: 'Do I need to commit to monthly management?',
    answer: [
      'No. Audits and cleanups are one-time projects. Management is month-to-month, cancel anytime.',
    ],
  },
  {
    slug: 'access',
    question: 'What access do you need?',
    answer: [
      'Read-only Google Ads, GA4 and Search Console. Admin only if you want changes implemented. You stay the owner and can revoke anytime.',
    ],
  },
  {
    slug: 'organic-speed',
    question: 'How fast does organic actually move?',
    // Semicolon after "weeks", not a comma and not a dash.
    answer: [
      'Slower than ads. Technical fixes can show in weeks; content compounds over months. The roadmap separates quick wins from long bets so you know which is which.',
    ],
  },
  {
    slug: 'ai-answers',
    // Ampersand, not the word "and". Legacy source is `&amp;`.
    question: 'What about AI Overviews, ChatGPT & Perplexity?',
    answer: [
      'Built into organic and combined engagements, never billed separately. Models cite sources they can parse and trust, which is the same structured data and authority your organic work already builds.',
    ],
  },
  {
    slug: 'vs-agency',
    question: 'How is this different from an agency?',
    answer: [
      'Agencies bundle search into broad retainers with multiple handoffs. Clarify is narrower, and you work with the person doing the work.',
    ],
  },
  {
    slug: 'guarantees',
    question: 'Do you guarantee results or rankings?',
    answer: [
      'No — nobody controls Google, and anyone who guarantees otherwise is selling something. The goal is better account quality and honest measurement.',
    ],
  },
  {
    slug: 'hire-or-software',
    question: 'Hire Clarify or use the software?',
    // Semicolon after "wrong"; straight apostrophe in "what's".
    answer: [
      "Software keeps you informed. Management gets it handled. The tool flags what's wrong; hiring Clarify means someone decides what to do about it and does it.",
    ],
  },
]

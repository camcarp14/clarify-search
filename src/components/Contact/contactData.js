/**
 * ============================================================================
 * CONTACT — COPY, SELECT OPTIONS, ERROR STRINGS, LEAD ENDPOINT
 * ============================================================================
 * Every user-visible string in `#contact` and `.site-footer` lives here,
 * lifted character-for-character from legacy/index.html (markup 2311–2441,
 * script 2968–3078).
 *
 * WHY A DATA MODULE AND NOT JSX PROSE (§C.9): "strings that live in JS data
 * (…form error messages…) go into <section>Data.js, lifted from the legacy
 * <script> block verbatim — including the error strings, which are copy."
 * Keeping the prose here too means the whole section's copy can be diffed
 * against legacy as plain JS strings, with no JSX escaping in the way.
 *
 * ---------------------------------------------------------------------------
 * CHARACTER-SET WARNING — these were byte-inspected. Do not "improve" them.
 * ---------------------------------------------------------------------------
 * Every apostrophe below is a straight ASCII `'` (U+0027). The legacy file
 * contains exactly ONE curly apostrophe in 3082 lines and it is not in this
 * section (§C.9). `you'll`, `it's`, `You'll`, `you'd` are all straight.
 *
 * The non-ASCII characters that ARE present, and where:
 *   —  U+2014 EM DASH       service options; "Takes about a minute —";
 *                           "Thanks —"; "The clicks you earn —" (other section)
 *   –  U+2013 EN DASH       budget ranges ONLY ($1,000–$3,000 / mo)
 *   …  U+2026 ELLIPSIS      textarea placeholder; "Sending…"
 *   →  U+2192 RIGHT ARROW   "Send my request →"
 *   ✓  U+2713 CHECK MARK    success glyph
 *   ©  U+00A9 COPYRIGHT     footer
 * Em dash and en dash are NOT interchangeable here.
 * ============================================================================
 */

import { useEffect, useState } from 'react'

/* ------------------------------------------------------------------------- */
/* 1. CONTACT COPY COLUMN                                                     */
/* ------------------------------------------------------------------------- */

/** `span.mono-label`. Source case is sentence case; the uppercase is CSS
 *  `text-transform`, so the string must stay sentence case or a copy diff
 *  against legacy fails. */
export const EYEBROW = 'Start free'

/** `<h2>` split around its inline `<span class="ital">`. The trailing full
 *  stop is OUTSIDE the italic span — "Get the *clarity*." not "*clarity.*" */
export const HEADING = {
  before: 'Send the account. Get the ',
  ital: 'clarity',
  after: '.',
}

/** Lede `<p>`, split around its `<strong>`. Legacy:
 *  "…not a sales call. <strong>Reply within one business day</strong>, no
 *  obligation." — the comma and " no obligation." are OUTSIDE the strong. */
export const LEDE = {
  before:
    "Tell Clarify how you show up in search and what feels broken. Ask for the leak check and you'll get a number back, not a sales call. ",
  strong: 'Reply within one business day',
  after: ', no obligation.',
}

/** `<ol class="next-steps">`. Each item is a hand-authored numeral plus a
 *  content span whose LEAD SENTENCE is `<strong>` and whose remainder is a
 *  bare text node. The leading space of `rest` is the space that separates the
 *  two in legacy's `<strong>…</strong> A minute of typing…`. */
export const NEXT_STEPS = [
  {
    n: '1',
    strong: 'You send the details.',
    rest: ' A minute of typing, no call to book.',
  },
  {
    n: '2',
    strong: 'You get a reply, not a pitch.',
    rest: ' Clear scope and the right starting point.',
  },
  {
    n: '3',
    strong: 'You decide.',
    rest: ' Nothing, the audit, cleanup, or management.',
  },
]

/** `.email-inline`. The trailing space before the anchor is legacy's. */
export const EMAIL_INLINE_PREFIX = 'Prefer email? '

/* ------------------------------------------------------------------------- */
/* 2. FORM CARD                                                               */
/* ------------------------------------------------------------------------- */

export const FORM_HEAD = {
  title: 'Get your leak check',
  /** Em dash (U+2014) after "minute". */
  blurb:
    'Takes about a minute — or pick a paid engagement in the dropdown. Fields marked * are required.',
}

/** The honeypot's own label. Its wrapper is `aria-hidden="true"` and the input
 *  is `tabindex="-1"`, so this string never reaches a user or a screen reader —
 *  it exists so a naive form-filling bot sees a labelled field. */
export const HONEYPOT_LABEL = 'Leave this field empty'

/**
 * Complete field inventory, in DOM order. This drives the rendered form AND
 * the focus order on a failed submit, so the order is load-bearing.
 *
 * `required` is emitted as a real attribute for parity with legacy, but the
 * validator does NOT read it — validation runs off REQUIRED_FIELDS below,
 * exactly as legacy's hardcoded list does.
 *
 * Note `website` is `type="text"`, not `type="url"`: deliberate in legacy so
 * `yourbusiness.com` without a scheme does not trip native validation.
 */
export const FIELDS = {
  name: {
    id: 'lf-name',
    name: 'name',
    label: 'Your name *',
    type: 'text',
    autoComplete: 'name',
    required: true,
    placeholder: 'Jane Smith',
  },
  business: {
    id: 'lf-business',
    name: 'business',
    label: 'Business name *',
    type: 'text',
    autoComplete: 'organization',
    required: true,
    placeholder: 'Smith Dental Co.',
  },
  email: {
    id: 'lf-email',
    name: 'email',
    label: 'Email *',
    type: 'email',
    autoComplete: 'email',
    inputMode: 'email',
    required: true,
    placeholder: 'you@yourbusiness.com',
  },
  website: {
    id: 'lf-website',
    name: 'website',
    label: 'Website ',
    labelOptional: '(optional)',
    type: 'text',
    autoComplete: 'url',
    inputMode: 'url',
    required: false,
    placeholder: 'yourbusiness.com',
  },
  spend: {
    id: 'lf-spend',
    name: 'monthly_budget',
    label: 'Monthly search budget *',
    required: true,
  },
  service: {
    id: 'lf-service',
    name: 'service',
    label: 'What do you need? *',
    required: true,
  },
  details: {
    id: 'lf-details',
    name: 'details',
    label: 'What feels broken? ',
    labelOptional: '(optional)',
    required: false,
    /** Ends with … (U+2026) and NO trailing full stop. */
    placeholder:
      'e.g. spend is up but leads are flat, traffic dropped after a redesign, not sure if tracking is right…',
  },
  bot: {
    id: 'lf-bot',
    name: 'bot-field',
  },
}

/** `#lf-spend` placeholder option — `value=""`, disabled. */
export const BUDGET_PLACEHOLDER = 'Select a range'

/** Rows 3 and 4 use EN DASH (U+2013), not a hyphen and not an em dash.
 *  None of these carry a `value` attribute in legacy, so their submitted
 *  value is their own text — keep it that way (§5 risk 9). */
export const BUDGET_OPTIONS = [
  'Not investing yet',
  'Under $1,000 / mo',
  '$1,000–$3,000 / mo',
  '$3,000–$10,000 / mo',
  '$10,000+ / mo',
]

/** `#lf-service` placeholder option — `value=""`, disabled. */
export const SERVICE_PLACEHOLDER = 'Select an option'

/**
 * ⚠️ THESE STRINGS ARE A JOIN KEY, NOT JUST DISPLAY COPY.
 *
 * The pricing / software / AI-build CTAs carry `data-offer="<one of these>"`
 * and the preselect matches on exact string equality (legacy 2974). One
 * changed character silently breaks the cross-section preselect and nothing
 * throws. Every dash below is an EM DASH (U+2014) with a single space each
 * side. `Custom Reporting & Data Tools` is `&amp;` in the HTML source and a
 * plain `&` here.
 */
export const SERVICE_OPTIONS = [
  'Free Leak Check — Paid Search',
  'Free Leak Check — Organic Search',
  'Audit — Paid Search',
  'Audit — Organic Search',
  'Audit — Both Channels',
  'Audit + Cleanup — Paid Search',
  'Audit + Cleanup — Organic Search',
  'Audit + Cleanup — Both Channels',
  'Monthly Management — Paid Search',
  'Monthly Management — Organic Search',
  'Monthly Management — Both Channels',
  'AI Search Visibility',
  'AI Solutions — Build',
  'Custom Reporting & Data Tools',
  'Clarify Software — Onboarding',
  'Not sure yet',
]

/** Submit label. Space then → (U+2192). */
export const SUBMIT_LABEL = 'Send my request →'
/** In-flight label. Ellipsis is U+2026, not three dots. */
export const SUBMIT_BUSY_LABEL = 'Sending…'

export const FINE_PRINT =
  'No spam, no obligation. Your details are only used to reply about your request.'

/* ------------------------------------------------------------------------- */
/* 3. SUCCESS PANEL                                                           */
/* ------------------------------------------------------------------------- */

export const SUCCESS = {
  /** ✓ U+2713, inside an aria-hidden div. */
  check: '✓',
  title: 'Request received.',
  /** Em dash after "Thanks". Three straight apostrophes: it's / You'll / you'd.
   *  The trailing full stop is OUTSIDE the mail anchor. */
  before:
    "Thanks — it's in. You'll hear back with next steps. If you'd rather add anything, mail ",
  after: '.',
}

/* ------------------------------------------------------------------------- */
/* 4. VALIDATION — legacy script 3001–3017, verbatim                          */
/* ------------------------------------------------------------------------- */

/**
 * [fieldId, errorMessage] in DOM order.
 *
 * DOM order matters twice: legacy focuses
 * `form.querySelector('[aria-invalid="true"]')` on a failed submit, which is a
 * document-order query, and this array happens to match it. Reordering this
 * array silently changes which field receives focus.
 */
export const REQUIRED_FIELDS = [
  ['lf-name', 'Please add your name.'],
  ['lf-business', 'Please add your business name.'],
  ['lf-email', 'Please add a valid email.'],
  ['lf-spend', 'Please pick a budget range.'],
  ['lf-service', 'Please pick an option.'],
]

/** `#formError` sentence 1 when the response is not ok / `data.ok` is falsy
 *  and the body supplied no `error`. A server-supplied `data.error` replaces
 *  this string verbatim. */
export const SERVER_ERROR_FALLBACK = 'Something went wrong on our end.'

/** `#formError` sentence 1 when the fetch itself threw with no message. */
export const NETWORK_ERROR_FALLBACK = 'Could not send.'

/**
 * Sentence 2 of the banner, always appended. Legacy composes
 *   message + ' You can email ' + addr + ' directly and it will reach the same inbox.'
 * — note the LEADING space before "You".
 */
export const composeFormError = (message, addr) =>
  `${message} You can email ${addr} directly and it will reach the same inbox.`

/* ------------------------------------------------------------------------- */
/* 5. SUBMISSION                                                              */
/* ------------------------------------------------------------------------- */

/**
 * A Supabase Edge Function that inserts into the CRM's `inbound_leads` table
 * using the service-role key SERVER-side. No Supabase credential is present in
 * this page, so view-source exposes nothing that could read the leads table.
 *
 * NO auth header is sent — no `apikey`, no `Authorization`. The function is
 * built for that. Do not add one (spec §3.6, §5 risk 18).
 *
 * The `<form>` has no `action` and no `method`: this fetch is the ONLY
 * submission path, and with JS disabled nothing is recorded. That is legacy
 * behaviour, preserved deliberately — see the Contact builder's concerns.
 */
export const LEAD_ENDPOINT =
  import.meta.env?.VITE_LEAD_ENDPOINT ??
  'https://nrzpinvyxxorxufadvyc.supabase.co/functions/v1/submit-lead'

/* ------------------------------------------------------------------------- */
/* 6. FOOTER                                                                  */
/* ------------------------------------------------------------------------- */

export const FOOTER = {
  /** © is U+00A9. The year is interpolated: legacy hardcodes 2026 in markup
   *  and overwrites it with `new Date().getFullYear()` at runtime, so the
   *  runtime value is the real copy and `id="year"` is dropped (§3.7). */
  copyrightBefore: '© ',
  copyrightAfter: ' Clarify Search. Chicago-based. Available across the US.',
  disclaimer: 'Search outcomes vary. No performance guarantees.',
  links: [
    { href: '#pricing', label: 'Pricing' },
    { href: '#ai-build', label: 'AI Builds' },
    { href: '#faq', label: 'FAQ' },
    /** `data-email` WITHOUT `data-email-text`: JS rewrites only the href, never
     *  the text. `#contact` is the no-JS fallback. */
    { href: '#contact', label: 'Contact', emailSubject: 'Clarify Search Question' },
  ],
}

/* ------------------------------------------------------------------------- */
/* 7. EMAIL ADDRESS — assembled at runtime, on purpose                        */
/* ------------------------------------------------------------------------- */

/**
 * The address is built from parts at RUNTIME so that scrapers reading the raw
 * HTML do not harvest it. Legacy does this with
 *   ['clarifypaidsearch','gmail.com'].join('@')
 * and then overwrites the anchor's textContent.
 *
 * Two properties have to survive the React port:
 *   1. The literal `clarifypaidsearch@gmail.com` must never appear in a source
 *      file, or the bundler bakes it into the JS output.
 *   2. It must never appear in the PRERENDERED HTML either. Build-time
 *      prerendering is planned, and a component that renders the real address
 *      during the server pass would put it straight back into the document —
 *      defeating the whole mechanism.
 *
 * `useEmailAddress()` therefore returns `null` on the first (server / hydration)
 * render and the real address only after mount, so the prerendered markup
 * carries the same obfuscated placeholder legacy ships and the swap happens in
 * the browser exactly as it does today.
 */
const EMAIL_PARTS = ['clarifypaidsearch', 'gmail.com']

/** 64 is '@'. Written as a char code so no source file contains the address. */
export const emailAddress = () => EMAIL_PARTS.join(String.fromCharCode(64))

/** What a no-JS visitor sees, and what the prerendered HTML contains. */
export const EMAIL_PLACEHOLDER = 'clarifypaidsearch [at] gmail.com'

export const mailtoHref = (addr, subject) =>
  `mailto:${addr}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`

/** Subjects, verbatim from the three `data-subject` attributes. */
export const EMAIL_SUBJECTS = {
  audit: 'Clarify Search Audit Request',
  request: 'Clarify Search Request',
  question: 'Clarify Search Question',
}

/**
 * SSR-safe: no window/document/navigator, and the state transition happens in
 * an effect so the first render is identical on server and client.
 * Shared by Contact.jsx and Footer.jsx.
 */
export function useEmailAddress() {
  const [addr, setAddr] = useState(null)
  useEffect(() => {
    setAddr(emailAddress())
  }, [])
  return addr
}

/* ------------------------------------------------------------------------- */
/* 8. CROSS-SECTION SERVICE PRESELECT                                         */
/* ------------------------------------------------------------------------- */

/**
 * Legacy wires the pricing CTAs to `#lf-service` with a document-level click
 * delegate on `[data-offer]` (script 2968–2980). §5 risk 1 says not to port
 * that listener and to lift the value into shared state instead — but shared
 * state needs a store that both #pricing and #contact agree on, and the twelve
 * sections are being built in parallel with no such store yet.
 *
 * The interim contract is this event name. Anything can drive the preselect
 * without importing Contact:
 *
 *   window.dispatchEvent(new CustomEvent(SERVICE_EVENT, {
 *     detail: 'Audit — Both Channels',
 *   }))
 *
 * Contact also keeps the legacy `[data-offer]` click delegate alive (mounted
 * and torn down inside its own useEffect) so the feature keeps working with
 * zero changes in the pricing section. Both paths run the same guard: set the
 * service to this exact option string, ignore anything unknown.
 */
export const SERVICE_EVENT = 'clarify:select-service'

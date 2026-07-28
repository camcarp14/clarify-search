import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import {
  CONDITIONS,
  fit,
  pick,
  refreshSoon,
  scrubbedTrigger,
  setIf,
} from '../../motion/system'
import { MOTION } from './contact.motion'
import { DEBUG } from '../../lib/motionDebug'
import {
  BUDGET_OPTIONS,
  BUDGET_PLACEHOLDER,
  EMAIL_INLINE_PREFIX,
  EMAIL_PLACEHOLDER,
  EMAIL_SUBJECTS,
  EYEBROW,
  FIELDS,
  FINE_PRINT,
  FORM_HEAD,
  HEADING,
  HONEYPOT_LABEL,
  LEAD_ENDPOINT,
  LEDE,
  NETWORK_ERROR_FALLBACK,
  NEXT_STEPS,
  REQUIRED_FIELDS,
  SERVER_ERROR_FALLBACK,
  SERVICE_EVENT,
  SERVICE_OPTIONS,
  SERVICE_PLACEHOLDER,
  SUBMIT_BUSY_LABEL,
  SUBMIT_LABEL,
  SUCCESS,
  composeFormError,
  emailAddress,
  mailtoHref,
  useEmailAddress,
} from './contactData'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

/**
 * Field values, keyed by the input's `name` attribute rather than its id, so
 * the payload builder reads exactly the keys legacy's `new FormData(form)`
 * produced. `bot-field` keeps its hyphen here and is renamed to `bot_field`
 * only at the JSON boundary — that mismatch is legacy's and it is preserved
 * on purpose (spec §3.6 step 7).
 */
const EMPTY_VALUES = {
  name: '',
  business: '',
  email: '',
  website: '',
  monthly_budget: '',
  service: '',
  details: '',
  'bot-field': '',
}

/**
 * Runtime-assembled mail link. Renders the obfuscated placeholder — and the
 * `#contact` no-JS href — on the first pass (server / prerender / hydration),
 * and the real address once the address has been assembled. That is what keeps
 * the literal out of both the JS bundle and the prerendered HTML, which is the
 * whole point of the mechanism. See contactData.js §7.
 *
 * `addr` is threaded in as a prop rather than read from `useEmailAddress()`
 * here, because the success panel mounts long after hydration: its own hook
 * would start at null and paint the placeholder for a frame before swapping.
 * One hook at the top of the section, resolved once, avoids that entirely.
 */
function EmailLink({ addr, subject, showAddress = false, children }) {
  return (
    <a href={addr ? mailtoHref(addr, subject) : '#contact'}>
      {showAddress ? (addr ?? EMAIL_PLACEHOLDER) : children}
    </a>
  )
}

export default function Contact() {
  const rootRef = useRef(null)
  const eyebrowRef = useRef(null)
  const headingRef = useRef(null)
  const ledeRef = useRef(null)
  const formCardRef = useRef(null)
  const emailRef = useRef(null)
  const successHeadingRef = useRef(null)

  /** The five validated controls, by id. Populated by callback refs.
   *  A ref map is the right answer twice here: the email rule is the browser's
   *  own `checkValidity()` on a live node (no declarative equivalent, and a
   *  hand-rolled regex would change which leads get through — native accepts
   *  `a@b`), and focus has to move to the first invalid control on a failed
   *  submit without waiting for a render to commit. */
  const controlRefs = useRef({})
  const setControlRef = useCallback(
    (id) => (el) => {
      controlRefs.current[id] = el
    },
    [],
  )

  /** null until mount, then the runtime-assembled address. Resolved once for
   *  the whole section and passed to both mail links. */
  const addr = useEmailAddress()

  const [values, setValues] = useState(EMPTY_VALUES)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  /** 'idle' | 'sending' | 'sent'. Replaces legacy's capture-and-restore of the
   *  submit button's textContent, its `disabled` property, its `is-busy` class
   *  and `#formCard`'s `is-sent` class — one value, four derived outputs. */
  const [status, setStatus] = useState('idle')

  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => {
      aliveRef.current = false
    }
  }, [])

  const onFieldChange = useCallback((event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }, [])

  /* ======================================================================= */
  /* CROSS-SECTION SERVICE PRESELECT                                          */
  /* ======================================================================= */

  /**
   * Legacy binds a document-level click delegate on `[data-offer]` and sets
   * `#lf-service` to the option whose text matches exactly (script 2968–2980).
   * §5 risk 1 asks for shared state instead — but there is no store the pricing
   * section and this one both know about yet, and dropping the listener without
   * a replacement would silently kill a shipped feature.
   *
   * So both paths are live and both run the same guard ("set the service to
   * this exact option string, ignore anything unknown"):
   *   - the legacy `[data-offer]` delegate, so #pricing keeps working untouched
   *   - a `clarify:select-service` CustomEvent, so a future store or any other
   *     section can drive it without reaching into this component's DOM
   *
   * Both are created and torn down inside this effect, so nothing leaks and
   * nothing runs during SSR.
   */
  useEffect(() => {
    const applyOffer = (offer) => {
      if (typeof offer !== 'string') return
      // Silent no-op on an unknown string — legacy's `break`-less loop simply
      // never matched. Do not guess at a nearest option.
      if (!SERVICE_OPTIONS.includes(offer)) return
      setValues((prev) => ({ ...prev, service: offer }))
    }

    const onDocumentClick = (event) => {
      const link = event.target?.closest?.('[data-offer]')
      if (!link) return
      applyOffer(link.getAttribute('data-offer'))
    }
    const onServiceEvent = (event) => applyOffer(event.detail)

    document.addEventListener('click', onDocumentClick)
    window.addEventListener(SERVICE_EVENT, onServiceEvent)
    return () => {
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener(SERVICE_EVENT, onServiceEvent)
    }
  }, [])

  /* ======================================================================= */
  /* VALIDATION — legacy validate(), semantics preserved exactly              */
  /* ======================================================================= */

  /**
   * Legacy, verbatim:
   *   var bad = !el.value || (el.type === 'email' && !el.checkValidity());
   *
   * Two behaviours that look like bugs and are NOT to be quietly fixed:
   *   1. Emptiness is `!el.value`, so whitespace is NOT trimmed here. A single
   *      space passes validation — and is then trimmed to "" by the payload
   *      builder, so a lead can post with an empty name. Real, flagged, and
   *      left alone: changing it changes what reaches the CRM (§5 risk 13).
   *   2. `checkValidity()` is the browser's own `type="email"` rule, which is
   *      more permissive than most hand-rolled regexes (`a@b` passes). It still
   *      works with `noValidate` on the form — `noValidate` only suppresses the
   *      automatic UI, not the method.
   *
   * Every call is a FULL re-validate, clearing errors on fields that now pass.
   * Validation runs on submit only: there are no blur/input/change validators
   * anywhere in legacy, and errors persist until the next submit attempt.
   */
  const validate = useCallback(() => {
    const next = {}
    let firstInvalid = null

    for (const [id, message] of REQUIRED_FIELDS) {
      const el = controlRefs.current[id]
      const value = el ? el.value : ''
      const bad = !value || (el?.type === 'email' && !el.checkValidity())
      if (bad) {
        next[id] = message
        if (!firstInvalid) firstInvalid = id
      }
    }

    setFieldErrors(next)
    // REQUIRED_FIELDS is in DOM order, so `firstInvalid` is the same element
    // legacy's `form.querySelector('[aria-invalid="true"]')` would have found —
    // without depending on attributes React has not flushed yet (§5 risk 12).
    return { ok: firstInvalid === null, firstInvalid }
  }, [])

  /* ======================================================================= */
  /* SUBMIT — legacy handler, step for step                                   */
  /* ======================================================================= */

  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault()

      /* HONEYPOT. Returns SILENTLY: no error, no network call, no button
       * state change, no feedback of any kind. This is deliberate and it is
       * not a missing else-branch — a bot must not learn why the submission
       * did nothing. Do not "fix" it (§5 risk 21). */
      if (values['bot-field']) return

      const { ok, firstInvalid } = validate()
      if (!ok) {
        controlRefs.current[firstInvalid]?.focus()
        return
      }

      // Assembled here rather than held in state: the handler only ever runs
      // in the browser, and the catch below needs the real address.
      const addr = emailAddress()
      const trimmed = (key) => (values[key] || '').toString().trim()

      setFormError('')
      setStatus('sending')

      try {
        const res = await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          // No apikey, no Authorization. The Edge Function is built to be
          // called unauthenticated; adding a header would break it.
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: trimmed('name'),
            business: trimmed('business'),
            email: trimmed('email'),
            website: trimmed('website'),
            monthly_budget: trimmed('monthly_budget'),
            service: trimmed('service'),
            details: trimmed('details'),
            // Input is `name="bot-field"`, JSON key is `bot_field`. The
            // mismatch is legacy's; both spellings are kept exactly.
            bot_field: trimmed('bot-field'),
          }),
        })

        // A non-JSON body is swallowed into {} exactly as legacy does.
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          throw new Error(data.error || SERVER_ERROR_FALLBACK)
        }
        if (aliveRef.current) setStatus('sent')
      } catch (err) {
        /* Never swallow a failure — the visitor must know it did not send. */
        if (!aliveRef.current) return
        setFormError(
          composeFormError(err?.message || NETWORK_ERROR_FALLBACK, addr),
        )
        setStatus('idle')
      }
    },
    [validate, values],
  )

  /**
   * ACCESSIBILITY FIX over legacy. `.form-success` is `role="status"
   * aria-live="polite"`, but a live region only announces on CONTENT mutation,
   * not on becoming visible — legacy's success panel is static markup that CSS
   * un-hides, so it announces nothing at all and a screen-reader user is left
   * on a form that has silently vanished. Moving focus to the panel's heading
   * is the fix the spec calls out as worth adding deliberately (§5 risk 11).
   */
  useEffect(() => {
    if (status === 'sent') successHeadingRef.current?.focus()
  }, [status])

  /**
   * The form card is the tallest thing in this band, and two things resize it
   * without any scrolling happening: the success panel replacing the form, and
   * the error banner going from `display: none` to `display: block`. Either one
   * changes the document height, which leaves every ScrollTrigger below this
   * point — the footer's included — measuring geometry that no longer exists.
   *
   * `refreshSoon()` is the coalesced refresh from the motion system: it fires
   * once on the next frame however many callers there were, rather than forcing
   * a full layout recalculation of a 15,000px document per state change.
   */
  useEffect(() => {
    refreshSoon()
  }, [status, formError])

  /* ======================================================================= */
  /* MOTION — one useEffect, one gsap.matchMedia(), scrub-no-pin (§B.11)      */
  /* ======================================================================= */

  useEffect(() => {
    let mm = null
    let cancelled = false

    const start = () => {
      if (cancelled || !rootRef.current) return

      mm = gsap.matchMedia()

      mm.add(CONDITIONS, (ctx) => {
        const { isMobile, isReduced } = ctx.conditions
        const root = rootRef.current

        // Scoped to root, never a bare document.querySelectorAll — scoping is
        // what stops twelve parallel sections from finding each other's
        // elements (§C.2).
        const numFaces = gsap.utils.toArray('[data-contact-num-lit]', root)
        const stepCopies = gsap.utils.toArray('[data-contact-step-copy]', root)

        const split = new SplitText(headingRef.current, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'contact__line',
        })

        const cleanup = () => {
          split.revert()
          root.classList.remove('is-live')
        }

        /* =================================================================
         * REDUCED MOTION
         * No timeline, no ScrollTrigger, nothing to scrub. Every animated
         * target is gsap.set() to its FINAL state explicitly: the CSS default
         * for these elements is their start state in the masked cases, so
         * "do nothing" would leave the steps and the email line clipped out
         * of sight — the regression that makes a site unusable for exactly
         * the people the setting exists to protect.
         * ================================================================= */
        if (isReduced) {
          root.dataset.motion = 'reduced'

          setIf(split.lines, { yPercent: 0 })
          setIf([eyebrowRef.current, ledeRef.current], { opacity: 1, y: 0 })
          setIf(numFaces, { opacity: 1 })
          setIf(stepCopies, { yPercent: 0 })
          setIf(formCardRef.current, { y: 0, scale: 1 })
          setIf(emailRef.current, { yPercent: 0 })

          return cleanup
        }

        /* =================================================================
         * FULL MOTION
         * ================================================================= */
        root.dataset.motion = 'full'

        const seq = pick(MOTION.seq, isMobile)
        const copyY = pick(MOTION.travel.copy, isMobile)
        const cardY = pick(MOTION.travel.formCard, isMobile)
        const maskY = MOTION.travel.maskYPercent

        const tl = gsap.timeline({
          scrollTrigger: scrubbedTrigger({
            trigger: root,
            root,
            isMobile,
            window: MOTION.window,
          }),
        })

        // Normalises the timeline to exactly 1 unit long, so timeline time ===
        // scroll progress and the MOTION numbers read as the storyboard.
        tl.to({}, { duration: 1 }, 0)

        /* IMMEDIATE RENDER, ONCE, EXPLICITLY (§C.6).
         * Every tween below is the FIRST tween to touch its own target's own
         * property — seven targets, seven properties, no overlap. So every one
         * of them keeps GSAP's default `immediateRender: true`, which is what
         * paints the correct progress-0 frame when the timeline is built.
         * Adding `immediateRender: false` here would be the mirror image of the
         * usual bug: progress 0 would show the FINAL state until the first
         * seek. If a second tween is ever added to any of these targets, that
         * one — and only that one — gets `immediateRender: false`. */

        /* ---- eyebrow: rises TRAVEL.copy, leading the H2 (§B.13 #2) ---- */
        const eb = seq.eyebrow
        tl.fromTo(
          eyebrowRef.current,
          { opacity: 0, y: copyY },
          {
            opacity: 1,
            y: 0,
            duration: eb.end - eb.start,
            ease: MOTION.ease.reveal,
          },
          eb.start,
        )

        /* ---- H2: the signature masked line rise (§A.6, §B.13 #1) ----
         * Identical numbers in every section that has an H2. The variation
         * lives in what happens after the headline, not in the headline. */
        const hd = seq.heading
        tl.from(
          split.lines,
          {
            yPercent: maskY,
            duration: fit(
              hd.end - hd.start,
              (split.lines.length - 1) * MOTION.stagger.headingLines,
            ),
            ease: MOTION.ease.reveal,
            stagger: MOTION.stagger.headingLines,
          },
          hd.start,
        )

        /* ---- lede: rises TRAVEL.copy, 0.06 after the H2 (§B.13 #3) ---- */
        const ld = seq.lede
        tl.fromTo(
          ledeRef.current,
          { opacity: 0, y: copyY },
          {
            opacity: 1,
            y: 0,
            duration: ld.end - ld.start,
            ease: MOTION.ease.reveal,
          },
          ld.start,
        )

        /* ---- the numbered rail ----
         * Each circle is two stacked layers with identical geometry and type
         * metrics; the lit one cross-fades up from opacity 0 (§A.4 rule 2 —
         * colour change is never a colour tween). EASE.tint keeps the
         * cross-fade midpoint from going muddy.
         *
         * The copy tween is placed at the SAME position with the SAME stagger,
         * so step i's sentence masks up on step i's beat rather than trailing
         * it — "each step's copy masks up on the same beat as its number". */
        const st = seq.steps
        const stepSpan =
          MOTION.stagger.steps * Math.max(0, stepCopies.length - 1)
        const stepDur = fit(st.end - st.start, stepSpan)

        tl.fromTo(
          numFaces,
          { opacity: 0 },
          {
            opacity: 1,
            duration: stepDur,
            ease: MOTION.ease.tint,
            stagger: MOTION.stagger.steps,
          },
          st.start,
        )
        tl.fromTo(
          stepCopies,
          { yPercent: maskY },
          {
            yPercent: 0,
            duration: stepDur,
            ease: MOTION.ease.reveal,
            stagger: MOTION.stagger.steps,
          },
          st.start,
        )

        /* ---- the form card ----
         * HARD RULE (§B.11): no scroll-driven motion on ANY focusable element
         * inside the form. Not the inputs, not the selects, not the textarea,
         * not the submit. A field that is mid-tween when it receives focus
         * fights the browser's scroll-into-view and the page jitters. The card
         * animates as ONE block and its contents animate not at all — this is
         * the only tween in the section that touches anything inside .form-card.
         *
         * Deliberately y + scale with NO opacity, and that is not an omission:
         * the conversion surface should never be invisible. If GSAP fails to
         * load, or a tween is somehow never built, the form is still there and
         * still usable — it is simply not animated. */
        const fc = seq.formCard
        tl.fromTo(
          formCardRef.current,
          { y: cardY, scale: MOTION.scale.formCardFrom },
          {
            y: 0,
            scale: 1,
            duration: fc.end - fc.start,
            ease: MOTION.ease.reveal,
          },
          fc.start,
        )

        /* ---- .email-inline masks up last ---- */
        const em = seq.email
        tl.fromTo(
          emailRef.current,
          { yPercent: maskY },
          {
            yPercent: 0,
            duration: em.end - em.start,
            ease: MOTION.ease.reveal,
          },
          em.start,
        )

        // Console handle while tuning:
        //   window.__contact.st.progress          → where the scrub is
        //   window.__contact.tl.progress(0.5)     → jump the storyboard
        if (DEBUG) window.__contact = { tl, st: tl.scrollTrigger }

        return cleanup
      })

      // Coalesced across all twelve sections — one refresh on the next frame,
      // not twelve full layout recalculations of a 15,000px document.
      refreshSoon()
    }

    // SplitText must not run before the webfonts land, or the line boxes it
    // measures are the fallback font's and the masks end up the wrong height.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start)
    else start()

    return () => {
      cancelled = true
      if (mm) mm.revert()
    }
  }, [])

  /* ======================================================================= */
  /* RENDER                                                                   */
  /* ======================================================================= */

  const isSending = status === 'sending'
  const isSent = status === 'sent'

  /** Legacy's setError() writes aria-invalid="true" OR "false" and never
   *  removes the attribute, so after the first failed submit every validated
   *  field carries an explicit value forever. The CSS paints on the literal
   *  string "true", so "false" is inert. Emitting the string (not `undefined`)
   *  keeps the AT semantics identical to legacy. */
  const invalid = (id) => (fieldErrors[id] ? 'true' : 'false')
  /** ACCESSIBILITY FIX over legacy: the .field-error spans exist but are wired
   *  to nothing, so the message is visible and silent. Pointing the control at
   *  its error slot means the text is read when focus lands there — which is
   *  exactly where focus is sent on a failed submit (§5 risk 20). */
  const describedBy = (id) => (fieldErrors[id] ? `${id}-error` : undefined)

  return (
    /* `band` is the shared section rhythm from components.css (116px / 56px
       padding, 1px top rule). `contact` is the block class the motion system
       needs for `.contact.is-live`. NOT `.tinted` — #contact is an untinted
       band in legacy.

       No aria-labelledby, no aria-label, and no id on the <h2>: legacy has
       none and the spec says not to add one silently (§2.1). The section id
       IS public URL surface — the header nav, the footer, sitemap.xml and
       every pricing CTA link to #contact — and is preserved exactly. */
    <section className="band contact" id="contact" ref={rootRef}>
      <div className="shell contact-grid">
        {/* ---------------------------------------------------------------
            COPY COLUMN
            No `.reveal` class: the legacy IntersectionObserver reveal system
            is retired (§0.1) and this column's motion is the scrubbed
            timeline above.
            --------------------------------------------------------------- */}
        <div className="contact-copy">
          <span className="mono-label contact__eyebrow" ref={eyebrowRef}>
            {EYEBROW}
          </span>

          {/* <span className="ital"> is a typographic swap (display sans →
              Instrument Serif italic), not semantic stress, so it stays a
              span. The full stop is outside it, as in legacy. */}
          <h2 ref={headingRef}>
            {HEADING.before}
            <span className="ital">{HEADING.ital}</span>
            {HEADING.after}
          </h2>

          <p className="contact__lede" ref={ledeRef}>
            {LEDE.before}
            <strong>{LEDE.strong}</strong>
            {LEDE.after}
          </p>

          {/* A real <ol>, but `list-style: none` strips the markers — which in
              Safari/VoiceOver also strips the list semantics. `role="list"`
              puts them back so the step number is announced exactly once, by
              the list, now that the painted numeral is aria-hidden. */}
          <ol className="next-steps" role="list">
            {NEXT_STEPS.map((step) => (
              <li key={step.n}>
                {/* aria-hidden because the numeral is now TWO stacked layers
                    (the colour change has to be an opacity cross-fade, §A.4
                    rule 2) and because it already duplicated the list position
                    in legacy — screen readers heard "1. 1 You send the
                    details" (§5 risk 19). Decorative in both directions. */}
                <span className="num contact__num" aria-hidden="true">
                  <span className="contact__num-face contact__num-face--outline">
                    {step.n}
                  </span>
                  <span
                    className="contact__num-face contact__num-face--lit"
                    data-contact-num-lit
                  >
                    {step.n}
                  </span>
                </span>

                <span className="contact__step-mask">
                  <span className="contact__step-copy" data-contact-step-copy>
                    <strong>{step.strong}</strong>
                    {step.rest}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="email-inline">
            <span className="contact__email-inner" ref={emailRef}>
              {EMAIL_INLINE_PREFIX}
              <EmailLink
                addr={addr}
                subject={EMAIL_SUBJECTS.audit}
                showAddress
              />
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------------------
            FORM CARD
            `is-sent` is kept alongside the conditional render so nothing
            depends on which of the two mechanisms wins — the ported CSS
            still hides .lead-form / .form-card-head and shows .form-success
            on that class, exactly as legacy does.
            --------------------------------------------------------------- */}
        <div
          className={`form-card${isSent ? ' is-sent' : ''}`}
          id="formCard"
          ref={formCardRef}
        >
          {isSent ? (
            <div className="form-success" role="status" aria-live="polite">
              <div className="check" aria-hidden="true">
                {SUCCESS.check}
              </div>
              {/* tabIndex -1 so focus can be moved here on success — see the
                  effect above. */}
              <h3 ref={successHeadingRef} tabIndex={-1}>
                {SUCCESS.title}
              </h3>
              <p>
                {SUCCESS.before}
                <EmailLink
                  addr={addr}
                  subject={EMAIL_SUBJECTS.request}
                  showAddress
                />
                {SUCCESS.after}
              </p>
            </div>
          ) : (
            <>
              <div className="form-card-head">
                <h3>{FORM_HEAD.title}</h3>
                <p>{FORM_HEAD.blurb}</p>
              </div>

              {/* noValidate suppresses the native constraint bubbles. The
                  `required` attributes stay as metadata — the validator does
                  not read them, it uses REQUIRED_FIELDS. There is no `action`
                  and no `method`: this form posts only through fetch. */}
              <form
                className="lead-form"
                id="leadForm"
                noValidate
                onSubmit={onSubmit}
              >
                {/* HONEYPOT. Off-screen via CSS (left: -9999px), not
                    display:none, so autofill-style bots still see it. */}
                <p className="hidden-field" aria-hidden="true">
                  <label>
                    {HONEYPOT_LABEL}{' '}
                    <input
                      type="text"
                      id={FIELDS.bot.id}
                      name={FIELDS.bot.name}
                      tabIndex={-1}
                      autoComplete="off"
                      value={values['bot-field']}
                      onChange={onFieldChange}
                    />
                  </label>
                </p>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor={FIELDS.name.id}>{FIELDS.name.label}</label>
                    <input
                      type={FIELDS.name.type}
                      id={FIELDS.name.id}
                      name={FIELDS.name.name}
                      autoComplete={FIELDS.name.autoComplete}
                      required
                      placeholder={FIELDS.name.placeholder}
                      value={values.name}
                      onChange={onFieldChange}
                      ref={setControlRef(FIELDS.name.id)}
                      aria-invalid={invalid(FIELDS.name.id)}
                      aria-describedby={describedBy(FIELDS.name.id)}
                    />
                    <span className="field-error" id={`${FIELDS.name.id}-error`}>
                      {fieldErrors[FIELDS.name.id] || ''}
                    </span>
                  </div>

                  <div className="field">
                    <label htmlFor={FIELDS.business.id}>
                      {FIELDS.business.label}
                    </label>
                    <input
                      type={FIELDS.business.type}
                      id={FIELDS.business.id}
                      name={FIELDS.business.name}
                      autoComplete={FIELDS.business.autoComplete}
                      required
                      placeholder={FIELDS.business.placeholder}
                      value={values.business}
                      onChange={onFieldChange}
                      ref={setControlRef(FIELDS.business.id)}
                      aria-invalid={invalid(FIELDS.business.id)}
                      aria-describedby={describedBy(FIELDS.business.id)}
                    />
                    <span
                      className="field-error"
                      id={`${FIELDS.business.id}-error`}
                    >
                      {fieldErrors[FIELDS.business.id] || ''}
                    </span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor={FIELDS.email.id}>{FIELDS.email.label}</label>
                  {/* Stays a real type="email" input so validate() can call the
                      browser's own checkValidity() on it. */}
                  <input
                    type={FIELDS.email.type}
                    id={FIELDS.email.id}
                    name={FIELDS.email.name}
                    autoComplete={FIELDS.email.autoComplete}
                    inputMode={FIELDS.email.inputMode}
                    required
                    placeholder={FIELDS.email.placeholder}
                    value={values.email}
                    onChange={onFieldChange}
                    ref={setControlRef(FIELDS.email.id)}
                    aria-invalid={invalid(FIELDS.email.id)}
                    aria-describedby={describedBy(FIELDS.email.id)}
                  />
                  <span className="field-error" id={`${FIELDS.email.id}-error`}>
                    {fieldErrors[FIELDS.email.id] || ''}
                  </span>
                </div>

                <div className="field">
                  <label htmlFor={FIELDS.website.id}>
                    {FIELDS.website.label}
                    <span className="opt">{FIELDS.website.labelOptional}</span>
                  </label>
                  {/* type="text", not type="url": deliberate, so
                      `yourbusiness.com` without a scheme does not trip native
                      validation. No error slot — website is never validated. */}
                  <input
                    type={FIELDS.website.type}
                    id={FIELDS.website.id}
                    name={FIELDS.website.name}
                    autoComplete={FIELDS.website.autoComplete}
                    inputMode={FIELDS.website.inputMode}
                    placeholder={FIELDS.website.placeholder}
                    value={values.website}
                    onChange={onFieldChange}
                  />
                </div>

                <div className="field-row">
                  <div className="field">
                    <label htmlFor={FIELDS.spend.id}>
                      {FIELDS.spend.label}
                    </label>
                    {/* Controlled. The placeholder option keeps value="" — the
                        exact value the validator fails on. Every other option
                        carries NO value attribute, so its submitted value is
                        its own text, which is what the CRM stores. */}
                    <select
                      id={FIELDS.spend.id}
                      name={FIELDS.spend.name}
                      required
                      value={values.monthly_budget}
                      onChange={onFieldChange}
                      ref={setControlRef(FIELDS.spend.id)}
                      aria-invalid={invalid(FIELDS.spend.id)}
                      aria-describedby={describedBy(FIELDS.spend.id)}
                    >
                      <option value="" disabled>
                        {BUDGET_PLACEHOLDER}
                      </option>
                      {BUDGET_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <span
                      className="field-error"
                      id={`${FIELDS.spend.id}-error`}
                    >
                      {fieldErrors[FIELDS.spend.id] || ''}
                    </span>
                  </div>

                  <div className="field">
                    <label htmlFor={FIELDS.service.id}>
                      {FIELDS.service.label}
                    </label>
                    <select
                      id={FIELDS.service.id}
                      name={FIELDS.service.name}
                      required
                      value={values.service}
                      onChange={onFieldChange}
                      ref={setControlRef(FIELDS.service.id)}
                      aria-invalid={invalid(FIELDS.service.id)}
                      aria-describedby={describedBy(FIELDS.service.id)}
                    >
                      <option value="" disabled>
                        {SERVICE_PLACEHOLDER}
                      </option>
                      {SERVICE_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                    <span
                      className="field-error"
                      id={`${FIELDS.service.id}-error`}
                    >
                      {fieldErrors[FIELDS.service.id] || ''}
                    </span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor={FIELDS.details.id}>
                    {FIELDS.details.label}
                    <span className="opt">{FIELDS.details.labelOptional}</span>
                  </label>
                  <textarea
                    id={FIELDS.details.id}
                    name={FIELDS.details.name}
                    placeholder={FIELDS.details.placeholder}
                    value={values.details}
                    onChange={onFieldChange}
                  />
                </div>

                {/* Rendered ALWAYS, empty when there is nothing to say, so the
                    live region is mounted before content ever arrives — a live
                    region that appears with its text already in it frequently
                    fails to announce (§5 risk 11). `.show` is what makes it
                    visible; without it the CSS keeps it out of the layout. */}
                <p
                  className={`form-error-banner${formError ? ' show' : ''}`}
                  id="formError"
                  role="alert"
                  aria-live="assertive"
                >
                  {formError}
                </p>

                <button
                  type="submit"
                  className={`form-submit${isSending ? ' is-busy' : ''}`}
                  id="formSubmit"
                  disabled={isSending}
                >
                  {isSending ? SUBMIT_BUSY_LABEL : SUBMIT_LABEL}
                </button>

                <p className="form-fineprint">{FINE_PRINT}</p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

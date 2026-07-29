/**
 * The four artifacts, drawn.
 *
 * The section's whole thesis is "Four steps. Every one leaves an artifact." —
 * and it named four artifacts without ever showing one, which is why the cards
 * read as four boxes of prose. Each step now carries a small picture of the
 * thing it hands you.
 *
 * Deliberately schematic rather than screenshot-real: these sit at ~120px and
 * have to read at a glance, and a shrunken real screenshot at this size is
 * mush. Everything is CSS boxes and inline SVG — no images, nothing to load,
 * and every colour comes from the shared tokens so they age with the palette.
 *
 * `data-art-part` marks the pieces the section's scrub staggers in. Nothing
 * here animates itself; Method.jsx owns the timeline.
 */

/** 01 — the access checklist: three scopes, ticking green as they are granted. */
function AccessChecklist() {
  const rows = ['Google Ads', 'GA4', 'Search Console']
  return (
    <ul className="mart mart--check">
      {rows.map((r) => (
        <li key={r} data-art-part>
          <span className="mart__tick" aria-hidden="true">
            <svg viewBox="0 0 12 12" width="8" height="8">
              <path
                d="M2 6.4 4.6 9 10 3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="mart__label">{r}</span>
          <span className="mart__scope">viewer</span>
        </li>
      ))}
    </ul>
  )
}

/** 02 — the scorecard: a ring and two graded bars. */
function Scorecard() {
  return (
    <div className="mart mart--score">
      <div className="mart__ring" data-art-part>
        <svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="rgba(var(--tint-rgb), .14)"
            strokeWidth="4"
          />
          {/* 72/100 of the circumference, drawn from 12 o'clock. */}
          <circle
            className="mart__ring-fill"
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="var(--amber)"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-90 22 22)"
          />
        </svg>
        <b className="mart__ring-num">72</b>
      </div>
      <div className="mart__bars">
        {[
          { k: 'Intent', w: 58, t: 'fair' },
          { k: 'Tracking', w: 42, t: 'poor' },
        ].map((b) => (
          <div className="mart__bar" key={b.k} data-art-part>
            <span className="mart__bar-k">{b.k}</span>
            <span className="mart__bar-track">
              <i className={`mart__bar-fill is-${b.t}`} style={{ '--w': `${b.w}%` }} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** 03 — the change log: a diff of what was actually altered. */
function ChangeLog() {
  const rows = [
    { s: '-', t: 'broad match: dentist', k: 'cut' },
    { s: '+', t: '38 negatives added', k: 'add' },
    { s: '+', t: 'call conversion fixed', k: 'add' },
  ]
  return (
    <ul className="mart mart--diff">
      {rows.map((r) => (
        <li key={r.t} className={`is-${r.k}`} data-art-part>
          <span className="mart__sign">{r.s}</span>
          <span className="mart__label">{r.t}</span>
        </li>
      ))}
    </ul>
  )
}

/** 04 — the roadmap: three phases across ninety days. */
function Roadmap() {
  const phases = [
    { k: '0-30', w: 34 },
    { k: '30-60', w: 33 },
    { k: '60-90', w: 33 },
  ]
  return (
    <div className="mart mart--road">
      <div className="mart__road-track">
        {phases.map((p, i) => (
          <span
            key={p.k}
            className="mart__road-seg"
            data-art-part
            style={{ '--w': `${p.w}%`, '--i': i }}
          />
        ))}
      </div>
      <div className="mart__road-keys">
        {phases.map((p) => (
          <span key={p.k}>{p.k}</span>
        ))}
      </div>
    </div>
  )
}

const BY_STEP = {
  '01': AccessChecklist,
  '02': Scorecard,
  '03': ChangeLog,
  '04': Roadmap,
}

export default function MethodArtifact({ step }) {
  const Art = BY_STEP[step]
  if (!Art) return null
  return (
    <div className="method__art" aria-hidden="true">
      <Art />
    </div>
  )
}

/**
 * The chip field.
 *
 * These are search terms, not spend. The split dramatises the line the site
 * already runs on the scorecard — "Search terms drifting from buyer intent;
 * negatives not tight enough" — using the same example account the legacy
 * hero uses (Lakeview Family Dental, Chicago).
 *
 * Two stages, deliberately separate:
 *   buildChips()  — identity: text, kind, and every per-chip random. Runs ONCE.
 *   layoutChips() — coordinates. Runs per breakpoint, so mobile gets its own
 *                   grid rather than the desktop grid squeezed.
 *
 * Layout is fully deterministic: same seed → same field, every load. A random
 * hero is not reviewable, and a chip that lands off-screen on one reload but
 * not the next is impossible to debug.
 */

/** Money going to searches that were never going to book an appointment. */
const WASTE = [
  'dental assistant jobs',
  'how to floss properly',
  'free dental clinic chicago',
  'what is a root canal',
  'dentist salary',
  'dental school chicago',
  'diy teeth whitening',
  'why do my teeth hurt',
  'dental hygienist programs',
  'is flossing necessary',
  'toothpaste ingredients',
  'gum disease pictures',
  'baby teeth chart',
  'enamel erosion causes',
  'dental cpt codes',
  'orthodontist vs dentist',
  'whitening with baking soda',
  'medicaid dentist illinois',
  'dental x ray radiation',
  'cheap dentures online',
  'tooth anatomy diagram',
  'dental insurance explained',
  'wisdom teeth removal video',
  'do i need a night guard',
]

/** Searches with a buyer on the other end. */
const CONVERT = [
  'emergency dentist lakeview',
  'dentist open saturday',
  'invisalign lakeview',
  'book dental cleaning',
  'same day crown chicago',
  'lakeview family dental',
  'cosmetic dentist reviews',
  'dental implants cost',
  'pediatric dentist lakeview',
  'root canal specialist',
  'teeth whitening price',
  'new patient special',
  'dentist near 60657',
  'wisdom tooth removal',
  'veneers consultation',
  'walk in dentist near me',
]

/** Share of the field that is wasted spend. The storyboard's ~60/40. */
export const WASTE_SHARE = 0.6

/** mulberry32 — small, fast, seedable. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates against a seeded source. */
function shuffle(list, rand) {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Identity + randomness. Called once; the result is what React renders.
 * Chips are interleaved so colour reads as distributed across the grid
 * rather than clustered in one corner.
 */
export function buildChips({ count, scatter, drift }) {
  const rand = rng(scatter.seed)

  const wasteCount = Math.round(count * WASTE_SHARE)
  const convertCount = count - wasteCount

  const picked = [
    ...WASTE.slice(0, wasteCount).map((text) => ({ text, kind: 'waste' })),
    ...CONVERT.slice(0, convertCount).map((text) => ({ text, kind: 'convert' })),
  ]

  return shuffle(picked, rand).map((chip, i) => ({
    id: `chip-${i}`,
    text: chip.text,
    kind: chip.kind,
    // Scatter offsets as a signed fraction of field size.
    scatterX: (rand() * 2 - 1) * scatter.spreadX,
    scatterY: (rand() * 2 - 1) * scatter.spreadY,
    scatterRotation: (rand() * 2 - 1) * scatter.rotation,
    scatterScale: scatter.scaleMin + rand() * (scatter.scaleMax - scatter.scaleMin),
    // Sign of the tumble as the red chips fall out.
    fallSign: rand() < 0.5 ? -1 : 1,
    // Idle drift, per chip so the field never pulses in unison.
    driftDur: drift.durMin + rand() * (drift.durMax - drift.durMin),
    driftDelay: -rand() * drift.durMax,
    driftX1: (rand() * 2 - 1) * drift.travel,
    driftY1: (rand() * 2 - 1) * drift.travel,
    driftR1: (rand() * 2 - 1) * drift.rotate,
    driftX2: (rand() * 2 - 1) * drift.travel,
    driftY2: (rand() * 2 - 1) * drift.travel,
    driftR2: (rand() * 2 - 1) * drift.rotate,
  }))
}

/**
 * Take a smaller field for narrow viewports while holding the waste/convert
 * ratio. Preserves shuffled order, so the mobile field is a genuine subset of
 * the desktop one rather than a different composition.
 */
export function subsetChips(chips, count) {
  if (count >= chips.length) return chips
  const wanted = {
    waste: Math.round(count * WASTE_SHARE),
    convert: count - Math.round(count * WASTE_SHARE),
  }
  const taken = { waste: 0, convert: 0 }
  return chips.filter((c) => {
    if (taken[c.kind] < wanted[c.kind]) {
      taken[c.kind] += 1
      return true
    }
    return false
  })
}

/**
 * Coordinates for one breakpoint, as percentages of the field box so they
 * survive resize. Hero.jsx converts to px inside function-based GSAP values
 * on every ScrollTrigger refresh.
 *
 * `bounds` is an explicit {left,right,top,bottom} rather than a symmetric
 * inset because the grid has to sit BELOW the headline, not around it. A
 * symmetric band put a row of chips straight through the type.
 *
 * Returns a Map keyed by chip id: { homeX, homeY, tightX, tightY }.
 * tightX/tightY are null for chips that do not survive the cull.
 */
export function layoutChips(chips, { cols, bounds, tight }) {
  const rows = Math.ceil(chips.length / cols)
  const spanX = bounds.right - bounds.left
  const spanY = bounds.bottom - bounds.top
  const map = new Map()

  chips.forEach((chip, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    // Single-column/row guards stop a divide-by-zero collapsing the field
    // onto one edge.
    map.set(chip.id, {
      homeX: bounds.left + (cols === 1 ? spanX / 2 : (col / (cols - 1)) * spanX),
      homeY: bounds.top + (rows === 1 ? spanY / 2 : (row / (rows - 1)) * spanY),
      tightX: null,
      tightY: null,
    })
  })

  // Compact grid for the chips that survive the cull. Reading order is kept,
  // so the tightened cluster preserves the field's left-to-right rhythm.
  const survivors = chips.filter((c) => c.kind === 'convert')
  const tCols = Math.min(tight.cols, survivors.length) || 1
  const tRows = Math.ceil(survivors.length / tCols)

  survivors.forEach((chip, i) => {
    const col = i % tCols
    const row = Math.floor(i / tCols)
    const slot = map.get(chip.id)
    slot.tightX =
      tCols === 1
        ? tight.centreX
        : tight.centreX - tight.spanX / 2 + (col / (tCols - 1)) * tight.spanX
    slot.tightY =
      tRows === 1
        ? tight.centreY
        : tight.centreY - tight.spanY / 2 + (row / (tRows - 1)) * tight.spanY
  })

  return map
}

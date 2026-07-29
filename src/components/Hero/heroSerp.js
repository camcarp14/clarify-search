/**
 * The hero's results page.
 *
 * Replaces the scattered query-chip field. The chips were abstract — text pills
 * standing in for "search demand" — and abstraction is what made the hero read
 * as decoration rather than as the product. A results page is the thing the
 * headline is literally about ("Own more of the results page"), the thing the
 * business operates on, and a shape every visitor recognises in half a second.
 *
 * The example account is the same one the rest of the site uses: Lakeview
 * Family Dental, Chicago. The query and the visual language match the SERP mock
 * in #ai-visibility on purpose — one artifact, seen twice, is a product. Two
 * different mocks are two mockups.
 */

/** The query that types into the omnibox. */
export const QUERY = 'best family dentist near me'

/**
 * Rows, in the order a real results page stacks them.
 *
 * `verdict` is what the scroll reveals about each row:
 *   'paid'  — you are buying this click
 *   'owned' — you already earn this click
 *   null    — neutral context
 *
 * `leak: true` marks the row the sequence culls: the sponsored click bought on
 * a term the site already ranks #1 for. That single overlap is the whole
 * argument of the page, so the hero shows exactly it and nothing else.
 */
export const ROWS = [
  {
    id: 'ai',
    kind: 'ai',
    tag: 'AI ANSWER',
    badge: 'NEW TOP',
    url: null,
    title: 'Three practices stand out for family care nearby',
    trailing: null,
    note: 'Answered before anyone scrolls',
    verdict: null,
    leak: false,
  },
  {
    id: 'paid',
    kind: 'paid',
    tag: 'SPONSORED',
    badge: null,
    url: 'yourpractice.com',
    title: 'Family Dentist in Lakeview — Book Today',
    trailing: null,
    note: 'The click you bought',
    verdict: 'paid',
    leak: true,
  },
  {
    id: 'org1',
    kind: 'org',
    tag: '#1 ORGANIC',
    badge: null,
    url: 'yourpractice.com',
    title: 'Lakeview Family Dental — New Patients Welcome',
    trailing: null,
    note: 'The same click, already earned',
    verdict: 'owned',
    leak: false,
  },
]

/** Copy the sequence writes onto the marked rows. */
export const VERDICT_LABEL = {
  paid: 'You paid for this click',
  owned: 'You already ranked #1 for it',
}

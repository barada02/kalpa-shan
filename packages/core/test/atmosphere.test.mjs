import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderSVG, seasonOf, timeOf } from 'kalpa-shan'
import { normalizeIds } from './cases.mjs'

const base = { seed: 'welcome', distance: 'high' }
const paths = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])

/** Whether every item of `small` appears in `big`, in order. */
function isSubsequence(small, big) {
  let i = 0
  for (const item of big) if (item === small[i]) i++
  return i === small.length
}

test('summer, clear and day are the plain painting', () => {
  const plain = normalizeIds(renderSVG(base))
  const explicit = normalizeIds(renderSVG({ ...base, season: 'summer', weather: 'clear', time: 'day' }))
  assert.equal(explicit.replace(/ data-(season|weather|time)="[a-z]+"/g, ''), plain)
})

test('season, weather and time keep the same landscape', () => {
  const variants = [
    { season: 'spring' },
    { season: 'autumn' },
    { season: 'winter' },
    { weather: 'rain' },
    { weather: 'snow' },
    { weather: 'fog' },
    { time: 'dusk' },
    { time: 'night' },
    { season: 'winter', weather: 'snow', time: 'night', space: 'left' },
  ]
  for (const seed of ['welcome', 'hello', 42]) {
    for (const distance of ['level', 'high', 'deep']) {
      for (const v of variants) {
        const plain = paths(renderSVG({ seed, distance, space: v.space }))
        const changed = paths(renderSVG({ seed, distance, ...v }))
        // Every brushstroke of the plain painting is still there, in the same order.
        assert.ok(isSubsequence(plain, changed), JSON.stringify({ seed, distance, ...v }))
      }
    }
  }
})

test("'auto' follows the date", () => {
  assert.equal(seasonOf(new Date(2026, 0, 10)), 'winter')
  assert.equal(seasonOf(new Date(2026, 3, 10)), 'spring')
  assert.equal(seasonOf(new Date(2026, 6, 10)), 'summer')
  assert.equal(seasonOf(new Date(2026, 9, 10)), 'autumn')
  assert.equal(seasonOf(new Date(2026, 11, 31)), 'winter')
  assert.equal(timeOf(new Date(2026, 0, 1, 4)), 'night')
  assert.equal(timeOf(new Date(2026, 0, 1, 6)), 'dusk')
  assert.equal(timeOf(new Date(2026, 0, 1, 12)), 'day')
  assert.equal(timeOf(new Date(2026, 0, 1, 18)), 'dusk')
  assert.equal(timeOf(new Date(2026, 0, 1, 21)), 'night')

  const svg = renderSVG({ ...base, season: 'auto', time: 'auto', date: new Date(2026, 3, 1, 19) })
  assert.match(svg, /data-season="spring"/)
  assert.match(svg, /data-time="dusk"/)
  assert.equal(normalizeIds(svg), normalizeIds(renderSVG({ ...base, season: 'spring', time: 'dusk' })))
})

test('the plain painting has no atmosphere attributes', () => {
  assert.doesNotMatch(renderSVG(base), /data-(season|weather|time)/)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderSVG } from 'kalpa-shan'

const paths = (svg) => [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1])

/** Whether every item of `small` appears in `big`, in order. */
function isSubsequence(small, big) {
  let i = 0
  for (const item of big) if (item === small[i]) i++
  return i === small.length
}

const seeds = ['welcome', 'hello', 42, 'mountain-dream']
const distances = ['level', 'high', 'deep']

test('birds, travellers and a waterfall keep the same landscape', () => {
  for (const seed of seeds) {
    for (const distance of distances) {
      const plain = paths(renderSVG({ seed, distance }))
      for (const life of [{ birds: true }, { travellers: true }, { waterfall: true }, { birds: true, travellers: true, waterfall: true }]) {
        assert.ok(isSubsequence(plain, paths(renderSVG({ seed, distance, ...life }))), JSON.stringify({ seed, distance, ...life }))
      }
    }
  }
})

test('each living detail is independent of the others', () => {
  for (const seed of seeds) {
    const base = { seed, distance: 'high' }
    const fall = paths(renderSVG({ ...base, waterfall: true }))
    const fallAndBirds = paths(renderSVG({ ...base, waterfall: true, birds: true, travellers: true }))
    // Turning birds and travellers on doesn't move the waterfall.
    assert.ok(isSubsequence(fall, fallAndBirds), String(seed))
  }
})

test('details appear where they belong', () => {
  let falls = 0
  let walkers = 0
  for (const seed of seeds) {
    for (const distance of distances) {
      const svg = renderSVG({ seed, distance, birds: true, travellers: true, waterfall: true })
      assert.match(svg, /stroke-linecap="round"/, 'birds are always drawn')
      if (/stroke-dasharray/.test(svg)) falls++
      if (distance !== 'high') assert.doesNotMatch(svg, /stroke-dasharray/, 'waterfalls only on high')
      walkers += Number(svg.length > renderSVG({ seed, distance, birds: true, waterfall: true }).length)
    }
  }
  assert.ok(falls >= 3, `expected waterfalls on most high compositions, got ${falls}`)
  assert.ok(walkers >= 9, `expected travellers on most paintings, got ${walkers}`)
})

test('nothing living is added unless asked for', () => {
  const svg = renderSVG({ seed: 'welcome', distance: 'high' })
  assert.doesNotMatch(svg, /stroke-dasharray|stroke-linecap="round"/)
})

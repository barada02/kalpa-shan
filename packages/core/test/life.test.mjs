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

test('birds and travellers keep the same landscape', () => {
  for (const seed of seeds) {
    for (const distance of distances) {
      const plain = paths(renderSVG({ seed, distance }))
      for (const life of [{ birds: true }, { travellers: true }, { birds: true, travellers: true }]) {
        assert.ok(isSubsequence(plain, paths(renderSVG({ seed, distance, ...life }))), JSON.stringify({ seed, distance, ...life }))
      }
    }
  }
})

test('each living detail is independent of the others', () => {
  for (const seed of seeds) {
    const base = { seed, distance: 'high' }
    const birds = paths(renderSVG({ ...base, birds: true }))
    const both = paths(renderSVG({ ...base, birds: true, travellers: true }))
    // Turning travellers on doesn't move the birds.
    assert.ok(isSubsequence(birds, both), String(seed))
  }
})

test('details appear where they belong', () => {
  let walkers = 0
  for (const seed of seeds) {
    for (const distance of distances) {
      const svg = renderSVG({ seed, distance, birds: true, travellers: true })
      assert.match(svg, /stroke-linecap="round"/, 'birds are always drawn')
      walkers += Number(svg.length > renderSVG({ seed, distance, birds: true }).length)
    }
  }
  assert.ok(walkers >= 9, `expected travellers on most paintings, got ${walkers}`)
})

test('nothing living is added unless asked for', () => {
  const svg = renderSVG({ seed: 'welcome', distance: 'high' })
  assert.doesNotMatch(svg, /stroke-linecap="round"/)
})

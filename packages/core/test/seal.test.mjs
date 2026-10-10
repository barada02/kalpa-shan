import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderSVG } from 'kalpa-shan'
import { normalizeIds } from './cases.mjs'

/** The seal: a rotated group of frame, characters and worn specks. */
const sealOf = (svg) => svg.match(/<g transform="rotate\([^"]+\)">.*?<\/text><\/g>(?:<circle[^>]*\/>)*<\/g>/)?.[0] ?? null
const plain = { seed: 'welcome', distance: 'high' }

test('no seal unless asked for', () => {
  assert.equal(sealOf(renderSVG(plain)), null)
  assert.equal(sealOf(renderSVG({ ...plain, seal: '  ' })), null)
})

test('a seal adds only itself: the painting is unchanged', () => {
  const without = normalizeIds(renderSVG(plain))
  const withSeal = normalizeIds(renderSVG({ ...plain, seal: '山水' }))
  assert.equal(withSeal.replace(sealOf(withSeal), ''), without)
})

test('one seal looks identical on every painting', () => {
  const a = sealOf(renderSVG({ seed: 'one', distance: 'level', seal: 'KB' }))
  const b = sealOf(renderSVG({ seed: 'two', distance: 'deep', palette: 'mist', season: 'winter', seal: 'KB' }))
  // Same text, same corner, same size: same stamp (only the paper-coloured parts follow the palette).
  assert.equal(a.replace(/#[0-9a-f]{6}/g, ''), b.replace(/#[0-9a-f]{6}/g, ''))
  assert.notEqual(a, sealOf(renderSVG({ seed: 'one', distance: 'level', seal: 'KC' })))
})

test('the seal moves out of the text space', () => {
  const corner = (svg) => Number(sealOf(svg).match(/rotate\([-\d.]+ ([\d.]+)/)[1])
  const right = corner(renderSVG({ ...plain, seal: '山' }))
  const moved = corner(renderSVG({ ...plain, seal: '山', space: { x: 0.6, y: 0.6, width: 0.38, height: 0.38 } }))
  assert.ok(right > 1600 * 0.9, `expected bottom-right, got x=${right}`)
  assert.ok(moved < 1600 * 0.1, `expected bottom-left, got x=${moved}`)
})

test('seal text is escaped and limited to four characters', () => {
  const svg = renderSVG({ ...plain, seal: '<&>xyz' })
  assert.match(svg, /<text[^>]*>&lt;<\/text><text[^>]*>&amp;<\/text><text[^>]*>&gt;<\/text><text[^>]*>x<\/text>/)
  assert.doesNotMatch(svg, />y<\/text>/)
})

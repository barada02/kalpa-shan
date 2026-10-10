import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { gzipSync } from 'node:zlib'
import * as esm from 'kalpa-shan'
import { normalizeIds } from './cases.mjs'

const require = createRequire(import.meta.url)

test('ESM and CommonJS builds draw the same painting', () => {
  const cjs = require('kalpa-shan')
  const options = { seed: 'parity', distance: 'deep', space: 'right', animate: true }
  assert.equal(normalizeIds(cjs.renderSVG(options)), normalizeIds(esm.renderSVG(options)))
})

test('the element entry can be imported without a DOM (SSR)', async () => {
  await import('kalpa-shan/element')
  require('kalpa-shan/element')
})

test('space presets resolve to boxes inside the drawing', () => {
  assert.equal(esm.resolveSpace('none'), null)
  assert.equal(esm.resolveSpace(undefined), null)
  for (const [name, box] of Object.entries(esm.spacePresets)) {
    assert.deepEqual(esm.resolveSpace(name), box)
    assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 1 && box.y + box.height <= 1, name)
  }
  const custom = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }
  assert.equal(esm.resolveSpace(custom), custom)
})

test('the label is escaped and the distance is reported', () => {
  const svg = esm.renderSVG({ seed: 1, distance: 'high', label: 'A "quoted" title' })
  assert.match(svg, /aria-label="A &quot;quoted&quot; title"/)
  assert.match(svg, /data-distance="high"/)
})

// The CDN bundle carries the whole library. Raise this only with a reason (see CLAUDE.md).
// History: 8.2 KB in v0.1; 10.0 KB in v0.2 (seasons, weather, time of day); 10.9 KB in v0.3 (seal). Budget 12 KB.
const BUDGET = 12 * 1024

test(`CDN bundle stays under ${BUDGET / 1024} KB gzipped`, () => {
  const size = gzipSync(readFileSync(new URL('../dist/kalpa-shan.iife.js', import.meta.url))).length
  assert.ok(size <= BUDGET, `kalpa-shan.iife.js is ${(size / 1024).toFixed(2)} KB gzipped`)
})

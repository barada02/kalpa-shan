import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { renderSVG } from 'kalpa-shan'
import { cases, fingerprint, normalizeIds } from './cases.mjs'

const snapshots = JSON.parse(readFileSync(new URL('./snapshots.json', import.meta.url), 'utf8'))

test('every case matches its snapshot (same seed, same painting)', () => {
  const changed = []
  for (const [name, options] of Object.entries(cases)) {
    if (!(name in snapshots)) changed.push(`${name} (no snapshot: run npm run test:update)`)
    else if (fingerprint(options) !== snapshots[name]) changed.push(name)
  }
  assert.deepEqual(changed, [], `Paintings changed for ${changed.length} case(s). If intended, run npm run test:update and note it in the release.`)
})

test('repeated renders differ only in their unique ids', () => {
  const a = renderSVG({ seed: 'twice', animate: true })
  const b = renderSVG({ seed: 'twice', animate: true })
  assert.notEqual(a, b)
  assert.equal(normalizeIds(a), normalizeIds(b))
})

test('different seeds give different paintings', () => {
  assert.notEqual(fingerprint({ seed: 'one' }), fingerprint({ seed: 'two' }))
})

// Strip everything animation adds: SMIL elements, reveal clips and their wrapper groups.
const stripAnimation = (svg) =>
  normalizeIds(svg)
    .replace(/<clipPath id="IDc[0-9a-z]+">.*?<\/clipPath>/g, '')
    .replace(/<(set|animate|animateTransform|animateMotion)\b[^>]*\/>/g, '')
    .replace(/ clip-path="url\(#IDc[0-9a-z]+\)"/g, '')
    .replace(/<\/?g>/g, '')

test('animation never changes the painting', () => {
  for (const seed of ['welcome', 'hello', 42, 'mountain-dream']) {
    for (const distance of ['level', 'high', 'deep']) {
      for (const space of ['none', 'left', 'top']) {
        const options = { seed, distance, space }
        const still = stripAnimation(renderSVG(options))
        for (const animate of [true, { reveal: false }, { motion: false }]) {
          assert.equal(stripAnimation(renderSVG({ ...options, animate })), still, JSON.stringify({ ...options, animate }))
        }
      }
    }
  }
})

test('animation never changes the painting, in any weather', () => {
  for (const atmosphere of [{ weather: 'rain' }, { weather: 'snow', season: 'winter' }, { weather: 'fog', time: 'night' }, { season: 'spring', time: 'dusk' }]) {
    for (const distance of ['level', 'high', 'deep']) {
      const options = { seed: 'weather', distance, space: 'left', ...atmosphere }
      const still = stripAnimation(renderSVG(options))
      for (const animate of [true, { reveal: false }, { motion: false }]) {
        assert.equal(stripAnimation(renderSVG({ ...options, animate })), still, JSON.stringify({ ...options, animate }))
      }
    }
  }
})

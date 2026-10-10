// The fixed set of paintings whose output is locked by snapshots.json.
// Adding a case is fine; changing what an existing case draws is a breaking change
// ("same seed, same painting"), so a snapshot update must be called out in the release notes.
import { createHash } from 'node:crypto'
import { renderSVG } from 'kalpa-shan'

const seeds = ['welcome', 'hello', 'my-post', 42, 'mountain-dream', 'ws0zfsxa']
const distances = ['auto', 'level', 'high', 'deep']

export const cases = {}

for (const seed of seeds) {
  for (const distance of distances) cases[`${seed} ${distance}`] = { seed, distance }
}

const variations = {
  'palette qinglu': { palette: 'qinglu' },
  'palette night': { palette: 'night' },
  'palette mist': { palette: 'mist' },
  'palette custom': { palette: { paper: '#f2f0e6', ink: '#0f3b2c', wash: '#2f7d5b' } },
  'space left': { space: 'left' },
  'space right': { space: 'right' },
  'space center': { space: 'center' },
  'space top': { space: 'top' },
  'space custom box': { space: { x: 0.6, y: 0.2, width: 0.3, height: 0.4 } },
  'density 0': { density: 0 },
  'density 1': { density: 1 },
  'no trees': { trees: false },
  'no water': { water: false },
  'no grain': { grain: false },
  'square 900x900': { width: 900, height: 900 },
  'phone 600x1066': { width: 600, height: 1066 },
  'animate': { animate: true },
  'animate reveal only': { animate: { motion: false, duration: 3 } },
  'animate motion only': { animate: { reveal: false } },
}

for (const seed of ['welcome', 'mountain-dream']) {
  for (const distance of ['level', 'high', 'deep']) {
    for (const [name, opts] of Object.entries(variations)) {
      cases[`${seed} ${distance} ${name}`] = { seed, distance, ...opts }
    }
  }
}

// Season, weather and time of day (v0.2).
const atmosphere = {
  'spring': { season: 'spring' },
  'autumn': { season: 'autumn' },
  'winter': { season: 'winter' },
  'rain': { weather: 'rain' },
  'snow': { weather: 'snow', season: 'winter' },
  'fog': { weather: 'fog' },
  'dusk': { time: 'dusk' },
  'night': { time: 'night' },
  'night palette winter night': { palette: 'night', season: 'winter', time: 'night', weather: 'snow' },
  'autumn dusk space left': { season: 'autumn', time: 'dusk', space: 'left' },
  'auto 2026-01-15 22:00': { season: 'auto', time: 'auto', date: new Date(2026, 0, 15, 22) },
  'animate rain night': { weather: 'rain', time: 'night', animate: true },
}

for (const seed of ['welcome', 'mountain-dream']) {
  for (const distance of ['level', 'high', 'deep']) {
    for (const [name, opts] of Object.entries(atmosphere)) {
      cases[`${seed} ${distance} ${name}`] = { seed, distance, ...opts }
    }
  }
}

// Seal stamp (v0.3).
const seals = {
  'seal 1 char': { seal: 'K' },
  'seal 2 chars': { seal: 'KB' },
  'seal 4 chars relief': { seal: { text: 'KSAB', style: 'relief' } },
  'seal initials top-left': { seal: { text: 'KB', position: 'top-left' } },
  'seal avoids space': { seal: 'KB', space: { x: 0.6, y: 0.6, width: 0.38, height: 0.38 } },
  'seal night palette animate': { seal: 'S', palette: 'night', animate: true },
}

for (const seed of ['welcome', 'mountain-dream']) {
  for (const [name, opts] of Object.entries(seals)) cases[`${seed} high ${name}`] = { seed, distance: 'high', ...opts }
}

/** Replace this render's unique id prefix, which changes per call by design. */
export function normalizeIds(svg) {
  const uid = svg.match(/id="(ks[0-9a-z]+)m"/)[1]
  return svg.split(uid).join('ID')
}

export function fingerprint(options) {
  return createHash('sha256').update(normalizeIds(renderSVG(options))).digest('hex').slice(0, 16)
}

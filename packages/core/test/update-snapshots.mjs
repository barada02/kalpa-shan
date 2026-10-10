// Rewrite snapshots.json from the current build. Run only when a painting change is intended:
//   npm run test:update -w kalpa-shan
import { readFileSync, writeFileSync } from 'node:fs'
import { cases, fingerprint } from './cases.mjs'

const file = new URL('./snapshots.json', import.meta.url)
let old = {}
try {
  old = JSON.parse(readFileSync(file, 'utf8'))
} catch {}

const next = {}
const changed = []
for (const [name, options] of Object.entries(cases)) {
  next[name] = fingerprint(options)
  if (old[name] && old[name] !== next[name]) changed.push(name)
}
const added = Object.keys(next).filter((k) => !(k in old))
const removed = Object.keys(old).filter((k) => !(k in next))

writeFileSync(file, JSON.stringify(next, null, 2) + '\n')
console.log(`${Object.keys(next).length} snapshots written: ${changed.length} changed, ${added.length} added, ${removed.length} removed`)
for (const name of changed) console.log(`  changed: ${name}`)
for (const name of removed) console.log(`  removed: ${name}`)

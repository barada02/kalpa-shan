import { drift, fadeIn } from '../anim'
import { brush, type Pt } from '../stroke'
import type { Ctx } from '../types'
import { circle, fillPath } from './svg'

/*
 * Living details: birds and travellers. Each draws from its own rng stream
 * (ctx.stream), so turning one on adds it without moving anything else in the painting.
 */

const r1 = (n: number) => Math.round(n * 10) / 10

/** A gull-like "m" stroke centred at (x, y); `lift` < 0 folds the wings down. */
const wing = (x: number, y: number, s: number, lift: number) =>
  `M${r1(x - s)} ${r1(y)}Q${r1(x - s / 2)} ${r1(y - s * lift)} ${r1(x)} ${r1(y)}Q${r1(x + s / 2)} ${r1(y - s * lift)} ${r1(x + s)} ${r1(y)}`

/** A small flock in a loose V, high in the sky and clear of the text space. */
export function birds(ctx: Ctx): string {
  const { W, H, palette } = ctx
  const rng = ctx.stream('birds')
  const count = rng.int(3, 8)
  const dir = rng.chance(0.5) ? 1 : -1
  const s = H * rng.range(0.008, 0.013)

  let cx = 0
  let cy = 0
  for (let i = 0; i < 8; i++) {
    cx = rng.range(0.15, 0.85) * W
    cy = rng.range(0.12, 0.35) * H
    if (!ctx.inSpace(cx, cy) && !ctx.inSpace(cx - dir * s * 12, cy)) break
  }

  let out = ''
  for (let k = 0; k < count; k++) {
    const rank = Math.ceil(k / 2)
    const side = k % 2 ? 1 : -1
    const x = cx - dir * rank * s * rng.range(2.2, 3.2)
    const y = cy + side * rank * s * rng.range(0.9, 1.5)
    const size = s * rng.range(0.8, 1.2)
    const d = wing(x, y, size, rng.range(0.5, 0.8))
    // Drawn from the rng even without motion, so turning motion on never changes the painting.
    const flap = `values="${d};${wing(x, y, size, -0.25)};${d}" dur="${r1(rng.range(0.5, 0.9))}s" begin="-${r1(rng.next())}s"`
    const anim = ctx.motion ? `<animate attributeName="d" ${flap} repeatCount="indefinite"/>` : ''
    out += `<path d="${d}" fill="none" stroke="${palette.ink}" stroke-width="${r1(size * 0.22)}" stroke-linecap="round">${anim}</path>`
  }
  const travel = drift(ctx, dir * W * rng.range(0.04, 0.08), -H * 0.01, rng.range(30, 50))
  return fadeIn(ctx, `<g opacity="0.85">${travel}${out}</g>`, 0.3, 1)
}

/** A walking figure with its feet at (x, y), facing `dir`. */
function figure(ctx: Ctx, x: number, y: number, s: number, dir: number, staff: boolean, ch: number): string {
  const { noise, palette } = ctx
  const lean = dir * s * 0.08
  let out = fillPath(brush([[x, y], [x + lean * 0.5, y - s * 0.45], [x + lean, y - s * 0.75]], { width: s * 0.32, noise, channel: ch, taper: 0.15 }), palette.ink, 0.9)
  out += circle(x + lean * 1.1, y - s * 0.86, s * 0.1, palette.ink)
  // A wide-brimmed hat.
  out += fillPath(brush([[x + lean - s * 0.2, y - s * 0.9], [x + lean * 1.1, y - s * 0.97], [x + lean + s * 0.2, y - s * 0.9]], { width: s * 0.06, noise, channel: ch + 1, taper: 0.3 }), palette.ink)
  if (staff) {
    out += fillPath(brush([[x + dir * s * 0.32, y + s * 0.02], [x + dir * s * 0.24, y - s * 0.8]], { width: s * 0.04, noise, channel: ch + 2, taper: 0.4 }), palette.ink)
  }
  return out
}

/** Two travellers, a scholar with a staff and a companion, walking along a foreground ridge. */
export function travellers(ctx: Ctx, ridge: Pt[]): string {
  const { W, H } = ctx
  const rng = ctx.stream('travellers')
  const s = H * rng.range(0.035, 0.045)
  const dir = rng.chance(0.5) ? 1 : -1
  const n = ridge.length
  const ok = (i: number) => {
    const [x, y] = ridge[i]
    return x > W * 0.04 && x < W * 0.96 && y < H * 0.99 && !ctx.inSpace(x, y - s)
  }
  const spots: number[] = []
  for (let i = Math.floor(n * 0.2); i < Math.ceil(n * 0.8); i++) if (ok(i)) spots.push(i)
  if (!spots.length) return ''

  const i = spots[Math.floor(rng.next() * spots.length)]
  const ch = rng.range(0, 1000)
  const [x, y] = ridge[i]
  // The companion follows a little behind, on the ridge where it is.
  const j = Math.min(n - 1, Math.max(0, i - dir * Math.max(1, Math.round(n * 0.03))))
  const [fx, fy] = ridge[j]
  const lead = figure(ctx, x, y + s * 0.05, s, dir, true, ch)
  const follow = figure(ctx, fx, fy + s * 0.05, s * 0.9, dir, false, ch + 7)
  return fadeIn(ctx, follow + lead, 0.3, 0.8)
}

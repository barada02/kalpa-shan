import { brush, type Pt } from '../stroke'
import type { Ctx } from '../types'
import { circle, fillPath } from './svg'

type TreeKind = 'pine' | 'leafy' | 'bare'
const KINDS: readonly TreeKind[] = ['pine', 'pine', 'leafy', 'bare']

/** Autumn leaves and moss: ochre, rust, cinnabar. */
export const AUTUMN = ['#a8432a', '#c06b2c', '#b8892f'] as const
const BLOSSOM = '#cf5f6a'

/** Plum blossom: a few dots scattered around (x, y). Seasonal touches use ctx.fx only. */
function blossom(ctx: Ctx, x: number, y: number, spread: number, size: number, count: number): string {
  const { fx } = ctx
  let out = ''
  for (let i = 0; i < count; i++) {
    const a = fx.range(0, Math.PI * 2)
    const r = spread * Math.sqrt(fx.next())
    out += circle(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, size * fx.range(0.03, 0.05), BLOSSOM, fx.range(0.7, 0.95))
  }
  return out
}

/** A small tree rooted at (x, y), roughly `size` tall. */
export function tree(ctx: Ctx, x: number, y: number, size: number): string {
  const { rng, noise, palette } = ctx
  const ch = rng.range(0, 1000)
  const kind = rng.pick(KINDS)
  const lean = rng.range(-0.18, 0.18)
  const out: string[] = []

  const trunk: Pt[] = []
  const segs = 8
  for (let j = 0; j <= segs; j++) {
    const t = j / segs
    trunk.push([x + lean * size * t + (noise(t * 3, ch) - 0.5) * size * 0.15, y - size * t])
  }
  out.push(fillPath(brush(trunk, { width: size * 0.05, noise, channel: ch, taper: 0.35 }), palette.ink))

  const at = (t: number) => trunk[Math.round(t * segs)]

  if (kind === 'pine') {
    const layers = rng.int(3, 5)
    for (let l = 0; l < layers; l++) {
      const t = 0.4 + (0.6 * l) / (layers - 1)
      const [cx, cy] = at(t)
      const half = size * 0.34 * (1 - t * 0.55) * rng.range(0.8, 1.2)
      const needles: Pt[] = []
      for (let k = 0; k <= 6; k++) {
        const u = k / 3 - 1
        needles.push([cx + u * half, cy + Math.abs(u) * size * 0.04 + (noise(k, ch + l) - 0.5) * size * 0.03])
      }
      out.push(fillPath(brush(needles, { width: size * 0.09, noise, channel: ch + l * 7 }), palette.ink, 0.85))
      if (ctx.season === 'winter') {
        // Snow settled on top of each layer of needles.
        const snow = needles.map(([nx, ny]): Pt => [nx, ny - size * 0.035])
        out.push(fillPath(brush(snow, { width: size * 0.05, noise, channel: ch + l * 7 + 3 }), ctx.light))
      }
    }
  } else if (kind === 'leafy') {
    const [cx, cy] = at(0.85)
    const blobs = rng.int(12, 20)
    for (let b = 0; b < blobs; b++) {
      const a = rng.range(0, Math.PI * 2)
      const r = size * 0.3 * Math.sqrt(rng.next())
      const bx = cx + Math.cos(a) * r * 1.2
      const by = cy + Math.sin(a) * r * 0.7
      const br = size * rng.range(0.04, 0.08)
      const o = rng.range(0.45, 0.85)
      // Winter: a few dry leaves left. Autumn: most leaves turn.
      const color = ctx.season === 'autumn' && ctx.fx.chance(0.7) ? ctx.fx.pick(AUTUMN) : palette.ink
      out.push(circle(bx, by, br, color, ctx.season === 'winter' ? o * 0.3 : o))
    }
    if (ctx.season === 'spring') out.push(blossom(ctx, cx, cy, size * 0.4, size, ctx.fx.int(10, 18)))
  } else {
    const branches = rng.int(3, 5)
    for (let b = 0; b < branches; b++) {
      const [bx, by] = at(rng.range(0.4, 0.9))
      const dir = rng.chance(0.5) ? -1 : 1
      const len = size * rng.range(0.2, 0.4)
      const pts: Pt[] = []
      for (let k = 0; k <= 5; k++) {
        const t = k / 5
        pts.push([bx + dir * len * t, by - len * 0.6 * t + (noise(t * 4, ch + b) - 0.5) * size * 0.08])
      }
      out.push(fillPath(brush(pts, { width: size * 0.035, noise, channel: ch + b, taper: 0.3 }), palette.ink))
      if (ctx.season === 'spring') {
        const [tx, ty] = pts[ctx.fx.int(3, 5)]
        out.push(blossom(ctx, tx, ty, size * 0.1, size, ctx.fx.int(3, 6)))
      }
    }
  }

  return out.join('')
}

import { fadeIn, wipe } from '../anim'
import { brush, pathFromPoints, type Pt } from '../stroke'
import { isDark } from '../atmosphere'
import type { Ctx, Season } from '../types'
import { circle, fillPath } from './svg'
import { AUTUMN, tree } from './tree'

const TINT: Partial<Record<Season, string>> = { spring: '#7f9a5c', autumn: '#b5793a' }

export interface MountainOptions {
  /** Centre x of the base. */
  x: number
  /** Baseline y (bottom of the mountain). */
  y: number
  w: number
  h: number
  /** Texture/detail amount, 0..1. */
  detail: number
  trees: boolean
  /** Distant mountain: soft wash only, no strokes. */
  washOnly?: boolean
}

export function mountain(ctx: Ctx, o: MountainOptions): string {
  const { rng, noise, palette, ids } = ctx
  const ch = rng.range(0, 1000)
  const peak = rng.range(-0.3, 0.3)
  // Sample count depends on relative size only, so the rng sequence (and the painting)
  // doesn't change with the canvas's aspect ratio.
  const rel = o.w / ctx.span
  const n = Math.max(24, Math.round(rel * 200))

  // Ridge profile: a skewed cosine envelope modulated by two octaves of noise.
  const heights: number[] = []
  const xs: number[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = t * 2 - 1
    const d = u < peak ? (u - peak) / (1 + peak) : (u - peak) / (1 - peak)
    const env = (Math.cos(d * Math.PI) + 1) / 2
    const m = 0.7 + (noise(t * 2.5, ch) - 0.5) * 0.9 + (noise(t * 10, ch + 7) - 0.5) * 0.3
    heights.push(Math.max(0, o.h * env * m))
    xs.push(o.x + (t - 0.5) * o.w)
  }


  // Keep out of the text space. First shrink the whole mountain (keeps its shape, never
  // below half size), then soft-limit what still pokes in. The limit itself undulates with
  // noise, so a squashed ridge rolls gently under the space instead of running flat.
  const allowed = xs.map((x, i) => (o.y - ctx.ceiling(x)) * (0.8 + 0.2 * noise(i * 0.12, ch + 33)))
  let scale = 1
  heights.forEach((hy, i) => {
    if (hy > 0 && allowed[i] < hy) scale = Math.min(scale, Math.max(0, allowed[i]) / hy)
  })
  scale = Math.max(0.5, scale)
  const profile: Pt[] = heights.map((hy, i) => {
    heights[i] = softLimit(hy * scale, allowed[i])
    return [xs[i], o.y - heights[i]]
  })
  const top = Math.max(...heights)
  // Squashed to a sliver by the space: it would only read as a stray line, so leave it out.
  if (top < Math.max(2, o.h * 0.2)) return ''
  const bodyPath = pathFromPoints(profile, true)

  // Seasons tint the washes: fresh green in spring, ochre (赭石) in autumn.
  const tint = TINT[ctx.season]
  const tinted = tint ? `<path d="${bodyPath}" fill="${tint}" fill-opacity="0.14"/>` : ''

  if (o.washOnly) return fadeIn(ctx, `<path d="${bodyPath}" fill="url(#${ids.mist})"/>${tinted}`, 0.25, 1.2)

  // Opaque paper fill hides whatever is behind, then a misty wash fading toward the base.
  let body = `<path d="${bodyPath}" fill="${palette.paper}"/><path d="${bodyPath}" fill="url(#${ids.mist})"/>${tinted}`
  if (ctx.season === 'winter') {
    // Snow: the upper slopes left unwashed, down to an uneven snow line.
    const line: Pt[] = profile.map(([x, y], i) => [x, y + heights[i] * (0.25 + 0.3 * noise(i * 0.15, ch + 55))])
    body += `<path d="${pathFromPoints([...profile, ...line.reverse()], true)}" fill="${ctx.light}"${isDark(palette.paper) ? ' fill-opacity="0.5"' : ''}/>`
  }
  const texture: string[] = []
  const details: string[] = []
  const strokeW = 1 + o.h * 0.006

  // Contour texture: inner ridge lines broken into fragments.
  const rings = Math.round(2 + o.detail * 5)
  for (let r = 1; r <= rings; r++) {
    const sc = r / (rings + 1)
    const inner: Pt[] = profile.map(([x], i) => [
      o.x + (x - o.x) * (1 - sc * 0.35) + (noise(i * 0.2, ch + r * 13) - 0.5) * o.w * 0.03,
      o.y - heights[i] * (1 - sc) + (noise(i * 0.3, ch + r * 17) - 0.5) * o.h * 0.05,
    ])
    let seg: Pt[] = []
    const flush = () => {
      if (seg.length >= 3 && rng.chance(0.55 + o.detail * 0.3 - sc * 0.3)) {
        texture.push(fillPath(brush(seg, { width: strokeW * 0.8, noise, channel: ch + r }), palette.ink, rng.range(0.3, 0.6)))
      }
      seg = []
    }
    for (const p of inner) {
      seg.push(p)
      if (rng.chance(0.12)) flush()
    }
    flush()
  }

  // Axe-cut strokes (斧劈皴): short strokes falling from the ridge, slanting outward.
  const peakX = profile[heights.indexOf(top)][0]
  const cuts = Math.round(rel * 133 * (0.4 + o.detail))
  for (let c = 0; c < cuts; c++) {
    const i = rng.int(2, n - 2)
    if (heights[i] < o.h * 0.1) continue
    const [x, y] = profile[i]
    const len = heights[i] * rng.range(0.12, 0.45)
    const dir = x < peakX ? -1 : 1
    const pts: Pt[] = []
    for (let j = 0; j <= 5; j++) {
      const t = j / 5
      pts.push([x + dir * len * 0.3 * t + (noise(t * 3, ch + c) - 0.5) * 4, y + 3 + len * t])
    }
    texture.push(fillPath(brush(pts, { width: strokeW * 1.1, noise, channel: ch + c * 3 }), palette.ink, rng.range(0.2, 0.5)))
  }

  const ridge = fillPath(brush(profile, { width: strokeW * 1.8, noise, channel: ch + 99, taper: 0.3, jitter: 0.8 }), palette.ink)

  // Moss dots (点苔) along the ridge.
  for (let i = 1; i < n; i++) {
    if (heights[i] < o.h * 0.25 || !rng.chance(0.1 * o.detail)) continue
    const [x, y] = profile[i]
    const dots = rng.int(2, 5)
    for (let k = 0; k < dots; k++) {
      const color = ctx.season === 'autumn' && ctx.fx.chance(0.5) ? ctx.fx.pick(AUTUMN) : palette.ink
      details.push(circle(x + rng.range(-6, 6), y + rng.range(-2, 5), rng.range(0.8, 2.2), color, rng.range(0.6, 1)))
    }
  }

  // Trees on the ridge.
  if (o.trees) {
    for (let i = 2; i < n - 2; i++) {
      if (heights[i] < o.h * 0.15 || !rng.chance(0.07)) continue
      const [x, y] = profile[i]
      details.push(tree(ctx, x, y + 2, o.h * rng.range(0.07, 0.15)))
    }
  }

  // Painting order: wash the body, draw the ridge line, texture it, then add details.
  // Slots are reserved in that order; the DOM order below keeps the ridge on top.
  const aBody = fadeIn(ctx, body, 0.25, 1)
  const aRidge = wipe(ctx, ridge, xs[0] - 4, xs[n] + 4, o.y - top - strokeW * 3, o.y + 4, 0.9, 1.6)
  const aTexture = fadeIn(ctx, texture.join(''), 0.6, 1.4)
  const aDetails = fadeIn(ctx, details.join(''), 0.4, 0.9)
  return `<g>${aBody}${aTexture}${aRidge}${aDetails}</g>`
}

/** min(h, a) with a smooth knee instead of a hard corner. */
function softLimit(h: number, a: number): number {
  if (a === Infinity) return h
  if (a <= 0) return 0
  const k = a * 0.75
  return h <= k ? h : k + (a - k) * Math.tanh((h - k) / (a - k))
}

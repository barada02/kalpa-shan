import { fadeIn } from './anim'
import { Rng } from './rng'
import type { Ctx, SealCorner, SealOptions } from './types'

/*
 * The red seal (印章) a painter presses onto the finished work. Its irregularities come
 * from the seal's own text, not the painting's seed, so one seal looks identical on every
 * painting, just like a real stamp.
 */

const VERMILION = '#b8322a'
const FONT = `'STKaiti','KaiTi',serif`
const CORNERS: readonly SealCorner[] = ['bottom-right', 'bottom-left', 'top-right', 'top-left']
const r1 = (n: number) => Math.round(n * 10) / 10

export function resolveSeal(s: string | SealOptions | undefined): Required<SealOptions> | null {
  if (!s) return null
  const o = typeof s === 'string' ? { text: s } : s
  const chars = Array.from(o.text.trim()).slice(0, 4)
  if (!chars.length) return null
  return { text: chars.join(''), position: o.position ?? 'bottom-right', style: o.style ?? 'intaglio' }
}

const xml = (c: string) => c.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Character centres as fractions of the seal, read top to bottom, right column first:
 * 1 fills the seal, 2 stack, 3 put one on the right and two on the left, 4 make a grid.
 */
function layout(n: number): { at: [number, number][]; size: number } {
  if (n === 1) return { at: [[0.5, 0.5]], size: 0.66 }
  if (n === 2) return { at: [[0.5, 0.28], [0.5, 0.72]], size: 0.4 }
  if (n === 3) return { at: [[0.73, 0.5], [0.27, 0.28], [0.27, 0.72]], size: 0.4 }
  return { at: [[0.73, 0.28], [0.73, 0.72], [0.27, 0.28], [0.27, 0.72]], size: 0.4 }
}

export function seal(ctx: Ctx, o: Required<SealOptions>): string {
  const { W, H, palette } = ctx
  const rng = new Rng(`seal:${o.text}:${o.style}`)
  const s = Math.min(W, H) * 0.1
  const m = s * 0.6

  // The requested corner, or else the first corner clear of the text space.
  const corner = (c: SealCorner): [number, number] => [c.endsWith('right') ? W - m - s : m, c.startsWith('bottom') ? H - m - s : m]
  const isClear = (c: SealCorner) => {
    const [x, y] = corner(c)
    return ![[x, y], [x + s, y], [x, y + s], [x + s, y + s]].some(([px, py]) => ctx.inSpace(px, py))
  }
  const [x, y] = corner([o.position, ...CORNERS].find(isClear) ?? o.position)

  // A square with slightly uneven, hand-cut edges.
  const edge: [number, number][] = []
  const side = (x0: number, y0: number, x1: number, y1: number) => {
    for (let i = 0; i < 6; i++) {
      const t = i / 6
      edge.push([x0 + (x1 - x0) * t + rng.range(-1, 1) * s * 0.015, y0 + (y1 - y0) * t + rng.range(-1, 1) * s * 0.015])
    }
  }
  side(x, y, x + s, y)
  side(x + s, y, x + s, y + s)
  side(x + s, y + s, x, y + s)
  side(x, y + s, x, y)
  const d = 'M' + edge.map(([px, py]) => `${r1(px)} ${r1(py)}`).join('L') + 'Z'

  const intaglio = o.style === 'intaglio'
  const frame = intaglio
    ? `<path d="${d}" fill="${VERMILION}"/>`
    : `<path d="${d}" fill="none" stroke="${VERMILION}" stroke-width="${r1(s * 0.07)}"/>`

  const chars = Array.from(o.text)
  const { at, size } = layout(chars.length)
  let text = ''
  chars.forEach((c, i) => {
    const [fx, fy] = at[i]
    text += `<text x="${r1(x + fx * s)}" y="${r1(y + fy * s)}">${xml(c)}</text>`
  })
  const textGroup =
    `<g font-family="${FONT}" font-size="${r1(s * size)}" font-weight="700" text-anchor="middle" ` +
    `dominant-baseline="central" fill="${intaglio ? palette.paper : VERMILION}">${text}</g>`

  // Worn spots where the ink didn't take.
  let wear = ''
  const specks = rng.int(6, 12)
  for (let i = 0; i < specks; i++) {
    wear += `<circle cx="${r1(x + rng.next() * s)}" cy="${r1(y + rng.next() * s)}" r="${r1(s * rng.range(0.01, 0.03))}" fill="${palette.paper}"/>`
  }

  const cx = r1(x + s / 2)
  const cy = r1(y + s / 2)
  const tilt = r1(rng.range(-3, 3))
  return fadeIn(ctx, `<g transform="rotate(${tilt} ${cx} ${cy})">${frame}${textGroup}${wear}</g>`, 0.3, 0.5)
}

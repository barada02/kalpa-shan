import { mistBand } from '../elements/mist'
import { mountain } from '../elements/mountain'
import { boat, water } from '../elements/water'
import type { Ctx } from '../types'
import { farWashes, group, placeX, treeClump, type Scene } from './shared'

/** Deep distance: overlapping ranges alternating left and right, receding up into a valley. */
export function deep(ctx: Ctx, s: Scene): string[] {
  const { rng, W, H, span } = ctx
  const out: string[] = []
  const rows = 4 + Math.round(s.D * 3)
  const waterRow = Math.floor(rows / 2) - 1
  let side: -1 | 1 = rng.chance(0.5) ? -1 : 1

  out.push(group(0.35, farWashes(ctx, rng.int(3, 5), [0.4, 0.46], [0.1, 0.25], [0.2, 0.4])))

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1)
    const y = H * (0.45 + 0.57 * t)
    const h = H * (0.14 + 0.3 * t)
    const w = span * (0.28 + 0.25 * t)
    const x = side < 0 ? rng.range(0, 0.35) * W : rng.range(0.65, 1) * W
    const detail = s.D * (0.2 + 0.8 * t)

    let row = mountain(ctx, { x, y, w, h, detail, trees: s.trees && t > 0.3 })
    // Sometimes a smaller answering hill on the other bank.
    if (rng.chance(0.35 + s.D * 0.3)) {
      const ox = side < 0 ? rng.range(0.7, 1) * W : rng.range(0, 0.3) * W
      row += mountain(ctx, { x: ox, y: y + H * 0.02, w: w * 0.7, h: h * 0.6, detail, trees: s.trees && t > 0.3 })
    }
    out.push(group(0.35 + 0.65 * t, row))
    if (t < 0.75) out.push(mistBand(ctx, y - h * 0.1, H * 0.03, 0.6))

    if (s.water && r === waterRow) {
      out.push(water(ctx, y, H, W))
      out.push(boat(ctx, placeX(ctx, 0.38, 0.62), H * rng.range(0.8, 0.88), H * 0.06))
    }
    if (r === rows - 1 && s.trees) {
      out.push(treeClump(ctx, x + side * -1 * span * rng.range(0.05, 0.12), H * 0.97, rng.int(1, 3), [0.1, 0.17]))
    }
    side = side === -1 ? 1 : -1
  }

  return out
}

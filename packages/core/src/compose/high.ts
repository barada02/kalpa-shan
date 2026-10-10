import { mistBand } from '../elements/mist'
import { mountain } from '../elements/mountain'
import { boat, water } from '../elements/water'
import type { Ctx } from '../types'
import { awaySide, farWashes, group, placeX, treeClump, type Scene } from './shared'

/** High distance: one towering main peak with lower flanking peaks, seen from below. */
export function high(ctx: Ctx, s: Scene): string[] {
  const { rng, W, H, span } = ctx
  const out: string[] = []

  out.push(group(0.35, farWashes(ctx, rng.int(2, 4), [0.55, 0.62], [0.2, 0.4], [0.2, 0.4])))

  // Prefer a central peak; if the text space is in the way, move it toward an edge.
  let mainX = placeX(ctx, 0.25, 0.75)
  if (ctx.ceiling(mainX) !== -Infinity) mainX = placeX(ctx, 0.08, 0.92, 10)
  const mainH = H * rng.range(0.72, 0.88)

  let flanks = ''
  let dir: -1 | 1 = rng.chance(0.5) ? -1 : 1
  const flankCount = rng.int(1, 2)
  for (let k = 0; k < flankCount; k++) {
    flanks += mountain(ctx, {
      x: mainX + dir * span * rng.range(0.16, 0.26),
      y: H * 0.88,
      w: span * rng.range(0.2, 0.3),
      h: mainH * rng.range(0.45, 0.65),
      detail: s.D * 0.7,
      trees: s.trees,
    })
    dir = dir === -1 ? 1 : -1
  }
  out.push(group(0.7, flanks))
  out.push(mistBand(ctx, H * 0.86, H * 0.04))

  out.push(group(0.92, mountain(ctx, { x: mainX, y: H * 0.9, w: span * rng.range(0.24, 0.34), h: mainH, detail: s.D, trees: s.trees })))
  // A belt of cloud around the main peak's waist.
  out.push(mistBand(ctx, H * 0.9 - mainH * rng.range(0.3, 0.5), H * 0.05, 0.8))

  if (s.water) {
    out.push(water(ctx, H * 0.9, H, W))
    if (rng.chance(0.5)) out.push(boat(ctx, placeX(ctx, 0.3, 0.7), H * 0.95, H * 0.06))
  }

  const side = awaySide(ctx)
  const x = side < 0 ? rng.range(0, 0.15) * W : rng.range(0.85, 1) * W
  out.push(mountain(ctx, { x, y: H * 1.03, w: span * rng.range(0.3, 0.45), h: H * rng.range(0.14, 0.24), detail: s.D, trees: false }))
  if (s.trees) out.push(treeClump(ctx, x - side * span * rng.range(0.02, 0.08), H * 0.97, rng.int(1, 3), [0.1, 0.17]))

  return out
}

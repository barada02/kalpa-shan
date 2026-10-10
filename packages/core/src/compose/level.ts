import { mistBand } from '../elements/mist'
import { travellers } from '../elements/life'
import { mountain } from '../elements/mountain'
import { boat, water } from '../elements/water'
import type { Pt } from '../stroke'
import type { Ctx } from '../types'
import { awaySide, farWashes, group, placeX, treeClump, type Scene } from './shared'

/** Level distance: low horizon, wide water, low hills far away, a few trees on a near bank. */
export function level(ctx: Ctx, s: Scene): string[] {
  const { rng, W, H, span } = ctx
  const out: string[] = []
  const hz = rng.range(0.5, 0.58)

  out.push(group(0.4, farWashes(ctx, Math.round(4 + s.D * 4), [hz - 0.01, hz + 0.02], [0.08, 0.2], [0.2, 0.5])))
  out.push(mistBand(ctx, hz * H, H * 0.04))
  out.push(group(0.6, farWashes(ctx, rng.int(2, 3), [hz + 0.02, hz + 0.04], [0.05, 0.12], [0.15, 0.3])))

  let mid = ''
  const midCount = 1 + Math.round(s.D * 2)
  for (let i = 0; i < midCount; i++) {
    mid += mountain(ctx, {
      x: placeX(ctx, 0, 1),
      y: (hz + rng.range(0.05, 0.08)) * H,
      w: span * rng.range(0.2, 0.35),
      h: H * rng.range(0.1, 0.22),
      detail: s.D * 0.5,
      trees: s.trees,
    })
  }
  out.push(group(0.75, mid))
  out.push(mistBand(ctx, (hz + 0.07) * H, H * 0.03, 0.6))

  if (s.water) {
    out.push(water(ctx, (hz + 0.07) * H, H, W))
    const boats = s.D > 0.6 ? 2 : 1
    for (let b = 0; b < boats; b++) out.push(boat(ctx, placeX(ctx, 0.25, 0.75), H * rng.range(0.78, 0.9), H * 0.08))
  }

  const side = awaySide(ctx)
  let ground = null as Pt[] | null
  const x = side < 0 ? rng.range(0.02, 0.2) * W : rng.range(0.8, 0.98) * W
  out.push(mountain(ctx, { x, y: H * 1.03, w: span * rng.range(0.4, 0.6), h: H * rng.range(0.2, 0.32), detail: s.D, trees: false, onRidge: (r) => (ground = r) }))
  if (s.trees) out.push(treeClump(ctx, x - side * span * rng.range(0.02, 0.1), H * 0.96, rng.int(2, 4), [0.12, 0.2]))
  if (s.travellers && ground) out.push(travellers(ctx, ground))

  return out
}

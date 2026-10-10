import { fadeIn } from '../anim'
import { mountain } from '../elements/mountain'
import { tree } from '../elements/tree'
import type { Ctx } from '../types'

export interface Scene {
  /** Density, 0..1. */
  D: number
  trees: boolean
  water: boolean
  travellers: boolean
  waterfall: boolean
}

type Range = [number, number]

/**
 * Pick an x position (fractions of W) that avoids the text space when possible:
 * tries a few candidates and keeps the least restricted one.
 */
export function placeX(ctx: Ctx, min: number, max: number, tries = 6): number {
  let best = 0
  let bestCeil = Infinity
  for (let i = 0; i < tries; i++) {
    const x = ctx.rng.range(min, max) * ctx.W
    const c = ctx.ceiling(x)
    if (c === -Infinity) return x
    if (c < bestCeil) {
      bestCeil = c
      best = x
    }
  }
  return best
}

/** Which side (-1 left, 1 right) is further from the text space. Used to anchor foreground masses. */
export function awaySide(ctx: Ctx): -1 | 1 {
  const pick: -1 | 1 = ctx.rng.chance(0.5) ? -1 : 1
  const l = ctx.ceiling(ctx.W * 0.12)
  const r = ctx.ceiling(ctx.W * 0.88)
  if (l === r) return pick
  return l < r ? -1 : 1
}

/** Soft, stroke-less distant ranges. `base`, `h` are fractions of H; `w` of span. */
export function farWashes(ctx: Ctx, count: number, base: Range, h: Range, w: Range): string {
  const { rng, W, H, span } = ctx
  let out = ''
  for (let i = 0; i < count; i++) {
    out += mountain(ctx, {
      x: rng.range(-0.1, 1.1) * W,
      y: rng.range(base[0], base[1]) * H,
      w: rng.range(w[0], w[1]) * span,
      h: rng.range(h[0], h[1]) * H,
      detail: 0,
      trees: false,
      washOnly: true,
    })
  }
  return out
}

/** A group of foreground trees around x, rooted near y. `size` is a fraction of H. */
export function treeClump(ctx: Ctx, x: number, y: number, count: number, size: Range): string {
  const { rng, H, span } = ctx
  let out = ''
  for (let k = 0; k < count; k++) {
    out += tree(ctx, x + rng.range(-0.05, 0.05) * span, y + rng.range(-0.02, 0.02) * H, rng.range(size[0], size[1]) * H)
  }
  return fadeIn(ctx, out, 0.3, 0.9)
}

export const group = (opacity: number, content: string) =>
  content ? `<g opacity="${opacity.toFixed(2)}">${content}</g>` : ''

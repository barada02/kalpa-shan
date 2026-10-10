import { drift } from '../anim'
import type { Rng } from '../rng'
import type { Ctx } from '../types'

/**
 * A band of soft paper-coloured cloud at height y, laid between layers so mountains
 * rise out of it. Always part of the painting; with motion on, it drifts slowly.
 * Fog passes its own `rng`, so its extra bands never shift the landscape.
 */
export function mistBand(ctx: Ctx, y: number, thickness: number, opacity = 0.75, rng: Rng = ctx.rng): string {
  const { W } = ctx
  const puffs = rng.int(3, 5)
  let out = ''
  for (let i = 0; i < puffs; i++) {
    const cx = rng.range(-0.1, 1.1) * W
    const cy = y + rng.range(-0.3, 0.3) * thickness
    const rx = rng.range(0.15, 0.35) * W
    const ry = thickness * rng.range(0.5, 1)
    out += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="url(#${ctx.ids.fog})"/>`
  }
  // Drawn from the rng even without motion, so turning motion on never changes the painting.
  const dx = rng.range(0.04, 0.1) * W * (rng.chance(0.5) ? 1 : -1)
  const dur = rng.range(40, 90)
  return `<g opacity="${opacity}">${drift(ctx, dx, 0, dur)}${out}</g>`
}

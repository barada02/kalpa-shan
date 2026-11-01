import type { AnimateOptions, Ctx } from './types'

/*
 * Animation uses SVG's built-in SMIL, so it also plays in a downloaded .svg file.
 * Every animated element keeps its final state as its base value: renderers without
 * SMIL (image converters, OG-image tools) simply show the finished painting.
 */

export interface ResolvedAnimate {
  reveal: boolean
  motion: boolean
  duration: number
}

export function resolveAnimate(a: boolean | AnimateOptions | undefined): ResolvedAnimate {
  if (!a) return { reveal: false, motion: false, duration: 0 }
  const o = a === true ? {} : a
  return { reveal: o.reveal ?? true, motion: o.motion ?? true, duration: o.duration ?? 6 }
}

/**
 * Collects reveal start times in abstract units while the scene is built (back to front,
 * i.e. painting order), then rescales them so the whole reveal fits `duration` seconds.
 * Placeholders carry the render's unique tag, so user text (a label, a seal) can never
 * contain one by accident.
 */
export class Timeline {
  private ticks: number[] = []
  private cursor = 0
  private tag: string

  constructor(tag = '') {
    this.tag = tag
  }

  get count(): number {
    return this.ticks.length
  }

  /** Reserve a start slot, advance by `advance` units, and return a placeholder for its time. */
  at(advance: number): string {
    this.ticks.push(this.cursor)
    this.cursor += advance
    return `§${this.tag}${this.ticks.length - 1}§`
  }

  resolve(svg: string, duration: number): string {
    const scale = this.cursor > 0 ? duration / this.cursor : 0
    return svg.replace(new RegExp(`§${this.tag}(\\d+)§`, 'g'), (_, i) => (this.ticks[Number(i)] * scale).toFixed(2))
  }
}

const EASE = 'calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.3 1"'
const r1 = (n: number) => Math.round(n * 10) / 10

/** Fade content in at the next slot of the reveal. */
export function fadeIn(ctx: Ctx, content: string, advance: number, dur = 0.8): string {
  if (!ctx.tl || !content) return content
  const t = ctx.tl.at(advance)
  return (
    `<g><set attributeName="opacity" to="0" begin="0s" end="${t}s"/>` +
    `<animate attributeName="opacity" from="0" to="1" begin="${t}s" dur="${dur}s" fill="freeze"/>` +
    content +
    `</g>`
  )
}

/** Reveal content with a clip that sweeps sideways, like a brush drawing a line. */
export function wipe(ctx: Ctx, content: string, x0: number, x1: number, y0: number, y1: number, advance: number, dur = 1.4): string {
  if (!ctx.tl || !content) return content
  // Alternate directions without touching the rng, so animation never changes the painting.
  const leftToRight = ctx.tl.count % 2 === 0
  const t = ctx.tl.at(advance)
  const id = ctx.uid()
  const w = r1(x1 - x0)
  const grow =
    `<set attributeName="width" to="0" begin="0s" end="${t}s"/>` +
    `<animate attributeName="width" from="0" to="${w}" begin="${t}s" dur="${dur}s" fill="freeze" ${EASE}/>`
  const slide = leftToRight
    ? ''
    : `<set attributeName="x" to="${r1(x1)}" begin="0s" end="${t}s"/>` +
      `<animate attributeName="x" from="${r1(x1)}" to="${r1(x0)}" begin="${t}s" dur="${dur}s" fill="freeze" ${EASE}/>`
  return (
    `<clipPath id="${id}"><rect x="${r1(x0)}" y="${r1(y0)}" width="${w}" height="${r1(y1 - y0)}">${grow}${slide}</rect></clipPath>` +
    `<g clip-path="url(#${id})">${content}</g>`
  )
}

/** An endless, eased back-and-forth drift. Add inside a <g>. Empty when motion is off. */
export function drift(ctx: Ctx, dx: number, dy: number, dur: number): string {
  if (!ctx.motion) return ''
  return (
    `<animateTransform attributeName="transform" type="translate" additive="sum" ` +
    `values="0 0;${r1(dx)} ${r1(dy)};0 0" keyTimes="0;0.5;1" calcMode="spline" ` +
    `keySplines="0.45 0 0.55 1;0.45 0 0.55 1" dur="${r1(dur)}s" repeatCount="indefinite"/>`
  )
}

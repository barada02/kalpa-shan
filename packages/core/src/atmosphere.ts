import { drift, fadeIn } from './anim'
import { mistBand } from './elements/mist'
import type { Rng } from './rng'
import type { Ctx, LandscapeOptions, Season, TimeOfDay, Weather } from './types'

/*
 * Season, weather and time of day. Everything here draws from its own rng streams, never
 * the landscape's, so the same seed keeps the same mountains in rain, snow or moonlight.
 */

export interface Atmosphere {
  season: Season
  weather: Weather
  time: TimeOfDay
}

const r1 = (n: number) => Math.round(n * 10) / 10

/** Meteorological seasons, northern hemisphere. */
export function seasonOf(date: Date): Season {
  const m = date.getMonth()
  return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'
}

/** Dusk covers both twilights: 5–7 and 17–20 h. */
export function timeOf(date: Date): TimeOfDay {
  const h = date.getHours()
  return h >= 7 && h < 17 ? 'day' : h >= 5 && h < 20 ? 'dusk' : 'night'
}

export function resolveAtmosphere(o: LandscapeOptions): Atmosphere {
  // Only read the clock when asked to, so renders stay pure by default.
  const date = () => (o.date == null ? new Date() : new Date(o.date))
  return {
    season: o.season === 'auto' ? seasonOf(date()) : (o.season ?? 'summer'),
    weather: o.weather ?? 'clear',
    time: o.time === 'auto' ? timeOf(date()) : (o.time ?? 'day'),
  }
}

/** Rough luminance test for #rgb / #rrggbb. Anything else counts as light. */
export function isDark(color: string): boolean {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (!m) return false
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const n = parseInt(hex, 16)
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128
}

const SUN = '#c4472f'
const GLOW = '#d9893f'

/** A full-size rect filled with a vertical gradient of `color`; stops are [offset, opacity]. */
function wash(ctx: Ctx, key: string, color: string, stops: [number, number][]): string {
  const id = ctx.ids.air + key
  const s = stops.map(([o, a]) => `<stop offset="${o}" stop-color="${color}" stop-opacity="${a}"/>`).join('')
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${s}</linearGradient></defs><rect width="${ctx.W}" height="${ctx.H}" fill="url(#${id})"/>`
}

/** Somewhere in the upper sky, clear of the text space when possible. */
function skySpot(ctx: Ctx, rng: Rng, r: number, y0: number, y1: number): [number, number] {
  let x = 0
  let y = 0
  for (let i = 0; i < 8; i++) {
    x = rng.range(0.12, 0.88) * ctx.W
    y = rng.range(y0, y1) * ctx.H
    const hits = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]].some(([px, py]) => ctx.inSpace(px, py))
    if (!hits) break
  }
  return [x, y]
}

/** Drawn first, behind every mountain: overcast or night sky, dusk glow, the sun or the moon. */
export function sky(ctx: Ctx, a: Atmosphere, rng: Rng): string {
  const { palette, H } = ctx
  const shade = isDark(palette.paper) ? '#000' : palette.ink
  let out = ''

  const overcast = a.weather === 'rain' || a.weather === 'snow' ? 0.24 : a.season === 'winter' ? 0.16 : 0
  if (overcast) out += wash(ctx, 'o', shade, [[0, overcast], [0.7, overcast / 4], [1, 0]])

  if (a.time === 'dusk') {
    out += wash(ctx, 'd', GLOW, [[0, 0], [0.35, 0.12], [0.6, 0.3], [1, 0.05]])
    const r = H * rng.range(0.05, 0.07)
    const [x, y] = skySpot(ctx, rng, r, 0.28, 0.42)
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${SUN}" fill-opacity="0.85"/>`
  } else if (a.time === 'night') {
    out += wash(ctx, 'n', shade, [[0, 0.42], [0.6, 0.2], [1, 0.1]])
    // 烘云托月: the moon is the paper left bare, set off by a soft halo of light.
    const r = H * rng.range(0.045, 0.065)
    const [x, y] = skySpot(ctx, rng, r * 2, 0.1, 0.28)
    const id = `${ctx.ids.air}h`
    out +=
      `<defs><radialGradient id="${id}"><stop offset="0.3" stop-color="${ctx.light}" stop-opacity="0.5"/><stop offset="1" stop-color="${ctx.light}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 3.2)}" fill="url(#${id})"/>` +
      `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${ctx.light}"/>`
  }
  return fadeIn(ctx, out, 0.4, 1.5)
}

/** Fog: extra mist bands slipped between the landscape's layers, back to front. */
export function addFog(ctx: Ctx, layers: string[], rng: Rng): void {
  for (const f of [0.75, 0.5, 0.25]) {
    const at = Math.max(1, Math.round(layers.length * f))
    layers.splice(at, 0, mistBand(ctx, rng.range(0.4, 0.85) * ctx.H, ctx.H * rng.range(0.05, 0.09), 0.85, rng))
  }
}

/**
 * Falling marks: one set covering the drawing plus a copy one height above, so the loop
 * is seamless. The copy is always drawn (it sits outside the view when still), so turning
 * motion on never changes the painting.
 */
function falling(ctx: Ctx, marks: string, dx: number, dur: number, sway: string): string {
  const id = `${ctx.ids.air}p`
  const fall = ctx.motion
    ? `<animateTransform attributeName="transform" type="translate" from="0 0" to="${r1(dx)} ${ctx.H}" dur="${dur}s" repeatCount="indefinite"/>`
    : ''
  return `<g>${sway}<g>${fall}<g id="${id}">${marks}</g><use href="#${id}" transform="translate(${r1(-dx)} ${-ctx.H})"/></g></g>`
}

/** Drawn last, over the landscape: night and dusk light, fog, rain, snow. */
export function weather(ctx: Ctx, a: Atmosphere, rng: Rng): string {
  const { palette, W, H } = ctx
  const shade = isDark(palette.paper) ? '#000' : palette.ink
  let out = ''

  if (a.time === 'night') out += wash(ctx, 'N', shade, [[0, 0.15]])
  if (a.time === 'dusk') out += wash(ctx, 'D', GLOW, [[0, 0.07]])
  if (a.weather === 'fog') out += wash(ctx, 'f', palette.paper, [[0, 0.45], [0.6, 0.3], [1, 0.08]])
  if (a.weather === 'rain') out += wash(ctx, 'r', palette.paper, [[0, 0.12]])

  if (a.weather === 'rain') {
    const slant = rng.range(0.1, 0.3) * (rng.chance(0.5) ? 1 : -1)
    let d = ''
    for (let i = 0; i < 140; i++) {
      const len = H * rng.range(0.03, 0.07)
      d += `M${r1(rng.range(-0.2, 1.2) * W)} ${r1(rng.next() * H)}l${r1(len * slant)} ${r1(len)}`
    }
    const streaks = `<path d="${d}" fill="none" stroke="${palette.ink}" stroke-opacity="0.28" stroke-width="0.9" stroke-linecap="round"/>`
    out += falling(ctx, streaks, H * slant, 1.2, '')
  } else if (a.weather === 'snow') {
    let flakes = ''
    for (let i = 0; i < 130; i++) {
      const o = rng.range(0.6, 1)
      flakes += `<circle cx="${r1(rng.range(-0.05, 1.05) * W)}" cy="${r1(rng.next() * H)}" r="${r1(rng.range(1.2, 3.2))}" fill="${ctx.light}" fill-opacity="${o.toFixed(2)}"/>`
    }
    // Drawn from the rng even without motion, so turning motion on never changes the painting.
    const sway = drift(ctx, W * rng.range(0.01, 0.02), 0, rng.range(4, 7))
    out += falling(ctx, flakes, 0, 16, sway)
  }
  return fadeIn(ctx, out, 0.5, 2)
}

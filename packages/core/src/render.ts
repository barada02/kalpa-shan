import { resolveAnimate, Timeline } from './anim'
import { addFog, isDark, resolveAtmosphere, sky, weather } from './atmosphere'
import { compose, resolveDistance } from './compose'
import { createNoise } from './noise'
import { resolvePalette } from './palettes'
import { hashSeed, randomSeed, Rng } from './rng'
import { makeCeiling, makeInSpace, resolveSpace } from './space'
import type { Ctx, LandscapeOptions } from './types'

let instanceCount = 0

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Render a complete landscape to an SVG string. Pure apart from unique element ids,
 * so it also works on the server or at build time.
 */
export function renderSVG(options: LandscapeOptions = {}): string {
  const seed = options.seed ?? randomSeed()
  const W = options.width ?? 1600
  const H = options.height ?? 600
  const D = clamp01(options.density ?? 0.6)
  const showGrain = options.grain ?? true
  const label = options.label ?? 'Generated Chinese ink landscape'

  const rng = new Rng(seed)
  const palette = resolvePalette(options.palette)
  const space = resolveSpace(options.space)
  const anim = resolveAnimate(options.animate)
  const atmos = resolveAtmosphere(options)
  const uid = `ks${hashSeed(seed).toString(36)}${(instanceCount++).toString(36)}`
  let idCount = 0
  const ctx: Ctx = {
    rng,
    noise: createNoise(rng),
    palette,
    ids: { mist: `${uid}m`, grain: `${uid}g`, space: `${uid}s`, fog: `${uid}f`, air: `${uid}a` },
    uid: () => `${uid}c${(idCount++).toString(36)}`,
    tl: anim.reveal ? new Timeline() : null,
    motion: anim.motion,
    W,
    H,
    span: Math.max(W, H * 1.6),
    ceiling: makeCeiling(space, W, H),
    inSpace: makeInSpace(space, W, H),
    season: atmos.season,
    fx: new Rng(`${seed}~season`),
    light: isDark(palette.paper) ? palette.ink : '#fbf9f3',
  }

  const distance = resolveDistance(options.distance, rng)
  const airRng = new Rng(`${seed}~air`)
  const back = sky(ctx, atmos, airRng)
  const layers = compose(ctx, distance, {
    D,
    trees: options.trees ?? true,
    water: options.water ?? true,
  })
  if (atmos.weather === 'fog') addFog(ctx, layers, airRng)
  const front = weather(ctx, atmos, airRng)

  // A soft veil of paper-coloured mist over the space, so text stays legible.
  let veil = ''
  if (space) {
    const padX = space.width * W * 0.2
    const padY = space.height * H * 0.2
    veil =
      `<rect x="${r1(space.x * W - padX)}" y="${r1(space.y * H - padY)}" ` +
      `width="${r1(space.width * W + padX * 2)}" height="${r1(space.height * H + padY * 2)}" fill="url(#${ctx.ids.space})"/>`
  }

  const grainSeed = rng.int(0, 9999)
  const defs =
    `<defs>` +
    `<linearGradient id="${ctx.ids.mist}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${palette.wash}" stop-opacity="0.32"/>` +
    `<stop offset="0.55" stop-color="${palette.wash}" stop-opacity="0.1"/>` +
    `<stop offset="1" stop-color="${palette.wash}" stop-opacity="0"/>` +
    `</linearGradient>` +
    `<radialGradient id="${ctx.ids.fog}">` +
    `<stop offset="0" stop-color="${palette.paper}" stop-opacity="0.9"/>` +
    `<stop offset="0.5" stop-color="${palette.paper}" stop-opacity="0.5"/>` +
    `<stop offset="1" stop-color="${palette.paper}" stop-opacity="0"/>` +
    `</radialGradient>` +
    (space
      ? `<radialGradient id="${ctx.ids.space}">` +
        `<stop offset="0" stop-color="${palette.paper}" stop-opacity="0.85"/>` +
        `<stop offset="0.6" stop-color="${palette.paper}" stop-opacity="0.6"/>` +
        `<stop offset="1" stop-color="${palette.paper}" stop-opacity="0"/>` +
        `</radialGradient>`
      : '') +
    (showGrain
      ? `<filter id="${ctx.ids.grain}" x="0" y="0" width="100%" height="100%">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="${grainSeed}" stitchTiles="stitch"/>` +
        `<feColorMatrix type="saturate" values="0"/>` +
        `<feComponentTransfer><feFuncA type="table" tableValues="0 0.09"/></feComponentTransfer>` +
        `</filter>`
      : '') +
    `</defs>`

  const grain = showGrain ? `<rect width="${W}" height="${H}" filter="url(#${ctx.ids.grain})"/>` : ''

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" ` +
    `preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label.replace(/"/g, '&quot;')}" ` +
    `data-distance="${distance}"` +
    // Only when asked for, so default output is unchanged; tells pages what 'auto' chose.
    (options.season ? ` data-season="${atmos.season}"` : '') +
    (options.weather ? ` data-weather="${atmos.weather}"` : '') +
    (options.time ? ` data-time="${atmos.time}"` : '') +
    `>` +
    defs +
    `<rect width="${W}" height="${H}" fill="${palette.paper}"/>` +
    back +
    layers.join('') +
    front +
    veil +
    grain +
    `</svg>`
  return ctx.tl ? ctx.tl.resolve(svg, anim.duration) : svg
}

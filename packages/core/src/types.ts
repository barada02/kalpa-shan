import type { Timeline } from './anim'
import type { Noise2 } from './noise'
import type { Rng } from './rng'

export interface Palette {
  /** Background / paper colour. Also used to occlude shapes behind a mountain. */
  paper: string
  /** Main ink colour for strokes. */
  ink: string
  /** Colour of the misty wash on mountain faces. Defaults to `ink`. */
  wash?: string
}

export type PaletteName = 'sumi' | 'qinglu' | 'night' | 'mist'

/**
 * Guo Xi's three distances (三远):
 * - `level` / `pingyuan` 平远 — a wide, calm view across water to low distant hills
 * - `high` / `gaoyuan` 高远 — looking up at a towering main peak
 * - `deep` / `shenyuan` 深远 — looking into a valley of receding, overlapping ranges
 */
export type Distance = 'level' | 'high' | 'deep' | 'pingyuan' | 'gaoyuan' | 'shenyuan'

export type SpacePreset = 'none' | 'left' | 'right' | 'center' | 'top'

/** `summer` is the plain painting; the others add blossom, autumn colour or snow. */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type Weather = 'clear' | 'rain' | 'snow' | 'fog'

export type TimeOfDay = 'day' | 'dusk' | 'night'

/** A region kept clear for content, as fractions (0..1) of the drawing's width/height. */
export interface SpaceBox {
  x: number
  y: number
  width: number
  height: number
}

export interface AnimateOptions {
  /** Paint the scene in, back to front, like a brush at work. Default true. */
  reveal?: boolean
  /** Endless ambient motion: drifting mist, shimmering water, a drifting boat. Default true. */
  motion?: boolean
  /** Length of the reveal in seconds. Default 6. */
  duration?: number
}

export interface LandscapeOptions {
  /** Same seed + same options + same aspect ratio → same painting. Defaults to a random seed. */
  seed?: string | number
  /** Palette name or a custom palette. Default `'sumi'`. */
  palette?: PaletteName | Palette
  /** Composition, after Guo Xi's three distances. Default `'auto'` (chosen by the seed). */
  distance?: Distance | 'auto'
  /** Keep a region free of mountains for text (留白). Default `'none'`. */
  space?: SpacePreset | SpaceBox
  /** Internal drawing width (viewBox units). `createLandscape` derives it from the element's aspect ratio. Default 1600. */
  width?: number
  /** Internal drawing height (viewBox units). Default 600. */
  height?: number
  /** How busy the scene is, 0..1. Default 0.6. */
  density?: number
  /** Draw trees. Default true. */
  trees?: boolean
  /** Draw water and boats. Default true. */
  water?: boolean
  /** Subtle paper-grain texture. Default true. */
  grain?: boolean
  /** Accessible label for the SVG. */
  label?: string
  /**
   * Season. `'auto'` follows `date` (northern-hemisphere months). The landscape itself stays
   * the same in every season; only blossom, leaves and snow change. Default `'summer'`.
   */
  season?: Season | 'auto'
  /** Weather over the landscape. Default `'clear'`. */
  weather?: Weather
  /** Time of day: a red sun at dusk, a moon at night. `'auto'` follows `date`. Default `'day'`. */
  time?: TimeOfDay | 'auto'
  /** The moment `'auto'` season and time follow, in its local time zone. Default: now. */
  date?: Date | string | number
  /**
   * Animate the painting (off by default). `true` enables reveal + ambient motion.
   * `createLandscape` turns it off for users who prefer reduced motion.
   */
  animate?: boolean | AnimateOptions
}

/** Shared state passed to every element generator. */
export interface Ctx {
  rng: Rng
  noise: Noise2
  palette: Required<Palette>
  /** Fixed element ids. `air` is a prefix for season, weather and time elements. */
  ids: { mist: string; grain: string; space: string; fog: string; air: string }
  /** A fresh unique element id. */
  uid: () => string
  /** Reveal timeline, or null when not revealing. */
  tl: Timeline | null
  /** Whether ambient motion is on. */
  motion: boolean
  /** Drawing size in viewBox units. */
  W: number
  H: number
  /** Width basis for sizing mountains, so they keep natural proportions on narrow canvases. */
  span: number
  /** Highest point (smallest y) a shape may reach at x, derived from the space box. -Infinity = no limit. */
  ceiling: (x: number) => number
  /** Whether (x, y) lies in the space box. */
  inSpace: (x: number, y: number) => boolean
  season: Season
  /**
   * Random stream for seasonal touches. Kept apart from `rng` so a season never moves
   * a mountain or a tree: the same seed is the same landscape all year.
   */
  fx: Rng
  /** Snow, moonlight: unpainted silk on light paper, the ink colour on dark paper. */
  light: string
}

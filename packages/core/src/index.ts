import { renderSVG } from './render'
import { randomSeed } from './rng'
import type { LandscapeOptions } from './types'

export { renderSVG } from './render'
export { palettes } from './palettes'
export { randomSeed } from './rng'
export { resolveSpace, spacePresets } from './space'
export { seasonOf, timeOf } from './atmosphere'
export type {
  AnimateOptions,
  Distance,
  LandscapeOptions,
  Palette,
  PaletteName,
  SealCorner,
  SealOptions,
  Season,
  SpaceBox,
  SpacePreset,
  TimeOfDay,
  Weather,
} from './types'

export interface Landscape {
  /** Merge new options and redraw (replays the reveal if animated). */
  update(next: Partial<LandscapeOptions>): void
  /** Paint the current scene in again from the start. */
  replay(): void
  /** Freeze all animation. */
  pause(): void
  /** Resume animation after `pause()`. */
  play(): void
  /** The current SVG markup, e.g. for download. Includes animation if enabled. */
  toSVG(): string
  /** The resolved options, including the seed actually used. */
  readonly options: LandscapeOptions
  /** Stop observers and remove the drawing. */
  destroy(): void
}

const BASE_HEIGHT = 600

/**
 * Draw a landscape into an element (or CSS selector). The SVG fills the element, so size
 * the element with CSS. Unless `width`/`height` are given, the drawing matches the element's
 * aspect ratio (so `space` lines up with your content) and redraws when that ratio changes.
 *
 * Animation is skipped for users who prefer reduced motion, and paused while off-screen.
 */
export function createLandscape(target: Element | string, options: LandscapeOptions = {}): Landscape {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) throw new Error(`kalpa-shan: target "${String(target)}" not found`)

  let opts: LandscapeOptions = { ...options, seed: options.seed ?? randomSeed() }
  let svg = ''
  let drawnWidth = 0
  let userPaused = false
  let onScreen = true

  const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const fittedWidth = () => {
    const { width, height } = el.getBoundingClientRect()
    return width > 0 && height > 0 ? Math.round((BASE_HEIGHT * width) / height) : 0
  }

  const svgEl = () => el.querySelector('svg') as SVGSVGElement | null

  const syncPlayback = () => {
    const node = svgEl()
    if (!node || typeof node.pauseAnimations !== 'function') return
    if (userPaused || !onScreen) node.pauseAnimations()
    else node.unpauseAnimations()
  }

  const draw = (reveal: boolean) => {
    const fit = opts.width == null && opts.height == null
    const w = fit ? fittedWidth() : 0
    drawnWidth = w

    let animate = reducedMotion ? false : opts.animate
    // Redraws caused by resizing keep the ambient motion but don't repaint from scratch.
    if (animate && !reveal) animate = { ...(animate === true ? {} : animate), reveal: false }

    const sized = w ? { ...opts, width: w, height: BASE_HEIGHT } : opts
    svg = renderSVG({ ...sized, animate })
    el.innerHTML = svg

    const node = svgEl()
    if (node && typeof node.setCurrentTime === 'function') node.setCurrentTime(0)
    syncPlayback()
  }
  draw(true)

  let frame = 0
  const resizeObserver =
    typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (opts.width != null || opts.height != null) return
          const w = fittedWidth()
          if (!w || (drawnWidth && Math.abs(w - drawnWidth) / drawnWidth < 0.02)) return
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(() => draw(false))
        })
  resizeObserver?.observe(el)

  const visibilityObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting
          syncPlayback()
        })
  visibilityObserver?.observe(el)

  return {
    update(next) {
      opts = { ...opts, ...next }
      draw(true)
    },
    replay() {
      draw(true)
    },
    pause() {
      userPaused = true
      syncPlayback()
    },
    play() {
      userPaused = false
      syncPlayback()
    },
    toSVG: () => svg,
    get options() {
      return { ...opts }
    },
    destroy() {
      resizeObserver?.disconnect()
      visibilityObserver?.disconnect()
      cancelAnimationFrame(frame)
      el.innerHTML = ''
    },
  }
}

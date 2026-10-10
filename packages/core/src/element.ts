import { createLandscape, type Landscape } from './index'
import { palettes } from './palettes'
import { resolveSpace } from './space'
import type { AnimateOptions, LandscapeOptions, Palette, PaletteName, SpaceBox, SpacePreset } from './types'

/*
 * <kalpa-shan seed="home" distance="high" space="left" season="auto" animate>
 *   <h1>Content placed in the empty space</h1>
 * </kalpa-shan>
 *
 * Attributes mirror LandscapeOptions. Brand colours can come from CSS:
 *   kalpa-shan { --kalpa-ink: #123; --kalpa-paper: #fff; --kalpa-wash: #456 }
 */

const ATTRIBUTES = [
  'seed',
  'palette',
  'distance',
  'space',
  'density',
  'trees',
  'water',
  'grain',
  'animate',
  'duration',
  'label',
  'season',
  'weather',
  'time',
] as const

const STYLE = `
:host { display: block; position: relative; aspect-ratio: 16 / 6; overflow: hidden; contain: content; }
:host([hidden]) { display: none; }
.art { position: absolute; inset: 0; }
.art svg { display: block; }
.content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
`

// Lets the module be imported during SSR, where HTMLElement doesn't exist.
const Base = (typeof HTMLElement === 'undefined' ? class {} : HTMLElement) as typeof HTMLElement

/** `false` or `"false"` → false; present/empty → true; missing → undefined (library default). */
function flag(el: Element, name: string): boolean | undefined {
  if (!el.hasAttribute(name)) return undefined
  return el.getAttribute(name) !== 'false'
}

function parseSpace(value: string | null): SpacePreset | SpaceBox | undefined {
  if (!value) return undefined
  // Custom box: "x y width height" as fractions, e.g. space="0.1 0.1 0.5 0.4".
  const nums = value.trim().split(/[\s,]+/).map(Number)
  if (nums.length === 4 && nums.every((n) => Number.isFinite(n))) {
    const [x, y, width, height] = nums
    return { x, y, width, height }
  }
  return value as SpacePreset
}

export class KalpaShanElement extends Base {
  static observedAttributes = [...ATTRIBUTES]

  private art: HTMLDivElement | null = null
  private content: HTMLDivElement | null = null
  private instance: Landscape | null = null
  private queued = false

  /** The underlying landscape, once connected. */
  get landscape(): Landscape | null {
    return this.instance
  }

  connectedCallback(): void {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: 'open' })
      root.innerHTML = `<style>${STYLE}</style><div class="art" part="art"></div><div class="content" part="content"><slot></slot></div>`
      this.art = root.querySelector('.art')
      this.content = root.querySelector('.content')
    }
    const opts = this.readOptions()
    this.placeContent(opts)
    this.instance = createLandscape(this.art!, opts)
  }

  disconnectedCallback(): void {
    this.instance?.destroy()
    this.instance = null
  }

  attributeChangedCallback(): void {
    if (!this.instance || this.queued) return
    // Batch several attribute changes made in the same task into one redraw.
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      if (!this.instance) return
      const opts = this.readOptions()
      this.placeContent(opts)
      this.instance.update(opts)
    })
  }

  replay(): void {
    this.instance?.replay()
  }

  pause(): void {
    this.instance?.pause()
  }

  play(): void {
    this.instance?.play()
  }

  toSVG(): string {
    return this.instance?.toSVG() ?? ''
  }

  private readOptions(): LandscapeOptions {
    const num = (name: string) => {
      const v = this.getAttribute(name)
      return v == null || v === '' ? undefined : Number(v)
    }

    let animate: boolean | AnimateOptions | undefined = flag(this, 'animate')
    const duration = num('duration')
    if (animate && duration != null) animate = { duration }

    const opts: LandscapeOptions = {
      seed: this.getAttribute('seed') ?? undefined,
      palette: this.readPalette(),
      distance: (this.getAttribute('distance') as LandscapeOptions['distance']) ?? undefined,
      space: parseSpace(this.getAttribute('space')),
      density: num('density'),
      trees: flag(this, 'trees'),
      water: flag(this, 'water'),
      grain: flag(this, 'grain'),
      animate,
      label: this.getAttribute('label') ?? undefined,
      season: (this.getAttribute('season') as LandscapeOptions['season']) ?? undefined,
      weather: (this.getAttribute('weather') as LandscapeOptions['weather']) ?? undefined,
      time: (this.getAttribute('time') as LandscapeOptions['time']) ?? undefined,
    }
    // Drop unset keys so the library's defaults apply.
    for (const k of Object.keys(opts) as (keyof LandscapeOptions)[]) if (opts[k] === undefined) delete opts[k]
    return opts
  }

  /** A named palette, overridden per colour by --kalpa-* custom properties. */
  private readPalette(): PaletteName | Palette {
    const name = (this.getAttribute('palette') as PaletteName) || 'sumi'
    const base = palettes[name] ?? palettes.sumi
    const css = getComputedStyle(this)
    const read = (prop: string) => css.getPropertyValue(prop).trim()
    const ink = read('--kalpa-ink')
    const paper = read('--kalpa-paper')
    const wash = read('--kalpa-wash')
    if (!ink && !paper && !wash) return name
    return { ink: ink || base.ink, paper: paper || base.paper, wash: wash || base.wash }
  }

  /** Put slotted content inside the space box, if there is one. */
  private placeContent(opts: LandscapeOptions): void {
    if (!this.content) return
    const box = resolveSpace(opts.space)
    const s = this.content.style
    if (!box) {
      s.inset = '0'
      s.left = s.top = s.width = s.height = ''
      return
    }
    s.inset = ''
    s.left = `${box.x * 100}%`
    s.top = `${box.y * 100}%`
    s.width = `${box.width * 100}%`
    s.height = `${box.height * 100}%`
  }
}

/** Register the element (done automatically on import). Safe to call more than once. */
export function defineKalpaShan(tag = 'kalpa-shan'): void {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return
  customElements.define(tag, class extends KalpaShanElement {})
}

defineKalpaShan()

declare global {
  interface HTMLElementTagNameMap {
    'kalpa-shan': KalpaShanElement
  }
}

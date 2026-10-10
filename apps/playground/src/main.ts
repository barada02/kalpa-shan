import {
  createLandscape,
  palettes,
  randomSeed,
  resolveSpace,
  type Distance,
  type LandscapeOptions,
  type PaletteName,
  type Season,
  type SpacePreset,
  type TimeOfDay,
  type Weather,
} from 'kalpa-shan'
import './style.css'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const seedInput = $<HTMLInputElement>('seed')
const paletteSelect = $<HTMLSelectElement>('palette')
const distanceSelect = $<HTMLSelectElement>('distance')
const spaceSelect = $<HTMLSelectElement>('space')
const seasonSelect = $<HTMLSelectElement>('season')
const weatherSelect = $<HTMLSelectElement>('weather')
const timeSelect = $<HTMLSelectElement>('time')
const sealInput = $<HTMLInputElement>('seal')
const sealStyle = $<HTMLSelectElement>('sealStyle')
const aspectSelect = $<HTMLSelectElement>('aspect')
const density = $<HTMLInputElement>('density')
const densityOut = $<HTMLOutputElement>('densityOut')
const trees = $<HTMLInputElement>('trees')
const water = $<HTMLInputElement>('water')
const grain = $<HTMLInputElement>('grain')
const showText = $<HTMLInputElement>('showText')
const animate = $<HTMLInputElement>('animate')
const pauseBtn = $<HTMLButtonElement>('pause')
const wrap = document.querySelector<HTMLElement>('.stage-wrap')!
const headline = $<HTMLElement>('headline')
const code = $<HTMLElement>('code')

for (const name of Object.keys(palettes)) paletteSelect.add(new Option(name, name))

// Seed from the URL hash so paintings are shareable.
seedInput.value = decodeURIComponent(location.hash.slice(1)) || randomSeed()

const DEFAULTS: LandscapeOptions = {
  palette: 'sumi',
  distance: 'auto',
  space: 'none',
  season: 'summer',
  weather: 'clear',
  time: 'day',
  density: 0.6,
  trees: true,
  water: true,
  grain: true,
  animate: false,
}

const read = (): LandscapeOptions => ({
  seed: seedInput.value || '0',
  palette: paletteSelect.value as PaletteName,
  distance: distanceSelect.value as Distance | 'auto',
  space: spaceSelect.value as SpacePreset,
  season: seasonSelect.value as Season | 'auto',
  weather: weatherSelect.value as Weather,
  time: timeSelect.value as TimeOfDay | 'auto',
  seal: !sealInput.value.trim()
    ? undefined
    : sealStyle.value === 'relief'
      ? { text: sealInput.value, style: 'relief' }
      : sealInput.value,
  density: Number(density.value),
  trees: trees.checked,
  water: water.checked,
  grain: grain.checked,
  animate: animate.checked,
})

function applyAspect() {
  const [w, h] = aspectSelect.value.split('/').map(Number)
  wrap.style.aspectRatio = aspectSelect.value
  // Keep tall aspects within the viewport.
  wrap.style.width = `min(100%, calc(70vh * ${w / h}))`
}

function placeHeadline(opts: LandscapeOptions) {
  const box = resolveSpace(opts.space as SpacePreset)
  headline.hidden = !box || !showText.checked
  if (!box) return
  Object.assign(headline.style, {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
    color: palettes[opts.palette as PaletteName].ink,
  })
}

function snippet(opts: LandscapeOptions) {
  // Show only what differs from the defaults, like a user would write it.
  const shown: Record<string, unknown> = { seed: opts.seed }
  for (const [k, v] of Object.entries(opts)) {
    if (k !== 'seed' && DEFAULTS[k as keyof LandscapeOptions] !== v) shown[k] = v
  }
  return `import { createLandscape } from 'kalpa-shan'\n\ncreateLandscape('#hero', ${JSON.stringify(shown, null, 2)})`
}

applyAspect()
const landscape = createLandscape('#stage', read())

function render() {
  const opts = read()
  densityOut.value = opts.density!.toFixed(2)
  landscape.update(opts)
  placeHeadline(opts)
  history.replaceState(null, '', `#${encodeURIComponent(String(opts.seed))}`)
  code.textContent = snippet(opts)
}

$('controls').addEventListener('input', (e) => {
  // While dragging the slider only update its label; redraw on release ('change' below),
  // otherwise an animated painting would restart on every tick.
  if (e.target === density) {
    densityOut.value = Number(density.value).toFixed(2)
    return
  }
  // The sample text is playground-only; no need to repaint.
  if (e.target === showText) {
    placeHeadline(read())
    return
  }
  // Aspect changes resize the element; the library redraws itself via ResizeObserver.
  if (e.target === aspectSelect) applyAspect()
  render()
})
density.addEventListener('change', render)
$('replay').addEventListener('click', () => landscape.replay())

pauseBtn.addEventListener('click', () => {
  const paused = pauseBtn.getAttribute('aria-pressed') !== 'true'
  pauseBtn.setAttribute('aria-pressed', String(paused))
  pauseBtn.textContent = paused ? 'Play' : 'Pause'
  if (paused) landscape.pause()
  else landscape.play()
})

$('shuffle').addEventListener('click', () => {
  seedInput.value = randomSeed()
  render()
})

$('download').addEventListener('click', () => {
  const blob = new Blob([landscape.toSVG()], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `kalpa-shan-${seedInput.value}.svg`
  a.click()
  URL.revokeObjectURL(a.href)
})

$('copy').addEventListener('click', async (e) => {
  const btn = e.currentTarget as HTMLButtonElement
  try {
    await navigator.clipboard.writeText(code.textContent ?? '')
    btn.textContent = 'Copied'
  } catch {
    btn.textContent = 'Copy failed'
  }
  setTimeout(() => (btn.textContent = 'Copy code'), 1200)
})

render()

# Kalpa Shan

Procedurally generated Chinese ink landscapes (山水, *shan shui*) for your website: hero backgrounds, headers, covers and cards.
Seeded, animated, dependency-free SVG, about 11 KB gzipped. **[Try it live](https://barada02.github.io/kalpa-shan/)**

![Kalpa Shan: a hero with space for text, and the three compositions](https://raw.githubusercontent.com/barada02/kalpa-shan/main/docs/preview.png)

- **Same seed, same painting.** Use a page slug or a title as the seed and every page gets its own painting, which never changes.
- **Leaves room for your content (留白).** Tell it where your headline goes and the mountains make space.
- **Composed, not random.** Three layouts after Guo Xi's classical *three distances* (三远).
- **Paints itself in.** An optional brush reveal plus drifting mist, respecting `prefers-reduced-motion`.
- **Works anywhere:** a `<kalpa-shan>` web component, a JS API, a CDN script, or server-side SVG strings.

## Install

```sh
npm install kalpa-shan
```

Or use it straight from a CDN, with no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/kalpa-shan@0.2/dist/kalpa-shan.iife.js"></script>
<kalpa-shan seed="hello" animate></kalpa-shan>
```

## Web component

```js
import 'kalpa-shan/element'
```

```html
<kalpa-shan seed="welcome" distance="level" space="left" animate style="aspect-ratio: 16 / 7">
  <h1>Quiet software for busy people</h1>
  <a href="/start">Get started</a>
</kalpa-shan>
```

Content inside the element is placed in the empty space automatically. Size the element with CSS (the default is `aspect-ratio: 16 / 6`, full width).

| Attribute | Values | Default |
| --- | --- | --- |
| `seed` | any text | random |
| `palette` | `sumi` · `qinglu` · `night` · `mist` | `sumi` |
| `distance` | `level` · `high` · `deep` · `auto` | `auto` |
| `space` | `left` · `right` · `center` · `top` · `none`, or `"x y width height"` as fractions | `none` |
| `density` | `0` to `1` | `0.6` |
| `trees`, `water`, `grain` | set to `"false"` to turn off | on |
| `animate` | present to animate | off |
| `duration` | reveal length in seconds | `6` |
| `season` | `spring` · `summer` · `autumn` · `winter` · `auto` | `summer` |
| `weather` | `clear` · `rain` · `snow` · `fog` | `clear` |
| `time` | `day` · `dusk` · `night` · `auto` | `day` |
| `seal` | 1–4 characters, e.g. `山水` or `KB` | none |
| `seal-position` | `bottom-right` · `bottom-left` · `top-right` · `top-left` | `bottom-right` |
| `seal-style` | `intaglio` (白文) · `relief` (朱文) | `intaglio` |
| `label` | accessible description | "Generated Chinese ink landscape" |

Changing an attribute redraws. Methods: `replay()`, `pause()`, `play()`, `toSVG()`.

**Brand colours** come from CSS custom properties. Each one overrides a single colour of the chosen palette:

```css
kalpa-shan {
  --kalpa-ink: #0f3b2c;
  --kalpa-paper: #f2f0e6;
  --kalpa-wash: #2f7d5b;
}
```

## JavaScript API

```js
import { createLandscape } from 'kalpa-shan'

const art = createLandscape('#hero', { seed: 'my-post', distance: 'high', space: 'left', animate: true })

art.update({ palette: 'night' }) // merge options and redraw
art.replay()                      // paint it in again
art.pause(); art.play()
art.toSVG()                       // SVG markup, e.g. for a download
art.destroy()
```

The drawing fills the element and matches its aspect ratio (so `space` lines up with your layout), and it redraws when the element is resized.

### Options

| Option | Type | Default |
| --- | --- | --- |
| `seed` | `string \| number` | random |
| `palette` | `'sumi' \| 'qinglu' \| 'night' \| 'mist' \| { paper, ink, wash? }` | `'sumi'` |
| `distance` | `'level' \| 'high' \| 'deep' \| 'auto'` (Chinese names like `'gaoyuan'` also work) | `'auto'` |
| `space` | `'none' \| 'left' \| 'right' \| 'center' \| 'top' \| { x, y, width, height }` | `'none'` |
| `density` | `0`–`1` | `0.6` |
| `trees` / `water` / `grain` | `boolean` | `true` |
| `animate` | `boolean \| { reveal?, motion?, duration? }` | `false` |
| `width` / `height` | viewBox size; set only for a fixed size | fit to element |
| `season` | `'spring' \| 'summer' \| 'autumn' \| 'winter' \| 'auto'` | `'summer'` |
| `weather` | `'clear' \| 'rain' \| 'snow' \| 'fog'` | `'clear'` |
| `time` | `'day' \| 'dusk' \| 'night' \| 'auto'` | `'day'` |
| `seal` | `string \| { text, position?, style? }` | none |
| `date` | `Date \| string \| number`: the moment `'auto'` follows | now |
| `label` | `string` | "Generated Chinese ink landscape" |

### The three distances (三远)

After Guo Xi's 11th-century theory of landscape composition:

| `distance` | | View |
| --- | --- | --- |
| `'level'` | 平远 pingyuan | Wide, calm water with low hills far away |
| `'high'` | 高远 gaoyuan | Looking up at a towering main peak |
| `'deep'` | 深远 shenyuan | Looking into a valley of receding ranges |

### Space for your content (留白)

Mountains move, shrink and slope away from the space, and a soft mist keeps text readable.

```js
createLandscape('#hero', { space: 'left' })
createLandscape('#hero', { space: { x: 0.1, y: 0.1, width: 0.5, height: 0.4 } }) // fractions of the element
```

`resolveSpace(space)` returns the box as fractions, so you can position your own elements over it.

### Seasons, weather and time of day

```js
createLandscape('#hero', { seed: 'home', season: 'winter', weather: 'snow', time: 'night' })
createLandscape('#hero', { seed: 'home', season: 'auto', time: 'auto' }) // follows the visitor's date and clock
```

| | |
| --- | --- |
| `season` | `spring`: plum blossom and fresh green washes. `summer`: the plain painting. `autumn`: ochre hills and turning leaves. `winter`: snow on the peaks and pines, bare trees, a grey sky. |
| `weather` | `rain`: slanting streaks. `snow`: falling flakes. `fog`: mist drifting between the ranges. With `animate`, rain and snow fall. |
| `time` | `dusk`: a red sun and a warm glow. `night`: a moon set off by a halo of wash (烘云托月). |

- **The landscape stays the same.** A seed keeps its mountains, trees and boat in every season, weather and time; only the atmosphere changes. A site using `season: 'auto'` keeps its painting all year.
- `'auto'` reads the date when the painting is drawn, in the local time zone (northern-hemisphere seasons). Pass `date` to control it, for example when rendering on a server for visitors elsewhere. `seasonOf(date)` and `timeOf(date)` return what `'auto'` picks.
- The SVG gets `data-season`, `data-weather` and `data-time` attributes for the options you set, so your page can match it (for example, light text at night).
- With `space` at night, the veil behind your text shows as a pale cloud. That keeps dark text readable.

### Seal (印章)

Painters finish a work by pressing their red seal onto it. Give yours 1–4 characters: initials, a name, or a phrase in Chinese.

```js
createLandscape('#hero', { seed: 'home', seal: '山水' })
createLandscape('#hero', { seal: { text: 'KB', style: 'relief', position: 'bottom-left' } })
```

```html
<kalpa-shan seed="home" seal="山水" seal-style="relief"></kalpa-shan>
```

- `style`: `'intaglio'` (白文, white characters cut into a red block, the default) or `'relief'` (朱文, red characters in a red frame).
- `position`: `'bottom-right'` (default), `'bottom-left'`, `'top-right'` or `'top-left'`. If your text space covers that corner, the seal moves to a free one.
- Characters read top to bottom, right column first, as on a real seal.
- **One seal, every painting.** Its uneven edges and worn specks come from the seal's text, not the painting's seed, so your seal looks the same everywhere, like a real stamp.
- It uses the visitor's Kaiti or serif font, so characters render the way their system draws them.

### Animation

With `animate: true` the scene paints itself back to front: washes fade in, ridge lines sweep across like a brush, then texture, water, the boat and the trees. After that, mist drifts, water shimmers and the boat bobs.

```js
createLandscape('#hero', { animate: { duration: 4, motion: false } }) // reveal only
createLandscape('#hero', { animate: { reveal: false } })             // ambient motion only
```

- Animation never changes the painting itself.
- It's skipped for users who prefer reduced motion, and paused while off-screen.
- It uses native SVG animation, so a downloaded `.svg` animates too. Tools that can't animate show the finished painting.

## Server-side and build time

`renderSVG` needs no DOM, so it works in Node, at build time, or in a server component:

```js
import { renderSVG } from 'kalpa-shan'

const svg = renderSVG({ seed: post.slug, width: 1200, height: 630 }) // e.g. an Open Graph image
```

## The name

**Kalpa** (कल्प) is Sanskrit for "creation" and for an aeon. **Shan** (山) is Chinese for mountain. Asked how long a kalpa is, the Buddha answered that a mountain of rock, stroked with a silk cloth once every hundred years, would wear away sooner. [More in the repo README](https://github.com/barada02/kalpa-shan#about-the-name).

## Credits

Inspired by Lingdong Huang's [{Shan, Shui}\*](https://github.com/LingDong-/shan-shui-inf). This is an independent implementation.

## License

MIT

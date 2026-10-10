# Kalpa Shan

Procedurally generated Chinese ink landscapes (山水, *shan shui*) for your website: hero backgrounds, headers, covers and cards.
Seeded, animated, dependency-free SVG, about 8 KB gzipped. **[Try it live](https://barada02.github.io/kalpa-shan/)**

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
<script src="https://cdn.jsdelivr.net/npm/kalpa-shan@0.1/dist/kalpa-shan.iife.js"></script>
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

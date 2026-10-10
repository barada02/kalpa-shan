# Kalpa Shan

**Procedurally generated Chinese ink landscapes for your website.**
Hero backgrounds, headers and post covers, each one a unique painting from a seed.

**[Try it live](https://barada02.github.io/kalpa-shan/)**: pick a seed, a palette and a composition, and copy the code.

![Kalpa Shan: a hero with space for text, and the three compositions](docs/preview.png)

## Why

Traditional ink landscape painting has ideas that fit web design well:

- **Leaving white space:** painters kept empty space on purpose. Kalpa Shan does the same for your headline. Say where your text goes, and the mountains move aside.
- **The three distances:** Guo Xi's 11th-century theory of composition. It gives three distinct layouts: a wide *level* view across water, a towering *high* peak, and a *deep* valley of receding ranges.
- **Brushwork:** ridge lines, texture strokes and moss dots are drawn as ink strokes, and they can paint themselves in when the page loads.

Give it a seed, such as a page slug or a post title, and you get the same painting every time.

## Features

- **Seeded:** the same seed always gives the same painting
- **Space for your content:** `left`, `right`, `center`, `top`, or any box
- **Three compositions:** level, high and deep
- **Animation:** a brush-stroke reveal, drifting mist and a drifting boat. Respects `prefers-reduced-motion`.
- **Seasons, weather, time of day:** plum blossom, autumn colour, snow, rain, fog, a red sun at dusk, a moon at night. `auto` follows the visitor's date and clock, and the landscape itself stays the same all year.
- **Living details:** birds in flight, travellers on a ridge, a waterfall down the main peak
- **Your seal:** a red stamp with your initials or name, the same on every painting
- **Palettes:** ink, blue-green, night, mist, or your brand colours via CSS variables
- **Fits any shape:** banner, card or phone, and redraws on resize
- **Tiny:** about 12 KB gzipped, no dependencies, pure SVG
- **Use it anywhere:** a web component, a JS API, a CDN script tag, or server-side rendering

## Quick start

With no build step:

```html
<script src="https://cdn.jsdelivr.net/npm/kalpa-shan@0.4/dist/kalpa-shan.iife.js"></script>

<kalpa-shan seed="welcome" space="left" animate style="aspect-ratio: 16 / 7">
  <h1>Your headline</h1>
</kalpa-shan>
```

With npm:

```sh
npm install kalpa-shan
```

```js
import 'kalpa-shan/element'                    // registers <kalpa-shan>
import { createLandscape } from 'kalpa-shan'   // or use the JS API

createLandscape('#hero', { seed: 'my-post', distance: 'high', space: 'left', animate: true })
```

**Full documentation: [packages/core/README.md](packages/core/README.md)**

## About the name

**Kalpa** (कल्प) is Sanskrit for "creation", and for an aeon, a vast span of cosmic time. **Shan** means mountain.

The two belong together. Asked how long a kalpa is, the Buddha answered with a mountain: picture a mountain of solid rock, a league high, and once every hundred years someone strokes it with a silk cloth. The mountain would wear away before the kalpa ends (*Pabbata Sutta*, SN 15.5). A cloth slowly shaping a mountain, much like a brush.

## Try it locally

```sh
git clone https://github.com/barada02/kalpa-shan.git
cd kalpa-shan
npm install
npm run dev
```

This opens a playground where you can change seeds, compositions, palettes and animation, and see the web component demos.

`npm test` checks that every seed in the test set still draws exactly the same painting.

## Project structure

```
packages/core      the `kalpa-shan` library, published to npm (tests in packages/core/test)
apps/playground    demo app that uses the library the way you would
```

## Credits

Inspired by Lingdong Huang's beautiful [{Shan, Shui}\*](https://github.com/LingDong-/shan-shui-inf), an infinite procedural shan shui painting. Kalpa Shan is an independent implementation with a different goal: making paintings *for* your site.

## License

[MIT](LICENSE)

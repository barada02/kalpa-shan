import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset paths, so the build works under GitHub Pages' /kalpa-shan/ subpath.
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        element: resolve(import.meta.dirname, 'element.html'),
      },
    },
  },
})

import type { Palette, PaletteName } from './types'

export const palettes: Record<PaletteName, Required<Palette>> = {
  /** Classic ink on warm rice paper. */
  sumi: { paper: '#efe7d6', ink: '#1d1b18', wash: '#1d1b18' },
  /** Blue-green landscape. */
  qinglu: { paper: '#ece2c9', ink: '#1f2926', wash: '#2f6f62' },
  /** Pale ink on dark paper. */
  night: { paper: '#15171b', ink: '#e6dfcf', wash: '#9aa6b2' },
  /** Soft, low-contrast grey. */
  mist: { paper: '#f3f2ee', ink: '#4a4d52', wash: '#6b7078' },
}

export function resolvePalette(p: PaletteName | Palette | undefined): Required<Palette> {
  if (!p) return palettes.sumi
  if (typeof p === 'string') return palettes[p] ?? palettes.sumi
  return { paper: p.paper, ink: p.ink, wash: p.wash ?? p.ink }
}

# Butki Design Brief

## Purpose & Context
Energetic youthful social media for South Asian markets. Bold neon dark mode with vibrant purple/pink/blue accents. Premium yet playful brand feel—distinctly non-generic.

## Visual Direction
**Tone:** Maximalist neon. Bold geometric shapes, sharp accents, glassmorphic depth.
**Differentiation:** Pure black backgrounds with *vibrant* (not muted) neon accents—energetic, modern, market-specific.

## Palette

| Role | OKLCH | Hex | Usage |
|------|-------|-----|-------|
| Background | 0 0 0 | #000000 | Base, pure black |
| Foreground | 0.96 0.005 260 | #F5F3FF | Text, UI elements |
| Primary | 0.65 0.24 295 | #9945FF | Buttons, active states |
| Accent | 0.68 0.26 350 | #FF1B9C | CTAs, highlights (hot pink) |
| Secondary | 0.11 0.006 270 | #1A1540 | Card backgrounds |
| Muted | 0.13 0.006 270 | #1F1555 | Disabled, subtle elements |
| Blue | 0.62 0.22 225 | #3D7FFF | Secondary accents |

## Typography

| Layer | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| Display | Space Grotesk | 700 | 28–32px | Page titles, hero text |
| Body | Plus Jakarta Sans | 400–600 | 14–16px | Content, labels |
| Mono | Plus Jakarta Sans | 400 | 12px | Code, technical text |

## Structural Zones

| Zone | Background | Border | Elevation | Intent |
|------|------------|--------|-----------|--------|
| Header | oklch(0.09 0.006 270) | oklch(0.25 0.02 280 / 0.3) | Glass | Navigation, branding |
| Nav Bottom | oklch(0.07 0.005 270) | oklch(0.25 0.02 280 / 0.2) | Glass | Tab navigation, always visible |
| Card/Post | oklch(0.07 0.005 270) | oklch(0.25 0.02 280 / 0.4) | Inset glow | Content containers |
| Button Primary | oklch(0.65 0.24 295) | None | Glow | Primary actions (purple) |
| Button Accent | oklch(0.68 0.26 350) | None | Glow | High-priority CTAs (hot pink) |
| Input | oklch(0.25 0.02 280) | oklch(0.25 0.02 280 / 0.6) | None | Form fields |
| Footer | oklch(0.05 0.003 270) | oklch(0.25 0.02 280 / 0.2) | None | Copyright, links |

## Spacing & Rhythm
- Base unit: 4px
- Dense zones: 12px, 16px
- Breathing room: 24px, 32px
- Mobile-first: 430px max-width

## Component Patterns
- **Buttons:** Gradient or solid accent, glow on hover, no borders
- **Cards:** Glassmorphic, dark card BG, soft border, inset shadows
- **Avatars:** Gradient ring borders (2–3px offset)
- **Icons:** Line-based, 20–24px, light grey/white
- **Bottom Nav:** Fixed, glassmorphic, purple active state

## Motion & Transitions
- **Default:** 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- **Animations:** Heartbeat (like), swipe-hint (reels), spin-disc (music), fade-in/slide-up (entries)
- **Choreography:** Staggered opacity + transform for list items

## Signature Detail
**Neon glow auras** — soft box-shadow halos on primary buttons and liked posts create depth without visual clutter. Sparingly applied to maintain clarity.

## Constraints
- No arbitrary colors—use CSS variables exclusively
- No full-page gradients—use tokens for accents only
- Maintain AA+ contrast in dark mode
- Mobile-safe: avoid text smaller than 14px
- Safe area padding for mobile notch (nav: `calc(var(--nav-height) + env(safe-area-inset-bottom))`)

## Exports
- `index.css`: Butki OKLCH tokens (vibrant), Space Grotesk + Plus Jakarta Sans
- `tailwind.config.js`: Custom glow shadows, animations (heartbeat, fade-in, slide-up, spin-disc)

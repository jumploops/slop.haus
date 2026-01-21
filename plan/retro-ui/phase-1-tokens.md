# Phase 1: Tokens + Global Styles

**Status:** Completed

## Objective

Make the retro aesthetic the default theme by updating base tokens, fonts, radius, and global background/link styling while keeping the semantic Tailwind token contract intact.

## Files to Change

- `apps/web/src/styles/theme.css`
- `apps/web/src/styles/presets.css`
- `apps/web/src/lib/theme-constants.ts`
- `apps/web/src/styles/TOKEN-CONTRACT.md`

## Tasks

- Update base `:root` values in `apps/web/src/styles/theme.css` to the retro palette (light background, darker text, bold accents) based on `reference-ui/DESIGN-LANGUAGE.md`.
- Add `--slop-*` variables in `apps/web/src/styles/theme.css` and map them via `@theme inline` to `--color-slop-*` so utilities like `bg-slop-green` are available.
- Set `--font-sans` to Comic Sans and `--font-mono` to Courier in `@theme inline`.
- Set radius tokens to `0px` to match sharp retro edges.
- Add a tiled background pattern on `body` and retro link styling (underline + hover color shift) in `@layer base`.
- Update `apps/web/src/styles/presets.css` so presets still override the new retro-default base values appropriately.
- Rename the default preset label in `apps/web/src/lib/theme-constants.ts` to reflect retro as the default.
- Update `apps/web/src/styles/TOKEN-CONTRACT.md` with the new `slop-*` token utilities and font defaults.

## Code Snippets

```css
/* apps/web/src/styles/theme.css */
:root {
  --background: oklch(0.95 0.02 250);
  --foreground: oklch(0.15 0.02 260);
  --border: oklch(0.7 0.05 260);
  --accent: oklch(0.5 0.25 260);
  --accent-dim: oklch(0.45 0.22 260);
  --slop-green: oklch(0.55 0.3 145);
  --slop-coral: oklch(0.6 0.3 30);
  --slop-blue: oklch(0.5 0.25 260);
  --slop-yellow: oklch(0.85 0.2 95);
  --slop-pink: oklch(0.7 0.25 330);
  --slop-teal: oklch(0.55 0.2 190);
  --slop-purple: oklch(0.5 0.3 300);
}

@theme inline {
  --font-sans: "Comic Sans MS", "Comic Sans", cursive;
  --font-mono: "Courier New", Courier, monospace;
  --radius-sm: 0px;
  --radius-md: 0px;
  --radius-lg: 0px;
  --color-slop-green: var(--slop-green);
  --color-slop-coral: var(--slop-coral);
  --color-slop-blue: var(--slop-blue);
  --color-slop-yellow: var(--slop-yellow);
  --color-slop-pink: var(--slop-pink);
  --color-slop-teal: var(--slop-teal);
  --color-slop-purple: var(--slop-purple);
}

@layer base {
  body {
    background-image: url("data:image/svg+xml,...");
  }
  a {
    text-decoration: underline;
  }
}
```

## Verification Checklist

- Default theme shows retro colors and fonts without selecting a preset.
- `bg-slop-*` and `text-slop-*` utilities compile and render as expected.
- Body background uses a subtle tiled pattern.
- Links are underlined and shift color on hover.
- Existing presets still apply correctly when toggled via `data-theme`.

# Theme Review: Retro 90s vs Current Default

Status: draft
Created: 2026-01-20

## Scope

Validate the semantic theming pipeline by translating:

- Reference UI (retro 90s) into a built-in theme file.
- Current implementation into a built-in theme file.

Files created:

- `apps/web/src/styles/themes/retro-90s.css`
- `apps/web/src/styles/themes/slop-default.css`

## Observed Peculiarities

### Reference UI (retro 90s)

- Typography is part of the aesthetic (Comic Sans + Courier).
- No rounded corners; 2px inset/outset borders are everywhere.
- Buttons use bevel gradients and pressed states.
- Background uses a tiled SVG pattern.
- Link styling is underlined, blue-to-red hover.
- Animation accents: blink, marquee, wobble.
- UI includes decorative components (visitor counter, under-construction banner, web rings).

### Current implementation (slop default)

- Dark, high-contrast base with bright green accent.
- Subtle radius and soft shadows (modern SaaS).
- Utility-driven component styles via CVA.
- Semantic color tokens already exist and map to Tailwind utilities.
- Theme switching uses `data-theme` presets and `next-themes`.

## Theme Files Created

### Retro 90s

File: `apps/web/src/styles/themes/retro-90s.css`

- Overrides color tokens to a light 90s palette.
- Sets `--font-sans` to Comic Sans and `--font-mono` to Courier.
- Sets `--radius` to 0 and `--border-style` to `outset`.
- Adds tiled background pattern on `body` and `.theme-scope`.
- Provides semantic overrides for `.btn`, `.card`, `.input`, `.badge`.
- Adds `blink`, `marquee`, and `wobble` animations scoped to the theme.

### Slop Default

File: `apps/web/src/styles/themes/slop-default.css`

- Mirrors the current dark theme values in `apps/web/src/styles/theme.css`.
- Preserves current system font stack and rounded corners.
- Provides semantic overrides for `.btn`, `.card`, `.input`, and link styling.

## Assumptions Made

- Semantic classes exist (`.btn`, `.btn-primary`, `.card`, `.input`, `.badge`).
- Theme scope preview is required; both themes emit `.theme-scope[data-theme="..."]`.
- Built-in themes are allowed to use complex CSS (gradients, shadow stacks).

## Gaps Identified

- No `recipes.css` yet, so semantic classes do not exist in code.
- Themes are not imported anywhere. They are inert until `apps/web/src/app/app.css` includes them.
- Existing `ThemeProvider` and `ThemeSwitcher` do not list `retro-90s` or `slop-default`.
- The current token contract does not include layout knobs like `--app-card-pad` or `--app-grid-cols`.

## Recommendations

1. Add `apps/web/src/styles/recipes.css` and define semantic class recipes.
2. Import the new theme files from `apps/web/src/app/app.css` to enable them.
3. Extend `apps/web/src/lib/theme-constants.ts` to include `retro-90s` and `slop-default`.
4. Update `apps/web/src/styles/presets.css` to either delegate to theme files or remove duplication.
5. Introduce layout tokens in `apps/web/src/styles/theme.css` and update presets.

## Open Questions

1. Do we want `slop-default` to replace the existing `default` preset or live alongside it?
2. Should retro-specific classes like `.blink` and `.marquee` be part of the semantic layer or theme-only?
3. Do we want to allow retro themes to override link styling globally, or only within themed components?
4. How will we handle theme-specific assets (badges, gifs) in a safe way?

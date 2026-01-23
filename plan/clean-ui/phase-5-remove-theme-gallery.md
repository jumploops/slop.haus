# Phase 5: Remove Theme Gallery + Presets

**Status:** Draft
**Owner:** TBD
**Last Updated:** 2026-01-22

## Goal

Remove the unused theme gallery and preset theme system, keeping only the standard light/dark/system theme toggle. Capture all related cleanup (components, styles, API endpoints, docs) and handle any stored theme values safely.

## Current Implementation (Summary)

### Web (Next.js)
- `apps/web/src/app/theme-gallery/page.tsx` renders the gallery using `PRESET_THEMES` + `ThemePreview`.
- `apps/web/src/components/theme/ThemePreview.tsx` uses `data-theme` + `.theme-scope` to preview presets.
- `apps/web/src/components/theme/ThemeGenerator.tsx` uses `useTheme()` to apply user-generated themes (currently unused).
- `apps/web/src/hooks/useTheme.ts` wraps `next-themes` and exposes preset + user-theme helpers. Only referenced by `ThemeGenerator`.
- `apps/web/src/lib/theme-constants.ts` defines `PRESET_THEMES`.
- `apps/web/src/components/theme/ThemeProvider.tsx` + `ThemeSwitcher.tsx` handle class-based theme switching (light/dark/system).

### Styles
- `apps/web/src/styles/presets.css` defines preset overrides via `[data-theme="..."]`.
- `apps/web/src/app/app.css` imports `presets.css`.
- `apps/web/src/styles/theme.css` + `TOKEN-CONTRACT.md` reference preset overrides in comments/docs.

### API
- `apps/api/src/routes/themes.ts` exposes:
  - `GET /api/v1/themes/presets` (hardcoded preset list)
  - `POST /api/v1/themes/generate` and `/compile` (LLM + compiler)
- Theme schemas live in `packages/shared/src/theme-schema.ts` and are used by theme routes.

## Proposed Removal Scope

### Must Remove
- Theme gallery route: `apps/web/src/app/theme-gallery/page.tsx`.
- Preset definitions: `apps/web/src/lib/theme-constants.ts` and any imports.
- Preset styles: `apps/web/src/styles/presets.css` and its import from `apps/web/src/app/app.css`.
- Theme preview UI: `apps/web/src/components/theme/ThemePreview.tsx` (only used by gallery).
- Theme generator UI + hook: `apps/web/src/components/theme/ThemeGenerator.tsx` and `apps/web/src/hooks/useTheme.ts`.
- Preset + theme generation API endpoints: remove `/api/v1/themes/*` routes and dependencies.
- Docs referencing presets: `apps/web/src/styles/TOKEN-CONTRACT.md`, `apps/web/src/styles/theme.css` comments.

### Likely Removable (confirm)
- None.
- Any API libs tied only to preset listing (none currently, but consider theme generator if unused).

### Keep
- `apps/web/src/components/theme/ThemeProvider.tsx` (light/dark/system).
- `apps/web/src/components/theme/ThemeSwitcher.tsx` (toggle).
- `next-themes` dependency.

## Implementation Tasks

1. **Web Routes + Components**
   - Remove `apps/web/src/app/theme-gallery/page.tsx`.
   - Remove `apps/web/src/components/theme/ThemePreview.tsx`.
   - Remove `apps/web/src/components/theme/ThemeGenerator.tsx` if unused.
   - Remove `apps/web/src/lib/theme-constants.ts`.
   - Remove `apps/web/src/hooks/useTheme.ts` if no other usage.

2. **Styles**
   - Remove `apps/web/src/styles/presets.css`.
   - Remove the presets import from `apps/web/src/app/app.css`.
   - Update comments in `apps/web/src/styles/theme.css` to no longer mention presets.

3. **API**
   - Remove `/api/v1/themes/*` routes and delete `apps/api/src/routes/themes.ts`.
   - Remove theme generation dependencies:
     - `apps/api/src/lib/theme-generator.ts`
     - `apps/api/src/lib/theme-compiler.ts`
     - `packages/shared/src/theme-schema.ts`

4. **Docs**
   - Update `apps/web/src/styles/TOKEN-CONTRACT.md` to remove preset references.

5. **Theme Value Hygiene**
   - Not required (no existing users or stored preferences).

## Open Questions

- Should the theme toggle be limited to light/dark only (no system), or keep system?

## Risks / Blockers

- Removing API endpoints could break external tools if they rely on presets or theme generation.

## Verification Checklist

- `/theme-gallery` returns 404 (route removed).
- No references to `PRESET_THEMES`, `ThemePreview`, or `presets.css` in web build.
- `pnpm -F @slop/web exec tsc --noEmit` passes.
- Theme toggle still cycles light/dark/system correctly.
- No API route for `/api/v1/themes/presets` remains (if removed).

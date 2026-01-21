# Debug: Retro 90s Theme Only Changes Background

Status: investigating
Created: 2026-01-20

## Problem Statement

Switching to the `retro-90s` theme changes the background, but most UI components (buttons, cards, inputs, borders, typography) appear unchanged.

## Repro Steps

1. Start the web app and select `Retro 90s` in the theme switcher.
2. Observe the UI in a few pages (home, theme gallery, submit).
3. Background changes; other component styling remains similar to default.

## Expected

Retro theme should change typography, borders, radius, shadows, and component styles (bevels/inset/outset, Comic Sans, etc.).

## Observations

- Background color/pattern updates, implying the theme CSS is at least partially applied.
- Other components (buttons/cards/inputs) do not visibly change.
- `data-theme="retro-90s"` is present on `<html>`.
- Retro theme rules show up in DevTools (served from `layout.css`), but `retro-90s.css` is not listed as a separate source.
- `body` computed font remains `-apple-system, "system-ui", "Segoe UI", Roboto, sans-serif` (not Comic Sans).
- The background pattern is applied via `:root[data-theme="retro-90s"] body`, but the background color appears black instead of the expected light tone.
- A few buttons (e.g., “Analyze Project” on `/submit`) show retro styling, but most UI does not.
- DevTools indicates `--font-sans` remains the system stack; the retro theme does not override it.
- The only visible retro rule is the `body` background-image selector, which does not touch font variables.

## Relevant Files (Current Implementation)

- Theme file: `apps/web/src/styles/themes/retro-90s.css`
- App CSS entry: `apps/web/src/app/app.css` (imports theme files)
- Recipes: `apps/web/src/styles/recipes.css`
- Theme switching: `apps/web/src/components/theme/ThemeProvider.tsx`
- Theme gallery: `apps/web/src/app/theme-gallery/page.tsx`
- Preview component: `apps/web/src/components/theme/ThemePreview.tsx`
- Token mapping: `apps/web/src/styles/theme.css`

## Initial Investigation Checklist

1. Confirm `data-theme="retro-90s"` on `html` at runtime.
2. Confirm `retro-90s.css` is loaded in the compiled CSS (DevTools Sources).
3. Inspect computed styles for a `.btn` element:
   - Is `border-style` still `solid`?
   - Is `border-width` still `1px`?
4. Inspect computed styles for a `.card` element:
   - Does `border-style`/`border-width` change?
   - Is the background `oklch(0.95 0 0)` as defined in retro theme?
5. Inspect `body` computed font:
   - Is it using Comic Sans? If not, why?

## Likely Causes (Hypotheses)

1. **Component utilities overriding theme styles**
   - `btn-primary` uses `border` utility, which sets `border-style: solid` and `border-width: 1px`.
   - Even if `.btn` is themed, `.btn-primary` may override those properties.
   - Similar conflicts may exist for cards/inputs using `rounded-*` utilities.

2. **Legacy radius aliases blocking retro radius**
   - `theme.css` sets `--radius-sm` and `--radius-lg` in a legacy alias block.
   - These fixed values can prevent radius from responding to `--radius` changes.

3. **Missing semantic coverage**
   - Not all component layouts use `.card`, `.input`, `.btn`, `.badge`.
   - Some UI surfaces still use raw utilities or palette classes.

4. **Layer ordering or specificity**
   - If `@layer components` is ordered after `@layer themes.retro-90s`, theme overrides won’t win.
   - Needs verification in compiled CSS.

5. **Theme uses tokens not wired into components**
   - Some structural tokens (`--border-style`, `--border-width`, `--shadow-*`) are set by the theme, but components still hardcode equivalent styles via utilities.

6. **Unlayered base variables overriding layered theme**
   - Base variables in `apps/web/src/styles/theme.css` are unlayered (`:root { ... }`).
   - Retro theme overrides are inside `@layer themes.retro-90s { ... }`.
   - In CSS cascade, unlayered rules outrank layered rules, so base `--background`/`--font-sans` may override theme values even when the theme file loads later.
   - This would explain: pattern applies (non-variable rule), but colors/fonts do not.

## Data to Collect

- Computed CSS for `.btn`, `.btn-primary`, `.card`, `.input` under `retro-90s`.
- Cascade order of `.btn` rules vs `.btn-primary` rules.
- Presence of theme layer styles in the final CSS bundle.
- Check which rule sets `--background` and `--font-sans` in DevTools (layered vs unlayered).
  - Observation: unlayered `:root` values appear to win.

## Next Steps (No Code Changes Yet)

1. Use DevTools to capture computed styles and confirm which rules win.
2. Verify `@layer` order in the built CSS output.
3. Identify remaining components still using raw utilities for borders/rounding.
4. Decide whether to remove conflicting utilities or move structural properties into theme layers.
5. Confirm whether unlayered base variables are overriding layered theme variables.

## Progress Update

- Applied a fix by moving base `:root` token definitions into a named layer in `apps/web/src/styles/theme.css` so theme layers can override them.
- Next verification: confirm `--background` and `--font-sans` now come from the retro theme in DevTools.

## Open Questions

1. Should semantic variants like `.btn-primary` avoid setting border style/width entirely?
2. Should we remove legacy radius aliases to allow `--radius` to control all rounding?
3. Do we want a lint rule to flag structural utilities in semantic variants?

# Phase 6: Built-in Themes Wiring

Status: pending

## Goal

Wire built-in themes into the current app and verify theme switching.

## Scope

- Import new theme files into the app CSS.
- Register theme IDs in the theme switcher.
- Ensure presets and new theme files do not conflict.

## Files to Change

- `apps/web/src/app/app.css` (import theme files)
- `apps/web/src/lib/theme-constants.ts` (add theme IDs)
- `apps/web/src/components/theme/ThemeSwitcher.tsx`
- `apps/web/src/styles/presets.css` (decide integration/deprecation)

## Implementation Notes

- Confirm the default theme ID and migration path.
- Ensure `data-theme` maps to correct theme files.
- Verify `.theme-scope` previews for all themes.

## Verification Checklist

- [ ] Themes switch without layout breakage.
- [ ] Theme preview matches applied theme.
- [ ] No conflicting overrides between presets and theme files.

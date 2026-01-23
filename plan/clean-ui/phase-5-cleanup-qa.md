# Phase 5: Cleanup + QA

**Status:** Pending

## Goals

- Remove unused theme system code and legacy styles.
- Ensure visual parity with clean-ui and stable behavior across light/dark.

## Tasks

1. Remove unused theme infrastructure.
   - Delete `apps/web/src/components/theme/ThemeSwitcher.tsx` and `ThemeGenerator.tsx` if no longer used.
   - Remove `apps/web/src/app/theme-gallery` route.
   - Remove `apps/web/src/hooks/useTheme.ts` and `apps/web/src/lib/theme-constants.ts` if unused.

2. Remove legacy styling files.
   - Stop importing and then delete `apps/web/src/app/app.css`.
   - Delete `apps/web/src/styles/theme.css`, `apps/web/src/styles/presets.css`, `apps/web/src/styles/animations.css` if fully superseded by globals.

3. Asset parity.
   - Copy required assets from `clean-ui/public` into `apps/web/public`.
   - Verify any new icons or images are referenced correctly.

4. QA pass.
   - Check light/dark/system theme toggling.
   - Verify page layout on mobile and desktop.
   - Validate key interactions (upvote, review submit, load more, auth).

## Files to Remove (Expected)

- `apps/web/src/components/theme/ThemeSwitcher.tsx`
- `apps/web/src/components/theme/ThemeGenerator.tsx`
- `apps/web/src/app/theme-gallery/*`
- `apps/web/src/hooks/useTheme.ts`
- `apps/web/src/lib/theme-constants.ts`
- `apps/web/src/app/app.css`
- `apps/web/src/styles/theme.css`
- `apps/web/src/styles/presets.css`
- `apps/web/src/styles/animations.css`

## Verification Checklist

- [ ] No unused theme components or routes remain.
- [ ] No references to removed CSS files.
- [ ] `apps/web/public` contains required clean-ui assets.
- [ ] Light/dark/system themes render correctly.
- [ ] Key routes render without layout regressions.

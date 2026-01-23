# Phase 2: Global Styles + Theme Simplification

**Status:** Completed (2026-01-22)

## Goals

- Replace current multi-file theme system with clean-ui style globals.
- Align tokens and fonts to clean-ui defaults.
- Configure `next-themes` to use class-based light/dark/system.

## Tasks

1. Introduce clean-ui style globals.
   - Add `apps/web/src/app/globals.css` modeled on `clean-ui/styles/globals.css`.
   - Wire `apps/web/src/app/layout.tsx` to import `./globals.css` instead of `./app.css`.

2. Simplify ThemeProvider.
   - Update `apps/web/src/components/theme/ThemeProvider.tsx` to match clean-ui:
     - `attribute="class"`
     - `defaultTheme="system"`
     - `enableSystem`
   - Remove preset theme list from provider.

3. Remove preset theme infrastructure (temporarily keep until Phase 5 cleanup if needed).
   - Deprecate `apps/web/src/styles/theme.css` and `apps/web/src/styles/presets.css`.
   - Stop importing `apps/web/src/styles/animations.css` if its keyframes are replaced in globals.

4. Fonts.
   - Add `Geist` + `Geist_Mono` in `apps/web/src/app/layout.tsx` (same pattern as clean-ui).

## Files to Change

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/globals.css` (new)
- `apps/web/src/components/theme/ThemeProvider.tsx`
- `apps/web/src/app/app.css` (remove usage; keep file until Phase 5 cleanup)
- `apps/web/src/styles/theme.css` (phase-out)
- `apps/web/src/styles/presets.css` (phase-out)
- `apps/web/src/styles/animations.css` (phase-out or merge keyframes)

## Code Notes / Snippets

ThemeProvider target:

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
  {children}
</ThemeProvider>
```

## Verification Checklist

- [x] App loads with clean-ui tokens (`bg-background`, `text-foreground`).
- [x] System theme toggling works (no hydration mismatch).
- [x] Fonts render as Geist / Geist Mono.
- [x] No references to `bg-bg` / `text-fg` remain in layout styles.

## Implementation Notes

- Add temporary legacy token aliases in `apps/web/src/app/globals.css` so existing `bg-bg`/`text-fg` classes keep working during migration.
- Carry forward legacy slop palette variables (`slop-blue`, `slop-purple`, etc.) until Phase 5 cleanup.

# Phase 3: Runtime + Loading Screen + Preview Scoping

Status: pending

## Goal

Implement safe runtime theme application, preview scoping, and a lightweight loading screen for user themes.

## Scope

- Ensure `data-theme` and `data-mode` are set before paint.
- Inject compiled user theme CSS before hydration.
- Add loading screen for user themes (name/author/icon).
- Ensure theme preview uses `.theme-scope` selectors.

## Files to Change

- `apps/web/src/app/layout.tsx` (inject boot script / loading state)
- `apps/web/src/hooks/useTheme.ts` (consume compiled CSS only)
- `apps/web/src/components/theme/ThemeProvider.tsx` (ensure user themes are allowed)
- `apps/web/src/components/theme/ThemePreview.tsx` (confirm `.theme-scope` usage)

## Implementation Notes

- Boot script reads persisted theme + metadata and applies `data-theme` + CSS variables.
- Loading UI should display theme name, author, and optional icon.
- User theme CSS should be pre-validated and stored, not raw.

## Verification Checklist

- [ ] No flash of default theme on reload.
- [ ] Loading screen appears for user themes only.
- [ ] Theme previews match applied theme.

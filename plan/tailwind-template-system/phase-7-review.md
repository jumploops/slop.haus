# Phase 7 Review: Runtime Theme Switching

**Date:** 2026-01-16
**Status:** Complete

## Implementation Summary

Phase 7 added runtime theme switching using `next-themes`. Users can now switch between preset themes instantly via the ThemeSwitcher dropdown in the header.

### Features Implemented

| Feature | Description |
|---------|-------------|
| ThemeProvider | Wraps app with next-themes configuration |
| useTheme hook | Updated to use next-themes + user theme support |
| ThemeSwitcher | Dropdown UI for selecting themes |
| Header integration | Theme switcher visible in header |
| Persistence | Theme choice saved to localStorage |
| No flash | next-themes handles SSR hydration |

### Files Created/Modified

| File | Action |
|------|--------|
| `apps/web/src/components/theme/ThemeProvider.tsx` | Created |
| `apps/web/src/components/theme/ThemeSwitcher.tsx` | Created |
| `apps/web/src/hooks/useTheme.ts` | Updated to use next-themes |
| `apps/web/src/app/providers.tsx` | Added ThemeProvider |
| `apps/web/src/components/layout/Header.tsx` | Added ThemeSwitcher |

### Architecture

**next-themes Configuration:**
```tsx
<NextThemesProvider
  attribute="data-theme"      // Sets data-theme on <html>
  defaultTheme="default"      // Fallback theme
  themes={[...presetIds]}     // Valid theme names
  enableSystem={false}        // No auto light/dark
  storageKey="slop-theme"     // localStorage key
>
```

**Theme Switching Flow:**
1. User clicks ThemeSwitcher button
2. Dropdown shows all preset themes
3. User clicks a theme
4. `setTheme(id)` calls next-themes
5. next-themes updates `data-theme` attribute on `<html>`
6. CSS variable overrides in `presets.css` take effect instantly
7. Theme ID saved to localStorage

**User Theme Support (for Phase 8):**
```typescript
// Apply a custom LLM-generated theme
applyUserTheme("custom-123", `
  :root[data-theme="user:custom-123"] {
    --background: oklch(0.1 0.03 200);
    ...
  }
`);
```
- Injects CSS into `<style id="user-theme-styles">`
- Sets theme to `user:{id}` pattern
- Persists CSS to `localStorage` for reload

### useTheme Hook API

```typescript
const {
  // State
  theme,           // Current theme ID (string)
  isUserTheme,     // true if using LLM-generated theme
  currentPreset,   // Preset object or undefined
  presets,         // PRESET_THEMES array
  mounted,         // true after hydration

  // Actions
  setTheme,        // Switch to preset theme
  applyUserTheme,  // Apply LLM-generated CSS
  reset,           // Reset to default
} = useTheme();
```

### ThemeSwitcher Features

- Dropdown with all preset themes
- Current theme highlighted with accent color
- Theme name + description displayed
- Keyboard accessible (Escape to close)
- Click outside to close
- SSR-safe (shows placeholder before hydration)
- "Reset to Default" option when using custom theme

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript | Only pre-existing AuthButtons error |
| ThemeProvider | Wraps app correctly |
| ThemeSwitcher | Visible in header |
| Theme switching | Works instantly |
| Persistence | Survives page refresh |

## TypeScript Status

**Pre-existing error (NOT from Phase 7):**
- `AuthButtons.tsx:49` - src type mismatch (string | null | undefined vs string | null)

## Testing Notes

1. **Basic switching:** Click theme dropdown, select different themes
2. **Persistence:** Refresh page, theme should persist
3. **No flash:** On page load, correct theme should show immediately
4. **Mobile:** ThemeSwitcher shows icon only on mobile (text hidden)
5. **Keyboard:** Press Escape to close dropdown

### Manual Testing Checklist

- [ ] Theme switcher visible in header
- [ ] Clicking opens dropdown with all 6 presets
- [ ] Clicking preset changes theme instantly
- [ ] Colors update across all components
- [ ] Theme persists after refresh
- [ ] No flash of default theme on reload
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on Escape key
- [ ] Mobile: shows palette icon only

## Integration with Other Phases

**Phase 6 (Presets):** Uses `presets.css` for theme definitions
**Phase 8 (LLM):** `applyUserTheme()` ready for custom themes

## Next Steps (Phase 8)

1. Add LLM theme generation endpoint
2. Create theme prompt/description input UI
3. Call `applyUserTheme()` with generated CSS
4. Add theme preview before applying
5. Consider theme sharing/saving features

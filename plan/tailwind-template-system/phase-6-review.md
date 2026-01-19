# Phase 6 Review: Preset Themes

**Date:** 2026-01-16
**Status:** Complete

## Implementation Summary

Phase 6 added 6 curated preset themes that apply instantly via the `data-theme` attribute on `<html>`. These themes override the base CSS variables defined in `theme.css`.

### Preset Themes Created

| Theme | Description | Key Colors |
|-------|-------------|------------|
| Default | Classic slop.haus look | Green accent on dark gray |
| Cyberpunk | Neon cyan on dark blue | Futuristic, sharper corners |
| Warm | Cozy orange tones | Orange accent on warm brown |
| Light | High contrast light mode | Green accent on white |
| Midnight | Elegant purple accent | Purple on near-black |
| Forest | Natural green tones | Green accent on dark green |

### Files Created/Modified

| File | Action |
|------|--------|
| `apps/web/src/styles/presets.css` | Already existed, verified |
| `apps/web/src/hooks/useTheme.ts` | Created |
| `apps/web/src/components/theme/ThemePreview.tsx` | Created |
| `apps/web/src/app/theme-gallery/page.tsx` | Created |

### Architecture

**Two-Layer Variable Pattern:**
```
:root (base variables)     →  @theme inline (Tailwind mapping)
--background               →  --color-bg → bg-bg utility
--foreground               →  --color-fg → text-fg utility
```

**Theme Override Flow:**
1. Presets override BASE variables (e.g., `--background`)
2. `@theme inline` preserves `var()` references
3. Tailwind utilities automatically use new values

**Theme Application:**
- Set `data-theme="themename"` on `<html>` for global theme
- Set `data-theme="themename"` on `.theme-scope` for scoped preview

### useTheme Hook

```typescript
const { theme, setTheme, isLoaded, presets } = useTheme();

// theme: current theme ID
// setTheme: function to change theme (persists to localStorage)
// isLoaded: true once client-side hydration is complete
// presets: PRESET_THEMES array
```

### Key Patterns

**Theme Scoping for Preview:**
```tsx
<div className="theme-scope" data-theme="cyberpunk">
  {/* Content uses cyberpunk theme */}
</div>
```

**Theme Persistence:**
- Uses `localStorage` with key `slop-theme`
- Applied on mount via `useEffect`
- Updates `document.documentElement` attribute

### OKLCH Color Space

All themes use OKLCH for perceptual uniformity:
```css
--background: oklch(0.07 0 0);           /* Lightness Chroma Hue */
--accent: oklch(0.85 0.2 155);           /* L=85%, C=0.2, H=155° */
```

Benefits:
- Consistent perceived brightness across hues
- Predictable color relationships
- Better for accessibility calculations

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript | Only pre-existing AuthButtons error |
| Presets loaded | presets.css imported in app.css |
| Hook created | useTheme.ts with PRESET_THEMES |
| Preview component | ThemePreview.tsx works |
| Gallery page | /theme-gallery accessible |

## TypeScript Status

**Pre-existing error (NOT from Phase 6):**
- `AuthButtons.tsx:49` - src type mismatch (string | null | undefined vs string | null)

## Testing Notes

To test themes:

1. Visit `/theme-gallery` to see all themes side-by-side
2. Each preview shows: buttons, badges, input, card, semantic colors
3. Use browser dev tools to verify CSS variable changes

### Visual Verification Checklist

For each theme, verify:
- [ ] Background colors apply correctly
- [ ] Text is readable (sufficient contrast)
- [ ] Borders are visible but not harsh
- [ ] Accent color stands out appropriately
- [ ] Hover states are noticeable
- [ ] Semantic colors (success, warning, danger) are visible

## CSS Variable Reference

Base variables that presets override:

| Variable | Purpose |
|----------|---------|
| `--background` | Page background |
| `--background-secondary` | Card/section backgrounds |
| `--foreground` | Primary text |
| `--muted` | Secondary text |
| `--border` | Borders and dividers |
| `--accent` | Brand/primary action color |
| `--accent-dim` | Hover state for accent |
| `--accent-foreground` | Text on accent background |
| `--danger` | Error/destructive states |
| `--warning` | Warning states |
| `--success` | Success states |
| `--radius` | Base border radius |

## Next Steps (Phase 7)

1. Add runtime theme switching with `next-themes` (or custom solution)
2. Apply `data-theme` to `<html>` based on user selection
3. Consider system preference detection (prefers-color-scheme)
4. Add theme picker UI component

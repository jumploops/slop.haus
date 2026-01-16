# Phase 9: Cleanup & Polish

**Status:** Not Started

## Overview

Final phase to remove legacy CSS, establish linting rules, document the system, and ensure everything is production-ready.

## Prerequisites

- Phases 1-8 complete
- All components migrated to Tailwind utilities
- Theme switching fully functional

## Tasks

### 9.1 Remove globals.css

After all components are migrated, `globals.css` should be empty or contain only:
1. CSS reset (if not using Tailwind's preflight)
2. Keyframe animations (if not defined in theme.css)
3. Print styles (if needed)

**Action:** Delete `apps/web/src/app/globals.css` entirely, or reduce to minimal content.

**Update `app.css`:**
```css
/* Theme tokens and Tailwind */
@import "../styles/theme.css";

/* Preset theme overrides */
@import "../styles/presets.css";

/* No more globals.css import */
```

### 9.2 Audit for Remaining CSS Classes

Search for any remaining custom CSS class usage:

```bash
# Find any className that doesn't look like Tailwind
grep -r "className=" apps/web/src --include="*.tsx" | grep -v "cn(" | head -50
```

Common patterns to fix:
- Direct class strings: `className="old-class"` → migrate to Tailwind
- Mixed usage: `className={cn("tw-class", "old-class")}` → remove old-class

### 9.3 Update cn() Function

Ensure `tailwind-merge` is properly configured:

**File:** `apps/web/src/lib/utils.ts`

```ts
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind-aware merging.
 * Later classes override earlier conflicting classes.
 *
 * @example
 * cn("p-2 bg-red-500", "p-4") // → "bg-red-500 p-4"
 * cn("text-fg", condition && "text-accent") // → "text-accent" if condition
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
```

### 9.4 Add ESLint Rule for Palette Classes

Prevent usage of raw Tailwind palette classes (e.g., `bg-slate-900`).

**File:** `apps/web/.eslintrc.js` (or equivalent)

```js
module.exports = {
  // ... existing config
  rules: {
    // Warn on non-semantic color classes
    "no-restricted-syntax": [
      "warn",
      {
        selector: "Literal[value=/bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d+/]",
        message: "Use semantic color tokens (bg-bg, bg-accent) instead of palette colors.",
      },
      {
        selector: "Literal[value=/text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d+/]",
        message: "Use semantic color tokens (text-fg, text-muted) instead of palette colors.",
      },
    ],
  },
};
```

**Alternative: Custom ESLint Plugin**

For more robust detection, create a simple custom rule or use `eslint-plugin-tailwindcss` with custom configuration.

### 9.5 Document Token Contract

Create a reference document for developers:

**File:** `apps/web/src/styles/TOKEN-CONTRACT.md`

```md
# Semantic Token Contract

This document defines the themeable tokens used throughout slop.haus.

## Colors

| Token | Utility | Purpose |
|-------|---------|---------|
| `--color-bg` | `bg-bg` | Primary background |
| `--color-bg-secondary` | `bg-bg-secondary` | Cards, inputs, elevated surfaces |
| `--color-fg` | `text-fg` | Primary text |
| `--color-muted` | `text-muted` | Secondary/helper text |
| `--color-border` | `border-border` | Borders, dividers |
| `--color-accent` | `bg-accent`, `text-accent` | Brand color, interactive elements |
| `--color-accent-dim` | `bg-accent-dim` | Hover state for accent |
| `--color-accent-contrast` | `text-accent-contrast` | Text on accent background |
| `--color-danger` | `bg-danger`, `text-danger` | Error states |
| `--color-warning` | `bg-warning`, `text-warning` | Warning states |
| `--color-success` | `bg-success`, `text-success` | Success states |

## Spacing

Spacing utilities derive from `--spacing` base (default: 0.25rem).

| Utility | Value |
|---------|-------|
| `p-1`, `m-1`, `gap-1` | 0.25rem |
| `p-2`, `m-2`, `gap-2` | 0.5rem |
| `p-4`, `m-4`, `gap-4` | 1rem |
| `p-8`, `m-8`, `gap-8` | 2rem |

## Border Radius

| Token | Utility | Default |
|-------|---------|---------|
| `--radius-sm` | `rounded-sm` | 0.25rem |
| `--radius-md` | `rounded-md` | 0.5rem |
| `--radius-lg` | `rounded-lg` | 0.75rem |

## Usage Guidelines

### DO
- Use semantic utilities: `bg-bg`, `text-fg`, `border-border`
- Use spacing scale: `p-4`, `gap-2`, `mt-6`
- Use radius tokens: `rounded-md`, `rounded-lg`

### DON'T
- Use palette classes: `bg-slate-900`, `text-gray-500`
- Use arbitrary colors: `bg-[#1a1a1a]`
- Use raw values: `p-[16px]`

## Adding New Tokens

1. Add to `@theme` block in `theme.css`
2. Add override in each preset in `presets.css`
3. Update this document
4. Test with all preset themes
```

### 9.6 Final File Structure

Verify the styles directory is organized:

```
apps/web/src/
├── styles/
│   ├── theme.css           # @theme tokens + base styles
│   ├── presets.css         # Preset theme overrides
│   └── TOKEN-CONTRACT.md   # Documentation
├── app/
│   └── app.css             # Entry point (imports theme + presets)
├── lib/
│   ├── utils.ts            # cn() with tailwind-merge
│   └── theme-manager.ts    # Runtime theme switching
├── hooks/
│   └── useTheme.ts         # React hook
└── components/
    └── theme/
        ├── ThemeSwitcher.tsx
        ├── ThemePreview.tsx
        └── ThemeGenerator.tsx
```

### 9.7 Performance Audit

Check CSS bundle size:

```bash
# After build
ls -la apps/web/.next/static/css/

# Compare to pre-migration size
# Tailwind's tree-shaking should result in smaller output
```

### 9.8 Visual Regression Testing (Optional)

Set up Playwright for visual regression:

**File:** `apps/web/tests/visual/themes.spec.ts`

```ts
import { test, expect } from "@playwright/test";

const themes = ["default", "cyberpunk", "warm", "light", "midnight", "forest"];

test.describe("Theme visual regression", () => {
  for (const theme of themes) {
    test(`${theme} theme renders correctly`, async ({ page }) => {
      await page.goto("/theme-gallery");

      // Apply theme
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);

      // Screenshot comparison
      await expect(page).toHaveScreenshot(`theme-${theme}.png`, {
        fullPage: true,
      });
    });
  }
});
```

### 9.9 Update AGENTS.md

Add theming guidelines to the developer guide:

```md
## Theming System

### CSS Variables
All colors, spacing, and radius values are defined as CSS variables in `@theme`.
Components use semantic Tailwind utilities that map to these variables.

### Semantic Utilities
| Use | Instead of |
|-----|------------|
| `bg-bg` | `bg-slate-900` |
| `text-fg` | `text-gray-100` |
| `border-border` | `border-gray-700` |

### Theme Files
- `src/styles/theme.css` - Token definitions
- `src/styles/presets.css` - Preset overrides
- `src/lib/theme-manager.ts` - Runtime switching

### Adding Components
When creating new components:
1. Use only semantic color utilities
2. Use spacing scale (p-4, gap-2, etc.)
3. Test with multiple themes
```

## Verification Checklist

### Code Quality
- [ ] No remaining references to `globals.css`
- [ ] No palette color classes in components
- [ ] All components use `cn()` for class merging
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (with palette class warnings)

### Visual Quality
- [ ] All pages render correctly with default theme
- [ ] All preset themes look intentional
- [ ] No visual regressions from pre-migration
- [ ] Mobile layouts work correctly

### Performance
- [ ] CSS bundle size ≤ pre-migration
- [ ] No unused CSS in production build
- [ ] Theme switching is instant (no layout shift)

### Documentation
- [ ] TOKEN-CONTRACT.md is complete
- [ ] AGENTS.md updated with theming guide
- [ ] Code comments explain non-obvious patterns

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/app/globals.css` | Delete |
| `apps/web/src/app/app.css` | Remove globals import |
| `apps/web/src/lib/utils.ts` | Verify tailwind-merge |
| `apps/web/.eslintrc.js` | Add palette class rule |
| `apps/web/src/styles/TOKEN-CONTRACT.md` | Create new |
| `AGENTS.md` | Update with theming guide |

## Rollback Plan

If critical issues are found post-migration:

1. **Immediate:** Restore `globals.css` from git
2. **Short-term:** Keep both systems (Tailwind + legacy CSS)
3. **Long-term:** Identify specific components causing issues and fix

The architecture allows coexistence of Tailwind and vanilla CSS, so partial rollback is possible.

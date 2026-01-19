# Debug: Tailwind v4 Styles Not Being Applied

**Date:** 2026-01-18
**Status:** Investigation

## Problem Statement

Tailwind utility classes are not being applied to elements. For example:
- `<body className="bg-bg text-fg">` - styles not visible in Chrome DevTools
- `<header className="sticky top-0 z-50 bg-bg">` - sticky/top-0 not applied

## Environment

- Next.js: 15.1.3
- Tailwind CSS: 4.1.18
- @tailwindcss/postcss: 4.1.18
- React: 19.0.0

## Investigation Findings

### 1. Generated CSS Analysis

Location: `apps/web/.next/static/css/app/layout.css` (4821 lines)

**What IS being generated:**
- Tailwind default theme colors (line 16+): `--color-red-50`, `--color-blue-500`, etc.
- Custom theme variables (line 991-998):
  ```css
  --color-bg: var(--background);
  --color-bg-secondary: var(--background-secondary);
  --color-fg: var(--foreground);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  ```
- Standard utilities (line 2369+): `.flex`, `.items-center`, `.hidden`
- The `@theme inline` block IS processed (line 989)

**What is NOT working:**
- **Custom color utilities NOT generated**: No `.bg-bg`, `.text-fg`, `.text-accent`, `.border-border` classes found
- **`@apply` directives NOT resolved** (lines 1080, 1084, 1091):
  ```css
  @layer base {
    * {
      @apply border-border;   /* ← Still literal @apply, not resolved! */
    }
    body {
      @apply bg-bg text-fg;   /* ← Still literal @apply, not resolved! */
    }
    a {
      @apply text-accent;     /* ← Still literal @apply, not resolved! */
    }
  }
  ```

### 2. CSS Architecture Review

**Import chain:**
```
layout.tsx
  └── app.css
        ├── @import "../styles/theme.css"      ← Contains @import "tailwindcss" + @theme inline
        ├── @import "../styles/animations.css"
        ├── @import "../styles/presets.css"
        └── @import "./globals.css"             ← Contains :root overrides
```

**theme.css structure:**
```css
@import "tailwindcss";

:root {
  --background: oklch(0.07 0 0);
  --foreground: oklch(0.93 0 0);
  /* ... */
}

@theme inline {
  --color-bg: var(--background);
  --color-fg: var(--foreground);
  /* ... */
}

:root {
  --bg: var(--background);  /* Legacy alias */
  /* ... */
}

@layer base {
  body {
    @apply bg-bg text-fg;   /* Uses custom color utilities */
  }
}
```

**globals.css conflict (lines 35-37):**
```css
:root {
  /* Aliases */
  --background: var(--bg);   /* ← OVERWRITES theme.css definition! */
  --foreground: var(--fg);   /* ← Creates circular reference! */
}
```

### 3. PostCSS Configuration

```javascript
// apps/web/postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

This is minimal - may need additional configuration for Next.js.

## Hypotheses

### Hypothesis 1: CSS Variable Circular Reference (HIGH PROBABILITY)

**Issue:** globals.css redefines `--background: var(--bg)` AFTER theme.css defines `--bg: var(--background)`

**Chain:**
1. theme.css: `--background: oklch(0.07 0 0)` (correct value)
2. theme.css: `--bg: var(--background)` (references correct value)
3. globals.css: `--background: var(--bg)` (NOW `--background` = `var(--bg)` = `var(--background)` = CIRCULAR!)

**Test:** Remove or comment out lines 35-37 in globals.css

### Hypothesis 2: `@apply` Not Resolving Due to Processing Order (HIGH PROBABILITY)

**Issue:** The `@apply bg-bg text-fg` in `@layer base` is not being resolved to actual CSS

**Possible causes:**
1. `bg-bg` utility doesn't exist when `@apply` is processed
2. The `@theme inline` block defines variables but utility generation happens in wrong order
3. Tailwind v4's `@apply` inside `@layer base` has different behavior

**Test:**
- Check if `bg-bg` utility exists at all
- Try moving `@apply` outside of `@layer base`
- Try using actual CSS instead of `@apply`

### Hypothesis 3: Custom Color Utilities Not Being Generated (HIGH PROBABILITY)

**Issue:** `--color-bg` is defined in `@theme inline` but `.bg-bg` utility is not generated

**Possible causes:**
1. Tailwind v4 may not generate utilities from `--color-*` variables that reference other variables
2. The `var(--background)` reference may prevent utility generation
3. May need `@theme` without `inline` keyword

**Test:**
- Check if hardcoded values work: `@theme inline { --color-test: #ff0000; }`
- Try `@theme` instead of `@theme inline`

### Hypothesis 4: Multiple CSS File Imports Issue (MEDIUM PROBABILITY)

**Issue:** [Per Tailwind v4 docs](https://github.com/tailwindlabs/tailwindcss/discussions/16429), importing multiple CSS files can cause issues

> "Importing multiple CSS files in JS can cause issues. Don't do that — import them all into one CSS file and load that one file in JS instead."

**Current setup:** app.css imports 4 CSS files

**Test:** Consolidate all CSS into theme.css and import only that

### Hypothesis 5: `@reference` Directive Needed (MEDIUM PROBABILITY)

**Issue:** [Per Tailwind v4 docs](https://github.com/tailwindlabs/tailwindcss/discussions/16429), if custom config in one file needs to be available in another:

> "If you have custom configuration in one CSS file that you need available in another CSS file, you need to explicitly import it using `@reference`"

**Test:** Try using `@reference` in files that need access to theme variables

### Hypothesis 6: CSS Filename Issue (LOW PROBABILITY)

**Issue:** [One source mentioned](https://medium.com/@bloodturtle/the-problem-f71da1eb9faa) the file must be named `global.css` (singular) not `globals.css`

**Current:** Using `globals.css` (plural)

**Test:** Rename to `global.css`

### Hypothesis 7: Next.js CSS Processing Interference (MEDIUM PROBABILITY)

**Issue:** Next.js processes CSS through its own pipeline which may interfere with Tailwind v4

**Evidence:** The webpack loader comments in generated CSS show complex processing chain

**Test:**
- Check Next.js version compatibility with Tailwind v4
- Try the official Next.js + Tailwind v4 setup from scratch

## Debug Paths

### Path A: Fix CSS Variable Circular Reference (Quick Test)

1. Edit `apps/web/src/app/globals.css`
2. Remove or comment out lines 35-37:
   ```css
   :root {
     /* Aliases - REMOVE THESE */
     --background: var(--bg);
     --foreground: var(--fg);
   }
   ```
3. Restart dev server
4. Check if styles apply

### Path B: Verify Utility Generation

1. Add a test color to theme.css:
   ```css
   @theme inline {
     --color-test-red: #ff0000;  /* Hardcoded, no var() */
   }
   ```
2. Use it: `<div className="bg-test-red">`
3. If it works → var() references are the issue
4. If it doesn't → utility generation itself is broken

### Path C: Bypass `@apply` in `@layer base`

1. Edit theme.css, replace:
   ```css
   @layer base {
     body {
       @apply bg-bg text-fg;
     }
   }
   ```
   With:
   ```css
   @layer base {
     body {
       background-color: var(--background);
       color: var(--foreground);
     }
   }
   ```
2. Check if base styles work
3. If yes → `@apply` resolution is the specific issue

### Path D: Check Browser DevTools

1. Open Chrome DevTools → Elements panel
2. Select `<body>` element
3. Look at Styles panel for:
   - Are there any `bg-bg` or `text-fg` classes listed?
   - Are they crossed out (overridden)?
   - Are there any CSS errors shown?
4. Go to Sources panel → find layout.css
5. Search for `bg-bg` - does the class exist?

### Path E: Console/Build Warnings

1. Check terminal for PostCSS/Tailwind warnings during build
2. Run: `pnpm -F @slop/web build 2>&1 | grep -i "warn\|error"`
3. Check browser console for CSS parsing errors

### Path F: Fresh Tailwind v4 Setup Comparison

1. Create minimal Next.js + Tailwind v4 project
2. Follow official guide: https://tailwindcss.com/docs/guides/nextjs
3. Compare configuration with current setup
4. Identify differences

## Recommended Action Order

1. **Path A** - Fix circular reference (5 min, likely to help)
2. **Path C** - Bypass @apply to confirm base styles (5 min, diagnostic)
3. **Path B** - Test utility generation (5 min, diagnostic)
4. **Path D** - Browser DevTools inspection (10 min, diagnostic)
5. **Path E** - Check for warnings (5 min, diagnostic)
6. **Path F** - Compare with fresh setup (30 min, if others fail)

## Related Files

| File | Purpose |
|------|---------|
| `apps/web/postcss.config.mjs` | PostCSS plugin config |
| `apps/web/src/app/layout.tsx` | Root layout, imports app.css |
| `apps/web/src/app/app.css` | CSS entry point |
| `apps/web/src/styles/theme.css` | @theme definitions |
| `apps/web/src/styles/presets.css` | Theme presets |
| `apps/web/src/app/globals.css` | Legacy CSS (contains conflicts) |
| `apps/web/.next/static/css/app/layout.css` | Generated output |

## References

- [Tailwind v4 @apply Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/16429)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [Tailwind v4 with Next.js Discussion](https://github.com/vercel/next.js/discussions/82623)
- [CSS Filename Issue Article](https://medium.com/@bloodturtle/the-problem-f71da1eb9faa)
- [Official Next.js Tailwind Guide](https://tailwindcss.com/docs/guides/nextjs)

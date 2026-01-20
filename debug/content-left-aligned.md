# Debug: Content Left-Aligned Instead of Centered

**Date:** 2026-01-18
**Status:** RESOLVED

## Problem Statement

After fixing the Tailwind v4 circular CSS variable reference, styles are now applying. However, page content appears left-aligned instead of centered with padding on larger screens.

**Expected:** Content centered within a max-width container
**Actual:** Content aligned to the left edge

## Environment

- Next.js: 15.1.3
- Tailwind CSS: 4.1.18
- Previous fix: Removed circular `--background` / `--bg` reference in globals.css

## Investigation Findings

### 1. Layout Structure

**Current implementation in `apps/web/src/app/layout.tsx`:**

```tsx
<main className="py-8 min-h-[calc(100vh-var(--app-header-height))]">
  <div className="max-w-[var(--app-container-max)] mx-auto px-4">
    {children}
  </div>
</main>
```

This should:
1. Set `max-width: 1200px` (via `--app-container-max`)
2. Center the div with `margin-inline: auto` (via `mx-auto`)
3. Add horizontal padding with `px-4`

### 2. CSS Variable Verification

**`--app-container-max` IS defined** in generated CSS (line 1354):
```css
--app-container-max: 1200px;
```

### 3. Utility Classes Verified

Both required utilities exist in generated CSS:

| Utility | Line | Generated CSS |
|---------|------|---------------|
| `.max-w-[var(--app-container-max)]` | 461-462 | `max-width: var(--app-container-max);` |
| `.mx-auto` | 275-276 | `margin-inline: auto;` |

### 4. CSS Layer Structure

Tailwind v4 uses CSS Cascade Layers:

```css
@layer properties;
@layer theme, base, components, utilities;
```

**Key insight:** All Tailwind utilities are inside `@layer utilities` (starting at line 199).

### 5. ROOT CAUSE FOUND: Unlayered CSS Override

**`apps/web/src/app/globals.css` (lines 1-5):**
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

This CSS is **NOT inside any `@layer`** block.

**In generated CSS (lines 1524+):**
```css
body {
  font-family: -apple-system, ...
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  ...
}
```

These styles appear AFTER the Tailwind layers and are UNLAYERED.

## Root Cause Explanation

Per the [CSS Cascade Layers specification](https://www.w3.org/TR/css-cascade-5/#layering):

> **Unlayered styles have higher priority than ANY layered styles.**

The cascade order (lowest to highest priority):
1. `@layer theme` - lowest priority
2. `@layer base`
3. `@layer components`
4. `@layer utilities`
5. **Unlayered CSS** - highest priority

Therefore:
- `.mx-auto { margin-inline: auto; }` is in `@layer utilities`
- `* { margin: 0; }` is UNLAYERED
- **The unlayered `margin: 0` wins**, overriding `mx-auto`

## Hypothesis Confirmation

The `* { margin: 0; }` universal selector in globals.css is overriding all Tailwind margin utilities because unlayered CSS beats layered CSS in the cascade.

## Solutions

### Solution A: Remove Duplicate Reset (Recommended)

Tailwind v4's preflight (in `@layer base`) already provides a complete CSS reset:

```css
@layer base {
  *, ::after, ::before, ::backdrop, ::file-selector-button {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0 solid;
  }
  /* ... */
}
```

**Action:** Remove lines 1-5 from globals.css since they duplicate Tailwind's reset but with wrong cascade priority.

### Solution B: Wrap in @layer base

If keeping the reset, wrap it in `@layer base`:

```css
@layer base {
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}
```

This ensures utilities can override base styles.

### Solution C: Remove globals.css Entirely

Since we've migrated to Tailwind v4 with `theme.css`:
1. All variables are defined in theme.css
2. Base styles are in `@layer base` in theme.css
3. globals.css may be entirely redundant

**Action:** Audit what's still needed from globals.css and consolidate into theme.css with proper layer annotations.

## Recommended Action

**Solution A is recommended** as the quickest fix:

1. Remove lines 1-5 from `globals.css` (the `* { ... }` reset)
2. Tailwind's preflight already provides this reset with correct cascade priority
3. Verify centering works after the change

## Files Involved

| File | Issue |
|------|-------|
| `apps/web/src/app/globals.css` | Contains unlayered CSS that overrides Tailwind utilities |
| `apps/web/src/app/app.css` | Imports globals.css AFTER theme.css |
| `apps/web/src/styles/theme.css` | Contains properly layered Tailwind setup |
| `apps/web/.next/static/css/app/layout.css` | Generated CSS shows issue clearly |

## Resolution

**Fixed on 2026-01-18:**

1. Removed the unlayered `* { margin: 0; }` reset from globals.css (Solution A)
2. Subsequently removed the entire `:root` block with hardcoded CSS variables that were overriding theme.css
3. As part of the broader globals.css cleanup (see `plan/remove-globals-css.md`), removed ~2,160 lines of dead code

The centering now works correctly because Tailwind's `.mx-auto` utility (in `@layer utilities`) is no longer overridden by unlayered CSS.

## Related Debug

- `debug/tailwind-v4-styles-not-applied.md` - Previous circular reference issue (fixed)

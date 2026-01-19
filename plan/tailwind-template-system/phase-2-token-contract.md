# Phase 2: Semantic Token Contract

**Status:** Complete

## Overview

Define the semantic token contract using Tailwind v4's `@theme inline` directive. This creates the foundation for all themeable values, generates utility classes, and enables runtime theme switching.

## Key Concept: Two-Layer Variable Pattern

Tailwind v4's `@theme` directive generates utilities from CSS variables. To enable runtime theming, we use a two-layer approach:

```css
/* Layer 1: Base variables in :root (can be overridden by theme presets) */
:root {
  --background: oklch(0.07 0 0);
}

/* Layer 2: @theme inline references the base variables */
@theme inline {
  --color-background: var(--background);  /* Creates: bg-background */
}
```

**Why `inline`?** Without `inline`, Tailwind bakes literal values into the output. With `inline`, it preserves the `var()` reference, allowing runtime theme changes.

## Tasks

### 2.1 Create Theme Stylesheet

**File:** `apps/web/src/styles/theme.css`

```css
@import "tailwindcss";

/* ============================================
   BASE VARIABLES

   These are the "source of truth" values that:
   1. Define the default theme
   2. Can be overridden by presets (via [data-theme="..."])
   3. Can be overridden by user themes (via runtime CSS injection)

   Using OKLCH color space for better perceptual uniformity.
   ============================================ */

:root {
  /* Backgrounds */
  --background: oklch(0.07 0 0);           /* #0a0a0a equivalent */
  --background-secondary: oklch(0.11 0 0); /* #111111 equivalent */

  /* Foreground (text) */
  --foreground: oklch(0.93 0 0);           /* #ededed equivalent */
  --muted: oklch(0.55 0 0);                /* #888888 equivalent */

  /* Borders & dividers */
  --border: oklch(0.25 0 0);               /* #333333 equivalent */

  /* Brand / Accent - bright green */
  --accent: oklch(0.85 0.2 155);           /* #00ff88 equivalent */
  --accent-dim: oklch(0.7 0.18 155);       /* #00cc6a equivalent */
  --accent-foreground: oklch(0.07 0 0);    /* Text on accent bg */

  /* Semantic status colors */
  --danger: oklch(0.65 0.25 25);           /* #ff4444 equivalent */
  --warning: oklch(0.8 0.18 75);           /* #ffaa00 equivalent */
  --success: oklch(0.85 0.2 155);          /* Same as accent */

  /* Border radius base */
  --radius: 0.5rem;
}

/* ============================================
   TAILWIND THEME MAPPING

   @theme inline creates utilities that reference
   the base variables above. This is what enables
   theme switching at runtime.
   ============================================ */

@theme inline {
  /* === COLORS === */
  --color-bg: var(--background);
  --color-bg-secondary: var(--background-secondary);
  --color-fg: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-dim: var(--accent-dim);
  --color-accent-foreground: var(--accent-foreground);
  --color-danger: var(--danger);
  --color-warning: var(--warning);
  --color-success: var(--success);

  /* === TYPOGRAPHY === */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  /* === SPACING === */
  /* Tailwind v4 derives utilities from --spacing base */
  --spacing: 0.25rem;

  /* === BORDER RADIUS === */
  --radius-xs: 0.125rem;
  --radius-sm: calc(var(--radius) - 0.25rem);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 0.25rem);
  --radius-xl: calc(var(--radius) + 0.5rem);
  --radius-full: 9999px;

  /* === SHADOWS === */
  --shadow-xs: 0 1px 2px oklch(0 0 0 / 0.2);
  --shadow-sm: 0 1px 3px oklch(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px oklch(0 0 0 / 0.35);
  --shadow-lg: 0 10px 15px oklch(0 0 0 / 0.4);
}

/* ============================================
   LEGACY ALIASES (Migration Compatibility)

   These allow existing code using var(--bg) etc.
   to continue working during migration.
   Remove in Phase 9 after full migration.
   ============================================ */

:root {
  --bg: var(--background);
  --bg-secondary: var(--background-secondary);
  --fg: var(--foreground);
  /* --muted already matches */
  /* --border already matches */
  /* --accent already matches */
  /* --accent-dim already matches */
  /* --danger already matches */
  /* --warning already matches */
  /* --success already matches */

  /* Spacing scale (legacy) */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-7: 2rem;
  --spacing-8: 2.5rem;

  /* Radius aliases */
  --radius-sm: 0.25rem;
  --radius-lg: 0.75rem;
}

/* ============================================
   APP-SPECIFIC VARIABLES

   Layout/structural values that don't need
   Tailwind utility generation.
   ============================================ */

:root {
  --app-container-max: 1200px;
  --app-header-height: 60px;
  --app-sidebar-width: 200px;
}

/* ============================================
   BASE STYLES
   ============================================ */

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-bg text-fg;
    font-family: var(--font-sans);
    line-height: 1.6;
  }
}
```

### 2.2 Create Animations Stylesheet

**File:** `apps/web/src/styles/animations.css`

```css
/* ============================================
   KEYFRAME ANIMATIONS

   Migrated from globals.css. These are referenced
   by component classes during the migration period.
   ============================================ */

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Animation utility classes */
.animate-spin {
  animation: spin 0.6s linear infinite;
}

.animate-shimmer {
  animation: shimmer 1.5s infinite;
}

.animate-slide-in {
  animation: slideIn 0.2s ease;
}

.animate-slide-in-right {
  animation: slideInRight 0.2s ease;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}
```

### 2.3 Update CSS Entry Point

**File:** `apps/web/src/app/app.css`

```css
/* Theme tokens (includes @import "tailwindcss") */
@import "../styles/theme.css";

/* Animations */
@import "../styles/animations.css";

/* Preset theme overrides */
@import "../styles/presets.css";

/* Keep existing globals.css during migration */
@import "./globals.css";
```

### 2.4 Token Mapping Reference

**Current → Tailwind utility mapping:**

| Current CSS | Tailwind Utility | Generated From |
|-------------|------------------|----------------|
| `background: var(--bg)` | `bg-bg` | `--color-bg` |
| `background: var(--bg-secondary)` | `bg-bg-secondary` | `--color-bg-secondary` |
| `color: var(--fg)` | `text-fg` | `--color-fg` |
| `color: var(--muted)` | `text-muted` | `--color-muted` |
| `border-color: var(--border)` | `border-border` | `--color-border` |
| `background: var(--accent)` | `bg-accent` | `--color-accent` |
| `color: var(--accent)` | `text-accent` | `--color-accent` |
| `background: var(--danger)` | `bg-danger` | `--color-danger` |
| `border-radius: var(--radius)` | `rounded-md` | `--radius-md` |
| `border-radius: var(--radius-sm)` | `rounded-sm` | `--radius-sm` |
| `border-radius: var(--radius-lg)` | `rounded-lg` | `--radius-lg` |

**Spacing utilities (derived from `--spacing: 0.25rem`):**

| Utility | Computed Value |
|---------|----------------|
| `p-1` | 0.25rem |
| `p-2` | 0.5rem |
| `p-3` | 0.75rem |
| `p-4` | 1rem |
| `p-6` | 1.5rem |
| `p-8` | 2rem |

### 2.5 Create Presets File (Placeholder)

**File:** `apps/web/src/styles/presets.css`

```css
/* ============================================
   THEME PRESETS

   Override base variables for different themes.
   Applied via data-theme attribute on <html>.

   Using OKLCH for consistent perceptual adjustments.
   ============================================ */

/* Default theme - no overrides needed */
:root[data-theme="default"],
.theme-scope[data-theme="default"] {
  /* Uses base :root values */
}

/* Cyberpunk - neon cyan on deep blue */
:root[data-theme="cyberpunk"],
.theme-scope[data-theme="cyberpunk"] {
  --background: oklch(0.05 0.02 250);
  --background-secondary: oklch(0.08 0.03 250);
  --foreground: oklch(0.92 0.03 200);
  --muted: oklch(0.55 0.05 200);
  --border: oklch(0.2 0.04 250);
  --accent: oklch(0.85 0.2 180);
  --accent-dim: oklch(0.7 0.18 180);
  --accent-foreground: oklch(0.05 0 0);
  --radius: 4px;
}

/* Warm - orange on warm brown */
:root[data-theme="warm"],
.theme-scope[data-theme="warm"] {
  --background: oklch(0.12 0.02 60);
  --background-secondary: oklch(0.16 0.02 60);
  --foreground: oklch(0.95 0.01 80);
  --muted: oklch(0.6 0.03 70);
  --border: oklch(0.28 0.03 60);
  --accent: oklch(0.75 0.18 55);
  --accent-dim: oklch(0.65 0.16 55);
  --accent-foreground: oklch(0.12 0 0);
}

/* Light - high contrast light mode */
:root[data-theme="light"],
.theme-scope[data-theme="light"] {
  --background: oklch(1 0 0);
  --background-secondary: oklch(0.97 0 0);
  --foreground: oklch(0.15 0 0);
  --muted: oklch(0.45 0 0);
  --border: oklch(0.88 0 0);
  --accent: oklch(0.55 0.2 155);
  --accent-dim: oklch(0.45 0.18 155);
  --accent-foreground: oklch(1 0 0);
  --danger: oklch(0.55 0.22 25);
  --warning: oklch(0.7 0.15 70);
}

/* Midnight - elegant purple */
:root[data-theme="midnight"],
.theme-scope[data-theme="midnight"] {
  --background: oklch(0.08 0.01 280);
  --background-secondary: oklch(0.12 0.015 280);
  --foreground: oklch(0.92 0.01 280);
  --muted: oklch(0.55 0.02 280);
  --border: oklch(0.22 0.02 280);
  --accent: oklch(0.7 0.15 290);
  --accent-dim: oklch(0.6 0.18 290);
  --accent-foreground: oklch(0.08 0 0);
}

/* Forest - natural green */
:root[data-theme="forest"],
.theme-scope[data-theme="forest"] {
  --background: oklch(0.1 0.02 140);
  --background-secondary: oklch(0.14 0.025 140);
  --foreground: oklch(0.92 0.02 140);
  --muted: oklch(0.55 0.04 140);
  --border: oklch(0.24 0.03 140);
  --accent: oklch(0.75 0.18 145);
  --accent-dim: oklch(0.6 0.16 145);
  --accent-foreground: oklch(0.1 0 0);
}
```

## Verification Checklist

- [ ] Build succeeds with no CSS errors
- [ ] Semantic utilities are generated:
  ```tsx
  <div className="bg-bg text-fg border border-border rounded-md p-4">
    Test semantic tokens
  </div>
  ```
- [ ] Default colors match current design (compare visually)
- [ ] Legacy aliases work: `var(--bg)` still resolves correctly
- [ ] Spacing utilities align with expected values
- [ ] Test theme switching:
  ```js
  document.documentElement.dataset.theme = "cyberpunk";
  // Colors should change immediately
  ```
- [ ] Animations work: `.animate-spin`, `.animate-shimmer`

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/styles/theme.css` | Create new |
| `apps/web/src/styles/animations.css` | Create new |
| `apps/web/src/styles/presets.css` | Create new |
| `apps/web/src/app/app.css` | Modify imports |

## Notes

### Why OKLCH?

OKLCH (Oklab Lightness, Chroma, Hue) provides:
- **Perceptual uniformity**: Equal steps look equally different
- **Better gradients**: No muddy colors when interpolating
- **Easier adjustments**: Change L for brightness, C for saturation, H for hue

Conversion from hex:
- `#0a0a0a` → `oklch(0.07 0 0)` (dark gray, no chroma)
- `#00ff88` → `oklch(0.85 0.2 155)` (bright green)

### Why Two-Layer Variables?

Without the two-layer pattern:
```css
@theme {
  --color-bg: #0a0a0a;  /* Literal value baked into CSS */
}
```
Tailwind compiles `bg-bg` to `background-color: #0a0a0a`. Theme presets can't change it.

With the two-layer pattern:
```css
:root { --background: oklch(0.07 0 0); }
@theme inline { --color-bg: var(--background); }
```
Tailwind compiles `bg-bg` to `background-color: var(--color-bg)`, which references `var(--background)`. Theme presets override `--background`, and everything updates.

### Color Token Naming

| Token | Purpose |
|-------|---------|
| `bg` | Primary background (page, app shell) |
| `bg-secondary` | Elevated surfaces (cards, inputs, modals) |
| `fg` | Primary text color |
| `muted` | Secondary/helper text |
| `border` | All borders, dividers, separators |
| `accent` | Brand color, interactive elements |
| `accent-dim` | Hover state for accent |
| `accent-foreground` | Text on accent background |

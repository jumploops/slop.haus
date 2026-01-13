# URL Input Spacing Issue

## Problem

Elements on `/submit` page (URL input, button, hints) are bunched together with no spacing despite CSS rules using `gap` and spacing variables.

## Investigation

### 1. CSS Structure Check

The `.url-input-form` has these styles applied:

```css
.url-input-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-6);
  /* ... */
}
```

The `gap` property should create spacing between flex children.

### 2. Root Cause Found: Undefined CSS Variables

Searched for `--spacing` variable definitions in `:root`:

```css
:root {
  --bg: #0a0a0a;
  --bg-secondary: #111;
  --fg: #ededed;
  --muted: #888;
  --border: #333;
  --accent: #00ff88;
  --accent-dim: #00cc6a;
  --danger: #ff4444;
  --warning: #ffaa00;
  --success: #00ff88;
}
```

**The spacing variables (`--spacing-1` through `--spacing-8`) are never defined!**

This means all CSS using `var(--spacing-6)` resolves to an empty/invalid value, effectively becoming `0` or being ignored.

### 3. Other Missing Variables

Also found these undefined variables being used:
- `--radius` - used for border-radius
- `--background` - used in inputs (should be `--bg`)
- `--foreground` - used in inputs (should be `--fg`)

### 4. Scope of Issue

Grep for `--spacing` usage shows **50+ occurrences** across the URL-first onboarding styles. All of these are currently broken.

## Solution

Add missing CSS variables to `:root`:

```css
:root {
  /* Existing colors... */

  /* Spacing scale */
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-7: 2rem;     /* 32px */
  --spacing-8: 2.5rem;   /* 40px */

  /* Border radius */
  --radius: 0.5rem;      /* 8px */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-lg: 0.75rem;  /* 12px */

  /* Aliases for consistency */
  --background: var(--bg);
  --foreground: var(--fg);
}
```

## Files to Update

- `apps/web/src/app/globals.css` - Add missing variables to `:root`

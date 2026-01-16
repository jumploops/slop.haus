# Phase 1: Tailwind v4 Installation

**Status:** Not Started

## Overview

Install Tailwind CSS v4 with PostCSS integration into the Next.js web app. This phase establishes the build pipeline and updates the `cn()` utility for proper Tailwind class merging.

## Prerequisites

- Node.js 20+ (already satisfied)
- pnpm workspace setup (already satisfied)

## Tasks

### 1.1 Install Dependencies

```bash
pnpm -F @slop/web add tailwindcss @tailwindcss/postcss postcss tailwind-merge clsx class-variance-authority next-themes
```

**Dependencies:**
| Package | Version | Purpose |
|---------|---------|---------|
| `tailwindcss` | ^4.x | Core Tailwind CSS |
| `@tailwindcss/postcss` | ^4.x | PostCSS plugin (v4 specific) |
| `postcss` | ^8.x | PostCSS processor |
| `tailwind-merge` | ^3.x | Resolves Tailwind class conflicts |
| `clsx` | ^2.x | Conditional class joining |
| `class-variance-authority` | ^0.7.x | Component variant management |
| `next-themes` | ^0.4.x | Theme switching with SSR support |

### 1.2 Create PostCSS Config

**File:** `apps/web/postcss.config.mjs`

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Notes:**
- v4 uses `@tailwindcss/postcss`, NOT the `tailwindcss` package as plugin
- No `tailwind.config.js` needed - v4 uses CSS-first configuration
- No `autoprefixer` needed - Tailwind v4 handles this internally

### 1.3 Create Tailwind Entry File

**File:** `apps/web/src/app/app.css`

```css
@import "tailwindcss";

/*
 * Keep existing globals.css imported during migration.
 * This will be removed in Phase 9 after all components are migrated.
 */
@import "./globals.css";
```

**Notes:**
- `@import "tailwindcss"` replaces the v3 `@tailwind base/components/utilities` directives
- Order matters: Tailwind first, then globals.css (so existing styles can override if needed)

### 1.4 Update Layout Import

**File:** `apps/web/src/app/layout.tsx`

```diff
 import type { Metadata } from "next";
 import { Providers } from "./providers";
 import { Header } from "@/components/layout/Header";
-import "./globals.css";
+import "./app.css";
```

### 1.5 Update cn() Utility

**Critical:** The current `cn()` function doesn't handle Tailwind class conflicts. Update it immediately.

**File:** `apps/web/src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind-aware merging.
 * Later classes override earlier conflicting classes.
 *
 * @example
 * cn("p-2 bg-red-500", "p-4") // → "bg-red-500 p-4"
 * cn("text-fg", condition && "text-accent") // → conditional class
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Keep existing utility functions unchanged
export function formatRelativeTime(date: Date | string): string {
  // ... existing implementation
}
```

**Why this matters:** Without `tailwind-merge`, conflicting classes like `p-2 p-4` both apply, causing unpredictable results. `tailwind-merge` intelligently resolves conflicts.

### 1.6 Verify Content Detection

Tailwind v4 auto-detects content sources. For monorepos, we may need to explicitly add sources.

**If needed, add to `app.css`:**
```css
@import "tailwindcss";

/* Ensure Tailwind scans all component files */
@source "../components";
@source "../lib";

@import "./globals.css";
```

## Verification Checklist

- [ ] `pnpm -F @slop/web dev` starts without errors
- [ ] No console warnings about Tailwind/PostCSS
- [ ] Existing styles render correctly (no visual changes)
- [ ] Tailwind utilities work - test with:
  ```tsx
  // Temporarily add to any component
  <div className="hidden">Tailwind test</div>
  <div className="text-red-500">Should be red (if not using semantic tokens)</div>
  ```
- [ ] Build succeeds: `pnpm -F @slop/web build`
- [ ] `cn()` correctly merges classes:
  ```ts
  cn("p-2", "p-4") // → "p-4" (not "p-2 p-4")
  cn("text-red-500", "text-blue-500") // → "text-blue-500"
  ```

## Potential Issues

### Issue: PostCSS not processing CSS files

**Symptom:** Tailwind classes don't apply

**Solution:** Ensure Next.js picks up the PostCSS config. Next.js should auto-detect `postcss.config.mjs` in the app root.

### Issue: Content not detected

**Symptom:** Tailwind classes exist but don't appear in output CSS

**Solution:** Add explicit `@source` directives to `app.css`

### Issue: Import order causing style conflicts

**Symptom:** Existing styles overridden unexpectedly

**Solution:** Ensure `globals.css` is imported AFTER `tailwindcss` so existing styles have higher specificity

## Files Changed

| File | Action |
|------|--------|
| `apps/web/package.json` | Add dependencies |
| `apps/web/postcss.config.mjs` | Create new |
| `apps/web/src/app/app.css` | Create new |
| `apps/web/src/app/layout.tsx` | Modify import |
| `apps/web/src/lib/utils.ts` | Update cn() function |

## Rollback Plan

If issues arise:
1. Revert `layout.tsx` to import `globals.css` directly
2. Delete `postcss.config.mjs` and `app.css`
3. Remove Tailwind dependencies from `package.json`
4. Run `pnpm install` to clean lockfile

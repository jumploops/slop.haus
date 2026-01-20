# Debug: Theme Gallery Build Error

**Date:** 2026-01-18
**Status:** RESOLVED

## Problem Statement

Build fails during static generation with:

```
Error occurred prerendering page "/theme-gallery"
TypeError: e.PRESET_THEMES.map is not a function
    at g (.next/server/app/theme-gallery/page.js:2:9327)
```

## Environment

- Next.js: 15.5.9
- React: 19.0.0
- Build command: `pnpm -F @slop/web build`

## Investigation Findings

### 1. Code Structure Analysis

**theme-gallery/page.tsx (Server Component):**
```tsx
import { PRESET_THEMES } from "@/hooks/useTheme";  // ← Problem: importing from client module
import { ThemePreview } from "@/components/theme/ThemePreview";

export default function ThemeGalleryPage() {
  return (
    <div className="py-8">
      {/* ... */}
      {PRESET_THEMES.map((theme) => (   // ← TypeError here
        <div key={theme.id}>
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

**hooks/useTheme.ts (Client Component):**
```tsx
"use client";  // ← This is a client module

export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "The classic slop.haus look" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
  // ...
] as const;

// ...
```

### 2. Root Cause: Server/Client Module Boundary

The issue is a **Next.js App Router server/client boundary problem**:

1. `theme-gallery/page.tsx` is a **Server Component** (no "use client" directive)
2. It imports `PRESET_THEMES` from `@/hooks/useTheme`
3. `useTheme.ts` is marked with `"use client"`

**What happens during build:**

When Next.js prerenders the page for static generation:
- Server Components can only import **React components** from client modules (they get wrapped in a client boundary)
- **Non-component exports** (like constants, types, utility functions) from client modules are NOT properly accessible in Server Components
- The `PRESET_THEMES` constant doesn't cross the client boundary correctly
- During SSG, the import resolves to something that isn't an array, hence `.map is not a function`

### 3. Why It Works in Dev But Fails in Build

- **Dev mode**: Uses dynamic rendering with HMR, may not hit this edge case
- **Build mode**: Static generation attempts to run the page as a Server Component, hitting the boundary issue

### 4. Related Files

| File | Type | Issue |
|------|------|-------|
| `apps/web/src/app/theme-gallery/page.tsx` | Server Component | Imports from client module |
| `apps/web/src/hooks/useTheme.ts` | Client Module | Exports `PRESET_THEMES` constant |
| `apps/web/src/components/theme/ThemeProvider.tsx` | Client Component | Also imports `PRESET_THEMES` |

## Hypotheses

### Hypothesis 1: Extract Constants to Shared Module (HIGH CONFIDENCE)

**Issue:** Constants defined in client modules can't be used in Server Components during SSG.

**Solution:** Extract `PRESET_THEMES` to a separate file WITHOUT "use client":

```typescript
// lib/theme-constants.ts (NO "use client")
export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "..." },
  // ...
] as const;

export type PresetThemeId = (typeof PRESET_THEMES)[number]["id"];
```

Then update both `useTheme.ts` and `theme-gallery/page.tsx` to import from there.

### Hypothesis 2: Make Theme Gallery a Client Component (MEDIUM CONFIDENCE)

**Issue:** The page is a Server Component trying to use client data.

**Solution:** Add "use client" to `theme-gallery/page.tsx`.

**Downside:** Loses SSG benefits (though for a gallery page, this may be acceptable).

### Hypothesis 3: Use Dynamic Import/Rendering (LOW PRIORITY)

**Issue:** SSG can't handle the client import.

**Solution:** Use `dynamic(() => import(...), { ssr: false })` or `export const dynamic = 'force-dynamic'`.

**Downside:** More complex, doesn't fix the underlying architecture issue.

## Recommended Solution

**Hypothesis 1 is the cleanest fix:**

1. Create `apps/web/src/lib/theme-constants.ts`:
   ```typescript
   export const PRESET_THEMES = [
     { id: "default", name: "Default", description: "The classic slop.haus look" },
     { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
     { id: "warm", name: "Warm", description: "Cozy orange tones" },
     { id: "light", name: "Light", description: "Clean light mode" },
     { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
     { id: "forest", name: "Forest", description: "Natural green tones" },
   ] as const;

   export type PresetTheme = (typeof PRESET_THEMES)[number];
   export type PresetThemeId = PresetTheme["id"];
   ```

2. Update `hooks/useTheme.ts`:
   ```typescript
   "use client";

   import { PRESET_THEMES, type PresetThemeId } from "@/lib/theme-constants";
   export { PRESET_THEMES, type PresetThemeId };
   // ... rest of hook
   ```

3. Update `theme-gallery/page.tsx`:
   ```typescript
   import { PRESET_THEMES } from "@/lib/theme-constants";
   // ... rest of page
   ```

4. Update `ThemeProvider.tsx`:
   ```typescript
   import { PRESET_THEMES } from "@/lib/theme-constants";
   // ... rest of provider
   ```

## Resolution

**Applied Hypothesis 1** - Extracted constants to shared module.

### Changes Made

1. **Created `apps/web/src/lib/theme-constants.ts`** (new file, no "use client"):
   ```typescript
   export const PRESET_THEMES = [
     { id: "default", name: "Default", description: "The classic slop.haus look" },
     { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
     { id: "warm", name: "Warm", description: "Cozy orange tones" },
     { id: "light", name: "Light", description: "Clean light mode" },
     { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
     { id: "forest", name: "Forest", description: "Natural green tones" },
   ] as const;

   export type PresetTheme = (typeof PRESET_THEMES)[number];
   export type PresetThemeId = PresetTheme["id"];
   ```

2. **Updated `apps/web/src/hooks/useTheme.ts`**:
   - Changed to import from `@/lib/theme-constants`
   - Re-exports for backwards compatibility

3. **Updated `apps/web/src/app/theme-gallery/page.tsx`**:
   - Changed import to `@/lib/theme-constants`

4. **Updated `apps/web/src/components/theme/ThemeProvider.tsx`**:
   - Changed import to `@/lib/theme-constants`

### Verification

- ✅ Build passes: `pnpm -F @slop/web build`
- ✅ `/theme-gallery` generates as static content
- ✅ No TypeScript errors

## References

- [Next.js Client/Server Component Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Next.js Prerender Error](https://nextjs.org/docs/messages/prerender-error)
- Related: This is similar to issues where utilities/constants are placed in component files instead of being extracted

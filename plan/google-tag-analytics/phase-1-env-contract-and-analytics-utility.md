# Phase 1: Env Contract + Analytics Utility

**Status:** Completed (2026-02-25)  
**Owner:** Web  
**Depends On:** None

## Implementation Notes

- Added `NEXT_PUBLIC_GA_MEASUREMENT_ID` to env example contract.
- Documented GA measurement ID in root README environment variables section.
- Added `apps/web/src/lib/analytics/gtag.ts` with:
  - single source of truth `GA_MEASUREMENT_ID`
  - type-safe `window.gtag` declaration
  - safe no-op `pageview()`/`event()` wrappers when GA is disabled or unavailable

## Goal

Define the GA4 configuration contract and add a reusable analytics helper that is safe when analytics is disabled.

## Files To Change

- `/Users/adam/code/slop.haus/.env.example`
- `/Users/adam/code/slop.haus/README.md`
- `/Users/adam/code/slop.haus/apps/web/src/lib/analytics/gtag.ts` (new)

## Tasks

1. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID=` to `.env.example`.
2. Document the new env var in root `README.md` environment section.
3. Create `gtag.ts` helper module that:
   - exposes `GA_MEASUREMENT_ID`
   - no-ops when measurement ID is unset
   - includes typed wrappers for `pageview(path)` and `event(action, params)`
4. Add narrow `window.gtag` typing in helper module scope so web components can call helpers without `any`.

## Code Snippets (Conceptual)

```ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export function pageview(url: string): void {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
}
```

## Verification Checklist

- [x] `.env.example` includes `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
- [x] README env section documents expected value format (e.g. `G-XXXXXXXXXX`).
- [x] `gtag.ts` compiles and no-ops safely when env var is empty.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Web code has a single source of truth for GA measurement ID and event dispatch helper APIs.

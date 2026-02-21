# Phase 3: Counter Read API + UI Wiring

**Status:** Draft  
**Owner:** API + Web  
**Depends On:** Phase 2

## Goal

Expose visitor count via a cacheable API endpoint and wire the existing retro counter component to real data.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/visitorCount.ts` (new)
- `/Users/adam/code/slop.haus/apps/api/src/index.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/visitor-count.ts` (new)
- `/Users/adam/code/slop.haus/apps/web/src/components/layout/VisitorCounter.tsx`

## Tasks

1. Add `GET /api/v1/visitor-count` route that reads `site_counters` key `unique_visitors`.
2. Add caching headers (`Cache-Control`) to reduce origin DB read volume.
3. Register route in API server index.
4. Replace localStorage logic in `VisitorCounter` with API-backed fetch.
5. Keep existing visual style (`compact` mode + retro digit boxes).
6. Define fallback behavior when request fails (for example display cached value or `000001` baseline).

## Key Design Notes

- Endpoint should remain public and cheap.
- UI data fetch should avoid writes and should not depend on authenticated state.

## Code Snippets

```ts
// apps/api/src/routes/visitorCount.ts (conceptual)
c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");
return c.json({ value: counterValue });
```

```ts
// apps/web/src/lib/api/visitor-count.ts (conceptual)
export async function fetchVisitorCount(): Promise<number> { ... }
```

## Verification Checklist

- [ ] Endpoint returns numeric counter value.
- [ ] Response includes expected cache headers.
- [ ] Footer counter renders DB-backed value and preserves current visual design.
- [ ] Initial rendered value path reflects baseline of `1` if backend value is unavailable.
- [ ] No localStorage read/write remains in `VisitorCounter`.
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Visitor counter UI is fully server-backed.
- Counter reads are cacheable and operationally cheap.

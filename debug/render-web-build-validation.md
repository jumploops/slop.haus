# Render Web Build Validation

**Date:** 2026-02-07  
**Status:** Ready for redeploy

## Problem
Render `slop-web` fails TypeScript checks during `next build`.

Current error:
- `src/app/page.tsx`
- `getFeedKey` typed as `SWRInfiniteKeyLoader<FeedResponse, FeedKey>`
- function returns `FeedKey | null`
- TS complains because `null` is not assignable to `FeedKey` under that annotation.

## Goal
Make the `@slop/web` production build pass locally using the same command pattern as Render, then redeploy.

## Steps
1. Reproduce with local build command aligned to Render.
2. Inspect SWR infinite typing and correct `getFeedKey` typing.
3. Re-run `@slop/web` build.
4. If additional type/build errors appear, fix iteratively.
5. Record final fix and verification output.

## Findings
1. Original SWR typing fix was incomplete:
   - `getFeedKey` was annotated as `SWRInfiniteKeyLoader<FeedResponse, FeedKey>`.
   - But the implementation returns `null` when pagination is exhausted.
   - Render TS error correctly reported that `null` is not assignable to `FeedKey`.

2. Corrected key loader typing:
   - `SWRInfiniteKeyLoader<FeedResponse, FeedKey | null>`
   - This matches SWR infinite pagination behavior and preserves typed fetcher tuple args.

3. Local full `next build` cannot be completed in this sandbox due blocked external font fetches (`fonts.googleapis.com`), but targeted TypeScript verification shows no `src/app/page.tsx` errors after the fix.

4. Next Render failure after redeploy:
   - `src/app/page.tsx:175` (`SlopGoo targetRef={introRef}`)
   - Error: `RefObject<HTMLDivElement | null>` not assignable to `RefObject<HTMLElement>`.
   - Root cause: `SlopGooProps.targetRef` was too strict; real React refs are nullable.

5. Updated component prop typing:
   - `apps/web/src/components/slop/SlopGoo.tsx`
   - Changed `targetRef` type to `RefObject<HTMLElement | null>`.
   - This aligns with `useRef(...null)` call sites.

6. Local build then failed on media query listener fallback typing:
   - `apps/web/src/components/slop/SlopGoo.tsx:35`
   - Error: `Property 'addListener' does not exist on type 'never'`.
   - Cause: with current DOM typings, fallback branch became unreachable/invalid.
   - Fix: use only `addEventListener/removeEventListener` for `MediaQueryList`.

7. Additional JSX parse/type errors surfaced in `DraftReview.tsx`:
   - Multiple parse errors around lines ~175 and ~203.
   - Cause: two extra stray closing `</div>` tags.
   - Fix: removed the extra closing tags.

## Resolution
- Updated `apps/web/src/app/page.tsx`:
  - `getFeedKey` now allows `null` in the SWR key loader generic.
- Updated `apps/web/src/components/slop/SlopGoo.tsx`:
  - `targetRef` now accepts nullable ref objects.
  - `usePrefersReducedMotion` now uses `addEventListener/removeEventListener` only.
- Updated `apps/web/src/components/submit/DraftReview.tsx`:
  - Removed two stray closing `</div>` tags causing JSX parse failures.
- Validation performed:
  - `pnpm -F @slop/web exec tsc --noEmit | grep \"src/app/page.tsx\"` returns no matches.
  - `pnpm -F @slop/web exec tsc --noEmit | grep \"targetRef\\|src/app/page.tsx:175\\|SlopGoo\"` returns no matches.
  - `pnpm -F @slop/web exec tsc --noEmit` passes with exit code 0.

## Redeploy Steps
1. Commit and push the web fixes.
2. Trigger `slop-web` redeploy in Render.
3. If build fails again, copy the new error block and continue from that exact line.

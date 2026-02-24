# Phase 4: Verification + Polish

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** API + Web  
**Depends On:** Phase 3

## Implementation Notes

- Verified API and web package typechecks pass after integration.
- Confirmed no DB schema or migration changes were introduced.
- Kept route-level submit auth policy unchanged (`requireGitHub` still enforced).
- Repo picker appears only on `/submit` and `/submit/manual`.

## Goal

Validate correctness of repo-fetching and submit UX integration, then close edge cases before final implementation sign-off.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/auth.ts` (if edge-case handling adjustments are needed)
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/GitHubRepoPicker.tsx` (UX polish)
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/page.tsx` (integration polish)
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx` (integration polish)

## Tasks

1. Run typechecks for affected packages.
2. Execute manual QA matrix across auth/linkage/repo-volume scenarios.
3. Tighten error copy and non-blocking fallback behavior.
4. Confirm no unnecessary complexity was introduced (no caching, no DB writes).
5. Update plan statuses to complete once checks pass.

## QA Matrix

1. GitHub linked + has repos:
   - picker loads quickly
   - selecting repo fills URL
   - manual edit still allowed
2. GitHub linked + zero public repos:
   - empty state shown
   - manual URL path still works
3. GitHub linked + many repos (pagination path):
   - full list is available
   - search/filter remains usable
4. Not GitHub linked:
   - existing gate UI appears
   - updated callout copy appears
5. GitHub API error/transient failure:
   - picker error shown
   - submit flow remains recoverable (manual path for linked users)

## Verification Checklist

- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] `pnpm -F @slop/web exec tsc --noEmit`
- [x] No DB schema/migration files changed.
- [x] No route-level auth policy change from current behavior.
- [x] Repo picker appears only on `/submit` and `/submit/manual`.
- [x] All phase docs updated to completed status at handoff.

## Exit Criteria

- Implementation is functionally complete against product decisions.
- Edge-case behavior is acceptable for non-live pre-launch environment.

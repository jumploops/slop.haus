# Phase 5: Verification + Polish

## Status

**Status:** 🔄 In Progress (2026-03-02)  
**Owner:** API + Web + DB  
**Depends On:** Phase 2, Phase 3, Phase 4

## Goal

Run typechecks and targeted manual QA to validate featured behavior, ranking semantics, admin permissions, and audit logging before merge.

## Files To Change

- `/Users/adam/code/slop.haus/plan/featured-hot-section/*.md` (status updates and final notes)
- Optional small fixes in touched implementation files from phases 2-4 if issues are found.

## Tasks

1. Run package-level typechecks for touched workspaces.
2. Execute manual QA matrix covering API + web + auth edge cases.
3. Confirm migration metadata correctness and schema behavior in local DB.
4. Validate no regressions in `new` and `top` feeds.
5. Finalize plan statuses from Planned -> Completed as work lands.

## QA Matrix

1. Hot feed page 1 with >= 1 featured project:
   - featured section visible
   - max 3 shown
   - star badges visible
   - no duplicates in standard list
   - first non-featured rank is `1`
2. Hot feed page > 1:
   - no featured section
   - non-featured ranks continue monotonically
3. New/Top feed:
   - no featured section
   - standard sorting behavior unchanged
4. Filter/window behavior:
   - featured rows are omitted when they fail active filter criteria
5. Project detail page:
   - admin sees feature toggle
   - non-admin users do not
6. Permissions:
   - non-admin feature/unfeature API calls return `403`
7. Audit:
   - moderation events written for feature and unfeature actions
8. Status transition safety:
   - hidden/removed projects are not effectively featured
   - hide/remove flows clear featured metadata

## Verification Checklist

- [ ] `pnpm -F @slop/db exec tsc --noEmit` (currently fails due pre-existing seed typing issues unrelated to this feature)
- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] `pnpm -F @slop/web exec tsc --noEmit`
- [ ] Migration files and Drizzle metadata are committed and consistent.
- [ ] Manual QA matrix completed with no P0/P1 regressions.
- [ ] Plan docs updated with completion statuses and date.

## Exit Criteria

- Feature behavior is correct and stable across feed modes, roles, and pagination.
- Auditability and permission requirements are met.
- Implementation is ready for merge.

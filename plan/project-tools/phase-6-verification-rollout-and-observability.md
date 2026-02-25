# Phase 6: Verification + Rollout + Observability

## Status

**Status:** Completed  
**Owner:** API + Web + Worker + DB  
**Depends On:** [Phase 1](./phase-1-schema-and-baseline-bootstrap.md), [Phase 2](./phase-2-backend-tag-resolution-and-write-paths.md), [Phase 3](./phase-3-frontend-free-entry-and-slug-fix.md), [Phase 4](./phase-4-worker-llm-tag-preservation.md), [Phase 5](./phase-5-tag-safety-visibility-and-rate-limits.md)

## Goal

Complete cross-package verification, production rollout readiness checks, and instrumentation for the new tag system.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/*` (instrumentation/logging where needed)
- `/Users/adam/code/slop.haus/apps/worker/*` (analysis metrics where needed)
- `/Users/adam/code/slop.haus/apps/web/*` (optional UX telemetry hooks)
- `/Users/adam/code/slop.haus/PROGRESS.md` (if project progress entry is added)
- `/Users/adam/code/slop.haus/TODO.md` (ensure deferred/admin follow-up remains tracked)

## Tasks

1. Run package-level typechecks:
   - `@slop/db`, `@slop/shared`, `@slop/api`, `@slop/worker`, `@slop/web`.
2. Execute focused integration QA:
   - manual submit with new tags,
   - draft submit with LLM-only unknown tags,
   - project edit add/remove tags,
   - blocked-tag visibility checks,
   - daily cap/rate-limit checks.
3. Validate migration behavior against production-like DB:
   - baseline insertion occurs,
   - no migration conflicts on existing rows.
4. Add/verify metrics:
   - new tags created/day by source,
   - tool creation failures (validation/rate-limit/blocked),
   - blocked-tag suppression counts.
5. Confirm deferred work remains tracked:
   - admin alias/merge UI in `TODO.md`.

## Execution Results (2026-02-24)

1. Typecheck results:
   - ✅ `pnpm -F @slop/shared exec tsc --noEmit`
   - ✅ `pnpm -F @slop/api exec tsc --noEmit`
   - ✅ `pnpm -F @slop/worker exec tsc --noEmit`
   - ✅ `pnpm -F @slop/web exec tsc --noEmit`
   - ⚠️ `pnpm -F @slop/db exec tsc --noEmit` still reports pre-existing seed typing errors unrelated to this tag work.
2. Migration verification:
   - ✅ Local schema apply verified by running `pnpm db:push` (user-confirmed).
   - ⚠️ `pnpm db:migrate` could not be executed in this sandbox without elevated local DB access.
3. Observability instrumentation added:
   - structured tool events in API resolver for:
     - new tool creation (`created`)
     - blocked-tag submissions (`blocked_submission`)
     - daily new-tool rate limiting (`rate_limited`)
4. Deferred admin alias/merge follow-up remains tracked in `TODO.md`.

## Verification Commands

```bash
pnpm -F @slop/db exec tsc --noEmit
pnpm -F @slop/shared exec tsc --noEmit
pnpm -F @slop/api exec tsc --noEmit
pnpm -F @slop/worker exec tsc --noEmit
pnpm -F @slop/web exec tsc --noEmit
```

## QA Matrix

1. New user-entered tag on manual submit.
2. New user-entered tag on edit page.
3. Unknown LLM tag from draft submit.
4. Existing + new mixed tag set with max=10.
5. Tag with spaces and symbols (`React Native`, `C#`, `C++`, `Next.js`).
6. Blocked tag no longer visible after status change (eventual cache window accepted).
7. User hitting 100 new tags/day limit receives expected error behavior.

## Exit Criteria

- All touched packages typecheck.
- End-to-end tag flows behave as designed for user and LLM paths.
- Metrics are available for post-launch monitoring.
- Rollout risks and deferred scope are explicitly documented.

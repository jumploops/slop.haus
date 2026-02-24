# Project Tools (Tags) Implementation Plan

## Overview

Implement open, runtime-created project technology tags ("tools") so:

- production has a non-empty baseline catalog,
- users can create tags inline (type + Enter),
- LLM extraction can introduce new tags,
- blocked tags are hidden everywhere,
- existing API field naming (`tools`) remains unchanged.

**Design Doc:** `design/project-tags-open-taxonomy.md`

## Status: Completed

**Last Updated:** 2026-02-24  
**Owner:** API + Web + Worker + DB

## Locked Product Decisions

1. Unknown LLM tags auto-persist on submit.
2. New tags per submission: max `10` (same as project tag cap).
3. Allow spaces and characters `+`, `#`, `.`, `/` in user-entered tags.
4. Keep API field name `tools`.
5. Blocked tags are hidden everywhere.
6. Blocked-tag propagation may use eventual cache invalidation.
7. No historical remediation/backfill is required for existing production data.
8. Baseline catalog is generated from:
   - `packages/db/src/seed/tools.ts`
   - `/Users/adam/code/slop.haus/example_tools.csv`
9. Display casing is preserved; slug canonicalization is separate.
10. Daily per-user cap for newly created tags: `100` (configurable).
11. Admin alias/merge tooling is deferred and tracked in `TODO.md`.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Schema + Baseline Bootstrap](./phase-1-schema-and-baseline-bootstrap.md) | Completed | Added tool metadata and production migration-backed baseline catalog |
| 2 | [Backend Tag Resolution + Write Paths](./phase-2-backend-tag-resolution-and-write-paths.md) | Completed | Centralized resolve/upsert logic and integrated create/update/draft submit paths |
| 3 | [Frontend Free Entry + Slug Mismatch Fix](./phase-3-frontend-free-entry-and-slug-fix.md) | Completed | Enabled type+Enter UX and standardized tool payload behavior |
| 4 | [Worker LLM Tag Preservation](./phase-4-worker-llm-tag-preservation.md) | Completed | Preserved unknown LLM tools for submit-time persistence |
| 5 | [Tag Safety + Blocked Visibility + Limits](./phase-5-tag-safety-visibility-and-rate-limits.md) | Completed | Added denylist, blocked-tag enforcement, and daily new-tag limits |
| 6 | [Verification + Rollout + Observability](./phase-6-verification-rollout-and-observability.md) | Completed | Ran cross-package checks and added structured tool-event logging |

## Dependencies

```text
Phase 1 (Schema + baseline migration)
  -> Phase 2 (backend resolve/upsert and route integration)
    -> Phase 3 (frontend free-entry + payload consistency)
    -> Phase 4 (worker LLM preservation path)
      -> Phase 5 (safety, blocked filtering, limits)
        -> Phase 6 (verification, rollout, observability)
```

## Milestones

### Milestone 1: Data Foundation Ready
- Tool schema supports lifecycle metadata.
- Production migration seeds baseline catalog safely (`ON CONFLICT DO NOTHING`).

### Milestone 2: End-to-End Write Path Ready
- Project create/update/draft submit all use one resolve/upsert flow.
- New user/LLM tags persist and link reliably.

### Milestone 3: UX and Safety Ready
- Users can create tags by pressing Enter/Comma.
- Tag validation, new-tag caps, blocked visibility, and daily limits are enforced.

### Milestone 4: Production Readiness
- Typechecks/tests pass across touched packages.
- Observability is in place for new-tag creation and abuse/error paths.

## Non-Goals

- Admin alias/merge UI in this milestone (deferred).
- Renaming API contract from `tools` to `tags`.
- Backfilling historical dropped tags for prior production records.

## Exit Criteria

- Implementation phases have file-level scope and verification steps.
- Plan is executable without ambiguity.
- Design decisions from `design/project-tags-open-taxonomy.md` are fully reflected.

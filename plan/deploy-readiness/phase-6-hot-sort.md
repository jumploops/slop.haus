# Phase 6 — Hot Sort Persistence & DB Ordering

**Status:** completed
**Priority:** P1

## Problem
Hot sort is computed in-memory and capped; performance degrades as the dataset grows.

## Goals
- Compute hot score in the database.
- Support efficient pagination with stable ordering.

## Proposed Approach
- Add a `hotScore` column to `projects`.
- Update `hotScore` when likes/reviews change (trigger/job).
- Add an index on `hotScore` (and possibly `createdAt`).
- Update feed query to `ORDER BY hotScore DESC`.

## Files to Change
- `packages/db/src/schema/projects.ts`
- `apps/api/src/routes/projects.ts`
- (Optional) worker job to recompute hot scores periodically

## Verification Checklist
- [ ] Hot feed matches current scoring logic.
- [ ] Pagination works beyond 1000 items.
- [ ] Query plan uses the hotScore index.

## Rollout
- Migrate DB to add column + index.
- Backfill hot scores for existing projects.

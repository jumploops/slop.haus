# Phase 1 — Worker Job Claiming Correctness

**Status:** completed
**Priority:** P0

## Problem
`claimJob()` updates all pending jobs and only processes the first returned row, potentially leaving many jobs stuck in `processing` without execution.

## Goals
- Claim exactly one job at a time.
- Ensure safe concurrency with multiple worker instances.
- Preserve ordering by `runAt`.

## Proposed Approach
- Replace the update-only claim with a transactional claim using `SELECT ... FOR UPDATE SKIP LOCKED`.
- Use a CTE to select one eligible job (status = pending, runAt <= now) ordered by `runAt`, then update by id.
- Keep the interface the same (return claimed job or null).

## Files to Change
- `apps/worker/src/worker.ts`

## Implementation Notes
- Use `db.transaction` to ensure the select/update is atomic.
- Ensure only one row is updated per claim.
- Preserve `startedAt` and `status` fields.

## Verification Checklist
- [ ] Unit/integration test with multiple workers claiming from the same queue.
- [ ] No job is left in `processing` without being executed.
- [ ] Ordering by `runAt` is respected.

## Rollout
- Deploy worker with the new claim logic before scaling instances.

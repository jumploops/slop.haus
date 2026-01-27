# Phase 9 — Single-Instance Scheduled Cleanup

**Status:** planned
**Priority:** P1

## Problem
`handleCleanupDrafts()` runs on an interval inside every worker process, causing duplicate work when multiple instances are running.

## Goals
- Ensure scheduled cleanup runs once per interval across the fleet.

## Proposed Approach
- Move cleanup to a dedicated scheduled job (cron/queue).
- Alternatively, implement leader election (Redis lock) for the interval.

## Files to Change
- `apps/worker/src/index.ts`
- `apps/worker/src/handlers/cleanup-drafts.ts`

## Verification Checklist
- [ ] Only one cleanup run occurs per interval in multi-worker setups.
- [ ] Draft cleanup continues to run on schedule.

## Rollout
- Deploy worker changes and verify logs for single execution.

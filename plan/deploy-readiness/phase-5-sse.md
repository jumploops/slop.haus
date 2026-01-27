# Phase 5 — Draft SSE Scaling Improvements

**Status:** completed
**Priority:** P1

## Problem
SSE endpoint polls the DB every second per client for up to 2 minutes, which can create heavy DB load at scale.

## Goals
- Reduce DB polling overhead for draft status updates.
- Preserve current client behavior (EventSource updates).

## Proposed Approach (minimal)
- Increase poll interval (start at ~2s, backoff to 5s).
- Track `updatedAt` per connection and only send updates on change.
- Keep max SSE duration at 5 minutes.

## Proposed Approach (robust)
- Add a lightweight pub/sub mechanism (Redis channels) to push draft updates to SSE without polling.
- Worker publishes status changes when it updates drafts.

## Files to Change
- `apps/api/src/routes/drafts.ts`
- `apps/worker/src/handlers/*` (publish events on status changes)

## Verification Checklist
- [ ] SSE remains responsive for normal flows.
- [ ] DB query rate drops under concurrent SSE connections.

## Rollout
- Start with minimal changes; iterate to pub/sub if load warrants.

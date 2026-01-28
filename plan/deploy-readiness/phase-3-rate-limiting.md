# Phase 3 — Distributed Rate Limiting

**Status:** completed
**Priority:** P1

## Problem
Rate limiting is in-memory and per-process. In multi-instance deployments, limits reset on restart and are trivially bypassed.

## Goals
- Enforce global rate limits across API instances.
- Preserve existing limit semantics for likes, comment votes, and draft analysis.

## Proposed Approach (simple, Postgres-first)
- Add a `rate_limits` table keyed by `{scope_key, window_start}` with a counter.
- Use `INSERT ... ON CONFLICT ... DO UPDATE` to increment atomically.
- Derive `window_start` by flooring `now` to `windowMs` (fixed windows).
- Keep API response shape (including `retryAfter`), using window end for `retryAfter`.

## Proposed Approach (later scale-up)
- Replace table-backed counters with Redis (INCR + EXPIRE) if throughput grows.

## Files to Change
- `apps/api/src/lib/rateLimit.ts`
- `apps/api/src/routes/drafts.ts`
- `apps/api/src/routes/likes.ts`
- `apps/api/src/routes/comments.ts`

## Implementation Notes
- Create a small helper in API for `checkRateLimitDb(key, windowMs, maxRequests)`.
- `window_start` should be stored as a timestamp; `retryAfter` = `window_start + windowMs - now`.
- Add a cleanup job (daily) to delete rows older than 1–2 days.
- Ensure the rate limit keyspace is stable and collision-free.

## Verification Checklist
- [ ] Limits enforced across two API instances.
- [ ] Limits reset correctly after window.
- [ ] `retryAfter` is accurate.

## Rollout
- Add migration + API helper.
- Monitor DB write amplification; switch to Redis if needed.

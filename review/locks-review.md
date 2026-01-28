# Review: Lock Usage & Behavior

**Date:** 2026-01-28
**Scope:** Worker lock implementation and usage (`locks` table + acquireLock)

## Current Lock Implementations

### 1) Cleanup lock for draft cleanup (worker)
- **Where:**
  - `apps/worker/src/index.ts` uses `acquireLock("cleanup_drafts", ...)` for startup + hourly cleanup.
  - `apps/worker/src/lib/locks.ts` implements the lock acquisition.
  - `packages/db/src/schema/locks.ts` defines the table.
- **Behavior:**
  - Uses a DB row keyed by `key` with `expires_at`.
  - Acquisition attempts insert; on conflict, updates only if existing lock is expired.
  - No explicit release; lock expires by TTL.
  - Best‑effort cleanup of expired rows (1% chance).

## Potential Issues / Edge Cases

### A) Clock skew between workers
- Lock expiry is based on worker-local `now`.
- If instances have skewed clocks, an expired lock might not be reclaimed promptly or might be reclaimed early.
- Risk is low but non‑zero; depends on infrastructure clock sync (NTP).

### B) TTL shorter than job duration
- TTL is 55 minutes, cleanup interval is 60 minutes.
- If cleanup runs longer than TTL, another worker could acquire and run cleanup concurrently.
- Current cleanup is likely fast, but this is a potential edge case if DB is slow.

### C) Lock acquisition uses Date ISO strings
- We switched to ISO strings in SQL comparisons to avoid driver Date serialization errors.
- This works, but relies on Postgres implicit cast from text → timestamp. (Should be safe.)

### D) No explicit release / ownership validation
- Locks are not explicitly released. This is acceptable for time‑based locks.
- We do not check the current holder before running cleanup (acquisition guarantees holder).

### E) Best‑effort cleanup
- Old rows are cleaned only randomly (1% chance), so stale rows can linger.
- Functionally OK (primary key ensures 1 row per key), but storage may grow if many lock keys are added over time.

## Overall Assessment
- For a single lock key (`cleanup_drafts`), the current approach is safe and simple.
- The biggest practical risk is **clock skew** and **TTL shorter than runtime**, both manageable in current scope.

## Recommendations (optional)
1) If cleanup duration increases, consider:
   - Increasing TTL
   - Adding `updatedAt` heartbeat to extend the lock while running
2) If more locks are added, add a scheduled cleanup to delete expired rows.
3) If infrastructure supports it, use DB server time (`now()`) instead of local time to avoid clock skew.

# Worker Deploy Readiness Review (apps/worker)

**Date:** 2026-01-26
**Status:** Reviewed

## Summary
Worker logic is functional, but current job-claiming semantics and external dependency handling are not safe for production scale.

## Findings

### P0 — Job claiming updates all pending jobs
- **Where:** `apps/worker/src/worker.ts` (`claimJob`)
- **Issue:** `update(jobs).set(...).where(...).returning()` has no limit/order. In Postgres this updates *all* matching pending jobs, then the code only processes the first returned row. This can mark many jobs as `processing` without ever running them.
- **Fix:** Use a single-row claim with `SELECT ... FOR UPDATE SKIP LOCKED` (or equivalent), or a CTE that updates one job by id.

### P1 — Multi-worker safety is not guaranteed
- **Where:** `apps/worker/src/worker.ts`
- **Issue:** The claim logic isn’t safe for multiple worker instances. Without `SKIP LOCKED`, concurrent workers can race or starve jobs.
- **Fix:** Use a transactional claim query designed for concurrency, and add metrics for stuck jobs.

### P1 — Scheduled cleanup runs in every worker instance
- **Where:** `apps/worker/src/index.ts`
- **Issue:** `setInterval(handleCleanupDrafts)` runs in every worker process, so cleanup will duplicate work when scaled horizontally.
- **Fix:** Move cleanup to a single scheduled job (cron) or gate with leader election.

### P1 — External API calls lack timeouts/retries
- **Where:** `apps/worker/src/lib/firecrawl.ts`, `apps/worker/src/handlers/analyze-content.ts`, `apps/worker/src/handlers/moderate-async.ts`
- **Issue:** Calls to Firecrawl and Anthropic don’t enforce request timeouts and rely on default fetch behavior. This can hang jobs and block the worker.
- **Fix:** Add abortable timeouts and classify retryable errors; consider circuit breakers for upstream outages.

### P1 — Storage provider is local-only
- **Where:** `apps/worker/src/lib/storage.ts`
- **Issue:** Only local filesystem storage is supported, which will not work in production multi-instance setups.
- **Fix:** Implement an object storage provider and share config with the API.

### P2 — Moderation fails open on errors
- **Where:** `apps/worker/src/handlers/moderate-async.ts`
- **Issue:** When the moderation API fails, content is approved by default. This is a deliberate choice but increases risk.
- **Fix:** Decide whether to fail closed for high-risk content or add a manual review fallback.

## Notes / Watchouts
- Worker processes jobs sequentially. If throughput becomes an issue, introduce concurrency with safe claim semantics.

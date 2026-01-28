# API Deploy Readiness Review (apps/api)

**Date:** 2026-01-26
**Status:** Reviewed

## Summary
Core API functionality is in place, but production readiness is gated by storage, rate limiting, and a few performance/scale concerns.

## Findings

### P0 — Storage provider is local-only
- **Where:** `apps/api/src/lib/storage.ts`, `apps/api/src/index.ts`
- **Issue:** `getStorage()` only supports `local`, and `serveStatic` exposes local `./uploads`. In production this will break multi-instance setups and lose uploads on redeploy.
- **Fix:** Implement S3/R2 (or equivalent) storage provider and serve uploads from object storage/CDN; remove or gate local static serving in prod.

### P1 — Rate limiting is in-memory
- **Where:** `apps/api/src/lib/rateLimit.ts`, `apps/api/src/routes/drafts.ts`
- **Issue:** Rate limits are per-process in memory; they reset on restart and do not work with multiple API instances.
- **Fix:** Replace with Redis (or similar) and add global rate limit middleware for abuse-prone endpoints.

### P1 — Draft SSE polling can overload DB
- **Where:** `apps/api/src/routes/drafts.ts`
- **Issue:** SSE endpoint polls the DB every second per client for up to 2 minutes. At scale this will cause heavy DB read load.
- **Fix:** Reduce polling frequency, add an event-driven mechanism (pub/sub), or move progress updates to a cache.

### P1 — Hot sort is computed in memory with a hard cap
- **Where:** `apps/api/src/routes/projects.ts`
- **Issue:** “hot” sort fetches up to 1000 items and sorts in memory. Performance will degrade as the dataset grows.
- **Fix:** Precompute hot scores and store/index them in the DB (the file already notes this TODO).

### P1 — Upload type validation relies on client MIME
- **Where:** `apps/api/src/routes/projects.ts`
- **Issue:** Screenshot upload trusts `File.type`; a spoofed MIME could allow unexpected file types.
- **Fix:** Validate file signatures server-side (or re-encode images), and consider adding AV scanning in prod.

### P1 — Missing sitemap endpoint expected by web
- **Where:** `apps/web/src/app/sitemap.ts` expects `/api/v1/sitemap/projects` (no route found in API)
- **Issue:** Web sitemap fetch will return an error or empty data.
- **Fix:** Add a minimal sitemap endpoint in API or update web to use an existing route.

### P2 — CORS origin is a single string
- **Where:** `apps/api/src/index.ts`
- **Issue:** Only one `APP_URL` is allowed. If you serve `www` and apex domains, one will be blocked.
- **Fix:** Allow a list of trusted origins or normalize to a single canonical host in production.

## Notes / Watchouts
- Ensure `API_URL`, `APP_URL`, `AUTH_SECRET`, and provider secrets are all set in production; several flows (auth, likes) hard-fail without them.

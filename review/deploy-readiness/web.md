# Web Deploy Readiness Review (apps/web)

**Date:** 2026-01-26
**Status:** Reviewed

## Summary
Next.js app is close to production-ready, but there are a few config and integration gaps that will break images or SEO if not addressed.

## Findings

### P1 — Missing production image host config
- **Where:** `apps/web/next.config.ts`
- **Issue:** `images.remotePatterns` only allows `http://localhost:3001/uploads`. In production, Next Image will block screenshots from object storage or a CDN.
- **Fix:** Add production storage/CDN host(s) and protocol(s) to `remotePatterns`.

### P1 — Sitemap depends on a missing API endpoint
- **Where:** `apps/web/src/app/sitemap.ts`
- **Issue:** Fetches `${API_URL}/api/v1/sitemap/projects`, but no API route exists for this path. This will produce an empty sitemap or errors in production.
- **Fix:** Implement `/api/v1/sitemap/projects` in the API or change the sitemap generator to query a supported endpoint.

### P1 — Production env vars required (defaults point to localhost)
- **Where:** `apps/web/src/lib/api.ts`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/sitemap.ts`
- **Issue:** Defaults fall back to `http://localhost:3001` / `http://localhost:3000`. If the production environment doesn’t set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_APP_URL`, API calls and metadata URLs will be wrong.
- **Fix:** Ensure deployment config sets these env vars for production builds.

## Notes / Watchouts
- `useDraftProgress` uses `EventSource` with `withCredentials: true`; ensure API CORS and cookie settings are compatible with the production web domain.

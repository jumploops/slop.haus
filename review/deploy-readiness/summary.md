# Deploy Readiness Summary

**Date:** 2026-01-26

## Detailed Findings
- Web: `review/deploy-readiness/web.md`
- API: `review/deploy-readiness/api.md`
- Worker: `review/deploy-readiness/worker.md`
- DB: `review/deploy-readiness/db.md`
- Infra: `review/deploy-readiness/infra.md`
- Ops: `review/deploy-readiness/ops.md`

## P0 — Blockers (fix before prod)
- Worker job claim updates all pending jobs, marking many as `processing` without execution. (`apps/worker/src/worker.ts`)
- Storage provider is local-only for API/worker; uploads will not persist across instances. (`apps/api/src/lib/storage.ts`, `apps/worker/src/lib/storage.ts`)

## P1 — Fix soon (production risks)
- In-memory rate limiting (likes/comments/draft analysis) doesn’t work across instances. (`apps/api/src/lib/rateLimit.ts`, `apps/api/src/routes/drafts.ts`)
- Draft SSE polls DB every second per client; will create significant DB load at scale. (`apps/api/src/routes/drafts.ts`)
- Hot sort is computed in-memory with a cap; will degrade with growth. (`apps/api/src/routes/projects.ts`)
- Sitemap endpoint expected by web is missing; SEO sitemap will be empty. (`apps/web/src/app/sitemap.ts`)
- Next Image only allows localhost uploads; production screenshots will be blocked. (`apps/web/next.config.ts`)
- External API calls (Anthropic/Firecrawl) lack timeouts and retry classification. (`apps/worker/src/lib/firecrawl.ts`, `apps/worker/src/handlers/analyze-content.ts`)
- Cleanup job runs in every worker instance; will duplicate work when scaled. (`apps/worker/src/index.ts`)
- Screenshot upload relies on client MIME only; needs server-side validation. (`apps/api/src/routes/projects.ts`)

## P2 — Watchouts
- Moderation fails open on upstream errors (accepts content by default). (`apps/worker/src/handlers/moderate-async.ts`)
- CORS origin only supports a single `APP_URL`; ensure canonical domain. (`apps/api/src/index.ts`)
- Ensure production env vars (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `API_URL`, `APP_URL`, `AUTH_SECRET`, provider keys) are set; defaults point to localhost.

## P3 — Nice-to-have
- Add observability for worker/job queue (metrics, queue depth, job age).

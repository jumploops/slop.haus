# Render Production Deployment Plan (Oregon)

**Date:** 2026-02-07  
**Status:** Proposed  
**Target Region:** Render Oregon

## Goal
Deploy `slop.haus` production services on Render (`web`, `api`, `worker`) with Render Postgres in Oregon and production object storage, with a concrete rollout checklist and clear go/no-go gates.

## Current Architecture (Repo Review)

| Service | Runtime | Current Responsibility | Key Dependencies |
| --- | --- | --- | --- |
| `apps/web` | Next.js 15 | UI, auth client, sitemap generation | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, API cookies/CORS |
| `apps/api` | Hono + Node | REST API, auth, uploads, moderation entrypoints | Postgres, OAuth, storage, Anthropic |
| `apps/worker` | Node worker loop | Job queue processing, scraping/enrichment/moderation, cleanup scheduling | Postgres queue, Firecrawl, Anthropic, storage |
| `packages/db` | Drizzle + postgres.js | Schema, migrations, seed scripts | `DATABASE_URL` |
| `packages/shared` | TS shared package | Shared schemas/types/utilities | consumed by `web/api/worker` |

## Production Target Topology

- Render Web Service: `@slop/web` (public site)
- Render Web Service: `@slop/api` (public API)
- Render Background Worker: `@slop/worker` (no public ingress)
- Render PostgreSQL (managed database)
- S3-compatible object storage for uploads/screenshots
- Optional CDN in front of object storage

## Preflight Blockers (Must Fix Before Deploy)

### B0: Production start scripts must not depend on `.env`
- Current `apps/api/package.json` and `apps/worker/package.json` `start` scripts use `dotenv -e ../../.env`.
- Plan: add dedicated production scripts (example: `start:prod`) that read from process environment only.
- Your direction: this is required and should be the default production path.

### B1: API build currently emits no `dist`
- `apps/api/tsconfig.json` extends root `tsconfig.json`, which has `"noEmit": true`.
- `pnpm -F @slop/api build` succeeds but does not create runtime artifacts.
- Plan: either override `noEmit: false` for API build or run API via `tsx` at runtime.

### B2: Worker compiled output fails under `node`
- `apps/worker/dist/index.js` imports `"./worker"` (no `.js` extension) and fails with Node ESM resolution.
- Plan: align TS module settings for Node ESM (`nodenext` flow) or run worker via `tsx` runtime path.

### B3: Workspace packages export raw `.ts` for runtime
- `@slop/db` and `@slop/shared` export `src/*.ts`; plain Node runtime errors with `ERR_UNKNOWN_FILE_EXTENSION`.
- Plan options:
1. Short-term: run API/worker with `tsx` in production.
2. Long-term: add build outputs for shared/db and point exports to compiled `.js` + `.d.ts`.

## Deployment Strategy

### Phase 0: Runtime Hardening (Code + Scripts)
- [x] Add `start:prod` script(s) for API/worker without `dotenv`.
- [x] Pick runtime strategy:
  - [x] Strategy A (fast): `tsx` runtime for API/worker in production.
  - [ ] Strategy B (hardened): compiled JS runtime with fixed TS/exports.
- [ ] Verify chosen strategy locally with production-like env vars only.

### Phase 1: Data Foundation (Render Postgres + Object Storage)
- [ ] Validate Render Postgres is in Oregon and healthy.
- [ ] Capture Render DB connection info for app runtime (`DATABASE_URL`) and migration workflow.
- [ ] Verify backup/retention settings for Render Postgres.
- [ ] Verify DB connectivity from both Render API and Render worker services.
- [ ] Provision production object storage bucket for uploads/screenshots.
- [ ] Enable encryption and versioning for object storage bucket.
- [ ] Set bucket policy/CORS for required public asset access model.

### Phase 2: Render Services
- [ ] Create Render service for `web`.
- [ ] Create Render service for `api`.
- [ ] Create Render background worker for `worker`.
- [ ] Set region to Oregon for all Render services.
- [ ] Configure health check for API: `/health`.
- [ ] Configure auto-deploy policy (main branch only for prod).

### Phase 3: Environment Configuration

#### Web (`@slop/web`)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL=https://slop.haus`
- [ ] `NEXT_PUBLIC_API_URL=https://api.slop.haus`

#### API (`@slop/api`)
- [ ] `NODE_ENV=production`
- [ ] `PORT` (Render-provided)
- [ ] `DATABASE_URL` (Render Postgres)
- [ ] `APP_URL=https://slop.haus`
- [ ] `API_URL=https://api.slop.haus`
- [ ] `AUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- [ ] `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- [ ] `STORAGE_TYPE=s3`
- [ ] `S3_BUCKET`
- [ ] `S3_REGION=us-west-2`
- [ ] `S3_ENDPOINT` (only if non-default)
- [ ] `S3_PUBLIC_URL` (if CDN/custom domain)
- [ ] `ANTHROPIC_API_KEY`

#### Worker (`@slop/worker`)
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (same Render Postgres)
- [ ] `STORAGE_TYPE=s3`
- [ ] `S3_BUCKET`
- [ ] `S3_REGION=us-west-2`
- [ ] `S3_ENDPOINT` (only if non-default)
- [ ] `S3_PUBLIC_URL` (if CDN/custom domain)
- [ ] `FIRECRAWL_API_KEY`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `WORKER_POLL_INTERVAL_MS` (start with `5000`)
- [ ] `WORKER_ID` (optional; defaults to random UUID)

### Phase 4: Build/Start Commands (Render)

#### Recommended if using Strategy A (`tsx` runtime)
- Web build: `pnpm install --frozen-lockfile && pnpm -F @slop/web build`
- Web start: `pnpm -F @slop/web start`
- API build: `pnpm install --frozen-lockfile`
- API start: `pnpm -F @slop/api exec tsx src/index.ts`
- Worker build: `pnpm install --frozen-lockfile`
- Worker start: `pnpm -F @slop/worker exec tsx src/index.ts`

#### Recommended if using Strategy B (compiled runtime)
- [ ] Fix API no-emit config.
- [ ] Fix worker ESM imports for Node.
- [ ] Add build pipelines for `@slop/db` and `@slop/shared` with JS exports.
- [ ] Then use `node dist/index.js` starts for API/worker.

### Phase 5: Database Change Management
- [ ] Use production migrations (`pnpm db:migrate`), not `db:push`.
- [ ] Run migration step before app cutover.
- [ ] Confirm schema version and core tables (`jobs`, `locks`, `rate_limits`, auth tables).
- [ ] Decide whether seed scripts are safe for production before running any seed command.

### Phase 6: DNS, Auth, and Cookies
- [ ] Point `slop.haus` to Render web service.
- [ ] Point `api.slop.haus` to Render API service.
- [ ] Update OAuth provider callback URLs to production API auth endpoints.
- [ ] Validate cross-site cookie/auth flow between `slop.haus` and `api.slop.haus`.
- [ ] Confirm CORS origin behavior for production domain(s).

### Phase 7: Smoke Tests (Go/No-Go)
- [ ] Web home/feed loads.
- [ ] OAuth sign-in works (GitHub and/or Google).
- [ ] API `/health` returns 200.
- [ ] Submit draft flow works end-to-end.
- [ ] Worker processes queued jobs and completes status transitions.
- [ ] Screenshot upload persists to S3 and URL resolves publicly.
- [ ] Sitemap endpoint + web sitemap render expected URLs.
- [ ] Rate limiting behaves as expected across API instances.

### Phase 8: Post-Launch Operations
- [ ] Configure alerts for API 5xx, worker failures, queue backlog, and DB saturation.
- [ ] Document incident runbook (DB outage, queue stuck, upstream API outage).
- [ ] Define rollback plan (service rollback + DB rollback boundaries).

## Release Order
1. Runtime script/build fixes (Phase 0).
2. Render Postgres + object storage validation/provisioning (Phase 1).
3. Render service creation + env setup (Phases 2-4).
4. Run DB migrations (Phase 5).
5. DNS/OAuth cutover (Phase 6).
6. Smoke tests and launch gate (Phase 7).
7. Monitoring/runbook completion (Phase 8).

## Open Decisions
- [ ] Choose runtime strategy for API/worker in production: `tsx` now vs compiled artifacts now.
- [ ] Decide which S3-compatible storage backend to use long-term (AWS S3 vs alternative).
- [ ] Decide whether to add CDN in front of object storage immediately or after initial launch.
- [ ] Decide whether production uses only `slop.haus` or also `www.slop.haus` (CORS/auth origin implications).

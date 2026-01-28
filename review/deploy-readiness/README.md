# Deploy Readiness Review Plan

**Date:** 2026-01-26
**Status:** In progress
**Scope:** `apps/web`, `apps/api`, `apps/worker`, database, infrastructure, ops

## Goal
Assess production readiness for slop.haus, identify blockers, and document risks across web, API, and worker components.

## Phases

### Phase 0 — Baseline & Context
- Confirm environment requirements and runtime assumptions.
- Review existing docs for known gaps.
- Establish review checklist and severity rubric.

### Phase 1 — Web (Next.js)
Focus areas:
- Runtime config (env vars, external URLs)
- Asset loading (images, uploads)
- SEO/metadata/sitemap
- Client/server boundary issues (cookies, CORS expectations)

### Phase 2 — API (Hono)
Focus areas:
- Auth/session handling
- CORS/security headers
- Upload/storage strategy
- Rate limiting & abuse protection
- Performance hotspots (hot sort, SSE polling)
- Missing/assumed endpoints

### Phase 3 — Worker (Jobs)
Focus areas:
- Job claiming concurrency correctness
- Retry/backoff behavior
- External dependency timeouts
- Scheduled jobs & multi-instance safety
- Storage provider parity with API

### Phase 4 — Consolidated Summary
- P0 (blockers), P1 (fix soon), P2 (watchouts), P3 (nice-to-have)
- Links to detailed findings per component

### Phase 5 — Database Readiness
Focus areas:
- Migrations, indexing, and schema evolution
- Backups/restore and retention
- Security/TLS and access controls

### Phase 6 — Infrastructure Readiness
Focus areas:
- Domains, TLS, CDN, and storage
- Secrets and configuration management
- Scaling assumptions

### Phase 7 — Ops Readiness
Focus areas:
- Monitoring/alerting
- Runbooks and incident response
- Release/rollback plans

## Deliverables
- `review/deploy-readiness/web.md`
- `review/deploy-readiness/api.md`
- `review/deploy-readiness/worker.md`
- `review/deploy-readiness/db.md`
- `review/deploy-readiness/infra.md`
- `review/deploy-readiness/ops.md`
- `review/deploy-readiness/summary.md`

## Status Tracking
- Phase 0: completed
- Phase 1: completed
- Phase 2: completed
- Phase 3: completed
- Phase 4: completed
- Phase 5: completed
- Phase 6: completed
- Phase 7: completed

# Deploy Readiness Implementation Plan

**Date:** 2026-01-26
**Status:** Proposed (awaiting review)

## Goal
Resolve deploy-readiness issues identified in `review/deploy-readiness/*` with a phased, production-safe rollout.

## Scope
- Worker job claiming + scheduling safety
- Production storage (API + worker)
- Distributed rate limiting
- Web sitemap + image host config
- SSE scaling improvements
- Hot sort performance
- External API timeouts/retries
- Upload validation hardening

## Out of Scope (for now)
- Major UI/UX changes
- Full observability stack implementation
- Data migrations unrelated to readiness findings

## Phases

| Phase | Title | Priority | Status |
| --- | --- | --- | --- |
| 1 | Worker job claiming correctness | P0 | completed |
| 2 | Object storage for uploads/screenshots | P0 | completed |
| 3 | Distributed rate limiting | P1 | completed |
| 4 | Sitemap endpoint + Next Image hosts | P1 | completed |
| 5 | Draft SSE scaling improvements | P1 | completed |
| 6 | Hot sort persistence & DB ordering | P1 | completed |
| 7 | External API timeouts & retry policy | P1 | completed |
| 8 | Upload validation hardening | P1 | completed |
| 9 | Single-instance scheduled cleanup | P1 | completed |

## Dependencies / Ordering
1) Phase 1 before scaling worker or queue throughput.
2) Phase 2 before production uploads.
3) Phase 3 before multi-instance API deploy.
4) Phase 4 before SEO launch.

## Verification Strategy
Each phase includes a verification checklist. Avoid cross-phase changes unless explicitly required.

## Rollout Notes
- Prefer feature flags or env-gated behavior for production-only paths (e.g., storage).
- Ensure DB migrations are applied before app changes that depend on them.

## Phase Docs
- `plan/deploy-readiness/phase-1-worker-claim.md`
- `plan/deploy-readiness/phase-2-storage.md`
- `plan/deploy-readiness/phase-3-rate-limiting.md`
- `plan/deploy-readiness/phase-4-sitemap-images.md`
- `plan/deploy-readiness/phase-5-sse.md`
- `plan/deploy-readiness/phase-6-hot-sort.md`
- `plan/deploy-readiness/phase-7-timeouts.md`
- `plan/deploy-readiness/phase-8-upload-validation.md`
- `plan/deploy-readiness/phase-9-scheduled-jobs.md`

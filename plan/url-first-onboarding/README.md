# URL-First Onboarding Implementation Plan

## Overview

This plan implements a simplified project submission flow where users enter a URL and the system automatically extracts project metadata using Firecrawl + Claude Haiku.

**Design Doc:** `design/url-first-onboarding.md`

## Current Status: In Progress

**Last Updated:** 2026-01-11

## Phase Summary

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | [Database & Types](./phase-1-database.md) | ✅ Complete | Schema for drafts, shared types |
| 2 | [URL Scraping](./phase-2-url-scraping.md) | ✅ Complete | URL detection, Firecrawl integration |
| 3 | [LLM Analysis](./phase-3-llm-analysis.md) | ✅ Complete | Claude Haiku field extraction |
| 4 | [Draft API](./phase-4-draft-api.md) | ✅ Complete | REST endpoints for drafts |
| 5 | [Real-time Progress](./phase-5-realtime-progress.md) | ✅ Complete | SSE for live updates |
| 6 | [Frontend: Input](./phase-6-frontend-input.md) | ✅ Complete | URL input & progress UI |
| 7 | [Frontend: Review](./phase-7-frontend-review.md) | ✅ Complete | Draft review & edit UI |
| 8 | [Polish](./phase-8-polish.md) | ✅ Complete | Error handling, cleanup, fallbacks |

## Dependencies

```
Phase 1 (Database)
    ↓
Phase 2 (Scraping) ──→ Phase 3 (LLM) ──→ Phase 4 (API)
                                              ↓
                                        Phase 5 (SSE)
                                              ↓
                                   Phase 6 (Frontend Input)
                                              ↓
                                   Phase 7 (Frontend Review)
                                              ↓
                                        Phase 8 (Polish)
```

## Milestones

### Milestone 1: Backend Core (Phases 1-4)
- Database schema in place
- URL scraping works end-to-end
- LLM extraction produces usable results
- API endpoints functional
- **Testable via curl/Postman**

### Milestone 2: Real-time UX (Phase 5)
- SSE streams progress to client
- **Can demo progress indicator**

### Milestone 3: Frontend MVP (Phases 6-7)
- Full user journey works
- URL → Analyze → Review → Submit
- **Can submit projects via new flow**

### Milestone 4: Production Ready (Phase 8)
- Error handling complete
- Fallback to manual entry
- Draft cleanup running
- Rate limits in place

## Key Technical Decisions

1. **Draft Storage**: Temporary `enrichment_drafts` table with 24h expiry
2. **Soft Delete**: Drafts are soft-deleted (never hard deleted)
   - Auto-expire after 24h: `deletedAt` set by cleanup job
   - Manual discard: `deletedAt` set immediately via DELETE endpoint
   - Stale drafts (stuck >5min): Marked "failed" but NOT deleted (user can see error)
3. **Draft Resumability**: Users can return to incomplete drafts via `GET /drafts`
4. **Job Processing**: Reuse existing Postgres job queue
5. **LLM**: Claude Haiku for cost efficiency (~$0.25/1M input tokens)
6. **Progress Updates**: Server-Sent Events (SSE) over WebSockets
7. **Fallback**: Manual entry form preserved at `/submit/manual`

## Environment Variables Required

```bash
# Existing
FIRECRAWL_API_KEY=...
DATABASE_URL=...

# New
ANTHROPIC_API_KEY=...  # For Claude Haiku (may already exist for moderation)
```

## Estimated Effort

| Phase | Complexity | Notes |
|-------|------------|-------|
| 1 | Low | Schema + types only |
| 2 | Medium | URL parsing + Firecrawl configs |
| 3 | Medium | Prompt engineering + parsing |
| 4 | Medium | 4 endpoints + validation |
| 5 | Low-Medium | SSE implementation |
| 6 | Medium | New components + state |
| 7 | Medium | Form pre-population |
| 8 | Low | Error states + cleanup |

## Testing Strategy

- **Unit Tests**: URL detection, LLM response parsing
- **Integration Tests**: Full draft → project flow
- **E2E Tests**: Browser automation for submit journey
- **Manual QA**: Test various URL types (GitHub, live sites, npm, etc.)

## Rollout Plan

1. Deploy backend (Phases 1-5) behind feature flag
2. Deploy frontend with A/B test (old vs new flow)
3. Monitor completion rates, error rates
4. Remove old flow once confident

## Files Changed Summary

### New Files
- `packages/db/src/schema/enrichment-drafts.ts` (includes `deletedAt` for soft delete)
- `packages/shared/src/url-detection.ts`
- `packages/shared/src/draft-types.ts`
- `apps/worker/src/handlers/scrape-url.ts`
- `apps/worker/src/handlers/analyze-content.ts`
- `apps/worker/src/handlers/cleanup-drafts.ts`
- `apps/api/src/routes/drafts.ts` (includes GET /drafts for resumability)
- `apps/web/src/app/submit/draft/[draftId]/page.tsx`
- `apps/web/src/components/submit/UrlInput.tsx`
- `apps/web/src/components/submit/AnalysisProgress.tsx`
- `apps/web/src/components/submit/DraftReview.tsx`
- `apps/web/src/components/submit/ScreenshotPreview.tsx`
- `apps/web/src/components/submit/TagEditor.tsx`

### Modified Files
- `packages/db/src/schema/index.ts` (export new schema)
- `packages/db/src/schema/jobs.ts` (new job types)
- `apps/worker/src/index.ts` (register new handlers)
- `apps/api/src/index.ts` (mount drafts routes)
- `apps/web/src/app/submit/page.tsx` (refactor to URL-first)

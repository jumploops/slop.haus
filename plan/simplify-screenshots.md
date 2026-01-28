# Simplify Screenshot Storage Prefixes

**Date:** 2026-01-26
**Status:** Completed

## Goal
Unify all screenshot uploads (draft and published) under a single flat `screenshots/` prefix for both local and S3 storage.

## Current Implementation (review)
- Draft screenshots are stored by the worker during URL analysis:
  - `apps/worker/src/handlers/scrape-url.ts` uses `generateStorageKey("draft-screenshots", ...)`
  - `apps/worker/src/handlers/scrape-screenshot.ts` uses `generateStorageKey("draft-screenshots", ...)`
- User-uploaded project screenshots are stored by the API:
  - `apps/api/src/routes/projects.ts` uses `generateStorageKey("project-screenshots", ...)`
- Enrichment screenshots for published projects already use:
  - `apps/worker/src/handlers/enrich-screenshot.ts` uses `generateStorageKey("screenshots/${project.slug}", ...)`

## Proposed Changes
- Standardize all screenshot uploads to a single flat prefix:
  - Draft screenshots: `screenshots/...`
  - Published project screenshots: `screenshots/...`
- No copy step on draft submission (project uses the same URL).
- Keep storage provider logic unchanged; this is a key-prefix only change.
- No DB schema changes required.

## Decisions
- Use a single flat `screenshots/` prefix.
- No migration of existing objects.

## Files to Change (if approved)
- `apps/worker/src/handlers/scrape-url.ts`
- `apps/worker/src/handlers/scrape-screenshot.ts`
- `apps/worker/src/handlers/enrich-screenshot.ts`
- `apps/api/src/routes/projects.ts`
- `apps/api/src/routes/drafts.ts` (copy draft screenshot into project prefix on submit)

## Verification Checklist
- [ ] Draft analysis screenshots appear under `screenshots/` in S3.
- [ ] Published project screenshots (auto + user upload) appear under `screenshots/`.
- [ ] Existing screenshots still render (if we choose not to migrate).

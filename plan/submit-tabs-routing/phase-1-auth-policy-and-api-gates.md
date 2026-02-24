# Phase 1: Auth Policy + API Gates

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** API + Web  
**Depends On:** None

## Goal

Allow authenticated users without linked GitHub to submit projects via URL and manual flows.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/draft/[draftId]/page.tsx`

## Tasks

1. Replace API submit endpoints from `requireGitHub()` to `requireAuth()`.
2. Remove `RequireGitHub` wrappers from submit/manual and submit/draft pages.
3. Keep repo list endpoint behavior unchanged (`/auth/github/repos` still checks linked status).

## Verification Checklist

- [x] Authenticated non-GitHub users can call `POST /drafts/analyze`.
- [x] Authenticated non-GitHub users can call `POST /drafts/:draftId/submit`.
- [x] Authenticated non-GitHub users can call `POST /projects`.
- [x] Manual and draft pages no longer hard-block on GitHub link.

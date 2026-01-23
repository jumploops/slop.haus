# Debug: Feed "Top" Sort Not Returning Most Votes

**Status:** Draft
**Owner:** TBD
**Date:** 2026-01-23

## Problem

The "Top" selector on the main project list page does not return the projects with the most votes.

## Where It Lives

- UI: `apps/web/src/app/page.tsx`
- API: `apps/api/src/routes/projects.ts`
- Feed query schema: `packages/shared/src/schemas.ts`
- Project schema (vote counts): `packages/db/src/schema/projects.ts`
- Like write path: `apps/api/src/routes/likes.ts`

## Findings

### Frontend behavior
- The feed page calls `fetchFeed({ sort, window, page, limit })`.
- Sort options are `hot`, `new`, `top`.
- The "Top" option adds a time window selector (24h/7d/30d/all).
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/lib/api/projects.ts`

### API behavior (feed)
- `GET /api/v1/projects` parses `sort` + `window` via `feedQuerySchema`.
- `sort === "top"` currently orders by `projects.slopScore` (descending).
- The time window filter for "top" uses `projects.createdAt >= windowStart`.
  - `apps/api/src/routes/projects.ts`

### What "votes" appear to mean in the schema
- Project-level vote count is `projects.likeCount` (integer).
- Likes are recorded in `project_likes`, with `likeCount` incremented/decremented on insert/delete.
  - `packages/db/src/schema/projects.ts`
  - `apps/api/src/routes/likes.ts`

## Suspected Root Cause

- "Top" is sorting by `slopScore` (review-based average) instead of vote count (`likeCount`).
- The time window filter is based on project **creation time**, not vote activity, which further disconnects it from "most votes" behavior.

## Open Questions

1. What does "most votes" mean for this feed?
   - Highest `likeCount` overall?
   - Highest `likeCount` within the selected time window?
   - Or highest review score (`slopScore`) within the window?
2. Should "Top" use `likeCount`, `reviewCount`, or a weighted metric?
3. If windowing should be by vote activity, do we want to compute this from `project_likes.createdAt` (requires aggregation)?

## Potential Fix Directions (Not Implemented)

- Change the "top" order to `orderBy desc(projects.likeCount)`.
- Decide whether the time window should be based on:
  - `projects.createdAt` (simple), or
  - `project_likes.createdAt` aggregation (accurate for votes in window).

## Notes

- No users exist yet, so there are no legacy preference concerns.
- This debug doc only covers "Top" feed sorting, not other feed variants.

# Phase 4 — Sitemap Endpoint + Next Image Hosts

**Status:** completed
**Priority:** P1

## Problem
The web sitemap expects `/api/v1/sitemap/projects`, but the API does not implement it. Next Image only allows localhost uploads.

## Goals
- Provide a lightweight sitemap endpoint for project slugs.
- Skip Next Image host allow-listing (not using Next image optimization in production).

## Proposed Approach
- Add a read-only API route that returns `{ projects: [{ slug, updatedAt }] }`.
- Use a minimal query filtered to published projects.
- Do not update Next Image host configuration for now.

## Files to Change
- `apps/api/src/routes/` (new sitemap route)
- `apps/api/src/index.ts` (route registration)

## Verification Checklist
- [ ] `/sitemap.xml` includes project URLs in production.

## Rollout
- Deploy API route, then web config update.

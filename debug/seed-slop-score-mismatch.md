# Debug: Seeded `slopScore` Mismatch vs Review Ratings

**Status:** Draft  
**Owner:** TBD  
**Date:** 2026-02-08

## Problem

A seeded project shows a high aggregate score (example: `8.8 - SOLID`) while the visible review ratings are low (`2, 2, 4, 2`) with several top-level entries showing no score.

Expected from those scored reviews:

- `(2 + 2 + 4 + 2) / 4 = 2.5`

Observed:

- project-level `slopScore = 8.8`

## Scope Investigated

- Runtime aggregate update paths in API
- DB seed builders and post-seed aggregate updater
- Comment/review display behavior in web UI

## Findings

### 1) Runtime aggregate logic is internally consistent

When reviews are created/removed in runtime paths, project aggregates are updated as:

- `reviewCount`
- `reviewScoreTotal`
- `slopScore = reviewScoreTotal / reviewCount` (with zero guard)
- `hotScore` recomputed from new slop score

References:

- `apps/api/src/routes/projectComments.ts:126`
- `apps/api/src/routes/comments.ts:89`
- `apps/api/src/routes/admin.ts:337`
- `apps/api/src/routes/flags.ts:126`

### 2) Seed project rows assign a random `slopScore` up front

`buildProjects()` seeds each project with random values:

- `slopScore` random float in `0.5..9.5`
- `hotScore` random float in `0..200`

Reference:

- `packages/db/src/seed/projects.ts:157`

### 3) Post-seed aggregate updater does not recalculate `slopScore`

`updateProjectCounts()` updates only:

- `likeCount`
- `reviewCount`
- `reviewScoreTotal`
- `commentCount`

It does **not** update:

- `slopScore`
- `hotScore`

Reference:

- `packages/db/src/seed/projects.ts:216`

This is the primary cause of mismatch: seeded counts are refreshed, but `slopScore` remains the original random value.

### 4) Seeded review scores are low-range (`1..5`)

Seed comments assign `reviewScore` as:

- 65% chance: integer `1..5`
- otherwise `null`

Reference:

- `packages/db/src/seed/comments.ts:50`

Given this distribution, a correctly recomputed seed aggregate should usually be much lower than `8.8`.

### 5) Seed aggregate counting semantics differ from runtime semantics

In seed aggregation (`seed.ts`), scored comments are counted regardless of comment status:

- no filter for `status === "visible"`

Reference:

- `packages/db/src/seed.ts:137`

Runtime decrement/increment behavior is visibility-aware (`isVisible` checks), so seed totals can diverge from live behavior patterns.

### 6) Seed updater can be skipped entirely if non-seed projects exist

If any project slug is not in current seed slugs, seed count updates are skipped:

- warning path at `nonSeedCount > 0`

Reference:

- `packages/db/src/seed.ts:147`

In that case, all seeded projects keep initial random `slopScore` plus initial count fields, increasing inconsistency risk.

### 7) UI review thread includes top-level no-score entries

The review count shown in thread header counts top-level non-removed comments, not only scored reviews.

Reference:

- `apps/web/src/components/comment/CommentThread.tsx:30`

This contributes to confusion when users expect every “review” row to carry a score.

## Most Likely Explanation for the Reported Example

1. Seed project got random `slopScore = 8.8`.
2. Seed comments produced scored roots like `2, 2, 4, 2` plus no-score roots.
3. Seed updater refreshed `reviewCount` / `reviewScoreTotal`, but left `slopScore` untouched at `8.8`.
4. UI shows:
   - project badge/term based on `projects.slopScore`
   - comment thread based on seeded comment rows

Result: obvious mismatch between aggregate badge and individual ratings.

## Potential Fix Directions (Not Implemented)

1. In seed aggregate update, recompute `slopScore` from `reviewScoreTotal / reviewCount` and recompute `hotScore`.
2. Align seed aggregate counting with runtime semantics (count only visible scored top-level reviews).
3. Decide whether seed review scores should use full `0..10` range (currently `1..5`).
4. Decide whether top-level no-score comments are intended:
   - if intended, rename UI text/metrics from “Reviews” to “Comments + Reviews”, or
   - if not intended, enforce required `reviewScore` for top-level in API schema and seed builder.
5. Revisit skip-all-updates guard when non-seed projects exist; consider updating only seeded rows instead of skipping.

## Notes

- No application code was changed in this debugging step.

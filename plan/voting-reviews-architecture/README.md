# Voting -> Likes + Reviews Implementation Plan

## Overview
This plan implements the new engagement model:
- Project likes (single counter, any user can like)
- Reviews (top-level comments with 0-10 rating + text)
- Nested replies without ratings
- Comment/review upvotes (authenticated only)
- Slop score derived from review ratings (straight average)
- Preserve self-reported vibe percentile (unchanged)
- Keep dev vs normal metadata for future weighting (aggregate for now)

Source design: `design/voting-reviews-architecture.md`

## Goals
- Replace dual-channel votes with a single like system
- Convert comments into reviews with rating + upvotable text
- Compute and display slop score from reviews
- Preserve vibe percentile as separate metric

## Non-goals (for MVP)
- Weighted/bayesian slop score
- Time-decayed ranking
- Dev-weighted review splits (future)

## Phases

| Phase | Name | Status | Dependencies |
| --- | --- | --- | --- |
| 1 | Schema and Migration | ✅ Completed | None |
| 2 | Shared Types + API Contracts | ✅ Completed | Phase 1 |
| 3 | Backend Routes and Aggregates | ✅ Completed | Phase 2 |
| 4 | Frontend UI + UX | ✅ Completed | Phase 2 |
| 5 | Cleanup and QA | ✅ Completed (pending QA) | Phases 3-4 |

## Key Decisions (Resolved)
- Slop score: straight average of review ratings (0-10)
- Add `reviewCount` separate from `commentCount`
- Comment upvotes: authenticated only
- No migration of existing downvotes (system not live)
- Keep dev metadata for future weighting
- Project likes: new `project_likes` table; remove `project_votes`
- Likes remain anonymous (cookie-based rater identity)
- Slop score is stored on projects and updated on review create/edit/delete

## Risks and Notes
- Feed sorting currently depends on dev/normal scores; will require rework
- Moderation status changes do not update counts today; new aggregates must stay consistent
- Anonymous project likes should remain possible unless we choose to require auth

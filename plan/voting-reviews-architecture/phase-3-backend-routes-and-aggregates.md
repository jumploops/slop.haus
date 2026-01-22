# Phase 3 - Backend Routes and Aggregates

Status: Completed

## Goals
- Implement like endpoints and state
- Implement review creation + replies with validation
- Implement authenticated comment upvotes
- Update stored slop score aggregation and feed sorting

## Files to Change
- `apps/api/src/routes/votes.ts` (replace or rename to likes)
- `apps/api/src/routes/projects.ts` (feed sorting + project shape)
- `apps/api/src/routes/projectComments.ts` (reviews + replies + counts)
- `apps/api/src/routes/comments.ts` (edit/delete logic with reviewScore)
- `apps/api/src/lib/rater.ts` (if still using anonymous likes)
- `apps/api/src/lib/rateLimit.ts` (new limits for likes/review votes)
- `apps/api/src/routes/admin.ts` (moderation should update aggregates)

## Route Changes

### Project Likes
- `POST /api/v1/projects/:slug/like`
  - Body: `{ value: 1 | 0 }`
  - Toggle like for current user (or anonymous rater cookie)
  - Update `projects.likeCount`
- `GET /api/v1/projects/:slug/like-state`
  - Returns `{ liked: boolean }`

### Reviews and Replies
- `POST /api/v1/projects/:slug/comments`
  - Accepts `reviewScore` only when `parentCommentId` is absent
  - Top-level increments `reviewCount` and `reviewScoreTotal`
  - Replies only increment `commentCount`
- `GET /api/v1/projects/:slug/comments`
  - Include `reviewScore` and `upvoteCount` in payload

### Comment Upvotes
- `POST /api/v1/comments/:id/vote`
  - Auth required
  - Toggle upvote
  - Update `comments.upvoteCount`

## Aggregation Rules
- `commentCount`: total visible comments (reviews + replies)
- `reviewCount`: total top-level reviews with rating
- `reviewScoreTotal`: sum of all review ratings (0-10)
- `slopScore`: stored as `reviewScoreTotal / reviewCount` (0 when count is 0)

Whenever a review is created/edited/deleted or moderated (hidden/removed), update aggregates and stored `slopScore`.

## Implementation Steps
1) Replace votes routes with likes (or add new route and deprecate old)
2) Update project list/detail queries to return new fields
3) Modify comment creation to handle reviewScore and update aggregates
4) Add comment vote routes and update comment list responses
5) Update moderation actions to adjust review aggregates and comment counts
6) Update rate limiting for likes and comment upvotes

## Code Sketch (Aggregates)
```ts
await tx.update(projects).set({
  reviewCount: sql`${projects.reviewCount} + 1`,
  reviewScoreTotal: sql`${projects.reviewScoreTotal} + ${reviewScore}`,
  slopScore: sql`((${projects.reviewScoreTotal} + ${reviewScore})::numeric / (${projects.reviewCount} + 1))`,
});
```

## Verification Checklist
- [ ] Like toggle works and count updates
- [ ] Reviews enforce rating only at top-level
- [ ] Slop score updates on create/edit/delete and moderation
- [ ] Comment upvotes require auth and update counts
- [ ] Feed sorting uses new slop score

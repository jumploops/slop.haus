# Phase 2 - Shared Types and API Contracts

Status: Completed

## Goals
- Update shared schemas/types to support likes, reviews, and comment upvotes
- Remove dual-channel vote concepts from shared API inputs
- Align feed query params with new sorting model

## Files to Change
- `packages/shared/src/schemas.ts`
- `packages/shared/src/types.ts`
- `packages/shared/src/draft-types.ts` (if referenced)
- `apps/web/src/lib/api/*` (types only, no UI yet)

## Proposed Changes

### Shared Schemas
- Replace `voteSchema` with `likeSchema`:
  - `value: z.union([z.literal(1), z.literal(0)])` (toggle)
- Add `createReviewSchema`:
  - `body` (1..10000)
  - `reviewScore` optional 0..10
  - `parentCommentId` optional uuid
  - Validation rule: `reviewScore` only allowed when `parentCommentId` is absent
- Add `commentVoteSchema`:
  - `value` 1 or 0 (toggle upvote)

### Feed Query
- Remove `channel` from `feedQuerySchema`
- Update sort behavior description (top/hot based on slop score)

### Shared Types
- Update `Project` type to replace normal/dev scores with:
  - `likeCount`
  - `reviewCount`
  - `reviewScoreTotal`
  - `slopScore`
- Update `Comment` type:
  - `reviewScore` nullable
  - `upvoteCount`

## Implementation Steps
1) Update `schemas.ts` with new schemas + validation rules
2) Update `types.ts` to reflect new fields
3) Update any shared consumer types in `apps/web/src/lib/api/*`
4) Audit for any remaining `channel` references in shared APIs

## Code Sketch (Zod)
```ts
export const createReviewSchema = z.object({
  body: z.string().min(1).max(10000),
  parentCommentId: z.string().uuid().optional(),
  reviewScore: z.number().min(0).max(10).optional(),
}).refine((data) => !data.parentCommentId || data.reviewScore === undefined, {
  message: "reviewScore is only allowed on top-level reviews",
});
```

## Verification Checklist
- [ ] Shared schemas compile and validate expected inputs
- [ ] No remaining references to `voteSchema` or `channel` in shared inputs
- [ ] TypeScript build passes for `@slop/shared`

# Phase 1 - Schema and Migration

Status: Completed

## Goals
- Add schema support for project likes, reviews, and comment upvotes
- Add review aggregates for slop score and review count
- Remove dependency on dual-channel project vote scores

## Scope
- Drizzle schema changes in `packages/db/src/schema/*`
- New migration(s) in `packages/db/drizzle`
- No data backfill beyond defaults (system not live)

## Files to Change
- `packages/db/src/schema/projects.ts`
- `packages/db/src/schema/comments.ts`
- `packages/db/src/schema/votes.ts` (remove)
- `packages/db/src/schema/likes.ts` (new)
- `packages/db/src/schema/index.ts`
- `packages/db/drizzle/*` (new migration)

## Proposed Schema Changes

### Projects
Add like and review aggregates. Suggested fields:
- `likeCount` integer default 0
- `reviewCount` integer default 0
- `reviewScoreTotal` integer default 0 (sum of 0-10 ratings)
- `slopScore` numeric (stored; computed from totals on write)

Note: Keep `vibePercent` as-is (self-reported).

### Comments -> Reviews
Add rating and upvote support to comments.
- `reviewScore` integer nullable (0-10)
- `upvoteCount` integer default 0

Constraint: `reviewScore` only allowed when `parentCommentId` is NULL.
- Enforce via CHECK constraint or application validation.

### Likes
Replace `project_votes` with a new `project_likes` table and **drop** the old table.

Suggested fields for `project_likes` (anonymous likes supported):
- `projectId`
- `userId` nullable (if anonymous likes allowed)
- `raterType` enum (public/dev) for future weighting
- `raterKeyHash` (if anonymous likes allowed)
- Unique constraint: (projectId, raterKeyHash)

### Comment Upvotes
New `comment_votes` table (authenticated only):
- `commentId`
- `userId`
- `createdAt`
- Unique constraint on (commentId, userId)

## Implementation Steps
1) Add columns to `projects` for aggregates (including stored `slopScore`)
2) Add `reviewScore` and `upvoteCount` to `comments`
3) Add `comment_votes` table + indexes
4) Add CHECK constraint for top-level `reviewScore`
5) Create `project_likes` table + indexes
6) Drop `project_votes` table
7) Generate migration + update drizzle snapshots

## Code Sketch (Drizzle)
```ts
export const comments = pgTable("comments", {
  // ...existing columns
  reviewScore: integer("review_score"),
  upvoteCount: integer("upvote_count").default(0).notNull(),
});
```

```ts
export const projectLikes = pgTable("project_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: text("user_id").references(() => user.id),
  raterType: raterTypeEnum("rater_type").notNull(),
  raterKeyHash: varchar("rater_key_hash", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Verification Checklist
- [ ] Migration applies cleanly to a fresh DB
- [ ] New columns default to 0 / null as expected
- [ ] Constraints prevent reviewScore on replies
- [ ] Indexes exist for projectId and commentId lookups

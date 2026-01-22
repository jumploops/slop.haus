# Voting → Likes + Reviews: Architecture Review & Plan

## Goals (from product request)
- Replace current dev/normal upvote/downvote with a **single project like/upvote counter** (any user can like).
- Reframe “comments” as **reviews**: top‑level feedback includes a **0–10 rating (slop → solid)** plus text.
- Allow **nested replies**, but replies **do not include a rating**.
- Add **comment/review upvotes** for ranking reviews.
- Keep a single **“slop score”** based on review ratings (not upvotes).
- Keep **self‑reported “vibe percentile”** separate and unchanged.
- Preserve **dev vs normal metadata** for potential future weighting, but combine to one score for now.

---

## Current Architecture Review

### Database (Drizzle schema)
- **Projects** (`packages/db/src/schema/projects.ts`)
  - Voting fields per channel: `normalUp`, `normalDown`, `normalScore`, `devUp`, `devDown`, `devScore`.
  - Engagement: `commentCount` (incremented on comment creation; decremented on delete when visible).
  - Self‑reported vibe: `vibeMode`, `vibePercent`, `vibeDetailsJson` (shown as the “Vibe Score” in UI).
- **Project votes** (`packages/db/src/schema/votes.ts`)
  - `project_votes` table with `rater_type` enum (`public` | `dev`), `rater_key_hash`, and `value` (-1/+1).
  - Unique constraint: `(project_id, rater_type, rater_key_hash)`.
- **Comments** (`packages/db/src/schema/comments.ts`)
  - Tree structure via `parentCommentId`, `depth`.
  - `status` enum (`visible`, `hidden`, `removed`).
  - No rating or upvote fields.

### Backend (Hono API)
- **Voting** (`apps/api/src/routes/votes.ts`)
  - `POST /api/v1/projects/:slug/vote` accepts `{ channel, value }` with `value` in {-1,0,+1}.
  - `GET /api/v1/projects/:slug/vote-state` returns `{ normal, dev, hasDevCredential }`.
  - Uses cookie‑based rater identity (`apps/api/src/lib/rater.ts`) and per‑rater rate limits (`apps/api/src/lib/rateLimit.ts`).
- **Feed sorting** (`apps/api/src/routes/projects.ts`)
  - Query includes `channel` for normal/dev.
  - `top`/`hot` based on `normalScore` or `devScore`.
- **Comments**
  - List/create: `apps/api/src/routes/projectComments.ts`.
  - Edit/delete: `apps/api/src/routes/comments.ts` (soft delete = `status=removed`; decrements `commentCount` only if previously visible).
  - Moderation: `apps/api/src/routes/admin.ts` and `apps/api/src/routes/flags.ts` toggle comment status, but do **not** adjust `commentCount`.

### Frontend (Next.js)
- **Voting UI**
  - `VoteButtons` renders up/down UI and score.
  - `ScoreWidget` shows “Community Votes” with **People** and **Devs** lanes.
  - `ProjectCard` shows score + vote buttons, driven by `useVote`.
  - Feed page has **Normal/Dev tabs** (`apps/web/src/app/page.tsx`).
- **Comments UI**
  - `CommentThread`, `CommentForm`, `CommentItem` in `apps/web/src/components/comment/*`.
  - No rating input; nested replies use same form.
  - Comment tree built client‑side via `buildCommentTree`.
- **Types & API clients**
  - `apps/web/src/lib/api/projects.ts` includes normal/dev counts + score.
  - `apps/web/src/lib/api/votes.ts` + `useVote` support per‑channel voting.
  - `packages/shared/src/schemas.ts` defines `voteSchema` and `feedQuerySchema` with `channel`.

---

## Observations / Constraints
- `commentCount` tracks total comments, but moderation actions (admin hide/remove) don’t update it.
- Feed sorting is tightly coupled to **dev/normal scores** and `channel` query.
- Voting is implemented with **anonymous cookie raters** (public) and **dev credential cookie**.
- “Vibe Score” is self‑reported and already separate from votes.

---

## Proposed Direction (High‑Level)

### Data Model
- **Projects**
  - Replace normal/dev vote counters with a **single like count** (optionally keep dev/public counters internally for future weighting).
  - Add derived review stats for slop score, e.g.:
    - `reviewCount`
    - `reviewScoreTotal`
    - `slopScore` (stored or computed as `reviewScoreTotal / reviewCount`)
- **Reviews & Comments**
  - Keep a single `comments` table but add `reviewScore` (0–10, nullable).
  - Enforce: `reviewScore` **only allowed when `parentCommentId` is null**.
- **Comment/Review Upvotes**
  - Add `comment_votes` (or `review_votes`) table with rater identity + unique per rater per comment.
  - Track `upvoteCount` for sorting reviews.
- **Votes/likes**
  - Convert `project_votes` into likes (value 1 only) **or** replace with a new `project_likes` table.
  - Keep `rater_type` for future dev weighting, but **aggregate into a single count** for now.

### Backend/API
- Replace current `/vote` with **like toggle** (0/1) and a **like‑state** endpoint.
- Add **review creation** endpoint (top‑level comment + rating) and reuse for replies without rating.
- Add **comment upvote** endpoints (toggle + state/count).
- Update feed sorting to remove `channel` and use the new **slop score** (review‑based) for `top`/`hot`.
- Update moderation so review score and counts stay consistent when comments are hidden/removed.

### Frontend
- Replace dev/normal UI with:
  - **Like button + count** (project card + project detail).
  - **Slop score display** (review‑based) separate from **Vibe** (self‑reported).
- Convert comment form to **review form** for top‑level:
  - Rating slider (0–10, “slop → solid”) + text.
  - Replies keep text only.
- Add **review upvote button** and allow sorting by upvotes.
- Remove feed channel toggles (Normal/Dev).

---

## High‑Level Plan

### Phase 0 — Product Decisions (Resolved)
- **Slop score:** straight average of review ratings (0–10).
- **Review count:** add `reviewCount` (separate from total comments).
- **Comment upvotes:** authenticated users only.
- **Legacy data:** no migration for existing votes/downvotes (system not live yet).
- **Dev weighting:** keep rater/dev metadata for future split, but aggregate into one score for now.

### Phase 1 — Schema & Migration
- Add review fields to `comments` (e.g. `review_score`).
- Add `comment_votes` table and indexes.
- Replace `project_votes` usage with likes (or new table) + add aggregated fields for review score.
- Write migration/backfill for:
  - project likes from existing upvotes
  - review aggregates

### Phase 2 — Shared Types & API
- Update `packages/shared` schemas/types for:
  - like input/state
  - review creation/editing
  - comment vote input/state
  - feed query (remove `channel`)
- Update API routes in `apps/api` for:
  - likes
  - reviews/comments
  - comment upvotes
  - feed sorting by slop score

### Phase 3 — Frontend
- Update `apps/web`:
  - Replace `useVote`/`VoteButtons` with `useLike` and comment upvote hooks.
  - Update `ProjectCard` and `ScoreWidget` for likes + slop score + vibe percentile.
  - Update `CommentForm`/`CommentItem` to support review rating and upvotes.
  - Remove Normal/Dev tabs in feed UI.

### Phase 4 — Cleanup & QA
- Remove deprecated vote channel fields, endpoints, and UI.
- Validate counts (likes, review count, slop score) against DB.
- Verify moderation flows update aggregates correctly.

---

## Open Questions
- None for MVP. Future consideration: dev‑weighted review splits (Rotten Tomatoes style).

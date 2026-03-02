# Featured Section for Hot Feed

Status: ready for implementation
Owner: TBD
Date: 2026-03-02

## Request Summary
- Add a "featured" section at the top of the home feed when the selected sort is `hot`.
- Do not show the featured section for `new` or `top`.
- Only admins can feature or unfeature projects.

## Current Implementation Review

### Frontend feed
- `apps/web/src/app/page.tsx`
  - Feed tabs are `hot`, `new`, and `top`.
  - Feed data comes from `useSWRInfinite` + `fetchFeed({ sort, window, page, limit })`.
  - UI renders one combined `projects` list from all loaded pages and passes each row to `ProjectCard`.
  - `rank` is derived from index in the flattened list.
  - The `window` query state is always sent to the API, even when `sort !== "top"`.
- `apps/web/src/lib/api/projects.ts`
  - `FeedResponse` currently contains only:
    - `projects: ProjectListItem[]`
    - `pagination`
  - There is no `featured` payload in the feed contract.
- `apps/web/src/components/project/ProjectCard.tsx`
  - Single card component already supports list and grid variants.
  - It can be reused for a featured section without a new card primitive.

### Backend feed API
- `apps/api/src/routes/projects.ts` (`GET /api/v1/projects`)
  - Validates `sort`, `window`, `page`, `limit` via `feedQuerySchema`.
  - Applies base filter `projects.status = "published"`.
  - Applies time-window filtering via `projects.createdAt >= ...` when window is not `all`.
  - Sort behavior:
    - `new`: `createdAt DESC`
    - `top`: `likeCount DESC`
    - `hot`: `hotScore DESC`, then `createdAt DESC`
  - Returns paginated project rows plus primary media.
  - No featured logic and no featured metadata in response.

### Auth and admin boundaries
- `apps/api/src/middleware/auth.ts`
  - `requireAdmin()` exists and is the right permission boundary for feature/unfeature writes.
- `apps/api/src/routes/admin.ts`
  - Existing admin/mod moderation actions exist.
  - No endpoint currently features/unfeatures a project.

### Database schema
- `packages/db/src/schema/projects.ts`
  - `projects` includes scoring, counts, status, and timestamps.
  - No `isFeatured`, `featuredAt`, or `featuredByUserId` fields exist.
  - Existing indexes include `status`, `createdAt`, and `hotScore`.

## Decisions from Review
- Show up to 3 featured projects.
- Use `featuredAt DESC` ordering.
- Featured section appears only on `hot`.
- Featured section renders only on first page of the feed.
- Featured projects should still appear in `new` and `top` as normal (non-featured) rows.
- Apply active feed filtering criteria to featured rows; if a featured project does not match the criteria, do not show it in the featured section.
- Featured cards should not affect numeric rank labels; the first non-featured card should always display rank `1`.
- Featured cards should use a gold square badge with a star icon instead of the black numeric rank square.
- Admin controls for featuring/unfeaturing live only on project detail pages.
- Log feature/unfeature actions for auditability.
- Do not enforce a global featured-count max at write time.

## Proposed Design (Recommended)

### 1) Data model
- Add featured metadata directly to `projects`:
  - `featuredAt timestamp null`
  - `featuredByUserId text null references user(id)`
- Featured state is derived:
  - A project is featured when `featuredAt IS NOT NULL` and `status = "published"`.
- Add an index for featured reads:
  - `projects_featured_at_idx` on `featuredAt`
  - Optional partial index for `(status, featuredAt)` where `status = 'published' and featured_at is not null`.

Why this shape:
- Minimal schema surface area.
- Keeps feed read path simple.
- Preserves who featured it for light audit/debug visibility.

### 2) Feed API contract
- Extend `GET /api/v1/projects` response to include `featuredProjects: ProjectListItem[]`.
- Behavior by sort:
  - `hot`:
    - Query featured projects ordered by `featuredAt DESC`.
    - Limit featured results to 3 rows.
    - Return featured rows only when `page === 1`.
    - Apply the same feed filtering criteria to featured rows (`status = published`, plus active time-window filter if present).
    - Exclude featured project IDs from the regular hot list query to prevent duplicates.
    - Return featured projects alongside standard paginated projects.
  - `new` and `top`:
    - Return `featuredProjects: []`.
    - Featured projects may still appear in the standard `projects` list naturally via existing sort logic.

### 3) Admin write API
- Add admin-only endpoints:
  - `POST /api/v1/admin/projects/:id/feature`
  - `DELETE /api/v1/admin/projects/:id/feature`
- Rules:
  - Require `requireAdmin()`.
  - Only allow feature for `published` projects.
  - Unfeature clears `featuredAt` and `featuredByUserId`.
  - Log both actions in `moderationEvents` for auditability:
    - `model: "admin_feature"`
    - `decision: "approved"`
    - `labels: [{ label: "feature", confidence: 1 }]` or `[{ label: "unfeature", confidence: 1 }]`
    - `reason` includes acting admin and action context.
  - If a featured project is hidden or removed by existing admin actions, clear featured fields in the same update path.

### 4) Web behavior
- `apps/web/src/lib/api/projects.ts`
  - Update `FeedResponse` to include `featuredProjects`.
- `apps/web/src/app/page.tsx`
  - Render a dedicated featured section only when:
    - `sort === "hot"`
    - first page response includes `featuredProjects.length > 0`
  - Featured section appears above the normal feed list.
  - Rank numbering behavior:
    - Featured cards show a gold square + star marker (not numeric rank labels).
    - Standard hot-list items use numeric rank labels starting at `1` for the first non-featured row.
    - On later pages, rank continues based only on standard (non-featured) items.
- Admin UI for toggling featured:
  - Location: project detail page (`ProjectDetails`) only, via admin-only button.
  - Reuse existing session role check and admin API client patterns.

## Expected Files to Change (Implementation Phase)
- DB:
  - `packages/db/src/schema/projects.ts`
  - `packages/db/drizzle/<new_migration>.sql`
  - `packages/db/drizzle/meta/*`
- API:
  - `apps/api/src/routes/projects.ts`
  - `apps/api/src/routes/admin.ts`
- Web:
  - `apps/web/src/components/project/ProjectCard.tsx`
  - `apps/web/src/lib/api/projects.ts`
  - `apps/web/src/lib/api/admin.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/components/project/ProjectDetails.tsx`

## Non-Goals
- Manual drag-and-drop ordering UI for featured projects.
- Scheduled featured expirations.
- Expanding feature permissions to mods.

## Verification Plan (After Implementation)
- API:
  - `hot` page 1 returns up to 3 `featuredProjects` and excludes them from regular hot list rows.
  - `hot` page > 1 returns `featuredProjects: []`.
  - featured query respects active feed filter criteria.
  - `new` and `top` return empty `featuredProjects` while still allowing those projects to appear in normal list rows.
  - non-admin feature/unfeature attempts return `403`.
  - feature/unfeature writes create `moderationEvents` audit rows.
- Web:
  - featured section renders only on `hot` page 1.
  - no duplicate project cards between featured and standard hot list.
  - featured cards use gold star badges (no numeric label).
  - numeric rank labels on non-featured cards start at `1` and remain monotonic across pagination.
- DB:
  - migration applies cleanly.
  - featured reads use intended index path.

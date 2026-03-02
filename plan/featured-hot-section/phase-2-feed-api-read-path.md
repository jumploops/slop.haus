# Phase 2: Feed API Read Path

## Status

**Status:** ✅ Completed (2026-03-02)  
**Owner:** API  
**Depends On:** Phase 1

## Goal

Extend `GET /api/v1/projects` so `hot` (page 1 only) includes a `featuredProjects` array while preventing duplicates in the regular feed list.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
- `/Users/adam/code/slop.haus/packages/shared/src/schemas.ts` (only if query contract needs extension)
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts` (response type update consumed by phase 4)

## API Behavior Target

- `sort=hot&page=1`:
  - Return `featuredProjects` (max 3) ordered by `featuredAt DESC`.
  - Apply active feed filters to featured rows (`status=published` plus window filter).
  - Exclude returned featured IDs from the standard `projects` result set for that response.
- `sort=hot&page>1`:
  - Return `featuredProjects: []`.
- `sort=new|top`:
  - Return `featuredProjects: []`.
  - Featured projects can still appear naturally in normal `projects` list.

## Tasks

1. Add `featuredProjects` to feed JSON response shape.
2. Implement featured query branch for `hot` + `page === 1`.
3. Reuse project-row mapping logic (author + primary media) for featured rows.
4. Exclude featured IDs from main hot query to prevent duplicates.
5. Keep pagination totals/behavior coherent for standard `projects` list.
6. Update frontend API typings to include `featuredProjects`.

## Design Notes

- Featured list is presentation-only for hot page 1; pagination remains driven by standard list.
- Current time-window logic uses `projects.createdAt`; featured filtering must match that existing semantics unless changed later.

## Code Snippets (Conceptual)

```ts
const shouldIncludeFeatured = sort === "hot" && page === 1;
```

```ts
const featuredConditions = [eq(projects.status, "published"), isNotNull(projects.featuredAt)];
if (timeFilter) featuredConditions.push(gte(projects.createdAt, timeFilter));
```

```ts
const nonFeaturedCondition =
  featuredIds.length > 0 ? notInArray(projects.id, featuredIds) : undefined;
```

## Verification Checklist

- [ ] `hot` page 1 returns `featuredProjects` with max length 3.
- [ ] `hot` page > 1 returns empty `featuredProjects`.
- [ ] `new` and `top` return empty `featuredProjects`.
- [ ] No duplicates between `featuredProjects` and standard `projects` for hot page 1.
- [ ] Existing sort behavior for standard list remains intact.
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Feed contract is stable and supports featured rendering requirements without regressions to existing feed modes.

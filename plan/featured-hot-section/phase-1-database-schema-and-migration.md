# Phase 1: Database Schema + Migration

## Status

**Status:** ✅ Completed (2026-03-02)  
**Owner:** DB  
**Depends On:** None

## Goal

Add persistent featured metadata to `projects` with query-friendly indexes and tracked Drizzle migration files.

## Files To Change

- `/Users/adam/code/slop.haus/packages/db/src/schema/projects.ts`
- `/Users/adam/code/slop.haus/packages/db/src/schema/index.ts` (only if export shape changes)
- `/Users/adam/code/slop.haus/packages/db/drizzle/<new_migration>.sql`
- `/Users/adam/code/slop.haus/packages/db/drizzle/meta/_journal.json`
- `/Users/adam/code/slop.haus/packages/db/drizzle/meta/<new_snapshot>.json`

## Tasks

1. Add `featuredAt` to `projects`:
   - `timestamp("featured_at")` (nullable)
2. Add `featuredByUserId` to `projects`:
   - `text("featured_by_user_id").references(() => user.id)` (nullable)
3. Add featured-read index(es):
   - Baseline: index on `featuredAt`
   - Optional: partial/index strategy for `status = "published"` hot reads
4. Generate and validate tracked Drizzle migration output.
5. Confirm schema exports remain correct for API usage.

## Design Notes

- Featured state is derived: featured iff `featuredAt IS NOT NULL` and `status = "published"`.
- No write-time global cap is enforced in DB.
- Keep migration metadata in sync with SQL migration files.

## Code Snippets (Conceptual)

```ts
featuredAt: timestamp("featured_at"),
featuredByUserId: text("featured_by_user_id").references(() => user.id),
```

```ts
index("projects_featured_at_idx").on(table.featuredAt)
```

## Verification Checklist

- [ ] New columns exist in schema with expected nullability and FK behavior.
- [ ] Migration SQL is generated and committed.
- [ ] Drizzle `meta/_journal.json` and snapshot are updated and in sync.
- [ ] `pnpm -F @slop/db exec tsc --noEmit` passes (or only pre-existing unrelated failures remain documented).

## Exit Criteria

- DB model supports feature/unfeature lifecycle and feed reads without additional tables.
- Migration artifacts are complete and reviewable.

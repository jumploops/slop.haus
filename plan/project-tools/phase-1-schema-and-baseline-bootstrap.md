# Phase 1: Schema + Baseline Bootstrap

## Status

**Status:** Completed  
**Owner:** DB  
**Depends On:** None

## Goal

Establish persistent data foundations for open tag creation:

1. extend `tools` with lifecycle metadata,
2. ensure production baseline tags exist via migration (not seed-only workflows).

## Files To Change

- `/Users/adam/code/slop.haus/packages/db/src/schema/projects.ts`
- `/Users/adam/code/slop.haus/packages/db/drizzle/*.sql` (new migration)
- `/Users/adam/code/slop.haus/packages/db/drizzle/meta/*` (snapshot/journal updates)
- `/Users/adam/code/slop.haus/packages/db/src/seed/tools.ts` (if shared baseline source extraction is needed)
- `/Users/adam/code/slop.haus/example_tools.csv` (read-only input source, no required edits)

## Tasks

1. Add tool metadata fields:
   - `status` enum (`active`, `blocked`)
   - `source` enum (`seed`, `user`, `llm`, `admin`)
   - `createdByUserId` nullable FK
   - `usageCount` default `0`
   - `createdAt`, `updatedAt`
2. Add indexes needed for expected query paths:
   - `tools.slug` (already unique)
   - `tools.status`
   - optional: `(status, name)` for list/search ordering
3. Create a tracked migration that inserts baseline tools from:
   - current seed constants
   - `example_tools.csv`
4. Use idempotent inserts (`ON CONFLICT DO NOTHING`) to avoid collisions across environments.
5. Set baseline metadata on inserted rows:
   - `source='seed'`
   - `status='active'`
6. Confirm Drizzle metadata chain remains valid.

## Implementation Notes

- Migration SQL should not depend on runtime seed execution.
- If CSV + seed list overlap, slug uniqueness should collapse duplicates naturally.
- Keep canonical slug as uniqueness authority; display `name` can vary casing.

## Example Snippet

```sql
INSERT INTO tools (name, slug, status, source, usage_count)
VALUES
  ('React Native', 'react-native', 'active', 'seed', 0)
ON CONFLICT (slug) DO NOTHING;
```

## Verification Checklist

- [ ] `tools` schema compiles with new fields.
- [ ] Migration applies on empty DB and existing DB without errors.
- [ ] Baseline rows are present after migration in production-like environment.
- [ ] Duplicate baseline values do not fail migration.
- [ ] `pnpm -F @slop/db exec tsc --noEmit`

## Exit Criteria

- Schema supports moderation/source/usage tracking for tags.
- Production bootstrap no longer depends on `seed.ts`.

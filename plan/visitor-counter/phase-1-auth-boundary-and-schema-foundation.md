# Phase 1: Auth Boundary + Schema Foundation

**Status:** Draft  
**Owner:** API + DB  
**Depends On:** None

## Goal

Prepare auth/runtime baseline, data model, and auth boundaries so enabling anonymous auto-sessions does not unintentionally grant access to protected flows or create account-linking FK issues.

## Files To Change

- `/Users/adam/code/slop.haus/packages/db/src/schema/users.ts`
- `/Users/adam/code/slop.haus/packages/db/src/schema/site-counters.ts` (new)
- `/Users/adam/code/slop.haus/packages/db/src/schema/index.ts`
- `/Users/adam/code/slop.haus/packages/db/drizzle/*.sql` (new migration)
- `/Users/adam/code/slop.haus/packages/db/drizzle/meta/*`
- `/Users/adam/code/slop.haus/apps/api/package.json`
- `/Users/adam/code/slop.haus/apps/web/package.json`
- `/Users/adam/code/slop.haus/pnpm-lock.yaml`
- `/Users/adam/code/slop.haus/apps/api/src/middleware/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/likes.ts`

## Tasks

1. Upgrade/verify Better Auth version to latest stable and align package ranges/lockfile (`apps/api`, `apps/web`) before behavior changes.
2. Add `isAnonymous` to the Better Auth `user` table schema.
3. Add `site_counters` schema/table with key/value storage for `unique_visitors`.
4. Generate tracked Drizzle migration that:
   - Adds `user.isAnonymous`.
   - Creates `site_counters`.
   - Seeds `unique_visitors` row to `1` with `INSERT ... ON CONFLICT DO NOTHING`.
5. Harden auth middleware:
   - Update `requireAuth()` to reject anonymous sessions.
   - Ensure `requireGitHub()` also rejects anonymous sessions.
   - Include `isAnonymous` in local auth/session typing.
6. Update likes write path so anonymous sessions do not populate `project_likes.userId` (keep nullable for anonymous, set for registered users only).

## Key Design Notes

- This phase should be safe to ship even before anonymous plugin is enabled.
- Keeping anonymous `userId` out of like rows avoids failures when plugin deletes anonymous users after linking.
- Counter seed value `1` is a product requirement, not a fallback default.

## Code Snippets

```ts
// apps/api/src/middleware/auth.ts (conceptual)
if (!session || session.user.isAnonymous) {
  return c.json({ error: "Unauthorized" }, 401);
}
```

```ts
// apps/api/src/routes/likes.ts (conceptual)
const registeredUserId = session?.user.isAnonymous ? null : session?.user.id ?? null;
```

## Verification Checklist

- [ ] `better-auth` version is upgraded/confirmed and typechecks pass with the new version.
- [ ] Drizzle migration files are generated and metadata journal is updated.
- [ ] `site_counters` contains seeded `unique_visitors = 1` after migration.
- [ ] `requireAuth()` protected routes return 401 for anonymous sessions.
- [ ] Likes still work for visitors, but `project_likes.user_id` is `NULL` for anonymous sessions.
- [ ] `pnpm -F @slop/db exec tsc --noEmit`
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- DB schema supports anonymous users and visitor counter storage.
- API authorization semantics remain aligned with pre-existing product gating after anonymous sessions are introduced.
- Auth dependency baseline is current and ready for anonymous plugin rollout.

# Phase 1: Schema + Auth Foundation

## Status

**Status:** Completed (2026-02-09)  
**Owner:** API + DB  
**Depends On:** None

## Goal

Introduce first-class username storage and wire auth-time username assignment (GitHub prefill, Google random generation), with robust normalization and uniqueness behavior.

## Files To Change

- `/Users/adam/code/slop.haus/packages/db/src/schema/users.ts`
- `/Users/adam/code/slop.haus/packages/db/src/schema/index.ts`
- `/Users/adam/code/slop.haus/packages/db/drizzle/*.sql`
- `/Users/adam/code/slop.haus/packages/db/drizzle/meta/*`
- `/Users/adam/code/slop.haus/apps/api/src/lib/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/lib/username.ts` (new)
- `/Users/adam/code/slop.haus/packages/shared/src/username.ts` (new)
- `/Users/adam/code/slop.haus/packages/shared/src/index.ts`

## Tasks

1. Add user schema fields:
   - `username` (required, unique by normalized value)
   - `usernameSource` (`github` | `google_random` | `manual` | `seed`)
2. Add normalization/validation utilities:
   - lowercase, trim, character policy, min/max length checks.
3. Add generated-username utility with bad-name filtering.
4. Implement auth create/update hooks:
   - On user create: derive candidate from provider context, normalize, uniquify.
   - On user update: validate username changes and enforce uniqueness.
5. Wire provider behavior:
   - GitHub source candidate from `profile.login`.
   - Google source candidate from generator.
6. Keep `name` mirrored to `username` internally if needed for Better Auth compatibility, but do not treat `name` as public identity.

## Key Design Notes

- Pre-launch allows aggressive cutover in app contracts.
- For safety, enforce uniqueness at DB level and retry at app layer to handle races.
- Bad-name filtering is not a reserved global list; it is generation-time sanitation only.

## Code Snippets

```typescript
// packages/shared/src/username.ts
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}
```

```typescript
// apps/api/src/lib/auth.ts (conceptual)
databaseHooks: {
  user: {
    create: {
      before: async (user, ctx) => {
        const username = await generateUniqueUsername(resolveProviderCandidate(user, ctx));
        return { data: { ...user, username, usernameSource: inferSource(ctx), name: username } };
      },
    },
  },
}
```

## Verification Checklist

- [ ] `pnpm db:push` applies schema cleanly in local dev.
- [ ] New GitHub sign-in creates user with username derived from login.
- [ ] New Google sign-in creates generated safe username.
- [ ] Duplicate username attempts resolve without breaking auth flow.
- [ ] `pnpm -F @slop/db exec tsc --noEmit`
- [ ] `pnpm -F @slop/shared exec tsc --noEmit`
- [ ] `pnpm -F @slop/api exec tsc --noEmit`

## Exit Criteria

- Username is persisted for all newly created users.
- Auth layer can create/update users without relying on public `name` semantics.

# Phase 4: Cleanup + Verification

## Status

**Status:** In Progress (2026-02-09)  
**Owner:** API + Web + DB  
**Depends On:** Phase 3

## Goal

Finalize the cutover by removing remaining app-layer `name` identity usage, updating seed/dev tooling, and validating launch readiness.

## Files To Change

- `/Users/adam/code/slop.haus/packages/db/src/seed/users.ts`
- `/Users/adam/code/slop.haus/packages/db/src/seed.ts`
- `/Users/adam/code/slop.haus/PROGRESS.md` (if needed)
- `/Users/adam/code/slop.haus/design/username-system-design.md` (mark decisions finalized, optional)
- `/Users/adam/code/slop.haus/debug/*` (only if new issues discovered during rollout)

## Tasks

1. Update seed users to provide stable usernames and sane usernameSource values.
2. Ensure dev reset/seed flow still works with new schema constraints.
3. Remove or rewrite remaining references to “display name” and `/users/me` patch in docs/comments.
4. Full package typecheck and focused functional QA.
5. Add any follow-up deltas to `TODO.md` only if discovered during implementation.

## Code Snippets

```typescript
// packages/db/src/seed/users.ts (target row shape)
{
  email: "admin@slop.haus",
  username: "slop_admin",
  name: "slop_admin", // internal mirror if still required by auth internals
  role: "admin",
}
```

## Verification Checklist

- [ ] `pnpm db:push` succeeds from a clean local database.
- [ ] `pnpm -F @slop/db exec tsc --noEmit`
- [ ] `pnpm -F @slop/shared exec tsc --noEmit`
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`
- [ ] Manual sign-in test: new GitHub user gets GitHub-derived username.
- [ ] Manual sign-in test: new Google user gets generated safe username.
- [ ] Manual edit test: username can be changed repeatedly without cooldown.
- [ ] Feed/project/comment/admin surfaces all render plain username.

## Exit Criteria

- Username system is production-ready for launch.
- Deferred enhancements are tracked in `TODO.md` (cooldown, history, GitHub-handle suggestion).

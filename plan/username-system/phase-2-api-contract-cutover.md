# Phase 2: API Contract Cutover

## Status

**Status:** Completed (2026-02-09)  
**Owner:** API + Shared  
**Depends On:** Phase 1

## Goal

Make `username` the canonical identity field in API payloads and shared types consumed by web/app clients.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/middleware/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/projectComments.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/users.ts`
- `/Users/adam/code/slop.haus/apps/api/src/routes/admin.ts`
- `/Users/adam/code/slop.haus/packages/shared/src/types.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/auth.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/comments.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/admin.ts`

## Tasks

1. Update auth session typing:
   - replace `AuthUser.name` with `AuthUser.username`.
2. Update route select projections:
   - `author.name` -> `author.username`
   - session response user should expose `username`.
3. Update shared contracts:
   - `User` and author pick types should use `username`.
4. Update web API client types to align with new payload shape.
5. Remove dependence on missing `PATCH /api/v1/users/me` from contracts and planning.

## Key Design Notes

- Since pre-launch, use direct cutover (no temporary dual-field response requirement).
- Keep internal compatibility glue only where required by Better Auth internals.

## Code Snippets

```typescript
// apps/api/src/routes/projects.ts (target shape)
author: {
  id: user.id,
  username: user.username,
  image: user.image,
  devVerified: user.devVerified,
}
```

```typescript
// packages/shared/src/types.ts (target)
export interface User {
  id: string;
  email: string;
  username: string;
  image: string | null;
  role: UserRole;
  devVerified: boolean;
  createdAt: Date;
}
```

## Verification Checklist

- [ ] `GET /api/v1/auth/me` returns `user.username`.
- [ ] Feed/project/comment/admin endpoints return `author.username` only.
- [ ] Web API typing compiles against new payload contracts.
- [ ] `pnpm -F @slop/shared exec tsc --noEmit`
- [ ] `pnpm -F @slop/api exec tsc --noEmit`
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- API contracts consistently expose username for identity labels.
- No app-layer type requires `name` for user identity rendering.

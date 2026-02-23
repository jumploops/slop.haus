# Phase 2: Anonymous Plugin + Counter Write Path

**Status:** Completed (2026-02-21)  
**Owner:** API + Web  
**Depends On:** Phase 1

## Goal

Enable Better Auth anonymous sessions, make anonymous-to-real linking seamless via `onLinkAccount`, and increment `unique_visitors` exactly once per anonymous user creation.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/lib/auth.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/auth-client.ts`
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/EnsureAnonymous.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx` (or `/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx`)

## Tasks

1. Enable anonymous plugin in Better Auth server config (`anonymous()`).
2. Implement `onLinkAccount` handler in plugin config:
   - Execute in a transaction-safe function boundary.
   - Add no-op/default migration path now (no meaningful anonymous-owned data yet).
   - Add structured logging hooks so future anonymous data migrations are observable.
3. Keep anonymous-linking deletion behavior at default (`disableDeleteAnonymousUser` unset/false) for cleaner user identity tracking.
4. Add `databaseHooks.user.create.after` logic in auth config:
   - Filter to `isAnonymous === true`.
   - Increment `site_counters` atomically via upsert.
5. Update auth client plugins to include `anonymousClient()`.
6. Add an app-wide client component (`EnsureAnonymous`) that:
   - Waits for `useSession()` to settle.
   - Calls `signIn.anonymous()` only when no session exists.
   - Treats repeat/duplicate failures as non-fatal.

## Key Design Notes

- Hooking on `user.create.after` matches design direction and counts anonymous users created through any auth entrypoint.
- Since Phase 1 hardens auth semantics, anonymous auto-session creation should not unlock protected functionality.
- Implementing `onLinkAccount` now keeps migration logic centralized before anonymous actions are enabled later.

## Code Snippets

```ts
// apps/api/src/lib/auth.ts (conceptual)
anonymous({
  onLinkAccount: async ({ anonymousUser, newUser, ctx }) => {
    await migrateAnonymousDataToUser({
      anonymousUserId: anonymousUser.user.id,
      newUserId: newUser.user.id,
    });
  },
}),

databaseHooks: {
  user: {
    create: {
      after: async (createdUser) => {
        if (!createdUser.isAnonymous) return;
        await db
          .insert(siteCounters)
          .values({ key: "unique_visitors", value: 1 })
          .onConflictDoUpdate({
            target: siteCounters.key,
            set: { value: sql`${siteCounters.value} + 1` },
          });
      },
    },
  },
}
```

```tsx
// EnsureAnonymous.tsx (conceptual)
if (!isPending && !session) {
  await authClient.signIn.anonymous();
}
```

## Verification Checklist

- [x] Fresh browser session gets anonymous user/session automatically.
- [x] Repeated navigation/refresh in same session does not increment counter again.
- [x] Anonymous sign-in errors for already-anonymous sessions are handled gracefully.
- [x] Linking anonymous session to real social sign-in completes cleanly via `onLinkAccount`.
- [x] Anonymous user cleanup after linking succeeds without FK errors.
- [x] `pnpm -F @slop/api exec tsc --noEmit`
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Anonymous identity is provisioned automatically across the app.
- Anonymous user creation reliably increments the global visitor counter.

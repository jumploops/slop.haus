# Phase 3: Web UX + Settings

## Status

**Status:** Completed (2026-02-09)  
**Owner:** Web  
**Depends On:** Phase 2

## Goal

Deliver a smooth username-management experience and update all user-facing identity labels to username.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/app/settings/profile/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/auth-client.ts`
- `/Users/adam/code/slop.haus/apps/web/src/components/layout/MobileNav.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/AuthButtons.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/EditableProject.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/comment/CommentItem.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/admin/users/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/admin/page.tsx`

## Tasks

1. Replace “Display Name” UX with “Username” UX in settings.
2. Use Better Auth update-user action to save username changes (session-aware).
3. Add client-side username validation:
   - allowed chars
   - length bounds
   - normalization preview behavior
4. Update all label renderers from `.name` to `.username`.
5. Keep style language plain username (no `@`).
6. Add clear success/failure feedback for conflicts and invalid values.

## Optional UX Enhancements In Scope (if small)

- Debounced username availability check endpoint integration.
- Inline “generated username” hint text for Google-random accounts.

## Code Snippets

```typescript
// settings save flow (conceptual)
await authClient.updateUser({ username: normalizedUsername });
await mutate("/auth/me");
showToast("Username updated", "success");
```

```tsx
// label usage
<span className="font-mono">by {project.author.username}</span>
```

## Verification Checklist

- [ ] Settings page updates username and reflects it immediately in header/nav.
- [ ] Validation errors are user-friendly and block invalid submissions.
- [ ] Identity labels across feed/project/comments/admin use username.
- [ ] No UI surface shows `name` as identity text.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Username editing feels reliable and clear.
- UI is fully aligned with username-first identity.

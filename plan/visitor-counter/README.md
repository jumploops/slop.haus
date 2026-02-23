# Visitor Counter Implementation Plan

**Status:** Completed  
**Last Updated:** 2026-02-23  
**Owner:** API + Web + DB

## Overview

Implement the 90s/early-2000s visitor counter from `design/anon-user-based-visitor-counter.md` by replacing the current localStorage counter with an all-time server counter that increments when Better Auth creates a new anonymous user.

## Current Codebase Findings

- `apps/web/src/components/layout/VisitorCounter.tsx` is currently localStorage-only and increments on every first render per browser profile.
- `apps/api/src/lib/auth.ts` already has `session.cookieCache.enabled = true`, which matches the design requirement.
- The installed auth runtime is `better-auth@1.4.10` (not `1.2.3`), and anonymous plugin APIs are available.
- Existing `requireAuth()` currently accepts any valid session; once anonymous sessions are auto-created, this would effectively unlock many protected routes.
- `apps/api/src/routes/likes.ts` currently stores `session.user.id` when present; with anonymous auto-sessions, this can create rows that block anonymous-user deletion during account linking unless we guard it.

## Decisions Locked

1. Count all-time unique visitors (no daily/weekly breakdown for now).
2. Count every anonymous user (including bots/internal traffic).
3. Use a single-row Postgres counter table (`site_counters`) for correctness.
4. Increment via `databaseHooks.user.create.after` when `isAnonymous` is true.
5. Counter starts at `1` (current prod baseline).
6. Keep current UI behavior for now: anonymous sessions should still see signed-out UX (sign-in CTAs and existing auth gates).
7. Implement `onLinkAccount` now for seamless anonymous-to-real conversion, even if migration payload is currently minimal.
8. Keep default anonymous cleanup behavior (`disableDeleteAnonymousUser` unset/false) unless a concrete data-retention requirement appears.
9. Site is pre-launch; no staged migration/deployment workflow is required.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Auth Boundary + Schema Foundation](./phase-1-auth-boundary-and-schema-foundation.md) | Completed | Upgrade/verify Better Auth baseline, add `isAnonymous`, add counter table, and harden API auth semantics |
| 2 | [Anonymous Plugin + Counter Write Path](./phase-2-anonymous-plugin-and-counter-write-path.md) | Completed | Enable anonymous auth, implement `onLinkAccount`, and increment counter atomically on anonymous user creation |
| 3 | [Counter Read API + UI Wiring](./phase-3-counter-read-api-and-ui-wiring.md) | Completed | Add cacheable visitor-count API endpoint and connect existing counter UI |
| 4 | [Web Auth UX Alignment + Final Verification](./phase-4-web-auth-ux-alignment-and-final-verification.md) | Completed | Ensure anonymous users are treated as guests in UI and run end-to-end verification |

## Dependency Graph

```text
Phase 1 (Auth Boundary + Schema)
  -> Phase 2 (Anonymous Plugin + Counter Increment)
    -> Phase 3 (Read API + VisitorCounter UI)
      -> Phase 4 (UX Alignment + Verification)
```

## Follow-Up Tracking

- Future enhancement work for broader anonymous actions (likes/comments with abuse controls) is explicitly tracked in `/Users/adam/code/slop.haus/TODO.md`.

## Success Criteria

- First visit from a new browser creates an anonymous session and increments counter exactly once.
- Returning visitors do not increment counter.
- Counter initial value is `1` before first anonymous increment.
- Visitor counter UI reads from API/DB instead of localStorage.
- Existing protected flows (submit, favorites, comments, settings, admin/mod actions) remain gated to non-anonymous users.
- Anonymous-to-real-account conversion works without FK conflicts.

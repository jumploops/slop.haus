# Username System Implementation Plan

## Overview

Implement Option B from `design/username-system-design.md`: add a dedicated username system and make username the primary public identity across API and web.

## Current Status

**Status:** In Progress  
**Last Updated:** 2026-02-09

## Product Decisions Locked

1. Usernames are fully editable at any time (no cooldown in initial launch).
2. Plain `username` is used in UI (no `@` prefix).
3. The app should move off user-facing `name` usage now (pre-launch, no backwards-compat requirement).
4. Generator should avoid bad names.
5. Defer: cooldown/rate limit, username history, GitHub-handle adoption suggestion (tracked in `TODO.md`).

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Schema + Auth Foundation](./phase-1-schema-auth-foundation.md) | Completed | Add username fields, generation/validation logic, and Better Auth hooks |
| 2 | [API Contract Cutover](./phase-2-api-contract-cutover.md) | Completed | Move API/user contracts from `name` to `username` |
| 3 | [Web UX + Settings](./phase-3-web-ux-settings.md) | Completed | Build username editing UX and update all UI surfaces |
| 4 | [Cleanup + Verification](./phase-4-cleanup-verification.md) | In Progress | Remove remaining `name` usage in app layer, update seeds/docs/tests |

## Dependency Graph

```text
Phase 1 (Schema + Auth)
  -> Phase 2 (API Contract)
    -> Phase 3 (Web UX)
      -> Phase 4 (Cleanup + Verification)
```

## Rollout Notes

- Pre-launch assumption: no production users yet.
- Local/dev data may exist; plan includes low-friction migration/backfill approach for developer environments.
- If migration noise appears locally, reset/reseed is acceptable during pre-launch.

## Success Criteria

- New GitHub signup defaults to GitHub handle-derived username.
- New Google signup defaults to generated safe username.
- Users can edit username successfully with clear validation feedback.
- All project/comment/author identity labels render from username, not name.
- No frontend calls remain to `PATCH /api/v1/users/me`.

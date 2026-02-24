# Repo Import Implementation Plan

## Overview

Implement GitHub public-repo selection in submit flows, without storing repo catalogs in our DB, and while keeping current GitHub submission gating.

**Design Doc:** `design/github-public-repo-picker.md`

## Status: Completed

**Last Updated:** 2026-02-24

## Confirmed Product Decisions

- GitHub remains required for submission (no auth-gating changes).
- Show all public repos available to the user (owner/collaborator/org-member).
- Include forks and archived repos.
- Keep current GitHub scopes (`read:user`, `user:email`).
- No server-side caching in v1.
- Show repo picker only on initial submit pages (`/submit`, `/submit/manual`), not draft review.

## Phase Summary

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | [Backend GitHub Repo API](./phase-1-backend-github-repo-api.md) | ✅ Complete | Added ephemeral paginated repo endpoint in auth routes |
| 2 | [Web Data Layer + Repo Picker](./phase-2-web-data-and-picker.md) | ✅ Complete | Added client API + reusable picker component |
| 3 | [Submit Integration + UX Copy](./phase-3-submit-integration-and-copy.md) | ✅ Complete | Integrated picker into `/submit` and `/submit/manual` |
| 4 | [Verification + Polish](./phase-4-verification-and-polish.md) | ✅ Complete | Typechecks pass and flow-specific QA checklist captured |

## Dependencies

```text
Phase 1 (API endpoint)
  -> Phase 2 (web API client + picker UI)
      -> Phase 3 (submit-page integration + copy updates)
          -> Phase 4 (verification + polish)
```

## Milestones

### Milestone 1: Repo API Ready (Phase 1)
- `GET /api/v1/auth/github/repos` returns all public repos with pagination handling.
- Works for linked and unlinked users.

### Milestone 2: Picker UI Ready (Phase 2)
- Reusable picker component can load/filter/select repos.
- Repo selection callback can populate existing URL fields.

### Milestone 3: End-to-End Submit UX (Phase 3)
- Picker integrated in `/submit` and `/submit/manual`.
- Manual URL entry still works alongside picker.
- Non-GitHub users keep current gate UI + improved callout copy.

### Milestone 4: Ready to Implement Confidently (Phase 4)
- Typechecks pass for touched packages.
- QA checklist complete for main and edge flows.

## Non-Goals

- No database schema changes.
- No private repository access.
- No repo-list caching layer in v1.
- No integration in draft review page.

## Exit Criteria

- Plan phases are unambiguous and implementation-ready.
- File-level scope is defined before coding starts.
- Verification steps are explicit for API and web flows.

# Featured Hot Section Implementation Plan

## Overview

Implement the featured-projects experience from `design/featured-hot-section.md`:
- Show featured projects only on the `hot` feed (page 1 only), up to 3 items.
- Keep `new` and `top` behavior unchanged.
- Allow only admins to feature/unfeature projects.
- Show featured cards with a gold square + star badge.
- Keep normal list ranking independent of featured cards (first non-featured rank is always `1`).

## Status: In Progress

**Last Updated:** 2026-03-02  
**Owner:** API + Web + DB

## Confirmed Product Decisions

1. Maximum displayed featured projects: 3.
2. Featured ordering: `featuredAt DESC`.
3. Featured section appears only on `hot`.
4. Featured section appears only on first page of `hot`.
5. Featured rows must satisfy active feed filter criteria.
6. Featured projects may still appear as normal rows in `new` and `top`.
7. Admin featuring controls live on project detail pages only.
8. Feature/unfeature actions must be auditable (`moderation_events`).
9. No global featured-count cap enforced at write time.
10. Featured cards use a gold star badge (not numeric rank).
11. First non-featured card is rank `1`; featured cards do not affect numeric rank.

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Database Schema + Migration](./phase-1-database-schema-and-migration.md) | ✅ Completed | Add featured columns/indexes and export schema updates |
| 2 | [Feed API Read Path](./phase-2-feed-api-read-path.md) | ✅ Completed | Return `featuredProjects` for hot/page-1 and prevent duplicates |
| 3 | [Admin Feature/Unfeature API + Audit](./phase-3-admin-feature-write-path-and-audit.md) | ✅ Completed | Admin-only feature toggles and moderation-event audit logging |
| 4 | [Web Feed + Project Detail UI](./phase-4-web-feed-and-admin-ui.md) | ✅ Completed | Render featured section, star badge, rank rules, and admin controls |
| 5 | [Verification + Polish](./phase-5-verification-and-polish.md) | 🔄 In Progress | Typechecks, behavioral QA, and regression checks |

## Dependencies

```text
Phase 1 (DB schema/migration)
  -> Phase 2 (feed read API contract)
    -> Phase 4 (feed UI integration)

Phase 1 (DB schema/migration)
  -> Phase 3 (admin write endpoints + audit logs)
    -> Phase 4 (project detail admin controls)

Phase 2 + Phase 3 + Phase 4
  -> Phase 5 (verification + polish)
```

## Milestones

### Milestone 1: Data Foundation Ready (Phase 1)
- Featured metadata exists on projects.
- Indexes support featured retrieval.
- Migration is tracked and metadata is in sync.

### Milestone 2: API Contract Ready (Phases 2-3)
- Feed endpoint returns `featuredProjects` with correct hot-only/page-1 behavior.
- Admin feature/unfeature endpoints enforce `requireAdmin()`.
- Audit rows are emitted for feature lifecycle actions.

### Milestone 3: UX Integration Ready (Phase 4)
- Hot feed renders featured section with gold star badges.
- Standard cards start ranking from `1` and ignore featured count.
- Admin can toggle feature state from project detail page.

### Milestone 4: Release Confidence (Phase 5)
- Typechecks and manual QA pass across API/web/DB changes.
- No duplicate cards in hot between featured and standard list.
- `new` and `top` remain behaviorally stable.

## Non-Goals

- Manual featured priority/ordering UI.
- Scheduled featured expirations.
- Mod-level feature permissions.
- Additional admin pages for feature management (beyond project detail page).

## Exit Criteria

- All phase docs are implementation-ready and reviewed.
- API and UI behavior matches confirmed product decisions.
- Verification checklist is complete with no unresolved blockers.

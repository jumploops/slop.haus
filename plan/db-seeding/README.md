# DB Seeding Implementation Spec (Heavy Only)

## Status
- **State:** Draft
- **Owner:** TBD
- **Last Updated:** 2026-02-01

## Goals
- Provide deterministic, idempotent seed data for **~200 projects** (single heavy tier).
- Keep seed workflow simple (`pnpm --filter @slop/db seed`), no additional modes.
- Avoid external services or image downloads; **use fallback images** in UI.
- Seed realistic data across all core tables so the app feels real in dev.

## Non-Goals
- Production data migration.
- Multi-tier seed sizes (base/demo).
- Real screenshots or uploads.

## Constraints & Assumptions
- PostgreSQL + Drizzle ORM via `packages/db`.
- Seed should be safe to re-run (no duplicates, stable IDs).
- No network calls or file system writes outside DB.

## Scope (Tables)
- **Required:** `user`, `projects`, `tools`, `project_tools`, `comments`, `project_likes`, `comment_votes`, `favorites`.
- **Optional but useful:** `project_revisions`, `moderation_events`, `flags`, `enrichment_drafts`.
- **Skip by default:** `project_media` (rely on fallback images), `jobs`, `rate_limits`, `locks`.

## Data Design
### Users
- Seed 6–10 users with stable string IDs and predictable emails.
- Roles: 1 admin, 1 mod, 1–2 devVerified, remaining standard users.
- Example:
  - `admin@slop.haus` (admin, devVerified)
  - `mod@slop.haus` (mod)
  - `dev@slop.haus` (user, devVerified)
  - `viewer@slop.haus` (user)

### Projects (~200)
- Deterministic slugs and titles; stable author assignment.
- Mix of `status`: 80% `published`, 15% `hidden`, 5% `removed`.
- Vibe values:
  - `vibeMode`: `overview`/`detailed` roughly 60/40 split.
  - `vibePercent`: 5–95 with skew toward 30–70.
- Score fields seeded with plausible values (not all zeros):
  - `slopScore`: 0.5–9.5 (numeric)
  - `hotScore`: 0–200 (numeric)
  - `likeCount`, `reviewCount`, `reviewScoreTotal`, `commentCount`: consistent with generated relationships.
- URLs:
  - Mix of `mainUrl`/`repoUrl` present or null to test empty states.

### Tools + Project Tools
- Use existing `commonTools` list.
- Attach 2–5 tools per project, deterministic based on project index.

### Comments + Votes
- 3–10 comments per project average (with a few deeper threads).
- Depth 0–2, mix of `reviewScore` (1–5 skewed toward 2–3).
- `comment_votes` seeded for a subset of comments with unique (commentId, userId).

### Likes + Favorites
- `project_likes`: mix of `public` and `dev` rater types.
- Use stable `raterKeyHash` (e.g., hash of `userId|projectId|raterType`).
- `favorites`: 20–40% of users favorite 10–30 projects.

### Revisions (Optional)
- 1–2 revisions on ~15% of projects.
- Mix statuses: pending/approved/rejected.
- `changedFields` aligned with provided updates.

### Moderation + Flags (Optional)
- Small set of `moderation_events` and `flags` to test UI.
- Target a mix of projects/comments.

### Enrichment Drafts (Optional)
- 10–20 drafts across statuses (`pending`, `ready`, `failed`).
- Include realistic `suggested_*` fields.

## Implementation Plan
### File Structure
- Keep `packages/db/src/seed.ts` as the entrypoint.
- Add seed modules:
  - `packages/db/src/seed/users.ts`
  - `packages/db/src/seed/projects.ts`
  - `packages/db/src/seed/tools.ts`
  - `packages/db/src/seed/comments.ts`
  - `packages/db/src/seed/interactions.ts`
  - `packages/db/src/seed/moderation.ts`
  - `packages/db/src/seed/enrichment.ts`
  - `packages/db/src/seed/utils.ts` (PRNG, helpers)

### Determinism
- Implement a tiny PRNG (mulberry32) in `seed/utils.ts` with a fixed seed.
- Use stable IDs where feasible:
  - Users: string IDs (`user_admin`, `user_mod`, etc.).
  - Projects: stable UUIDs (precomputed list or deterministic uuid v5-style).
- Use `onConflictDoNothing` or `onConflictDoUpdate` for unique constraints.

### Seeding Order
1. Tools
2. Users
3. Projects
4. Project tools
5. Comments
6. Likes / Favorites / Comment votes
7. Revisions (optional)
8. Moderation / Flags (optional)
9. Enrichment drafts (optional)

### Script Behavior
- Single mode only (“heavy”).
- `pnpm --filter @slop/db seed` runs the heavy seed with defaults.
- Output summary: counts per table and total runtime.

## Verification Checklist
- `pnpm db:push` then `pnpm --filter @slop/db seed` completes without errors.
- Project list shows ~200 projects with diverse statuses and vibes.
- Comments/reviews render with realistic distribution.
- No duplicate key violations on re-run.
- UI uses fallback images (no project media seeded).

## Future Notes
- Add optional fixture user later (see `TODO.md`).

# Database Seeding Design (Pre-Launch)

## Summary
We need a repeatable, developer-friendly seeding workflow that provides realistic demo data across all core tables (projects, users, comments, votes, etc.) without relying on external services. Seeds should be deterministic, idempotent, and fast, with clear entry points for local/dev environments.

## Current State (Review)
- **Schema** lives in `packages/db/src/schema/*` with core tables: users/auth, projects, comments, likes/votes, favorites, tools, moderation, enrichment drafts, jobs, rate-limits, locks.
- **Seed implementation** is a single script: `packages/db/src/seed.ts`, which only seeds `tools`.
- Root workflow: README mentions `pnpm db:push` then `pnpm --filter @slop/db seed`.

## Goals
- Provide **baseline** data that makes the product feel real in dev.
- Make seeding **deterministic and idempotent** (safe to re-run).
- Support **multiple modes** (tiny, demo, heavy) so devs can choose size.
- Avoid external network calls (Firecrawl/Anthropic) during seed.
- Include **example data** for all key product flows:
  - Project listing, reviews/comments, likes/favorites, moderation, enrichment drafts.

## Non-Goals
- Not a production migration system.
- Not a full test data generator framework.

## Data Coverage (Tables)
1. **user, session, account, verification**
   - Seed a small set of stable users: `admin`, `mod`, `dev`, `public`.
   - Only `user` table needed for most dev flows; other auth tables can remain empty unless a flow depends on them.

2. **projects, project_revisions, project_media, tools, project_tools**
   - Seed 20–50 projects in demo; 200+ in heavy.
   - Mix of statuses: `published`, `hidden`, `removed`.
   - Vibe mix: `overview`/`detailed` and varying `vibePercent`.
   - Media: 1–3 per project, with at least one `isPrimary` true.
   - Tools: attach 2–5 per project from seeded tools.
   - Revisions: a few per project, mix of `pending/approved/rejected`.

3. **comments**
   - Threaded data with depth 0–2.
   - Mix of `reviewScore` values with realistic distribution.
   - Include `hidden` and `removed` examples.

4. **project_likes, comment_votes, favorites**
   - Likes by both `public` and `dev` rater types.
   - Ensure uniqueness constraints with stable `raterKeyHash`.
   - Favorites for 20–40% of users.

5. **moderation_events, flags**
   - Seed a few auto moderation events and user flags to test UI/ops.

6. **enrichment_drafts**
   - Seed a handful of drafts in different statuses (`pending`, `ready`, `failed`).
   - Include `scraped_metadata`, `suggested_*` fields with realistic placeholders.

7. **jobs, rate_limits, locks**
   - Optional minimal entries for UI validation/debug.
   - Default: leave empty unless there is a feature depending on them.

## Example Seed Data (Suggested)
- **Users**
  - `admin@slop.haus` (role: admin, devVerified: true)
  - `mod@slop.haus` (role: mod)
  - `dev@slop.haus` (role: user, devVerified: true)
  - `viewer@slop.haus` (role: user)

- **Projects** (examples)
  - `ai-todo-mirror` (tagline: "Ship a TODO app in 7 seconds")
  - `vibe-portfolio` (tagline: "Your bio, but make it neon")
  - `slop-board` (tagline: "A kanban board that auto-critiques itself")
  - Include projects with missing `mainUrl` or `repoUrl` to test empty states.

- **Comments / Reviews**
  - Mix of short quips and longer reviews.
  - Add a few `reviewScore` values: 1–5 with skew toward 2–3.

- **Tools**
  - Keep current `commonTools` list as baseline.

## Seed Tiers / Modes
- **base**: tools + 4 users + 10 projects + minimal relationships.
- **demo**: base + 30 projects + comments/reviews + likes/favorites + media.
- **heavy**: demo + 200+ projects + deeper comment trees for perf testing.

## Script/CLI Plan
Add structured scripts that are easy to run from the root:

- `pnpm --filter @slop/db seed` -> defaults to `demo`.
- `pnpm --filter @slop/db seed:base`
- `pnpm --filter @slop/db seed:demo`
- `pnpm --filter @slop/db seed:heavy`
- `pnpm db:reset` (root script): drop + push + seed:demo (dev only).

**Implementation idea:**
- Move `packages/db/src/seed.ts` into a small orchestrator that reads `SEED_MODE` or CLI args.
- Break data creation into modules:
  - `packages/db/src/seed/users.ts`
  - `packages/db/src/seed/projects.ts`
  - `packages/db/src/seed/comments.ts`
  - `packages/db/src/seed/interactions.ts`
  - `packages/db/src/seed/moderation.ts`
  - `packages/db/src/seed/enrichment.ts`
  - `packages/db/src/seed/tools.ts` (existing list)

## Determinism & Idempotency
- Use stable IDs for seed records (string IDs for users, fixed UUIDs for projects).
- Use `onConflictDoNothing`/`onConflictDoUpdate` for tables with unique constraints.
- Use deterministic pseudo-random generator with a fixed seed (no external deps).
- Keep `slug` values stable for projects to prevent churn.

## Safety & Constraints
- Avoid referencing external services in seed flows.
- Do not create auth sessions/accounts by default unless a feature requires it.
- Preserve `soft delete` semantics (avoid setting `deletedAt` unless testing).

## Verification Checklist
- `pnpm db:push` then seed mode completes without errors.
- Project list renders with seeded projects, media, tools.
- Review/comment widgets show valid data.
- Moderation/flag admin pages show entries.
- Rerunning seed does not create duplicates.

## Open Questions
- Should we include a “fixture user” to use in Cypress/Playwright login flows?
- Do we want seed data to include real local screenshots in `uploads/`?

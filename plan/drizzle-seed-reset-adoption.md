# Drizzle-Seed Reset Adoption Spec

## Status
- State: Implemented
- Owner: Codex
- Last Updated: 2026-02-08

## Goal

Adopt `drizzle-seed` reset support in the local DB workflow so developers can reliably reset and reseed with one command, without manual `psql` schema drops.

## Non-Goals

- No production reset workflow.
- No change to data model or seed data content (other than reset behavior).
- No migration strategy changes (`db:push`/`db:migrate` stay as-is).

## Current Implementation Review

### 1) Seed orchestration is monolithic and CLI-coupled

Current seed entrypoint (`packages/db/src/seed.ts`) does all orchestration and immediately executes with `process.exit()`.  
This makes it harder to reuse from a second script (like `reset + seed`) without refactoring.

References:
- `packages/db/src/seed.ts`

### 2) No reset script exists today

`@slop/db` scripts currently include:
- `push`, `migrate`, `studio`, `seed`

No `reset` script is present.

References:
- `packages/db/package.json`
- root scripts in `package.json`

### 3) Schema exports are already suitable for `drizzle-seed` reset

The DB package exports all schema modules from `src/schema/index.ts`, and DB initialization is centralized in `src/index.ts`.  
This is a good fit for `reset(db, schema)`.

References:
- `packages/db/src/schema/index.ts`
- `packages/db/src/index.ts`

### 4) Current seeding assumes additive/idempotent behavior

Current seed logic includes defensive behavior around mixed datasets (example: skipping some aggregate updates if non-seed rows exist).  
A reset-first flow can simplify expected state, but this is separate from the reset integration itself.

Reference:
- `packages/db/src/seed.ts`

## Proposed Approach

### Recommended command semantics

1. Keep existing `seed` command non-destructive (for compatibility).
2. Add a new destructive command for local development:
- `seed:reset` (inside `@slop/db`) runs reset then seed.
3. Add root alias:
- `db:reset` -> `pnpm --filter @slop/db run seed:reset`

Rationale:
- Avoid surprising destructive behavior on plain `seed`.
- Provide explicit reset intent.

## Implementation Plan

### Workstream 1: Add dependency + reset utility

Tasks:
1. Add `drizzle-seed` dependency in `packages/db/package.json`.
2. Add reset helper script/module (for example `packages/db/src/reset.ts`) using:
- `import { reset } from "drizzle-seed"`
- `import { db } from "./index"`
- `import * as schema from "./schema"`

Deliverable:
- Reusable reset function that can be called from CLI wrapper and/or tests.

### Workstream 2: Refactor seed orchestration for reuse

Tasks:
1. Refactor current `packages/db/src/seed.ts` to expose a reusable function, for example:
- `export async function seedDatabase()`
2. Keep a thin CLI wrapper so current `pnpm --filter @slop/db seed` continues to work.

Deliverable:
- Seed logic callable from `seed` and `seed:reset`.

### Workstream 3: Add reset+seed entrypoint and scripts

Tasks:
1. Add `packages/db/src/seed-reset.ts` (or similar) that:
- runs reset first
- then calls `seedDatabase()`
2. Add scripts in `packages/db/package.json`:
- `reset`
- `seed:reset`
3. Add root script in `package.json`:
- `db:reset`

Deliverable:
- One command for local clean slate.

### Workstream 4: Safety guardrails

Tasks:
1. Add a guard to destructive reset command:
- fail fast if `DATABASE_URL` appears non-local
2. Allow explicit override with env flag, for example:
- `ALLOW_DB_RESET=1`

Deliverable:
- Reduced chance of accidental reset against shared/prod DB.

### Workstream 5: Docs update

Tasks:
1. Update `README.md` local setup section to include:
- `pnpm db:reset` for clean reset+seed
2. Clarify difference:
- `seed` = non-destructive
- `db:reset` / `seed:reset` = destructive

Deliverable:
- Clear local developer workflow.

## Files Expected to Change

- `packages/db/package.json`
- `packages/db/src/seed.ts`
- `packages/db/src/reset.ts` (new)
- `packages/db/src/seed-reset.ts` (new)
- `package.json` (root)
- `README.md`

## Verification Checklist

1. `pnpm db:push` completes successfully.
2. `pnpm db:reset` resets and reseeds without manual SQL commands.
3. Running `pnpm db:reset` twice is deterministic and succeeds both times.
4. `pnpm --filter @slop/db seed` still works and remains non-destructive.
5. Guard blocks destructive reset against clearly non-local DB URLs unless override is set.

Verification notes:
- Dependency install and lockfile update completed with `pnpm --filter @slop/db add drizzle-seed@^0.3.1`.
- `@slop/db` typecheck currently fails due existing pre-existing seed typing issues outside this workstream.
- Runtime script execution inside this sandbox is limited by a `tsx` IPC permission error, so reset/seed commands were validated by implementation review rather than full execution.

## Risks

1. Accidental destructive reset if guard logic is too permissive.
2. Unexpected behavior if `drizzle-seed` reset interacts with tables/extensions outside exported schema.
3. Developer confusion if command semantics are not explicit in docs.

## Resolved Decisions

1. `seed` remains non-destructive. Reset behavior is explicit via `seed:reset` and root `db:reset`.
2. Default local reset host allowlist: `localhost`, `127.0.0.1`, `::1`, `db`, `postgres`.
3. Reset is introduced for local workflows now; CI adoption can be handled in a follow-up if needed.

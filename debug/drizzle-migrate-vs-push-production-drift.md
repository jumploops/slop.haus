# Drizzle Migration Drift Investigation (`db:push` vs `db:migrate`)

**Date:** 2026-02-07  
**Status:** Remediated in repo (pending prod validation)

## Problem
Production API fails with:

- `PostgresError: column projects.hot_score does not exist` (SQLSTATE `42703`)

But `pnpm db:migrate:prod` reports success.

## Goal
Determine why `db:migrate:prod` reports success while schema appears to be missing migration `0005_add_hot_score`.

## Findings

### 1) Migration files and migration journal are out of sync in repo
SQL files present:
- `0000_broken_frank_castle`
- `0001_steady_joshua_kane`
- `0002_voting_reviews`
- `0003_drop_vote_columns`
- `0004_rate_limits`
- `0005_add_hot_score`
- `0006_locks`

Journal entries (`packages/db/drizzle/meta/_journal.json`) only include:
- `0000_broken_frank_castle`
- `0001_steady_joshua_kane`
- `0002_voting_reviews`
- `0003_drop_vote_columns`

Implication: Drizzle migrate may never consider `0004`/`0005`/`0006` as pending tracked migrations.

### 2) `migrate:prod` currently loads local `.env.prod`
`packages/db/package.json`:
- `"migrate:prod": "dotenv -e ../../.env.prod drizzle-kit migrate"`

Implication: local migration command may run against a different DB than Render API if `.env.prod` is stale/mismatched.

### 3) Historical workflow used `db:push` in development
`db:push` mutates schema directly and does not depend on tracked migration history like `db:migrate`.

Implication: easy to accumulate schema state that exists in dev but is not reproducible from migration files/journal in prod.

### 4) Drizzle metadata chain was internally broken
- `0002_snapshot.json` and `0003_snapshot.json` had a parent/id collision.
- `drizzle-kit generate` failed with:
  - `are pointing to a parent snapshot ... which is a collision`

### 5) `.gitignore` excluded migrations from source control
- `.gitignore` had:
  - `packages/db/drizzle/`
- Result: migration SQL and meta files were not tracked in git.
- Implication: Render/CI deploys could run migration commands without having canonical migration files from repo history.

## Primary Hypotheses

### H1 (high confidence): wrong target DB during migration run
`db:migrate:prod` may be applying against DB-A (from local `.env.prod`) while API is querying DB-B (Render service env `DATABASE_URL`).

### H2 (high confidence): migration ledger drift
Even if target DB is correct, Drizzle migration tracking may skip `0004`+ because `_journal.json` does not include these tags.

### H3 (medium confidence): mixed `push` + `migrate` workflow caused non-replayable schema
Dev schema evolved via `push`; prod is replaying migration journal, which may not include all intended SQL evolution.

## Validation Plan

### Step A: prove API DB target
From Render API shell:

```bash
node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname, db:u.pathname.slice(1)});"
```

### Step B: prove migration DB target
From the environment where `pnpm db:migrate:prod` is run:

```bash
node -e "const u=new URL(process.env.DATABASE_URL); console.log({host:u.hostname, db:u.pathname.slice(1)});"
```

If host/db differ from Step A, H1 is confirmed.

### Step C: check actual schema in API DB
Run against API DB:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name = 'hot_score';
```

### Step D: inspect migration history in API DB

```sql
SELECT id, hash, created_at
FROM drizzle.__drizzle_migrations
ORDER BY created_at;
```

(If table is not in `drizzle` schema in your DB, try `public.__drizzle_migrations`.)

## What we are likely doing incorrectly
1. Using `db:push` as primary schema evolution in dev while expecting `db:migrate` replay in prod.
2. Treating presence of SQL files as sufficient, without ensuring migration journal/tracking includes them.
3. Running `migrate:prod` from local `.env.prod` instead of the exact deployed API `DATABASE_URL` source of truth.

## Proposed Remediation (safe order)
1. **Standardize prod migration execution target**:
   - Run migrations using the exact Render API `DATABASE_URL` (from Render env or migration job in Render).
2. **Repair migration ledger drift**:
   - Create a new tracked migration that includes missing additive changes (`hot_score`, `rate_limits`, `locks`) and ensure it is properly journaled.
   - Prefer one new canonical migration over relying on untracked historical SQL files.
3. **Process change**:
   - For schema changes: generate tracked migration first, then apply with `migrate` in all environments.
   - Reserve `db:push` for disposable/local-only workflows, not as primary path.

## Remediation Implemented

1. **Repaired Drizzle metadata chain**
   - Fixed `packages/db/drizzle/meta/0003_snapshot.json` `id`/`prevId` so snapshot lineage is valid.

2. **Generated canonical tracked reconciliation migration**
   - New migration: `packages/db/drizzle/0004_curious_magik.sql`
   - Added to journal: `packages/db/drizzle/meta/_journal.json`
   - Includes missing schema changes (`rate_limits`, `locks`, `projects.hot_score`, enum additions) and is idempotent/safe for mixed environments.

3. **Removed untracked legacy drift files**
   - Deleted:
     - `packages/db/drizzle/0004_rate_limits.sql`
     - `packages/db/drizzle/0005_add_hot_score.sql`
     - `packages/db/drizzle/0006_locks.sql`
   - This removes ambiguous duplicate migration paths.

4. **Hardened production migration command target behavior**
   - Updated `packages/db/package.json`:
     - `migrate:prod` now runs `drizzle-kit migrate` directly (no local `.env.prod` indirection).
   - `DATABASE_URL` must now be provided by the execution environment (Render shell/CI), matching deployed services.

5. **Preventive policy update**
   - Added migration safety rules to `AGENTS.md` to prevent `push`/`migrate` drift recurrence.

6. **Stopped ignoring migration directory**
   - Removed `packages/db/drizzle/` from `.gitignore`.
   - Migration SQL + meta files can now be versioned and deployed consistently.

## Repository Validation
- `pnpm -F @slop/db run generate` now succeeds and reports:
  - `No schema changes, nothing to migrate`
- This confirms metadata/journal/snapshots are internally consistent again.

## Immediate Workaround (if API is down)
Apply additive SQL directly to the production DB:

```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS hot_score numeric(10,4) DEFAULT '0' NOT NULL;

CREATE INDEX IF NOT EXISTS projects_hot_score_idx ON projects (hot_score);
```

Then redeploy API (or restart) and continue with migration-ledger cleanup.

## Production Validation Checklist (next action)
1. In Render (same environment as `slop-api`), run:
   - `pnpm db:migrate:prod`
2. Verify schema in API DB:
   - `SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='hot_score';`
3. Verify migration ledger includes new tag/hash row for `0004_curious_magik`.
4. Restart/redeploy API and confirm `/api/v1/projects?sort=hot...` returns 200.

# Render API Error: `projects.hot_score` Missing

**Date:** 2026-02-07  
**Status:** Superseded by `debug/drizzle-migrate-vs-push-production-drift.md`

## Symptom
API requests to `/api/v1/projects` fail with:

- `PostgresError: column projects.hot_score does not exist`
- SQLSTATE `42703`

## Root Cause
Application code orders feed results by `projects.hot_score`, but production schema drift prevented the migration-backed column from being present in the API target DB.

## Why this is not SSL-related
The API is successfully connecting to Postgres and executing queries; this failure is a missing column error from the server, not a TLS negotiation error.

## Verification Steps
1. Confirm API service DB target (host + DB name):

```bash
node -e "const u = new URL(process.env.DATABASE_URL); console.log({ host: u.hostname, db: u.pathname.slice(1) });"
```

2. Confirm column presence:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
  AND column_name = 'hot_score';
```

3. Check migration history table:

```sql
SELECT *
FROM "__drizzle_migrations"
ORDER BY created_at DESC;
```

## Fix
Run migrations against the same `DATABASE_URL` used by `slop-api`:

```bash
pnpm db:migrate:prod
```

If running outside the Render service shell, pass the prod URL explicitly:

```bash
DATABASE_URL='postgresql://...'
pnpm db:migrate:prod
```

See `debug/drizzle-migrate-vs-push-production-drift.md` for the full remediation (journal repair, canonical migration, git-tracked migration files, and process updates).

## Post-Fix Validation
- Re-hit:
  - `GET /api/v1/projects?sort=hot&window=all&page=1&limit=20`
- Expect HTTP 200 and no `42703` errors in API logs.

## Preventive Follow-up
- Ensure production deploy flow runs `pnpm db:migrate:prod` before app rollout.
- Keep API and worker `DATABASE_URL` values aligned to the intended production DB.

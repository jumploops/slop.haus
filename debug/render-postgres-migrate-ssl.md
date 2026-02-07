# Render Postgres SSL Migration Issue

**Date:** 2026-02-07  
**Status:** Completed

## Problem
Running production migrations against Render Postgres fails with an SSL/TLS error when invoking `db:migrate`.

## Investigation
1. Reviewed migration command path:
   - root `db:migrate` -> `pnpm --filter @slop/db run migrate`
   - package `@slop/db` `migrate` script -> `dotenv -e ../../.env -- drizzle-kit migrate`
2. Reviewed Drizzle config:
   - `packages/db/drizzle.config.ts` only passed `dbCredentials.url` from `DATABASE_URL`.
3. Reviewed Drizzle Kit runtime behavior (local installed `drizzle-kit` code):
   - In URL-based credential mode, SSL options are not independently provided via config object.
   - Driver relies on SSL parameters in URL / driver defaults.

## Root Cause
`drizzle.config.ts` does not enforce SSL for remote/prod Postgres URLs. If `DATABASE_URL` lacks an SSL mode (e.g., `sslmode=require`), migrations can fail against Render-managed Postgres, which expects TLS.

## Fix Plan
1. Update `packages/db/drizzle.config.ts`:
   - Normalize `DATABASE_URL` before passing to Drizzle.
   - Auto-add `sslmode=require` for non-local hosts when not explicitly set.
   - Preserve explicit SSL config when already present in URL.
2. Add production migration scripts with no `.env` dependency:
   - `packages/db/package.json`: `migrate:prod`
   - root `package.json`: `db:migrate:prod`

## Verification
- Added scripts:
  - root: `db:migrate:prod`
  - package: `@slop/db` -> `migrate:prod`
- Config now auto-adds `sslmode=require` for remote hosts when missing.
- Run `pnpm db:migrate:prod` with prod `DATABASE_URL` set in environment.
- Confirm migrations execute against Render Postgres before deploying app services.

## Notes
- This change is migration-focused. Runtime DB connection behavior for API/worker should still be validated separately in deployment smoke tests.

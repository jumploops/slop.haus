# Render Blueprint Build Failures (web/api)

**Date:** 2026-02-07  
**Status:** Completed

## Problem
Blueprint deploy created all services, but:
- `slop-web` failed during build.
- `slop-api` also failed to deploy.

## Observed Error (web)
- Build log shows: `devDependencies: skipped because NODE_ENV is set to production`
- Then Next tries to install TypeScript at build-time and fails due pnpm install mode conflict.

## Root Cause
`render.yaml` sets `NODE_ENV=production` at service level. During build, `pnpm install --frozen-lockfile` then skips devDependencies, but the web build requires devDependencies (TypeScript / Next build toolchain).

A second config issue likely affects API:
- API/worker `start:prod` runs `tsx src/index.ts`.
- `tsx` is currently in `devDependencies`, so it may be absent if production-only install is used.

## Fix Plan
1. Update Render build commands to install devDependencies explicitly:
   - use `pnpm install --frozen-lockfile --prod=false`.
2. Move `tsx` to runtime `dependencies` in:
   - `apps/api/package.json`
   - `apps/worker/package.json`
3. Regenerate lockfile metadata (`pnpm install`) to keep `--frozen-lockfile` deploys valid.

## Verification
- Confirm `render.yaml` build commands include `--prod=false` for web/api/worker.
- Confirm `tsx` is under `dependencies` for API/worker.
- Confirm `pnpm-lock.yaml` is in sync.
- Redeploy Blueprint and validate service boot.

### Verified in repo
- `render.yaml` now installs with `pnpm install --frozen-lockfile --prod=false` for all services.
- `tsx` moved to `dependencies` in:
  - `apps/api/package.json`
  - `apps/worker/package.json`
- `pnpm-lock.yaml` includes updated importer entries for API/worker dependency move.

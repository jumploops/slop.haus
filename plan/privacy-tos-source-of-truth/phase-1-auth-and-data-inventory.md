# Phase 1 - Auth and Data Inventory

## Status
Completed

## Scope
- OAuth providers, scopes, callback flows, account linking
- Session/auth cookie implementation
- Core database tables/fields and user content fields
- Public/private route behavior from web/api

## Files to Inspect
- `apps/api/src/middleware/*`
- `apps/api/src/routes/*`
- `apps/web/src/lib/api/*`
- `packages/db/src/schema.ts`
- `.env.example`, `README.md`

## Verification
- [x] Providers and scopes documented
- [x] Token storage behavior documented
- [x] Session/cookie model documented
- [x] Core user + content schema documented

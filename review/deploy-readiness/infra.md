# Infra Deploy Readiness Review

**Date:** 2026-01-26
**Status:** Checklist + partial review

## Summary
Infrastructure requirements are not documented in-repo. Several app-level assumptions (uploads, CORS origins, API base URLs) must be reflected in infra configuration.

## Checklist (verify before prod)

### Networking & routing
- [ ] Canonical domains defined (apex vs. www) and enforced in app config.
- [ ] TLS certificates provisioned and auto-renewed.
- [ ] CDN/proxy configured for web static assets and uploads (if applicable).

### Storage & assets
- [ ] Object storage configured for uploads/screenshots; public access policy defined.
- [ ] CDN or image proxy configured and added to Next Image `remotePatterns`.
- [ ] Static uploads serving from API is disabled in production.

### Secrets & config
- [ ] Secrets managed via secure store (not .env in prod).
- [ ] Required env vars configured for web, api, worker (auth, API URLs, storage, DB, keys).
- [ ] CORS allowed origins include all production web domains.

### Scaling & reliability
- [ ] API and worker can scale horizontally without stateful dependencies (rate limiting, uploads, scheduled jobs).
- [ ] DB connection limits and pool sizes set per service.
- [ ] Health checks wired for API and worker readiness/liveness.

## Observations
- Upload storage is local-only in app code; infra needs object storage before production.
- CORS config supports only a single `APP_URL` (may conflict with multi-domain setups).

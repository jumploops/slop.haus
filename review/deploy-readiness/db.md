# DB Deploy Readiness Review (packages/db / database)

**Date:** 2026-01-26
**Status:** Checklist + partial review

## Summary
Database schema and tooling exist, but production readiness depends on migrations, backups, and operational safeguards that are not documented in-repo.

## Checklist (verify before prod)

### Migrations & schema
- [ ] Production uses `drizzle-kit migrate` (tracked migrations), not `push`.
- [ ] Migrations are committed and run in CI/CD with a rollback plan.
- [ ] Schema changes are compatible with zero-downtime deploys (avoid locks for large tables).

### Indexing & performance
- [ ] Indexes exist for top read paths (feeds, comments, votes, drafts).
- [ ] EXPLAIN plans run for feed queries and hot sort alternatives.
- [ ] Connection pool size is tuned for expected traffic.

### Backups & recovery
- [ ] Automated backups configured (daily full, frequent WAL/point-in-time if needed).
- [ ] Restore procedure tested (time-to-restore and data integrity).
- [ ] Retention policy documented.

### Security & access
- [ ] Production DB requires TLS; app connection strings include SSL config.
- [ ] Separate DB roles for app vs. migrations.
- [ ] Secrets stored in a managed secrets system (not .env in prod).

### Data lifecycle
- [ ] Soft-delete retention and cleanup policy documented (e.g., drafts).
- [ ] PII inventory and retention policy documented (user emails, IPs, tokens).

## Observations
- **updatedAt** fields are set in app logic; no DB-level auto-update triggers. This requires discipline across write paths to avoid stale timestamps.
- **Local dev** uses Postgres 16 via `docker-compose.yml`. Ensure prod version compatibility and parameter tuning.

# Ops Deploy Readiness Review

**Date:** 2026-01-26
**Status:** Checklist + partial review

## Summary
Operational runbooks, monitoring, and alerting are not documented in-repo. There are a few app-level behaviors that should be captured in ops procedures.

## Checklist (verify before prod)

### Monitoring & alerting
- [ ] API error rates, latency, and 5xx alerts configured.
- [ ] Worker job queue depth, age, and failure alerts configured.
- [ ] DB CPU, connections, disk, and replication/backup alerts configured.

### Logging & tracing
- [ ] Centralized logging for API and worker.
- [ ] PII redaction rules defined.
- [ ] Request IDs or trace IDs propagated across services.

### Runbooks
- [ ] Incident response playbook (auth outage, DB outage, queue backlog).
- [ ] Manual moderation procedures for flagged content.
- [ ] Restore procedure for uploads and database data.

### Releases
- [ ] Zero-downtime deploy plan (migrations + app rollout order).
- [ ] Rollback plan documented and tested.

## Observations
- API exposes `/health` endpoint for liveness checks.
- Worker has no explicit health endpoint; consider adding a heartbeat metric or status table.

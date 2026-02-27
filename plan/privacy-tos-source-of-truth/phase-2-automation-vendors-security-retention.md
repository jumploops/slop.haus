# Phase 2 - Automation, Vendors, Security, Retention

## Status
Completed

## Scope
- Agent/automation/background job capabilities
- Third-party SDK/service inventory
- Logging and security controls from code/config
- Retention/deletion and moderation workflows

## Files to Inspect
- `apps/worker/src/**/*`
- `render.yaml`, `docker-compose.yml`, `.env.example`
- `apps/web/package.json`, `apps/api/package.json`, `package.json`
- API rate limiting / moderation routes

## Verification
- [x] Vendor/subprocessor inventory documented
- [x] Abuse controls and moderation flows documented
- [x] Retention/deletion behavior and gaps documented
- [x] Security controls and incident-handling evidence captured

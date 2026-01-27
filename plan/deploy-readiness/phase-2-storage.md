# Phase 2 — Object Storage for Uploads/Screenshots

**Status:** completed
**Priority:** P0

## Problem
Storage is local-only in both API and worker, which breaks multi-instance deployments and loses uploads on redeploy.

## Goals
- Support object storage (S3/R2/etc.) for uploads and screenshots.
- Keep local storage for dev.
- Standardize storage configuration across API and worker.

## Proposed Approach
- Add a new storage provider (S3/R2) implementing the existing `StorageProvider` interface.
- Use env-gated selection: `STORAGE_TYPE=s3|r2|local`.
- Update API upload URLs to reference the object storage public URL or CDN.
- Gate `serveStatic` for uploads so it is only used in local/dev.

## Files to Change
- `apps/api/src/lib/storage.ts`
- `apps/worker/src/lib/storage.ts`
- `apps/api/src/index.ts`
- Potentially `apps/web/next.config.ts` (image host)

## Implementation Notes
- Keep signatures stable: `upload(key, buffer, contentType)` returns a public URL.
- Ensure ACL/public access policy is defined for storage bucket.
- Consider using pre-signed URLs for private buckets if needed.

## Verification Checklist
- [ ] Uploads and screenshots persist across restarts.
- [ ] URLs resolve in production via CDN/host.
- [ ] Local dev still works with `STORAGE_TYPE=local`.

## Rollout
- Provision storage bucket + credentials.
- Deploy API/worker with new provider and env vars.

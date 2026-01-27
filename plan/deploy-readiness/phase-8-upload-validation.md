# Phase 8 — Upload Validation Hardening

**Status:** planned
**Priority:** P1

## Problem
Screenshot upload validates only client-provided MIME type, which can be spoofed.

## Goals
- Validate uploaded files server-side.
- Prevent non-image uploads from being stored or served.

## Proposed Approach
- Detect file type from content (magic bytes).
- Optionally re-encode images to a safe format (PNG/WebP) before storage.
- Enforce max dimensions and size limits.

## Files to Change
- `apps/api/src/routes/projects.ts`
- Potentially shared validation helper in `packages/shared`

## Implementation Notes
- Prefer existing dependencies if available; only add new ones if necessary.
- If adding a dependency, document it in the plan before coding.

## Verification Checklist
- [ ] Non-image files are rejected even with spoofed MIME types.
- [ ] Valid images upload successfully.

## Rollout
- Deploy API change; monitor upload errors.

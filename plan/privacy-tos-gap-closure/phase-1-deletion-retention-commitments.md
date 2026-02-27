# Phase 1: Deletion + Retention Commitments

**Status:** In Progress  
**Owner:** Product + API + Infra  
**Depends On:** None

## Goal
Define and approve a concrete data-deletion contract and retention schedule that can be truthfully published in Privacy Policy and ToS.

## Deliverables
1. Deletion matrix by data class (hard delete vs soft delete vs anonymize).
2. Retention table for DB records, logs, object storage, and backups.
3. User-facing deletion workflow spec (request, execution, backup lag language).
4. Engineering implementation backlog items for any gaps.

Current draft artifact:
- `phase-1-deletion-retention-matrix-draft.md`

## Current Baseline (from existing audit)
- Account deletion workflow is not yet implemented.
- Retention periods for logs/backups/object storage are not yet committed.
- Several entities currently use soft-delete/status patterns, but policy language is not yet bound to explicit timelines.

## Checklist
- [ ] Confirm target deletion behavior for:
  - `user`, `session`, `account` (OAuth tokens), `favorites`, `likes`, `comment_votes`
  - user-authored content (`projects`, `comments`, `project_revisions`, media)
  - moderation/reporting records (`flags`, `moderation_events`)
- [ ] Decide aggregate-data policy:
  - whether de-identified aggregates may persist after account deletion
  - whether authored content is removed, anonymized, or retained under license
- [ ] Define retention durations for:
  - auth/session/account tables
  - application logs/platform logs
  - object storage and revision artifacts
  - backups + full purge lag
- [ ] Define operational SLA:
  - time to process deletion request
  - exception handling (fraud/security/legal hold)
- [ ] Create implementation tickets for any code/infra gaps.

## Started Work
- [x] Gap set captured and scoped from `POLICY_TOS_SOURCE_OF_TRUTH.md`.
- [x] Convert baseline into explicit deletion/retention matrix draft (`phase-1-deletion-retention-matrix-draft.md`).
- [ ] Convert draft matrix into approved commitments with final retention values/owners.

## Exit Criteria
- Product/legal approve a deletion matrix and retention table suitable for policy publication.
- Engineering backlog exists for any required implementation work with owners.

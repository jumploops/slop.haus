# Phase 5 - Cleanup and QA

Status: Completed (pending QA)

## Goals
- Remove deprecated vote channel code paths
- Ensure aggregates and counts are consistent
- Validate UI and API with basic checks

## Files to Change
- Remove or deprecate:
  - `apps/api/src/routes/votes.ts`
  - `apps/web/src/hooks/useVote.ts`
  - `apps/web/src/lib/api/votes.ts`
  - Any `normal/dev` fields in types and UI
- Update docs or references:
  - `README.md`, `PROGRESS.md`, `TODO.md` if needed

## Implementation Steps
1) Remove dual-channel fields from project DTOs and UI
2) Remove `channel` from feed query handling
3) Delete unused vote routes and rater helpers (if no longer used)
4) Re-run type checks to ensure no dangling references
5) Manually QA with a dev dataset

## Verification Checklist
- [x] TypeScript checks pass for affected packages
- [x] No references to `normalScore/devScore` in codebase
- [x] Feed sorting uses slop score and works for all windows
- [ ] Like/review/comment upvote flows work end-to-end
- [ ] Moderation actions keep aggregates correct

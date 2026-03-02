# Vibe Percent Not Saved on New Submission

## Status

- **Type:** Investigation
- **Date:** 2026-02-28
- **Scope:** Submit flow (`/submit/*`) vs edit flow (`/p/[slug]/edit`)
- **Code changes:** Implemented (same day)

## Problem Statement

Reported behavior: when creating/submitting a **new** project, the vibe percentage entered by the user is not reliably reflected in the saved project. Editing an existing project appears to save vibe percentage correctly.

## Initial Flow Comparison

### Manual submit path (likely healthy)

- Manual form includes `vibePercent` in payload when mode is `overview`:
  - [apps/web/src/app/submit/manual/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx:52)
- API create route persists `vibePercent` (or recomputes for detailed mode):
  - [apps/api/src/routes/projects.ts](/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts:306)

### Draft submit path (likely bug source)

- Draft review UI keeps vibe percent in local state; comment explicitly says it is not persisted on change:
  - [apps/web/src/components/submit/EditableProjectPreview.tsx](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:62)
  - [apps/web/src/components/submit/EditableProjectPreview.tsx](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:111)
- Before fix, submit sent only `{ vibeMode, vibeDetails? }` (no `vibePercent`):
  - [apps/web/src/app/submit/draft/[draftId]/page.tsx](/Users/adam/code/slop.haus/apps/web/src/app/submit/draft/[draftId]/page.tsx:125)
- Before fix, shared submit-draft type/schema excluded `vibePercent`:
  - [packages/shared/src/draft-types.ts](/Users/adam/code/slop.haus/packages/shared/src/draft-types.ts:90)
  - [packages/shared/src/schemas.ts](/Users/adam/code/slop.haus/packages/shared/src/schemas.ts:183)
- Before fix, draft submit API always fell back to stored draft value (`finalVibePercent` or `suggestedVibePercent`) for overview mode:
  - [apps/api/src/routes/drafts.ts](/Users/adam/code/slop.haus/apps/api/src/routes/drafts.ts:302)

## Leading Hypotheses

1. **High confidence:** In draft submission flow, user-updated overview vibe percent is not included in submit payload and is not guaranteed to be persisted before submit, so the server saves an older fallback value.
2. **Medium confidence:** A legacy component split exists (`DraftReview` vs `EditableProjectPreview`), and behavior differs; current route uses `EditableProjectPreview`, which intentionally does not persist vibe on change.
3. **Lower confidence:** If any code path still relies on asynchronous field blur saves for vibe percent, there may be race conditions between last UI change and submit.

## Why Edit Flow Appears Correct

Edit flow computes changed fields and includes `vibePercent` directly in update payload:

- [apps/web/src/components/project/EditableProject.tsx](/Users/adam/code/slop.haus/apps/web/src/components/project/EditableProject.tsx:100)

API update route persists `vibePercent` when provided:

- [apps/api/src/routes/projects.ts](/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts:565)

This aligns with the report that edit works while new submit does not.

## Verification Plan (Next Step)

1. Reproduce in URL/Repo draft flow and inspect the `POST /drafts/:draftId/submit` payload.
2. Confirm payload omits `vibePercent` for overview mode.
3. Confirm resulting project row gets fallback draft vibe value (not final UI value).
4. Compare with manual submit payload/DB result as control.

## Candidate Fix Directions (Considered)

1. Add `vibePercent` to `SubmitDraftRequest` + schema + API handler, and use it when `vibeMode === "overview"`.
2. Persist vibe percent to draft on change (or before submit) via `PATCH /drafts/:draftId` and await completion.
3. Prefer option 1 (explicit submit payload) and keep option 2 as extra durability.

## Resolution Implemented

Implemented option 1 to make the submit request authoritative for overview vibe score.

- `SubmitDraftRequest` now includes optional `vibePercent`.
- `submitDraftSchema` now accepts optional `vibePercent`.
- Draft submit UI now sends `vibePercent` when `vibeMode === "overview"`.
- Draft submit API now prioritizes payload `vibePercent` for overview mode.
- Detailed mode behavior is unchanged (average derived from `vibeDetails`).

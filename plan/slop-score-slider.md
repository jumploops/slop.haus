# Slop Score Slider Labels

Status: draft
Owner: TBD

## Goal
Update the Slop Score slider labels to match the new domain language:
- rotten -> sloppy
- fresh -> solid
- certified -> immaculate

Adjust thresholds so **immaculate** applies only to score 10, and **solid** applies to scores 8-9.

## Current implementation survey

### Frontend (active app)
- `apps/web/src/components/comment/CommentForm.tsx`
  - Slider range: 0-10 (step 1).
  - `getScoreLabel()` currently maps:
    - >= 9: "CERTIFIED SLOP"
    - >= 8: "FRESH SLOP"
    - >= 6: "DECENT SLOP"
    - >= 4: "STALE SLOP"
    - else: "ROTTEN SLOP"
  - This is the only place in `apps/web` that uses the Rotten Tomatoes-style labels.

### API + DB
- `packages/db/src/schema/comments.ts`: `reviewScore` integer (nullable), no label logic.
- `packages/db/src/schema/projects.ts`: `reviewScoreTotal` and `slopScore` (numeric avg of 0-10), no label logic.
- `apps/api/src/routes/projectComments.ts`, `apps/api/src/routes/comments.ts`, `apps/api/src/routes/admin.ts`, `apps/api/src/routes/flags.ts`
  - Maintain `reviewScoreTotal`, `reviewCount`, and `slopScore` averages. No label strings.
- `packages/shared/src/schemas.ts`: validation enforces 0-10 range.

## Plan

### Phase 1: Confirm scope
- Verify the active slider UI is `apps/web/src/components/comment/CommentForm.tsx`.

### Phase 2: Update label mapping
- Update `getScoreLabel()` in `apps/web/src/components/comment/CommentForm.tsx`:
  - 10 -> "IMMACULATE SLOP"
  - 8-9 -> "SOLID SLOP"
  - 6-7 -> "DECENT SLOP" (unchanged)
  - 4-5 -> "STALE SLOP" (unchanged)
  - 0-3 -> "SLOPPY SLOP" (rename from "ROTTEN SLOP")

### Phase 3: QA
- Manual check: slider label for 8, 9, 10 in the review form.
- Confirm the display text reads "IMMACULATE SLOP" only at 10, and "SOLID SLOP" at 8-9.
- Spot-check 0-3 shows "SLOPPY SLOP".

## Files likely to change
- `apps/web/src/components/comment/CommentForm.tsx`

## Open questions
- Should we keep the score color mapping as-is, or adjust tones to match the new naming? (No change proposed unless requested.)

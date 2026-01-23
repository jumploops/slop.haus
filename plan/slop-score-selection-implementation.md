# Slop Score Selection - Implementation Spec (Option 2)

Status: draft
Owner: TBD

## Overview
Implement an “unset” state for the Slop Score slider so users must explicitly choose a value before submitting a review. The slider should display a placeholder label until the first interaction, and the submit button remains disabled until a score is chosen.

## Goals
- Prevent accidental submissions with the default score.
- Keep UI changes minimal and aligned with current design.
- Preserve accessibility (keyboard + screen reader).

## Non-goals
- Changing the slider range (0–10) or review score storage.
- Redesigning the review form layout.

## Current behavior
- `apps/web/src/components/comment/CommentForm.tsx`
  - `reviewScore` initialized to `5`.
  - Submit is enabled if body is non-empty.

## Proposed UX
- Initial state: score is **unset**.
- Slider appears with its thumb centered for visual continuity, but label reads **“Select score”** (or similar).
- On first slider interaction, set the numeric score and mark `hasPickedScore = true`.
- Submit button remains disabled until `hasPickedScore` is true.
- If user focuses the slider and uses keyboard to change it, that should also count as selection.

## Implementation details

### State changes
- Replace `reviewScore` initial value with `null` and add a `hasPickedScore` boolean, **or**
- Keep `reviewScore` as `number | null` and derive `hasPickedScore = reviewScore !== null`.

Recommended:
```ts
const [reviewScore, setReviewScore] = useState<number | null>(null);
```

### Slider rendering
- Slider `value` must always be a number; when `reviewScore` is null, render `value={5}` (visual midpoint) but keep `reviewScore` unset.
- On `onChange`, call `setReviewScore(Number(e.target.value))`.
- Display label:
  - If `reviewScore === null` → “SELECT SCORE” (or “Select score”)
  - Else → existing label mapping for numeric score.
- Display score number:
  - If unset, show “—” or blank state (confirm desired visual).

### Submit button behavior
- Update disabled condition:
  - Currently: `disabled={!body.trim()}`
  - New: `disabled={!body.trim() || reviewScore === null}`

### Helper text
- Add a small helper line below slider: “Pick a score to enable posting.”
  - Only show while `reviewScore === null`.

### Validation
- In `handleSubmit`, guard against null score:
  - If `isTopLevel && reviewScore === null` return early (with toast or inline error).
  - Should align with UI disable state.

## Files to change
- `apps/web/src/components/comment/CommentForm.tsx`

## Acceptance criteria
- A top-level review cannot be submitted until a score is chosen.
- Slider label shows “Select score” until first interaction.
- Keyboard interaction on slider counts as selection.
- Replies (non-top-level) unchanged.

## QA checklist
- Top-level review: submit disabled until slider moved.
- Selecting a score enables submit (assuming body is filled).
- Selected score shows correct label and color.
- Replies: submit still works without score.
- Keyboard: tab to slider and adjust with arrows → submit enabled.

## Open questions
- Should the placeholder label be “Select score” or “Pick a score”?
- Should the numeric display show “—” or be hidden when unset?
- Do we want an inline error or toast on submit if the user bypasses the UI?

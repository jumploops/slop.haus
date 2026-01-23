# Slop Score Slider UX (Option 1)

Status: draft
Owner: TBD

## Overview
Refine the Slop Score UI to prevent label wrapping (e.g., “IMMACULATE SLOP”) by using a floating score badge that hovers above the slider and tracks the current value. The badge contains the numeric score and label, avoiding cramped inline placement.

## Goals
- Prevent wrapping of long labels like “IMMACULATE SLOP”.
- Improve visual hierarchy by grouping the score with the label.
- Preserve existing slider interaction and the “select score” requirement.

## Current behavior
- `apps/web/src/components/comment/CommentForm.tsx`
  - Score block sits to the right of the slider (label + number), causing long label wraps.
  - Slider sits on the same row as the score block.
  - “Select score” placeholder and helper copy are shown when score is unset.

## Proposed UX (Option 1 - Floating badge)
- Layout:
  - Row 1: “Your Slop Score” label only.
  - Row 2: slider with a floating badge positioned above the thumb.
- Floating badge:
  - Shows score number + label in a small stacked block.
  - Tracks the slider value position (0–10) across the track.
  - Uses `whitespace-nowrap` to keep labels on one line.
- Helper text remains below the slider.

## Implementation details

### Layout changes
- Keep the label row simple (no inline score block).
- Wrap slider in a relative container; position the badge absolutely above the input.

### Label styling
- Add `whitespace-nowrap` to prevent wrapping.
- Consider `text-[9px]` or `text-[10px]` for long labels.

### Floating badge positioning
- Compute a percentage based on score (0–10) to place the badge along the track.
- Apply `transform: translateX(-50%)` so the badge centers on the thumb position.
- Clamp position to avoid clipping at the edges.

### Preserve selection requirement
- Keep `reviewScore === null` handling:
  - Display “SELECT SCORE” placeholder.
  - Submit disabled until set.
  - Helper text remains.

## Files to change
- `apps/web/src/components/comment/CommentForm.tsx`

## Acceptance criteria
- “IMMACULATE SLOP” no longer wraps on typical mobile/desktop widths.
- Slider sits below the header row, full width.
- Floating badge follows the slider thumb and remains readable.
- Existing select‑before‑submit behavior still works.

## QA checklist
- Check label wrapping at 8–10 scores.
- Confirm layout on mobile widths.
- Confirm placeholder state and helper text still render correctly.

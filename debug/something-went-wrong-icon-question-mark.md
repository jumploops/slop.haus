# Something Went Wrong Icon Question Mark

**Status:** Resolved
**Date:** 2026-03-06

## Problem

The `"Something went wrong"` error UI currently renders a red square containing an SVG circle with an exclamation-mark style glyph. The requested change is to replace that glyph with a question mark inside the circle.

## Current Implementation Review

### Primary target

- App-level error boundary UI:
  - `apps/web/src/app/error.tsx`
- The panel is visually modal-like, with:
  - a red bordered square container
  - a centered SVG icon
  - `"Something went wrong"` heading
  - retry and home actions

### Related implementation

- Submit analysis error card:
  - `apps/web/src/components/submit/AnalysisError.tsx`
- It uses the same SVG structure:
  - outer circle
  - vertical line
  - dot

## Findings

1. The visible `'`-like mark is not a text glyph. It is composed from two SVG `<line>` elements.
2. The exact `"Something went wrong"` copy is in `apps/web/src/app/error.tsx`, so that file is the direct match for the requested UI.
3. The easiest local verification path is to render that error UI from `apps/web/src/app/page.tsx` temporarily, rather than forcing a runtime error.

## Proposed Change

1. Replace the exclamation-mark SVG strokes in `apps/web/src/app/error.tsx` with a question-mark shape inside the existing circle.
2. Temporarily render the error UI on the main page (`apps/web/src/app/page.tsx`) for visual QA.
3. Leave the submit analysis error icon unchanged unless the user wants both error surfaces aligned.

## Implementation Applied

- Extracted the error panel in `apps/web/src/app/error.tsx` into a reusable `SomethingWentWrongPanel` client component.
- Replaced the icon internals with a question-mark shape:
  - kept the existing outer circle
  - replaced the vertical stroke with a curved SVG path
  - kept a bottom dot to complete the question mark
- Updated the default app error boundary to render the new reusable panel.
- Temporarily mounted `SomethingWentWrongPanel` from `apps/web/src/app/page.tsx` in development so the homepage showed the state without forcing a runtime error.
- Removed the temporary homepage mount after visual QA passed, restoring the normal feed page.

## Validation

- `pnpm -F @slop/web exec tsc --noEmit`
  - Passed
- Visual QA
  - Confirmed the question-mark icon looked correct on the temporary homepage preview before removing it

## Verification Plan

1. Trigger the app error boundary and confirm the icon reads clearly as a question mark inside the circle.
2. Confirm the surrounding red square, heading, and actions still render correctly.
3. Confirm the homepage renders the normal feed again.

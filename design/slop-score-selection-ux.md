# Slop Score Selection UX

Status: draft
Owner: TBD

## Problem
Reviews default to a slop score of 5, so users can post a review without actively choosing a score. We want to ensure the user explicitly sets the score before submission.

## Goals
- Require an explicit user action to set the slop score.
- Keep the interaction lightweight and obvious.
- Preserve accessibility and mobile usability.

## Ideas / Approaches (3–5)

### 1) Track "touched" state + disable submit until changed
**Concept:** Keep the slider range 0–10, but initialize to 5 and mark `hasPickedScore = false`. Only when the user changes the slider do we set `hasPickedScore = true`. Disable the submit button until true.

**Pros**
- Minimal UI change; simple to implement.
- No visual redesign required.

**Cons**
- Slider still appears set to 5, so users might think 5 is pre-selected.
- Requires clear affordance (helper text) explaining “pick a score to continue.”

**Notes**
- Add helper text like “Pick a score to enable posting.”
- Consider a subtle highlight or animation when disabled.

---

### 2) Start as “unset” with a ghost slider position
**Concept:** Represent an unset state. Start with `reviewScore = null`, render the thumb at mid-point visually but show an “unset” label (e.g., “Select score”). On first drag, assign a numeric value.

**Pros**
- Clearly communicates that the score is not set yet.
- Avoids the accidental 5 default.

**Cons**
- Requires some custom slider handling and display logic.
- Edge cases for keyboard interactions need care.

**Notes**
- Use a placeholder label like “Select score” or “Choose a score.”
- Add ARIA helper text describing the requirement.

---

### 3) Two-step selection: “Set score” button reveals slider
**Concept:** Initially show a button “Set score” or “Pick a score.” Clicking reveals the slider and locks in a value. Submit stays disabled until the slider is used.

**Pros**
- Forces an explicit action before the slider even appears.
- Good for clarity; reduces accidental submissions.

**Cons**
- Adds an extra click (slightly more friction).
- More layout changes.

**Notes**
- If the slider is hidden by default, ensure the CTA is obvious.

---

### 4) Require confirmation on submit when score untouched
**Concept:** If user submits without interacting, show a modal/toast: “Please set your Slop Score.”

**Pros**
- Minimal UI change.
- Prevents accidental submission while allowing the default to remain.

**Cons**
- Reactive rather than proactive; can be annoying.
- Adds an interruption step that might feel like an error.

**Notes**
- Use inline error message near slider if possible.

---

### 5) Replace slider with discrete buttons (0–10)
**Concept:** Use a small grid or row of buttons (0–10). No default selected; user must tap one.

**Pros**
- Clear unselected state.
- Mobile-friendly; more deliberate selection.

**Cons**
- Larger UI footprint.
- Might be a bigger departure from the refactor design.

**Notes**
- Could still keep slider for desktop and buttons for mobile (adaptive UI).

## Recommended starting point
Option 1 or 2 for minimal disruption. Option 2 provides the clearest signal that the score is unset, but is slightly more involved.

## Potential implementation touchpoints
- `apps/web/src/components/comment/CommentForm.tsx`
  - Track `hasPickedScore` or `reviewScore: number | null`
  - Disable submit button and/or show inline guidance until a selection is made

## Open questions
- Do we want to allow submitting without a score for any reason (e.g., non-review comments)?
- Should the requirement only apply to top-level reviews (current behavior), or also replies?

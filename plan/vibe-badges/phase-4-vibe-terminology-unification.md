# Phase 4: Project/Submit/Edit Terminology Unification

## Status

**Status:** ⏳ Not Started  
**Owner:** Web  
**Depends On:** [Phase 1](./phase-1-shared-vibe-taxonomy-utility.md)

## Goal

Adopt the sample taxonomy terms for vibe score labels across project, submit, and edit flows so all vibe surfaces resolve labels consistently.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/project/VibeMeter.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/form/VibeInput.tsx`

## Tasks

1. Update `VibeMeter` label logic to use shared taxonomy helpers instead of local/custom phrasing.
2. Update `VibeInput` scale label logic (`VibeScale`) to use shared taxonomy helpers.
3. Remove duplicated, hardcoded threshold logic currently local to components.
4. Keep existing percent display behavior while changing label terms only.
5. Preserve existing submit/edit interaction behavior and slider value semantics.

## Implementation Notes

- This phase changes vocabulary, not data model.
- Ensure any string shown as "vibe label" is sourced from the shared utility.
- Keep scope tight: only term-rendering logic should change.

## Code Snippets (Conceptual)

```ts
import { getVibeLabel } from "@/lib/vibe-taxonomy";

const label = getVibeLabel(percent);
```

```tsx
<span className="text-xs text-muted-foreground text-center">{label}</span>
```

## Verification Checklist

- [ ] Project page vibe score term matches badge term for the same percent.
- [ ] Submit flow shows sample taxonomy terms while adjusting sliders.
- [ ] Edit flow shows sample taxonomy terms while adjusting sliders.
- [ ] No behavior change in percent persistence or form submission.

## Exit Criteria

- Project, submit, and edit vibe-score labels all derive from shared sample taxonomy terms.

# Vibe Badges Implementation Plan

## Overview

Implement the approved `VibeBadge` and terminology unification from `design/vibe-badges-project-cards.md` so that:

- shared project cards show a tooltip-enabled vibe badge,
- badge and vibe score terminology use one shared taxonomy,
- taxonomy terms are consistent on project, submit, and edit surfaces,
- My Projects cards remain unchanged.

## Status: In Progress

**Last Updated:** 2026-03-02  
**Owner:** Web

## Locked Product Decisions

1. Tooltip is required in v1.
2. Add `@radix-ui/react-tooltip` to `apps/web`.
3. Use sample taxonomy terms for badges and vibe-score UI.
4. Exclude My Projects cards from badge integration.
5. Use rounded decile bucketing (`Math.round(percent / 10) * 10`).
6. Keep badge styling clean and neutral in v1 (no slop-mode treatment).

## Phase Summary

| Phase | Name | Status | Description |
| --- | --- | --- | --- |
| 1 | [Shared Vibe Taxonomy Utility](./phase-1-shared-vibe-taxonomy-utility.md) | ✅ Completed | Added canonical clamp/bucket/label helpers and mapping constants |
| 2 | [Tooltip Infrastructure](./phase-2-tooltip-infrastructure.md) | ✅ Completed | Added Radix tooltip dependency and shared tooltip UI wrapper |
| 3 | [VibeBadge + ProjectCard Integration](./phase-3-vibebadge-and-projectcard-integration.md) | ✅ Completed | Built badge component and integrated into shared project cards |
| 4 | [Project/Submit/Edit Terminology Unification](./phase-4-vibe-terminology-unification.md) | ✅ Completed | Updated vibe score label logic to use shared sample taxonomy terms |
| 5 | [Verification + Polish](./phase-5-verification-and-polish.md) | 🔄 In Progress | Typecheck passed; lint and manual QA pending/partial |

## Dependencies

```text
Phase 1 (taxonomy utility)
  -> Phase 3 (VibeBadge term/tone resolution)
  -> Phase 4 (project/submit/edit term unification)

Phase 2 (tooltip dependency + UI wrapper)
  -> Phase 3 (tooltip-enabled VibeBadge)

Phase 3 + Phase 4
  -> Phase 5 (verification + polish)
```

## Milestones

### Milestone 1: Shared Vocabulary Foundation
- Taxonomy helper exists and is the single source of truth for term resolution.
- Rounded decile behavior is codified with edge-case handling.

### Milestone 2: Badge Infrastructure Ready
- Tooltip dependency and wrapper are available in `apps/web`.
- `VibeBadge` component renders percent + term-aware style + tooltip content.

### Milestone 3: Card Integration Ready
- Badge is visible on shared `ProjectCard` in all three variants.
- Card interactions (open project, like, favorite, external link) remain intact.

### Milestone 4: Terminology Consistency Ready
- Project page vibe score and submit/edit vibe scale labels use the same sample taxonomy terms.

### Milestone 5: Release Confidence
- Typecheck and manual QA are complete.
- No unresolved accessibility or interaction regressions remain.

## Non-Goals

- Badge integration on My Projects cards.
- Slop-mode-specific badge effects in v1.
- Backend/schema changes for vibe percent storage.
- Reworking project score card layout beyond required badge placement.

## Exit Criteria

- All phases are implementation-ready and reviewed.
- File-level scope and verification criteria are explicit per phase.
- Plan reflects approved decisions with no unresolved design ambiguity.

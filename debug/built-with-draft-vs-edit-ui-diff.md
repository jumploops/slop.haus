# Built With UI Diff: Draft Submit vs Edit Project

## Status

- **Type:** Investigation
- **Date:** 2026-02-24
- **Scope:** Web UI only (no backend/schema changes)

## Problem Statement

The `Built with` section appears different between:

1. Draft submission review flow (`/submit/draft/[draftId]`)
2. Existing project edit flow (`/p/[slug]/edit`)

Goal of this investigation: identify where each UI is rendered and why they diverge.

## Entry Points and Component Paths

### Draft submission review path

- Route: [`apps/web/src/app/submit/draft/[draftId]/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/submit/draft/[draftId]/page.tsx:176)
- Renders: `EditableProjectPreview`
- Component: [`apps/web/src/components/submit/EditableProjectPreview.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:237)

### Edit project path

- Route: [`apps/web/src/app/p/[slug]/edit/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/p/[slug]/edit/page.tsx:102)
- Renders: `EditableProject`
- Component: [`apps/web/src/components/project/EditableProject.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/EditableProject.tsx:398)

## Findings

### 1) Both flows use the same base editor widget

Both `EditableProjectPreview` and `EditableProject` render:

- [`TagEditor`](/Users/adam/code/slop.haus/apps/web/src/components/submit/TagEditor.tsx:13)

So the core add/remove/search tool selector is shared.

### 2) Draft flow adds an extra custom tag display that edit flow does not

In draft preview, `Built with` includes:

1. A custom pre-rendered badge list using raw `tools` values with `#` prefix  
   - [`EditableProjectPreview.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:240)
2. Then `TagEditor` below it  
   - [`EditableProjectPreview.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:251)

In edit flow, `Built with` includes:

1. `TagEditor` only  
   - [`EditableProject.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/project/EditableProject.tsx:401)

This is the direct source of UI mismatch.

### 3) The two displays format tool labels differently

- Draft extra badges render `#{tool}` from local array values (slug-like string)  
  - [`EditableProjectPreview.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:243)
- `TagEditor` renders `tool.name` from `/tools` API lookup  
  - [`TagEditor.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/TagEditor.tsx:45)

Net effect in draft flow:

- duplicate representation of tools
- mixed formatting (`#slug` badges + display-name chips)

while edit flow shows only one representation (TagEditor chips).

### 4) Empty state text also differs

- Draft custom block empty state: `Add technologies...`  
  - [`EditableProjectPreview.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx:249)
- `TagEditor` empty state: `No technologies selected`  
  - [`TagEditor.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/submit/TagEditor.tsx:62)

This adds another visible inconsistency in the draft screen.

## Root Cause

The draft review component (`EditableProjectPreview`) contains legacy/extra presentation logic in addition to `TagEditor`, while the edit component (`EditableProject`) relies on `TagEditor` only.

The mismatch is not caused by different APIs, routes, or DB schema; it is caused by divergent UI composition in these two React components.

## Impact

- Inconsistent `Built with` UX across two core editing experiences.
- Potential user confusion from duplicated tool surfaces in draft flow.
- Tool naming/slug formatting inconsistency (`#slug` vs display name).

## Open Questions

1. Desired canonical UX:
   - Use `TagEditor` only in both flows, or keep a read-only summary + editor in both?
2. If summary badges are desired:
   - Should they use tool display names (not slugs) for consistency?
3. Should empty-state copy be standardized across both contexts?

## Suggested Fix Direction (No Code Changes Yet)

- Normalize both flows to a single composition pattern.
- Most direct option: remove the draft-only custom badge list and rely on shared `TagEditor` in both places.
- Standardize empty-state copy in one location (`TagEditor`) if needed.

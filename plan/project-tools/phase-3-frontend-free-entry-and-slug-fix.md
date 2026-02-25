# Phase 3: Frontend Free Entry + Slug Mismatch Fix

## Status

**Status:** Completed  
**Owner:** Web  
**Depends On:** [Phase 2](./phase-2-backend-tag-resolution-and-write-paths.md)

## Goal

Enable "type a tag and press Enter" UX and eliminate current manual submit name/slug mismatch behavior.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/components/form/ToolsSelector.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/TagEditor.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/EditableProject.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/DraftReview.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/EditableProjectPreview.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/tools.ts` (if request/search behavior changes)

## Tasks

1. Update both tag input components to support free entry:
   - Enter key adds current text,
   - Comma delimiter optionally adds current text,
   - blur behavior should not lose pending text unexpectedly.
2. Standardize selected value representation to canonical tool string expected by API (slug).
3. Preserve readable display labels while storing canonical values for payloads.
4. Enforce client-side max 10 tags and duplicate prevention.
5. Maintain suggestion dropdown/search behavior for existing tags.
6. Ensure manual submit path no longer sends display name when API expects slug.
7. Keep accessibility intact:
   - keyboard-only add/remove flows,
   - clear labels and `aria-label` on remove controls.

## Implementation Notes

- Prefer one shared normalization util in web layer to prevent divergent behavior.
- Display casing policy:
  - known tools display DB `name`,
  - newly typed values display user-entered casing until canonicalized from server response.
- Do not block submit solely due to unknown tags; backend is source of truth.

## Example Snippet

```ts
if ((e.key === "Enter" || e.key === ",") && search.trim()) {
  e.preventDefault();
  addToolFromInput(search);
  setSearch("");
}
```

## Verification Checklist

- [ ] Manual submit: typing new tag + Enter creates chip and submits successfully.
- [ ] Edit project: add/remove new and existing tags works.
- [ ] Draft review: LLM suggestions + manual additions persist.
- [ ] Duplicate entries are prevented regardless of casing.
- [ ] Tag limit behavior matches backend limits.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- All submission/edit surfaces support free-entry tools.
- Manual flow mismatch bug (name vs slug payload) is eliminated.

# Editable Project Preview - Implementation Plan

**Feature:** Transform draft review page into editable project preview
**Design Doc:** `design/editable-project-preview.md`
**Status:** Phase 1 Complete

---

## Summary

Replace the form-based draft review page (`/submit/draft/[draftId]`) with a WYSIWYG editable preview that mirrors the published project page layout. Users see exactly how their project will appear and click elements to edit them.

---

## Phase Overview

| Phase | Name | Scope | Dependencies | Status |
|-------|------|-------|--------------|--------|
| 1 | Core Preview & Inline Text | Preview layout, title/tagline editing | None | ✅ Complete |
| 2 | Complex Editors | Popover, tags, vibe score, URL modals | Phase 1 | Not Started |
| 3 | Description & Media | Textarea editing, screenshot replacement | Phase 2 | Not Started |
| 4 | Polish & Accessibility | Keyboard nav, ARIA, mobile, animations | Phase 3 | Not Started |

---

## Files Created/Modified

### New Files
```
apps/web/src/components/submit/
├── EditableProjectPreview.tsx      # Phase 1
├── InlineEditText.tsx              # Phase 1
├── InlineEditTextarea.tsx          # Phase 3
├── EditableMedia.tsx               # Phase 3
├── EditableLink.tsx                # Phase 2
├── EditableTagsPopover.tsx         # Phase 2
├── EditableVibePopover.tsx         # Phase 2

apps/web/src/components/ui/
├── Popover.tsx                     # Phase 2

apps/web/src/app/
├── globals.css                     # All phases (incremental)
```

### Modified Files
```
apps/web/src/app/submit/draft/[draftId]/page.tsx   # Phase 1
apps/web/src/components/submit/DraftReview.tsx     # Phase 1 (deprecated/removed)
```

---

## Key Decisions

1. **Inline vs Modal:** Simple text fields use inline editing; complex fields (tags, vibe, URLs) use popovers/modals
2. **Auto-save:** Changes save on blur/Enter, no explicit save button per field
3. **Reuse:** Leverage existing `TagEditor`, `VibeInput`, `ProjectDetails` styles
4. **Screenshot:** Defer replacement to Phase 3; show captured screenshot as-is initially
5. **No toggle:** Always show edit affordances (no read-only preview mode)

---

## Success Criteria

- [x] Preview visually matches published project page
- [ ] All editable fields can be modified (title, tagline, description done)
- [x] Changes persist via existing draft API
- [x] Form validation matches current behavior
- [ ] Works on mobile (touch-friendly)
- [ ] Keyboard accessible
- [ ] Screen reader friendly

---

## Risk Considerations

| Risk | Mitigation |
|------|------------|
| CSS conflicts with existing styles | Use scoped class `.preview-mode` |
| Complex state management | Reuse existing draft page state |
| Popover positioning edge cases | Use well-tested positioning logic |
| Mobile popover UX | Convert to bottom sheets on small screens |

---

## Plan Documents

1. [Phase 1: Core Preview & Inline Text](./01-phase-1-core-preview.md)
2. [Phase 2: Complex Editors](./02-phase-2-complex-editors.md)
3. [Phase 3: Description & Media](./03-phase-3-description-media.md)
4. [Phase 4: Polish & Accessibility](./04-phase-4-polish.md)

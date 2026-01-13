# Phase 1: Core Preview & Inline Text Editing

**Status:** ✅ Complete
**Depends On:** None
**Enables:** Phase 2, 3, 4
**Completed:** 2026-01-13

---

## Goals

1. Create the editable preview component that mirrors `ProjectDetails` layout
2. Implement inline text editing for title and tagline
3. Integrate with existing draft page state management
4. Replace current form-based `DraftReview` component

---

## Components to Create

### 1.1 `InlineEditText.tsx`

Reusable inline text editing component for single-line fields.

**Location:** `apps/web/src/components/submit/InlineEditText.tsx`

**Props:**
```typescript
interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";  // Rendered element when not editing
}
```

**Behavior:**
- Display mode: Renders as specified element with hover affordance
- Click: Transforms to input field, focuses, selects all text
- Blur or Enter: Saves value, returns to display mode
- Escape: Cancels edit, reverts to original value
- Empty + required: Shows placeholder with "required" styling

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Implement display state with editable styling (hover outline, cursor)
3. Implement editing state with controlled input
4. Add keyboard handlers (Enter, Escape)
5. Add focus management (auto-focus, select on edit start)
6. Add empty/placeholder state styling
7. Export from component

---

### 1.2 `EditableProjectPreview.tsx`

Main container component that replicates `ProjectDetails` structure.

**Location:** `apps/web/src/components/submit/EditableProjectPreview.tsx`

**Props:**
```typescript
interface EditableProjectPreviewProps {
  draft: DraftData;
  onFieldChange: (field: string, value: unknown) => Promise<void>;
  onSubmit: () => void;
  onStartOver: () => void;
  isSubmitting: boolean;
  error: string | null;
}
```

**Structure (mirrors ProjectDetails):**
```
.project-preview-container
├── .preview-banner (edit mode indicator)
├── .project-details.preview-mode
│   ├── .project-details-header
│   │   ├── .project-details-media (screenshot - read-only for Phase 1)
│   │   └── .project-details-info
│   │       ├── h1 (title - InlineEditText)
│   │       ├── p.tagline (tagline - InlineEditText)
│   │       ├── .project-details-author (read-only, current user)
│   │       ├── .project-details-meta (read-only, "Submitted just now")
│   │       └── .project-details-links (placeholder buttons for Phase 2)
│   └── .project-details-body
│       ├── .project-details-main
│       │   ├── .project-details-description (placeholder for Phase 3)
│       │   └── .project-details-tools (placeholder for Phase 2)
│       └── .project-details-sidebar
│           └── .score-widget (placeholder for Phase 2)
└── .preview-actions
    ├── Button (Submit Project)
    └── Button (Start Over)
```

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Copy structure from `ProjectDetails.tsx` as reference
3. Implement header section with media placeholder
4. Add `InlineEditText` for title and tagline
5. Add author section (pull from auth context or pass as prop)
6. Add placeholder sections for description, tools, vibe (non-functional)
7. Add action buttons at bottom
8. Wire up `onFieldChange` callbacks

---

## Files to Modify

### 1.3 `apps/web/src/app/submit/draft/[draftId]/page.tsx`

**Changes:**
- Import `EditableProjectPreview` instead of `DraftReview`
- Pass appropriate props from existing state
- Keep existing state management logic unchanged

**Before:**
```tsx
<DraftReview
  draft={draft}
  onUpdate={handleUpdate}
  onSubmit={handleSubmit}
  onStartOver={handleStartOver}
  isSubmitting={submitting}
  error={error}
/>
```

**After:**
```tsx
<EditableProjectPreview
  draft={draft}
  onFieldChange={handleUpdate}
  onSubmit={() => handleSubmit(vibeMode, vibeDetails)}
  onStartOver={handleStartOver}
  isSubmitting={submitting}
  error={error}
/>
```

**Note:** Vibe mode/details state will move into `EditableProjectPreview` in Phase 2.

---

### 1.4 `apps/web/src/app/globals.css`

**Add styles for:**

```css
/* Preview banner */
.preview-banner { ... }

/* Editable field base styles */
.editable-field { ... }
.editable-field:hover { ... }
.editable-field.editing { ... }
.editable-field.empty { ... }

/* Inline edit input */
.inline-edit-input { ... }
.inline-edit-input input { ... }

/* Preview mode overrides */
.project-details.preview-mode { ... }

/* Preview actions */
.preview-actions { ... }
```

---

## State Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DraftReviewPage                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ State:                                               │   │
│  │   draft: DraftData                                   │   │
│  │   loading: boolean                                   │   │
│  │   error: string | null                               │   │
│  │   submitting: boolean                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EditableProjectPreview                               │   │
│  │                                                      │   │
│  │   onFieldChange(field, value) ─────────────────────────► updateDraft API
│  │                                                      │   │
│  │   ┌──────────────────────────────────────────────┐  │   │
│  │   │ InlineEditText (title)                        │  │   │
│  │   │   onSave ──► onFieldChange("title", value)   │  │   │
│  │   └──────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │   ┌──────────────────────────────────────────────┐  │   │
│  │   │ InlineEditText (tagline)                      │  │   │
│  │   │   onSave ──► onFieldChange("tagline", value) │  │   │
│  │   └──────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Functional Tests
- [ ] Preview layout matches `ProjectDetails` visually
- [ ] Title is editable via click
- [ ] Tagline is editable via click
- [ ] Enter key saves and exits edit mode
- [ ] Escape key cancels and reverts value
- [ ] Click outside saves and exits edit mode
- [ ] Changes persist to API (check network tab)
- [ ] Submit button works (redirects to project page)
- [ ] Start Over button works (redirects to /submit)
- [ ] Error states display correctly

### Edge Cases
- [ ] Empty title shows placeholder
- [ ] Empty tagline shows placeholder
- [ ] Very long title truncates/wraps appropriately
- [ ] Very long tagline truncates/wraps appropriately
- [ ] Rapid click-edit-click doesn't break state
- [ ] Network error during save shows error message

### Visual Tests
- [ ] Hover state shows dashed outline
- [ ] Edit mode shows solid outline
- [ ] Input field matches display text size/style
- [ ] Banner is visible and styled correctly
- [ ] Buttons match existing UI

---

## Definition of Done

1. ✅ `InlineEditText` component created and functional
2. ✅ `EditableProjectPreview` component created with header section
3. ✅ Title and tagline editable via inline editing
4. ✅ Draft page uses new preview component
5. ✅ Existing auto-save behavior preserved
6. ✅ All tests in checklist passing
7. ✅ No console errors or warnings
8. [ ] Code reviewed

**Additional work completed:**
- Created `InlineEditTextarea.tsx` for description editing (originally planned for Phase 3)
- Integrated existing `TagEditor` and `VibeInput` components into preview

---

## Notes

- **Deprecation:** `DraftReview.tsx` will be deprecated but not deleted until Phase 4 (in case rollback needed)
- **Styling:** Intentionally reuse `.project-details` class to inherit existing styles
- **Placeholders:** Description, tools, vibe, and links sections render but are non-functional (Phase 2/3)
- **Author Info:** For Phase 1, hardcode "Your Name" or pull from auth context if easy; full implementation in Phase 2

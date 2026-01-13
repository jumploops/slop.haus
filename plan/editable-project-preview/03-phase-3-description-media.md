# Phase 3: Description & Media

**Status:** Not Started
**Depends On:** Phase 2
**Enables:** Phase 4

---

## Goals

1. Implement inline textarea editing for description field
2. Implement screenshot/media replacement functionality
3. Add proper empty state placeholders for all optional fields
4. Handle the optional nature of description gracefully

---

## Components to Create

### 3.1 `InlineEditTextarea.tsx`

Inline editing component for multi-line text fields.

**Location:** `apps/web/src/components/submit/InlineEditTextarea.tsx`

**Props:**
```typescript
interface InlineEditTextareaProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  className?: string;
}
```

**Behavior:**
- Display mode: Renders as paragraph(s) with hover affordance
- Click: Transforms to auto-resizing textarea
- Blur: Saves value, returns to display mode
- Escape: Cancels edit, reverts to original value
- Auto-resize: Textarea grows/shrinks with content
- Character counter: Shows remaining characters near maxLength

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Implement display state with editable styling
3. Implement editing state with controlled textarea
4. Add auto-resize logic (adjust height based on scrollHeight)
5. Add keyboard handlers (Escape to cancel; Enter for newline, not submit)
6. Add character counter when approaching limit
7. Add empty/placeholder state styling
8. Handle very long text with scroll in display mode

**Key Difference from `InlineEditText`:**
- Enter key inserts newline (not save)
- Save only on blur or explicit save button
- Auto-resizing textarea behavior
- Optional character counter

---

### 3.2 `EditableMedia.tsx`

Component for displaying and replacing the project screenshot.

**Location:** `apps/web/src/components/submit/EditableMedia.tsx`

**Props:**
```typescript
interface EditableMediaProps {
  url: string | null;
  alt: string;
  onReplace: (file: File) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}
```

**Structure:**
```
.editable-media
├── img (current screenshot)
├── .media-overlay (on hover)
│   ├── .overlay-icon (camera icon)
│   └── .overlay-text "Replace Image"
├── input[type="file"] (hidden)
└── .upload-progress (when uploading)
    └── progress bar or spinner
```

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Implement image display with existing styles
3. Add hover overlay with replace prompt
4. Implement hidden file input
5. Handle file selection and validation (image types, max size)
6. Show upload progress indicator
7. Handle upload errors
8. Update preview on successful upload
9. Handle missing screenshot (placeholder image)

**File Upload Flow:**
1. User clicks overlay or image
2. Native file picker opens
3. User selects image file
4. Validate file (type: image/*, size: < 5MB)
5. Show uploading state
6. Upload to API endpoint
7. Receive new URL
8. Update display with new image
9. Save new URL to draft

---

### 3.3 `EditablePlaceholder.tsx`

Generic placeholder component for empty optional fields.

**Location:** `apps/web/src/components/submit/EditablePlaceholder.tsx`

**Props:**
```typescript
interface EditablePlaceholderProps {
  label: string;      // "Add description", "Add technologies", etc.
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}
```

**Structure:**
```
.editable-placeholder
├── .placeholder-icon (optional)
└── .placeholder-text "+ Add {label}"
```

**Usage:**
- Shown when description is empty
- Shown when no tools selected
- Clicking activates the edit mode for that field

---

## Files to Modify

### 3.4 `EditableProjectPreview.tsx`

**Changes:**
- Replace description placeholder with `InlineEditTextarea`
- Replace media placeholder with `EditableMedia`
- Add proper empty state handling for all fields
- Update layout for description section

**Updated description section:**
```tsx
<div className="project-details-description">
  <h3>About</h3>
  {description ? (
    <InlineEditTextarea
      value={description}
      onSave={(v) => onFieldChange("description", v)}
      placeholder="Describe your project..."
      maxLength={10000}
    />
  ) : (
    <EditablePlaceholder
      label="description"
      onClick={() => setEditingDescription(true)}
    />
  )}
</div>
```

**Updated media section:**
```tsx
<div className="project-details-media">
  <EditableMedia
    url={draft.screenshot}
    alt={title || "Project screenshot"}
    onReplace={handleMediaReplace}
    isUploading={isUploadingMedia}
  />
</div>
```

---

### 3.5 New API Endpoint (Backend)

**May need:** `PATCH /api/v1/drafts/:id/media`

If screenshot replacement requires a new endpoint:

```typescript
// Request: multipart/form-data with file
// Response: { url: string }
```

**Alternatively:** Reuse existing media upload infrastructure if available.

**Check existing codebase for:**
- `apps/api/src/routes/uploads.ts` or similar
- Existing media upload handling
- Storage configuration

---

### 3.6 `apps/web/src/app/globals.css`

**Add styles for:**

```css
/* Inline textarea */
.inline-edit-textarea { ... }
.inline-edit-textarea textarea { ... }
.inline-edit-textarea .char-counter { ... }
.inline-edit-textarea .char-counter.warning { ... }

/* Editable media */
.editable-media { ... }
.editable-media img { ... }
.media-overlay { ... }
.media-overlay:hover { ... }
.overlay-icon { ... }
.overlay-text { ... }
.upload-progress { ... }

/* Editable placeholder */
.editable-placeholder { ... }
.editable-placeholder:hover { ... }
.placeholder-icon { ... }
.placeholder-text { ... }

/* Description section adjustments */
.project-details-description .inline-edit-textarea { ... }
```

---

## State Flow (Description & Media)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       EditableProjectPreview                             │
│                                                                          │
│  Local State:                                                            │
│    isUploadingMedia: boolean                                             │
│    mediaError: string | null                                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ InlineEditTextarea (description)                                    │ │
│  │                                                                     │ │
│  │   value ◄── draft.final.description ?? draft.suggested.description │ │
│  │   onSave ──► onFieldChange("description", value)                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ EditableMedia                                                       │ │
│  │                                                                     │ │
│  │   url ◄── draft.screenshot                                         │ │
│  │   onReplace ──► handleMediaReplace(file)                           │ │
│  │                     │                                               │ │
│  │                     ▼                                               │ │
│  │               ┌─────────────────────────────────────────┐          │ │
│  │               │ 1. Set isUploadingMedia = true          │          │ │
│  │               │ 2. Upload file to API                   │          │ │
│  │               │ 3. Receive new URL                      │          │ │
│  │               │ 4. Update draft.screenshot              │          │ │
│  │               │ 5. Set isUploadingMedia = false         │          │ │
│  │               └─────────────────────────────────────────┘          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Inline Textarea
- [ ] Click activates edit mode
- [ ] Shows current description text
- [ ] Textarea auto-resizes as you type
- [ ] Enter key inserts newline (doesn't save)
- [ ] Blur saves the content
- [ ] Escape cancels and reverts
- [ ] Character counter appears near limit
- [ ] Very long text scrolls in display mode
- [ ] Empty state shows placeholder
- [ ] Placeholder is clickable to add

### Media Replacement
- [ ] Hover shows "Replace Image" overlay
- [ ] Click opens file picker
- [ ] Only image files accepted
- [ ] Files over 5MB rejected with error
- [ ] Upload progress indicator shows
- [ ] Successful upload updates preview
- [ ] Failed upload shows error message
- [ ] Missing screenshot shows placeholder
- [ ] Placeholder has "Add Image" prompt

### Empty States
- [ ] Empty description shows "Add description" placeholder
- [ ] Empty tools shows "Add technologies" placeholder
- [ ] Clicking placeholder activates editor
- [ ] Placeholder styling matches editable field hover

### Integration
- [ ] Description saves to API correctly
- [ ] Media URL saves to draft correctly
- [ ] All fields still work together
- [ ] Submit still functions correctly

---

## Definition of Done

1. `InlineEditTextarea` component created and functional
2. `EditableMedia` component created with upload capability
3. `EditablePlaceholder` component created for empty states
4. Description editing integrated and working
5. Media replacement integrated and working
6. Empty states implemented for all optional fields
7. All tests in checklist passing
8. No console errors or warnings
9. Code reviewed

---

## Notes

- **Backend Check:** Verify if media upload endpoint exists or needs creation
- **File Size:** 5MB limit for uploaded images (same as existing constraints)
- **Image Types:** Accept image/jpeg, image/png, image/gif, image/webp
- **Fallback:** If media upload is complex, defer to Phase 4 and use placeholder-only in Phase 3
- **Character Limit:** Description max 10000 chars (from existing validation)
- **Auto-resize Library:** Consider using `react-textarea-autosize` or custom CSS solution

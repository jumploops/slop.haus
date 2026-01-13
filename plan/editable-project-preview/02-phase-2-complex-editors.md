# Phase 2: Complex Editors (Popovers & Modals)

**Status:** Not Started
**Depends On:** Phase 1
**Enables:** Phase 3, 4

---

## Goals

1. Create reusable `Popover` UI component
2. Implement tags editing via popover (wrapping existing `TagEditor`)
3. Implement vibe score editing via popover (wrapping existing `VibeInput`)
4. Implement URL editing via modal
5. Move vibe mode/details state into the preview component

---

## Components to Create

### 2.1 `Popover.tsx`

Reusable popover component for anchored floating content.

**Location:** `apps/web/src/components/ui/Popover.tsx`

**Props:**
```typescript
interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  className?: string;
}
```

**Behavior:**
- Click on trigger toggles open state
- Click outside closes popover
- Escape key closes popover
- Popover positioned relative to trigger
- Handles viewport edge collision (flip if needed)

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Implement controlled/uncontrolled open state pattern
3. Add click-outside detection via event listener
4. Add escape key handler
5. Implement basic positioning (below trigger, aligned to start)
6. Add alignment variants (start, center, end)
7. Add viewport collision detection (flip to top if no room below)
8. Export from `components/ui/index.ts` if exists

---

### 2.2 `EditableTagsPopover.tsx`

Popover wrapper for editing project tools/tags.

**Location:** `apps/web/src/components/submit/EditableTagsPopover.tsx`

**Props:**
```typescript
interface EditableTagsPopoverProps {
  tools: string[];
  onChange: (tools: string[]) => void;
  className?: string;
}
```

**Structure:**
```
Popover
├── trigger: .tools-list (current tags display)
│   └── Badge[] (each tool)
└── content: .tags-popover-content
    ├── h4 "Built with"
    ├── TagEditor (existing component)
    └── Button "Done"
```

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Import `Popover` and `TagEditor`
3. Render trigger as styled tags list with edit affordance
4. Render popover content with `TagEditor` inside
5. Add "Done" button that closes popover
6. Handle empty state (no tags yet)
7. Wire onChange to parent

---

### 2.3 `EditableVibePopover.tsx`

Popover wrapper for editing vibe score.

**Location:** `apps/web/src/components/submit/EditableVibePopover.tsx`

**Props:**
```typescript
interface EditableVibePopoverProps {
  vibeMode: "overview" | "detailed";
  vibePercent: number;
  vibeDetails: Record<string, number>;
  onModeChange: (mode: "overview" | "detailed") => void;
  onPercentChange: (percent: number) => void;
  onDetailsChange: (details: Record<string, number>) => void;
  className?: string;
}
```

**Structure:**
```
Popover
├── trigger: .vibe-display (VibeMeter preview)
│   └── VibeMeter (read-only display)
└── content: .vibe-popover-content
    ├── h4 "Vibe Score"
    ├── p "How much AI was involved?"
    ├── VibeInput (existing component)
    └── Button "Done"
```

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Import `Popover`, `VibeMeter`, and `VibeInput`
3. Render trigger as `VibeMeter` with edit affordance
4. Render popover content with `VibeInput` inside
5. Add "Done" button that closes popover
6. Wire all callbacks to parent

---

### 2.4 `EditableLink.tsx`

Modal-based URL editor for main URL and repo URL.

**Location:** `apps/web/src/components/submit/EditableLink.tsx`

**Props:**
```typescript
interface EditableLinkProps {
  url: string | null;
  onChange: (url: string | null) => void;
  label: string;          // "Live URL" or "Repository URL"
  placeholder: string;    // "https://yourapp.com" or "https://github.com/..."
  icon: React.ReactNode;  // ExternalLinkIcon or GithubIcon
  buttonText: string;     // "Visit Site" or "View Repo"
  className?: string;
}
```

**Structure:**
```
.editable-link
├── Button (trigger, shows buttonText + icon + edit indicator)
└── Modal (on click)
    ├── h2 "Edit Link"
    ├── label + input (URL field)
    ├── validation message
    └── Button[] (Cancel, Save)
```

**Implementation Steps:**
1. Create component file with TypeScript interface
2. Import existing `Modal` component
3. Implement trigger button with edit indicator
4. Implement modal with URL input
5. Add URL validation (valid URL format, https preferred)
6. Add validation feedback (checkmark or error message)
7. Handle empty URL (allow clearing)
8. Save button saves and closes modal
9. Cancel button reverts and closes modal

---

## Files to Modify

### 2.5 `EditableProjectPreview.tsx`

**Changes:**
- Add local state for `vibeMode`, `vibePercent`, `vibeDetails`
- Replace placeholder tools section with `EditableTagsPopover`
- Replace placeholder vibe section with `EditableVibePopover`
- Replace placeholder link buttons with `EditableLink` components
- Update submit handler to pass vibe data

**Updated structure:**
```
.project-details.preview-mode
├── .project-details-header
│   ├── .project-details-media
│   └── .project-details-info
│       ├── InlineEditText (title)
│       ├── InlineEditText (tagline)
│       ├── .project-details-author
│       ├── .project-details-meta
│       └── .project-details-links
│           ├── EditableLink (mainUrl)      ← NEW
│           ├── EditableLink (repoUrl)      ← NEW
│           └── Button (Favorite - disabled/decorative)
└── .project-details-body
    ├── .project-details-main
    │   ├── .project-details-description (placeholder for Phase 3)
    │   └── EditableTagsPopover (tools)     ← NEW
    └── .project-details-sidebar
        └── EditableVibePopover              ← NEW
```

---

### 2.6 `apps/web/src/app/submit/draft/[draftId]/page.tsx`

**Changes:**
- Remove local `vibeMode`, `vibePercent`, `vibeDetails` state (moved to preview)
- Update submit handler signature
- Simplify props passed to preview

---

### 2.7 `apps/web/src/app/globals.css`

**Add styles for:**

```css
/* Popover component */
.popover-container { ... }
.popover-content { ... }
.popover-content.align-start { ... }
.popover-content.align-end { ... }
.popover-content.side-top { ... }

/* Tags popover */
.tags-popover-content { ... }

/* Vibe popover */
.vibe-popover-content { ... }
.vibe-display { ... }
.vibe-display:hover { ... }

/* Editable link */
.editable-link { ... }
.editable-link-trigger { ... }
.editable-link-trigger:hover { ... }
.editable-link-modal { ... }
.url-validation { ... }
.url-validation.valid { ... }
.url-validation.invalid { ... }
```

---

## State Flow (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DraftReviewPage                                   │
│                                                                             │
│  State: draft, loading, error, submitting                                   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EditableProjectPreview                            │   │
│  │                                                                      │   │
│  │  Local State:                                                        │   │
│  │    vibeMode: "overview" | "detailed"                                │   │
│  │    vibePercent: number                                              │   │
│  │    vibeDetails: Record<string, number>                              │   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │   │
│  │  │ InlineEditText │  │ InlineEditText │  │ EditableLink (x2)  │    │   │
│  │  │ (title)        │  │ (tagline)      │  │ (mainUrl, repoUrl) │    │   │
│  │  └───────┬────────┘  └───────┬────────┘  └─────────┬──────────┘    │   │
│  │          │                   │                     │               │   │
│  │          ▼                   ▼                     ▼               │   │
│  │  ┌───────────────────────────────────────────────────────────┐    │   │
│  │  │              onFieldChange(field, value)                   │    │   │
│  │  └───────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌─────────────────────┐  ┌─────────────────────────────────┐      │   │
│  │  │ EditableTagsPopover │  │ EditableVibePopover             │      │   │
│  │  │                     │  │                                  │      │   │
│  │  │ onChange ───────────────► onFieldChange("tools", [...])  │      │   │
│  │  │                     │  │                                  │      │   │
│  │  │                     │  │ onPercentChange ─► local state   │      │   │
│  │  │                     │  │ onDetailsChange ─► local state   │      │   │
│  │  └─────────────────────┘  └─────────────────────────────────┘      │   │
│  │                                                                      │   │
│  │  onSubmit() ──► parent handleSubmit(vibeMode, vibeDetails)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Popover Component
- [ ] Opens on trigger click
- [ ] Closes on outside click
- [ ] Closes on Escape key
- [ ] Positions correctly below trigger
- [ ] Flips to top when near viewport bottom
- [ ] Alignment variants work (start, center, end)

### Tags Popover
- [ ] Opens when clicking tags area
- [ ] Shows current tags
- [ ] Can remove existing tags
- [ ] Can add new tags via search
- [ ] "Done" button closes popover
- [ ] Changes persist to API
- [ ] Empty state shows "Add technologies"

### Vibe Popover
- [ ] Opens when clicking vibe meter
- [ ] Shows current vibe percent
- [ ] Slider updates preview in real-time
- [ ] Can switch between overview/detailed modes
- [ ] Detailed mode shows all category sliders
- [ ] "Done" button closes popover
- [ ] Changes persist to API on submit

### URL Editing
- [ ] Modal opens when clicking URL button
- [ ] Shows current URL in input
- [ ] Validates URL format
- [ ] Shows validation feedback (valid/invalid)
- [ ] Can clear URL (set to null)
- [ ] Save button updates and closes
- [ ] Cancel button reverts and closes
- [ ] Empty URL hides the button in preview

### Integration
- [ ] All editors coexist without conflicts
- [ ] Submit still works with all new data
- [ ] At least one URL required validation still works

---

## Definition of Done

1. `Popover` component created and tested in isolation
2. `EditableTagsPopover` functional with existing `TagEditor`
3. `EditableVibePopover` functional with existing `VibeInput`
4. `EditableLink` modal functional for both URL fields
5. All integrated into `EditableProjectPreview`
6. Vibe state moved into preview component
7. All tests in checklist passing
8. No console errors or warnings
9. Code reviewed

---

## Notes

- **Reuse:** Wrap existing `TagEditor` and `VibeInput` rather than rebuilding
- **Modal:** Use existing `Modal` component from `components/ui/Modal.tsx`
- **Vibe Persistence:** Vibe score only persists on final submit (not auto-saved like other fields) - this matches current behavior
- **URL Validation:** Prefer https:// but allow http:// with warning
- **Empty URLs:** Both URLs can be empty, but at least one required for submit (existing validation)

# Editable Project Preview for Draft Review

**Project:** slop.haus
**Doc status:** Draft
**Date:** 2026-01-12

---

## 1) Problem Statement

### Current State

The draft review page (`/submit/draft/[draftId]`) displays a traditional form layout:
- Screenshot at top
- Form fields in sections: Basic Info, Links, Technologies, Vibe Score
- Submit/Start Over buttons

This is functional but has UX issues:
- User can't visualize how their project will actually appear on the site
- Disconnect between "form filling" and "final result"
- Requires mental translation from form fields to project page layout
- No preview of the actual project card/page appearance

### Proposed Solution

Transform the draft review page into a **live, editable preview** that looks exactly like the published project page. Users see their project as it will appear, and can click on elements to edit them directly.

**Benefits:**
- True WYSIWYG experience
- Reduces cognitive load - what you see is what you get
- More engaging and intuitive editing experience
- Immediate visual feedback on changes
- Higher confidence before submitting

---

## 2) Design Principles

1. **Visual Fidelity**: The preview must look identical to the published project page
2. **Discoverability**: Make it clear which elements are editable without cluttering the UI
3. **Minimal Friction**: Prefer inline editing for simple text fields
4. **Progressive Complexity**: Simple edits (text) should be simpler than complex edits (tags, vibe)
5. **Immediate Feedback**: Changes should reflect instantly in the preview
6. **Non-Destructive**: Always allow canceling edits

---

## 3) Visual Design

### 3.1 Preview Layout

The preview replicates `ProjectDetails` component structure:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │                         EDIT MODE BANNER                            │  │
│ │  "Review your project. Click any highlighted area to edit."         │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌───────────────────────────────┐  ┌───────────────────────────────────┐│
│ │                               │  │                                   ││
│ │    [Screenshot/Media]         │  │  [Title] ← clickable              ││
│ │                               │  │  [Tagline] ← clickable            ││
│ │    📷 Replace Image           │  │                                   ││
│ │                               │  │  👤 Your Name • Submitted just now││
│ │                               │  │                                   ││
│ └───────────────────────────────┘  │  ┌─────────┐ ┌─────────┐          ││
│                                    │  │Visit    │ │View Repo│          ││
│                                    │  │Site ✏️  │ │  ✏️     │          ││
│                                    │  └─────────┘ └─────────┘          ││
│                                    └───────────────────────────────────┘│
│                                                                          │
│ ┌──────────────────────────────────────────┐  ┌────────────────────────┐│
│ │  About                                   │  │  Vibe Score            ││
│ │  ─────                                   │  │  ───────────           ││
│ │  [Description text here...] ← clickable  │  │  [▓▓▓▓▓▓░░░░] 60%     ││
│ │                                          │  │           ← clickable  ││
│ │  Built with                              │  │                        ││
│ │  ──────────                              │  │  Community Votes       ││
│ │  [React] [TypeScript] [Claude]           │  │  (disabled/preview)    ││
│ │           ← clickable                    │  │  People: +0 / -0       ││
│ │                                          │  │  Devs:   +0 / -0       ││
│ └──────────────────────────────────────────┘  └────────────────────────┘│
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │              [Submit Project]        [Start Over]                   │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Editable vs Non-Editable Elements

| Element | Editable | Edit Method |
|---------|----------|-------------|
| Screenshot/Media | Yes | Click to replace (file upload modal) |
| Title | Yes | Inline text editing |
| Tagline | Yes | Inline text editing |
| Description | Yes | Inline textarea / modal for long text |
| Main URL | Yes | Modal (URL input with validation) |
| Repo URL | Yes | Modal (URL input with validation) |
| Tools/Tags | Yes | Popover with TagEditor component |
| Vibe Score | Yes | Popover with VibeInput component |
| Author info | No | Comes from authenticated user |
| Timestamps | No | Shown as "Submitted just now" (preview) |
| Vote buttons | No | Decorative/disabled in preview |
| Comments | No | Hidden in preview mode |

### 3.3 Edit Affordances

**Hover State for Editable Elements:**
```css
.editable-field {
  position: relative;
  cursor: pointer;
  transition: all 0.15s ease;
}

.editable-field:hover {
  background: var(--color-surface-hover);
  outline: 2px dashed var(--color-primary);
  outline-offset: 4px;
}

.editable-field:hover::after {
  content: "✏️";
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
}
```

**Active/Editing State:**
```css
.editable-field.editing {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}
```

---

## 4) Interaction Patterns

### 4.1 Inline Text Editing (Title, Tagline)

**Flow:**
1. User hovers on title → dashed outline + pencil icon appears
2. User clicks → text transforms into input field (same size/position)
3. User edits text
4. User clicks outside or presses Enter → saves, reverts to display mode
5. User presses Escape → cancels, reverts to original value

**Visual:**
```
DISPLAY MODE:                    EDIT MODE:
┌─────────────────────────┐     ┌─────────────────────────┐
│ Cool Project Name   ✏️  │ →   │ ┌─────────────────────┐ │
└─────────────────────────┘     │ │ Cool Project Name   │ │
                                │ └─────────────────────┘ │
                                │        ✓ Save  ✕ Cancel │
                                └─────────────────────────┘
```

**Component: `InlineEditText`**
```tsx
interface InlineEditTextProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  className?: string;
}
```

### 4.2 Inline Description Editing

For longer text like descriptions, we have two options:

**Option A: Inline Textarea**
- Click transforms paragraph into auto-resizing textarea
- Good for short descriptions
- May feel cramped for longer text

**Option B: Slide-in Panel / Modal**
- Click opens a side panel or modal with full-size textarea
- Better for longer descriptions
- Markdown preview support possible

**Recommendation:** Use Option A (inline textarea) since descriptions are typically short (2-4 sentences per LLM extraction).

### 4.3 URL Editing (Modal)

URLs require validation and are less visually integrated, so a modal makes sense.

**Flow:**
1. User clicks "Visit Site" or "View Repo" button
2. Modal opens with URL input field
3. User edits URL
4. Real-time URL validation feedback
5. Save → closes modal, updates button
6. Cancel → closes modal, no changes

**Modal Content:**
```
┌─────────────────────────────────────────────┐
│  Edit Link                              ✕   │
├─────────────────────────────────────────────┤
│                                             │
│  Live Site URL                              │
│  ┌─────────────────────────────────────┐    │
│  │ https://myproject.com               │    │
│  └─────────────────────────────────────┘    │
│  ✓ Valid URL                                │
│                                             │
│         [Cancel]  [Save]                    │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.4 Tools/Tags Editing (Popover)

Tags are complex - users can add/remove from a list with autocomplete.

**Flow:**
1. User clicks on tags area
2. Popover appears anchored to tags section
3. Shows current tags with remove buttons
4. Search/autocomplete input to add new tags
5. Click outside or "Done" → closes popover

**Popover Content:**
```
┌──────────────────────────────────────┐
│  Built with                          │
│                                      │
│  [React ✕] [TypeScript ✕] [Claude ✕] │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Add technology...              │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Python                         │  │
│  │ PostgreSQL                     │  │
│  │ Prisma                         │  │
│  └────────────────────────────────┘  │
│                                      │
│                     [Done]           │
└──────────────────────────────────────┘
```

**Reuses:** Existing `TagEditor` component

### 4.5 Vibe Score Editing (Popover)

Vibe score has a slider + optional detailed mode.

**Flow:**
1. User clicks on VibeMeter
2. Popover appears with VibeInput component
3. User adjusts slider or switches to detailed mode
4. Click outside or "Done" → closes popover

**Popover Content:**
```
┌──────────────────────────────────────┐
│  Vibe Score                          │
│                                      │
│  How much AI was involved?           │
│                                      │
│  [○ Overview]  [○ Detailed]          │
│                                      │
│  0% ──────●────────────── 100%       │
│           60%                        │
│                                      │
│  "Mostly AI-assisted"                │
│                                      │
│                     [Done]           │
└──────────────────────────────────────┘
```

**Reuses:** Existing `VibeInput` component

### 4.6 Screenshot/Media Replacement

**Flow:**
1. User hovers over screenshot → "Replace Image" overlay appears
2. User clicks → File picker modal opens
3. User selects image file
4. Image uploads (progress indicator)
5. Preview updates with new image

**Overlay:**
```
┌───────────────────────────────┐
│                               │
│    [Current Screenshot]       │
│                               │
│    ┌───────────────────────┐  │
│    │ 📷 Replace Image      │  │  ← Appears on hover
│    └───────────────────────┘  │
│                               │
└───────────────────────────────┘
```

**Note:** For MVP, we may keep the existing screenshot and not allow replacement. Screenshot replacement adds complexity (upload endpoint, storage, etc.). Consider as Phase 2.

---

## 5) Component Architecture

### 5.1 New Components

```
apps/web/src/components/
├── submit/
│   ├── EditableProjectPreview.tsx    # Main preview container
│   ├── EditableField.tsx             # Wrapper for editable fields
│   ├── InlineEditText.tsx            # Inline text editing
│   ├── InlineEditTextarea.tsx        # Inline textarea editing
│   ├── EditableLink.tsx              # URL editing with modal
│   ├── EditableTagsPopover.tsx       # Tags editing popover
│   ├── EditableVibePopover.tsx       # Vibe score popover
│   └── EditablePlaceholder.tsx       # Placeholder for empty fields
├── ui/
│   └── Popover.tsx                   # Reusable popover component
```

### 5.2 Component: `EditableProjectPreview`

Main container that mirrors `ProjectDetails` structure.

```tsx
interface EditableProjectPreviewProps {
  draft: DraftData;
  onFieldChange: (field: string, value: unknown) => Promise<void>;
  onSubmit: (vibeMode: "overview" | "detailed", vibeDetails?: Record<string, number>) => void;
  onStartOver: () => void;
  isSubmitting: boolean;
  error: string | null;
}

export function EditableProjectPreview({
  draft,
  onFieldChange,
  onSubmit,
  onStartOver,
  isSubmitting,
  error,
}: EditableProjectPreviewProps) {
  // Resolves final vs suggested values
  const getValue = (field: keyof DraftData["final"]) => {
    return draft.final[field] ?? draft.suggested[field];
  };

  return (
    <div className="project-preview-container">
      {/* Edit mode banner */}
      <div className="preview-banner">
        <p>Review your project. Click any highlighted area to edit.</p>
      </div>

      {/* Mirrors ProjectDetails structure */}
      <div className="project-details preview-mode">
        <div className="project-details-header">
          {/* Media section */}
          <div className="project-details-media">
            <EditableMedia
              url={draft.screenshot}
              onReplace={...}
            />
          </div>

          {/* Info section */}
          <div className="project-details-info">
            <InlineEditText
              value={getValue("title") || ""}
              onSave={(v) => onFieldChange("title", v)}
              className="project-title"
              placeholder="Project Title"
            />
            <InlineEditText
              value={getValue("tagline") || ""}
              onSave={(v) => onFieldChange("tagline", v)}
              className="project-tagline"
              placeholder="One-line description"
            />
            {/* Author info - not editable */}
            {/* Links - editable */}
          </div>
        </div>

        <div className="project-details-body">
          {/* Description */}
          {/* Tools */}
          {/* Vibe Score sidebar */}
        </div>
      </div>

      {/* Actions */}
      <div className="preview-actions">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Project"}
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
```

### 5.3 Component: `InlineEditText`

Handles inline editing for single-line text fields.

```tsx
interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  as?: "h1" | "p" | "span";  // Rendered element type
}

export function InlineEditText({
  value,
  onSave,
  placeholder,
  maxLength,
  className,
  as: Element = "span",
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className={cn("inline-edit-input", className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <Element
      className={cn("editable-field", className, { empty: !value })}
      onClick={handleClick}
    >
      {value || placeholder}
    </Element>
  );
}
```

### 5.4 Component: `Popover`

Reusable popover for complex editors.

```tsx
interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "start",
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        contentRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <div className="popover-container">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <div ref={contentRef} className={cn("popover-content", `align-${align}`)}>
          {children}
        </div>
      )}
    </div>
  );
}
```

---

## 6) State Management

### 6.1 Draft State Structure

The parent page component manages all state:

```tsx
interface PreviewState {
  // Current values (merged from final + suggested)
  title: string;
  tagline: string;
  description: string;
  mainUrl: string;
  repoUrl: string;
  tools: string[];
  vibeMode: "overview" | "detailed";
  vibePercent: number;
  vibeDetails: Record<string, number>;

  // UI state
  activeEditor: string | null;  // Which field is being edited
  isSaving: boolean;
  saveError: string | null;
}
```

### 6.2 Auto-Save Behavior

- Each field saves independently when editing completes (blur/Enter)
- Debounced API calls to prevent excessive requests
- Optimistic updates - UI updates immediately, reverts on error
- No explicit "Save" button for individual fields

```tsx
const handleFieldSave = async (field: string, value: unknown) => {
  // Optimistic update
  setLocalState(prev => ({ ...prev, [field]: value }));

  try {
    await updateDraft(draftId, { [field]: value });
  } catch (error) {
    // Revert on error
    setLocalState(prev => ({ ...prev, [field]: originalValue }));
    showToast({ type: "error", message: "Failed to save. Please try again." });
  }
};
```

### 6.3 Validation

Validation happens at two levels:

1. **Client-side (immediate feedback):**
   - Title: Required, max 255 chars
   - Tagline: Required, max 500 chars
   - Description: Optional, max 10000 chars
   - URLs: Valid URL format
   - At least one URL required (mainUrl or repoUrl)

2. **Server-side (on submit):**
   - All client validations + security checks
   - Duplicate URL detection
   - Content moderation

---

## 7) CSS Approach

### 7.1 Reusing Existing Styles

The preview component should reuse existing `.project-details` styles to ensure visual fidelity:

```css
/* Extends existing project-details styles */
.project-details.preview-mode {
  /* Same layout and styling as published projects */
}

/* Add edit affordances */
.project-details.preview-mode .editable-field {
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: var(--radius-sm);
}

.project-details.preview-mode .editable-field:hover {
  background: rgba(var(--color-primary-rgb), 0.1);
  outline: 2px dashed var(--color-primary);
  outline-offset: 4px;
}

.project-details.preview-mode .editable-field.empty {
  color: var(--color-muted);
  font-style: italic;
}

.project-details.preview-mode .editable-field.empty::before {
  content: "+ Add ";
}
```

### 7.2 New Styles

```css
/* Preview banner */
.preview-banner {
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.preview-banner p {
  margin: 0;
  color: var(--color-info-text);
  font-size: var(--font-size-sm);
}

/* Inline edit input */
.inline-edit-input {
  display: inline-block;
  width: 100%;
}

.inline-edit-input input,
.inline-edit-input textarea {
  width: 100%;
  font: inherit;
  background: var(--color-surface);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-1) var(--spacing-2);
}

/* Popover */
.popover-container {
  position: relative;
  display: inline-block;
}

.popover-content {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--spacing-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-4);
  z-index: 100;
  min-width: 280px;
}

.popover-content.align-end {
  left: auto;
  right: 0;
}

/* Preview actions */
.preview-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  margin-top: var(--spacing-6);
  padding-top: var(--spacing-6);
  border-top: 1px solid var(--color-border);
}
```

---

## 8) Accessibility

### 8.1 Keyboard Navigation

- All editable fields are focusable (`tabindex="0"`)
- Enter/Space activates editing mode
- Escape cancels editing
- Tab moves to next editable field
- Arrow keys navigate within popovers

### 8.2 Screen Reader Support

- Editable fields have `aria-label="Click to edit [field name]"`
- Editing state announced with `aria-live="polite"`
- Popovers use `role="dialog"` and trap focus
- Cancel/Save buttons in modals are properly labeled

### 8.3 Focus Management

- When entering edit mode, focus moves to input
- When exiting edit mode, focus returns to the element
- Popovers trap focus until closed

---

## 9) Mobile Considerations

### 9.1 Touch Interactions

- Hover states don't work on touch → use persistent edit icons
- Tap to edit (same as click)
- Popovers become bottom sheets on mobile

### 9.2 Responsive Layout

- Two-column layout becomes single column on mobile
- Sidebar moves below main content
- Edit icons always visible (no hover required)

```css
@media (max-width: 768px) {
  .project-details.preview-mode .editable-field::after {
    content: "✏️";
    opacity: 1;  /* Always visible on mobile */
  }

  .popover-content {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
}
```

---

## 10) Implementation Plan

### Phase 1: Core Preview Component
1. Create `EditableProjectPreview` component mirroring `ProjectDetails` layout
2. Implement `InlineEditText` for title and tagline
3. Wire up to existing `DraftReviewPage` state management
4. Replace current `DraftReview` form with preview

### Phase 2: Complex Editors
1. Create `Popover` component
2. Implement `EditableTagsPopover` wrapping existing `TagEditor`
3. Implement `EditableVibePopover` wrapping existing `VibeInput`
4. Implement `EditableLink` modal for URL editing

### Phase 3: Description & Media
1. Implement `InlineEditTextarea` for description
2. Implement media replacement UI (if scope allows)
3. Add empty state placeholders

### Phase 4: Polish
1. Add keyboard navigation
2. Add ARIA attributes
3. Mobile optimizations
4. Animation/transitions
5. Error states and loading indicators

---

## 11) Open Questions

1. **Media Replacement:** Should users be able to replace the auto-captured screenshot? This adds upload complexity but gives more control.
   - **Recommendation:** Defer to Phase 2. For MVP, show captured screenshot as-is.

2. **Preview vs Edit Toggle:** Should there be a toggle to switch between "preview mode" (read-only, exact project page) and "edit mode"?
   - **Recommendation:** No. Always show edit affordances - simpler UX.

3. **Markdown in Description:** Should description support markdown with preview?
   - **Recommendation:** No for MVP. Plain text is sufficient for 2-4 sentence descriptions.

4. **Undo/Redo:** Should we support undo/redo for edits?
   - **Recommendation:** No for MVP. Auto-save is sufficient. Users can re-edit.

5. **Draft Indicator:** How do we clearly communicate "this is a draft, not published yet"?
   - **Recommendation:** Banner at top + different background color/border.

---

## 12) Appendix: Mapping Draft Fields to Project Page

| Draft Field | Project Page Element | Edit Method |
|------------|---------------------|-------------|
| `title` | `h1.project-title` | Inline text |
| `tagline` | `p.project-tagline` | Inline text |
| `description` | `.project-description p` | Inline textarea |
| `mainUrl` | "Visit Site" button href | Modal |
| `repoUrl` | "View Repo" button href | Modal |
| `tools` | `.tools-list` badges | Popover |
| `vibePercent` | `VibeMeter` component | Popover |
| `screenshot` | `.project-details-image` | Replace button |
| (author) | Avatar + name | Not editable |
| (dates) | "Submitted X ago" | Shows "just now" |
| (votes) | `ScoreWidget` | Disabled/decorative |

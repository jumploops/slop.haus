# Edit Page: Explicit Submit Pattern

**Status:** Complete
**Created:** 2026-01-15
**Related:** `debug/edit-page-moderation-ux.md`

## Overview

Replace the current auto-save-on-blur pattern with an explicit "Save Changes" button. This eliminates the UX issue where the first flagged edit blocks all subsequent changes.

## Goals

1. **User can edit all fields** before any moderation runs
2. **Single moderation check** on combined content (not per-field)
3. **Single revision** created with all changed fields
4. **Clear save/discard UX** with dirty state indication
5. **Minimal code changes** - reuse existing components and backend

## Non-Goals

- Auto-save to localStorage (future enhancement)
- "Save Draft" vs "Submit" distinction (not needed - moderation handles this)
- Concurrent editing detection (edge case, can add later)

## Current vs. New Flow

### Current Flow (Problematic)

```
User edits title → blur → PATCH { title } → moderation → maybe "pending"
User edits description → blur → PATCH { description } → 409 BLOCKED ❌
```

### New Flow (Proposed)

```
User edits title → blur → local state update only
User edits description → blur → local state update only
User edits tools → local state update only
User clicks "Save Changes" → PATCH { title, description, tools } → moderation
                           → Either approved (changes applied)
                           → Or pending (single revision for review)
```

## Implementation

### Key Insight: Minimal Backend Changes

The PATCH endpoint already supports multi-field updates:
```typescript
// Already works! Send multiple fields in one request:
PATCH /api/v1/projects/:slug
{ title: "New", description: "Updated", tools: ["react", "nextjs"] }
```

The backend creates one revision with all `changedFields`, runs moderation once on combined text. **No backend changes needed.**

### Phase 1: Decouple Field Handlers from API

**File:** `apps/web/src/components/project/EditableProject.tsx`

**Current handlers:**
```typescript
const handleTitleSave = async (value: string) => {
  setTitle(value);           // Local state ✓
  setSaving("title");        // Loading indicator
  await onFieldChange("title", value);  // ← API call - REMOVE
  setSaving(null);
};
```

**New handlers:**
```typescript
const handleTitleChange = (value: string) => {
  setTitle(value);  // Just update local state
};
```

**Changes:**
- Rename handlers from `handle*Save` to `handle*Change` for clarity
- Remove `onFieldChange` calls
- Remove `setSaving` calls (no per-field loading)
- Keep local state updates

### Phase 2: Dirty State Tracking

**Approach:** Compare current state to original `project` prop

```typescript
// Compute dirty state
const isDirty = useMemo(() => {
  if (title !== project.title) return true;
  if (tagline !== project.tagline) return true;
  if (description !== (project.description || "")) return true;
  if (mainUrl !== (project.mainUrl || "")) return true;
  if (repoUrl !== (project.repoUrl || "")) return true;
  if (vibeMode !== project.vibeMode) return true;
  if (vibePercent !== project.vibePercent) return true;
  if (JSON.stringify(vibeDetails) !== JSON.stringify(project.vibeDetailsJson || {})) return true;

  // Tools comparison (order-independent)
  const originalTools = new Set(project.tools.map(t => t.slug));
  const currentTools = new Set(tools);
  if (originalTools.size !== currentTools.size) return true;
  for (const tool of currentTools) {
    if (!originalTools.has(tool)) return true;
  }

  return false;
}, [title, tagline, description, mainUrl, repoUrl, vibeMode, vibePercent, vibeDetails, tools, project]);
```

**Also track which specific fields changed** (for the submit payload):

```typescript
const getChangedFields = (): Record<string, unknown> => {
  const changes: Record<string, unknown> = {};

  if (title !== project.title) changes.title = title;
  if (tagline !== project.tagline) changes.tagline = tagline;
  if (description !== (project.description || "")) changes.description = description;
  if (mainUrl !== (project.mainUrl || "")) changes.mainUrl = mainUrl || null;
  if (repoUrl !== (project.repoUrl || "")) changes.repoUrl = repoUrl || null;
  if (vibeMode !== project.vibeMode) changes.vibeMode = vibeMode;
  if (vibePercent !== project.vibePercent) changes.vibePercent = vibePercent;
  if (JSON.stringify(vibeDetails) !== JSON.stringify(project.vibeDetailsJson || {})) {
    changes.vibeDetails = vibeDetails;
  }

  // Tools
  const originalTools = new Set(project.tools.map(t => t.slug));
  const currentTools = new Set(tools);
  const toolsChanged = originalTools.size !== currentTools.size ||
    [...currentTools].some(t => !originalTools.has(t));
  if (toolsChanged) changes.tools = tools;

  return changes;
};
```

### Phase 3: Update Component Props

**Current props:**
```typescript
interface EditableProjectProps {
  project: ProjectDetail;
  onFieldChange: (field: string, value: unknown) => Promise<void>;  // Per-field
  onScreenshotChange: (url: string) => void;
  onDelete: () => void;
  onDone: () => void;
  error: string | null;
  pendingRevision?: ProjectRevision;
  onRevisionDismiss?: () => void;
}
```

**New props:**
```typescript
interface EditableProjectProps {
  project: ProjectDetail;
  onSubmit: (changes: Record<string, unknown>) => Promise<void>;  // All changes at once
  onScreenshotChange: (url: string) => void;
  onDelete: () => void;
  onDone: () => void;
  error: string | null;
  pendingRevision?: ProjectRevision;
  onRevisionDismiss?: () => void;
}
```

### Phase 4: Add Submit UI

**Location:** Header area of EditableProject (replace current layout)

**Current header:**
```tsx
<div className="edit-header">
  <Button variant="ghost" onClick={onDelete}>Delete</Button>
  <Button onClick={onDone}>Done</Button>
</div>
```

**New header:**
```tsx
<div className="edit-header">
  <div className="edit-header-left">
    <Button variant="ghost" onClick={onDelete} className="btn-danger-text">
      Delete Project
    </Button>
  </div>
  <div className="edit-header-right">
    {isDirty && (
      <Button variant="ghost" onClick={handleDiscard}>
        Discard
      </Button>
    )}
    <Button
      onClick={handleSubmit}
      disabled={!isDirty || isSaving}
    >
      {isSaving ? "Saving..." : "Save Changes"}
    </Button>
  </div>
</div>
```

**Visual states:**
- No changes: "Save Changes" disabled, "Discard" hidden
- Has changes: "Save Changes" enabled, "Discard" visible
- Saving: "Saving..." text, button disabled
- Error: Show error message below header

### Phase 5: Implement Submit Handler

```typescript
const [isSaving, setIsSaving] = useState(false);

const handleSubmit = async () => {
  const changes = getChangedFields();
  if (Object.keys(changes).length === 0) return;

  setIsSaving(true);
  try {
    await onSubmit(changes);
    // Success - parent will update project prop via SWR mutate
    // Local state now matches project, isDirty becomes false
  } catch (err) {
    // Error shown via error prop from parent
    // Keep dirty state so user can retry
  } finally {
    setIsSaving(false);
  }
};

const handleDiscard = () => {
  // Reset all local state to project values
  setTitle(project.title);
  setTagline(project.tagline);
  setDescription(project.description || "");
  setMainUrl(project.mainUrl || "");
  setRepoUrl(project.repoUrl || "");
  setTools(project.tools.map(t => t.slug));
  setVibeMode(project.vibeMode);
  setVibePercent(project.vibePercent);
  setVibeDetails(project.vibeDetailsJson || { idea: 50, design: 50, code: 50, prompts: 50, vibe: 50 });
};
```

### Phase 6: Update Edit Page

**File:** `apps/web/src/app/p/[slug]/edit/page.tsx`

**Current:**
```typescript
const handleFieldChange = async (field: string, value: unknown) => {
  setSaveError(null);
  try {
    const result = await updateProject(slug, { [field]: value });
    mutate(result.project, false);
    mutateRevisions();
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : "Failed to save");
    throw err;
  }
};
```

**New:**
```typescript
const handleSubmit = async (changes: Record<string, unknown>) => {
  setSaveError(null);
  try {
    const result = await updateProject(slug, changes);
    mutate(result.project, false);
    mutateRevisions();
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : "Failed to save");
    throw err;
  }
};
```

**Update component usage:**
```tsx
<EditableProject
  project={project}
  onSubmit={handleSubmit}  // Changed from onFieldChange
  onScreenshotChange={handleScreenshotChange}
  onDelete={() => setShowDeleteModal(true)}
  onDone={() => router.push(`/p/${slug}`)}
  error={saveError}
  pendingRevision={latestActionableRevision}
  onRevisionDismiss={() => mutateRevisions()}
/>
```

### Phase 7: Navigation Warning

**Add to EditableProject:**

```typescript
// Warn on browser close/refresh
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = ""; // Required for Chrome
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isDirty]);
```

**For Next.js router navigation** (clicking links):

The `onDone` handler should check for dirty state:
```typescript
const handleDone = () => {
  if (isDirty) {
    // Could show confirmation modal, or just warn
    if (!window.confirm("You have unsaved changes. Discard and leave?")) {
      return;
    }
  }
  onDone();
};
```

### Phase 8: Handle InlineEditText Behavior

**Current behavior:** InlineEditText calls `onSave` on blur, shows loading state.

**With new pattern:** The `onSave` callback just updates local state (sync), so:
- Loading state flashes briefly (setState → render → loading false)
- This is acceptable, but we can improve it

**Option A: Keep as-is** (minimal change)
- Brief flash of loading is barely noticeable
- No component changes needed

**Option B: Add optional flag** (cleaner)
```typescript
// InlineEditText.tsx
interface Props {
  // ... existing
  showSavingState?: boolean;  // Default true for backward compat
}

// In handleBlur:
if (showSavingState !== false) {
  setIsSaving(true);
}
```

**Recommendation:** Start with Option A. If the flash is noticeable, apply Option B.

### Phase 9: URL Change Handling

**Current:** URL changes open a modal with "Just Save" and "Save & Refresh" options.

**New behavior:**
- URL input changes update local state only
- Modal should only appear when user clicks "Save Changes" AND URL changed
- Or: Simplify to always refresh screenshot if URL changed

**Proposed simplification:**
- Remove URL change modal entirely
- On submit, if mainUrl changed, automatically refresh screenshot
- Show "URL changed - screenshot will be refreshed" message

**Alternative:** Keep modal but trigger it on submit instead of blur:
```typescript
const handleSubmit = async () => {
  const changes = getChangedFields();

  // Check if URL changed
  if (changes.mainUrl && changes.mainUrl !== project.mainUrl) {
    // Show modal asking about screenshot refresh
    setUrlChangeModal({ isOpen: true, changes });
    return;
  }

  await submitChanges(changes);
};
```

**Recommendation:** Keep current modal flow but trigger on submit. User experience:
1. User changes URL and other fields
2. User clicks "Save Changes"
3. Modal appears: "URL changed. Refresh screenshot?"
4. User chooses option
5. All changes submitted together

## File Changes Summary

| File | Changes |
|------|---------|
| `apps/web/src/components/project/EditableProject.tsx` | Major refactor: local-only handlers, dirty tracking, submit button |
| `apps/web/src/app/p/[slug]/edit/page.tsx` | Replace `onFieldChange` with `onSubmit` |
| `apps/web/src/app/globals.css` | Minor: dirty indicator styles, button states |
| `apps/web/src/components/submit/InlineEditText.tsx` | Optional: add `showSavingState` prop |

## Edge Cases

### 1. Pending revision already exists
**Current:** 409 error blocks edit
**New:** User can still edit locally; on submit, 409 error shows with message

This is still a limitation but less severe:
- User can make all their changes
- On submit, they learn a revision is pending
- They can wait for review, then try again

**Future enhancement:** Allow submitting changes that merge with/replace pending revision.

### 2. Project updated by another session
**Current:** Stale project data, edits based on old values
**New:** Same issue, but less frequent since we don't hit API on every blur

**Mitigation:** On submit error, refetch project and show "Project was updated. Please review changes."

### 3. Screenshot changes
**Current:** Screenshot upload is separate from field edits
**New:** Keep as-is. Screenshot changes are:
- Upload: Independent action, saves immediately
- Refresh: Independent action, saves immediately

These don't need to be part of the "Save Changes" flow.

### 4. Tools change to empty
**Current:** Can remove all tools
**New:** Same. Empty tools array is valid.

### 5. Long editing session
**Current:** Each blur saves, so no data loss
**New:** Risk of losing work if browser closes

**Mitigation for v1:** Navigation warning via `beforeunload`
**Future:** Auto-save to localStorage

## Testing Checklist

- [x] Edit single field → Save → Changes applied
- [x] Edit multiple fields → Save → All changes in single revision
- [x] Edit fields → Discard → All fields reset
- [x] Edit fields → Navigate away → Warning appears
- [x] Edit fields → Close browser → Warning appears
- [x] Edit fields → Save → Moderation flags → Single "pending" revision
- [x] Edit only tools → Save → Auto-approved (no text content)
- [x] Edit title + tools → Save → Moderation runs on title
- [ ] Pending revision exists → Can still edit locally
- [ ] Pending revision exists → Submit → 409 error shown clearly
- [x] Screenshot upload → Works independently of Save button
- [x] Screenshot refresh → Works independently of Save button
- [x] URL changed → On save, modal asks about screenshot refresh

## Bug Fixes

### Dirty State Persists After Save (2026-01-15)

**Problem:** After successfully saving, clicking "Back to project" still showed "unsaved changes" warning.

**Root Cause:** `isDirty` used `JSON.stringify` to compare `vibeDetails` objects. PostgreSQL JSONB doesn't preserve key order, so server response had different key ordering than local state, causing false positive.

**Fix:**
1. Created centralized vibe configuration in `packages/shared/src/schemas.ts`
2. Added `isEqualVibeDetails()` helper for order-independent comparison
3. Updated all components to use shared `DEFAULT_VIBE_DETAILS`

**Files:**
- `packages/shared/src/schemas.ts` - Added `VIBE_CATEGORIES`, `DEFAULT_VIBE_DETAILS`, `isEqualVibeDetails()`
- `apps/web/src/components/project/EditableProject.tsx` - Import from shared
- `apps/web/src/components/submit/DraftReview.tsx` - Import from shared
- `apps/web/src/components/submit/EditableProjectPreview.tsx` - Import from shared
- `apps/web/src/app/submit/manual/page.tsx` - Import from shared

**Debug Doc:** `debug/dirty-state-after-save.md`

## Rollout Plan

1. **Implement core changes** (Phases 1-6) ✅
2. **Test manually** with various edit scenarios ✅
3. **Add navigation warning** (Phase 7) ✅
4. **Fix dirty state bug** ✅
5. **Update PROGRESS.md** with completion status ✅

## Future Enhancements

1. **Auto-save to localStorage** - Recover work on browser crash
2. **Revision merging** - Allow edits even when revision pending
3. **Optimistic updates** - Show changes immediately, sync in background
4. **Field-level dirty indicators** - Highlight which fields changed
5. **Undo/redo** - Track edit history within session

# Edit Page Moderation UX Conflict

## Problem Statement

The edit page has a fundamental UX conflict between its save mechanism and moderation flow:

1. **Auto-save on blur**: Each field saves immediately when the user clicks away
2. **Per-edit moderation**: Each save triggers the PATCH endpoint which runs moderation
3. **Pending revision blocking**: Once a revision is flagged as "pending", all subsequent edits return 409 Conflict

**Result**: If a user's first edit triggers moderation review, they cannot make any additional changes until the first edit is reviewed. This creates a frustrating experience where users can't complete their intended edits.

## Current Implementation Analysis

### Frontend: Auto-Save Pattern

The edit page uses individual field saves on blur:

```
apps/web/src/app/p/[slug]/edit/page.tsx
├── handleFieldChange(field, value) → updateProject(slug, { [field]: value })
│   └── Called on every field blur/change
└── No batching, no explicit "Submit" button for edits
```

**Field save triggers:**

| Field | Save Trigger | File:Line |
|-------|--------------|-----------|
| Title | onBlur | `InlineEditText.tsx:102` |
| Tagline | onBlur | `InlineEditText.tsx:102` |
| Description | onBlur | `InlineEditTextarea.tsx:116` |
| Tools | onChange (immediate) | `EditableProject.tsx:107-114` |
| Vibe | onBlur (container) | `EditableProject.tsx:194-203` |
| URLs | onBlur → modal | `EditableProject.tsx:117-137` |

### Backend: Per-Request Moderation

The PATCH endpoint (`projects.ts:440-597`) processes each field change independently:

```typescript
// 1. Check for existing pending revision (BLOCKS further edits)
const [pendingRevision] = await db.select()...
if (pendingRevision) {
  return c.json({ error: "A revision is already pending review" }, 409);
}

// 2. Create new revision for this single change
const [revision] = await db.insert(projectRevisions).values({...});

// 3. Run moderation on text content
if (textContent) {
  const modResult = await moderateProject({...});
  shouldApprove = modResult.approved;
} else {
  shouldApprove = true; // Non-text auto-approves
}

// 4. Either apply immediately OR leave pending for review
if (shouldApprove) {
  // Apply changes, mark revision approved
} else {
  // Changes NOT applied, revision stays pending
  // User can't make more edits until this is reviewed
}
```

### The Blocking Problem

**Scenario**: User wants to update title, description, and add a new tool

```
Timeline:
1. User edits title "New Project Name" → blur
2. PATCH /projects/slug { title: "New Project Name" }
3. Backend: No pending revision, create revision #1, run moderation
4. Moderation: "New Project Name" flagged (maybe contains banned word)
5. Response: { revision: { status: "pending" } }
6. User edits description → blur
7. PATCH /projects/slug { description: "..." }
8. Backend: Found pending revision #1 → 409 CONFLICT
9. User sees error: "A revision is already pending review"
10. User cannot edit tools, vibe, or anything else ❌
```

**The user is now blocked from making ANY changes** until an admin reviews revision #1.

### What the User Expects

Users expect one of these behaviors:
1. **Batch editing**: Make all changes, then click "Save" to submit everything together
2. **Non-blocking**: Previous pending edits don't block new edits (edits queue up or merge)
3. **Local-only until submit**: Changes only go to server when explicitly submitted

### What Currently Happens

- Each blur immediately sends to server
- First flagged edit blocks all subsequent edits
- "Done" button just navigates away (doesn't submit anything)
- No way to batch multiple changes into single moderation check

## Impact Analysis

### User Experience Issues

1. **Incomplete edits**: User can't finish their intended changes
2. **Wasted moderator time**: Reviewing partial edits instead of complete revisions
3. **Confusion**: "Done" button exists but doesn't control saving
4. **No undo**: Can't cancel a pending change to continue editing

### Moderation Queue Issues

1. **Fragmented reviews**: Multiple revisions for what should be one edit session
2. **Context missing**: Reviewer sees partial change, not full intent
3. **Thrashing**: User might submit multiple attempts to work around blocking

## Potential Solutions

### Option A: Explicit Submit Pattern

Change from auto-save to explicit submit:

```
Frontend:
- Track dirty state for all fields locally
- "Save Changes" button at bottom
- Warn on navigate-away if dirty
- Submit all changes as single PATCH

Backend:
- Same PATCH endpoint, but receives all changes at once
- Single moderation check on combined text content
- Single revision created with all changed fields
```

**Pros:**
- Clean UX: User knows when changes are submitted
- Better moderation: Reviewer sees complete intent
- Standard pattern: Familiar form behavior

**Cons:**
- Loses "instant save" feel
- More code changes needed
- Risk of losing work on browser close

### Option B: Deferred Moderation

Keep auto-save, but defer moderation to explicit action:

```
Frontend:
- Auto-save stores changes in "draft revision" locally/server
- "Submit for Review" button triggers moderation
- Show "unsaved changes" indicator

Backend:
- New endpoint: PATCH /projects/:slug/draft - saves without moderation
- Existing PATCH /projects/:slug - triggers moderation (called on submit)
- Or: Add flag to PATCH { ..., deferModeration: true }
```

**Pros:**
- Keeps instant save feel
- Clear separation of save vs. submit
- User can accumulate changes

**Cons:**
- More complex state management
- Two-phase commit pattern
- Draft state needs cleanup if abandoned

### Option C: Revision Merging

Allow multiple pending changes by merging revisions:

```
Backend:
- If pending revision exists for same project/user, UPDATE it
- Merge new field changes into existing pending revision
- Re-run moderation on merged content
- Only one pending revision per project

Frontend:
- No change needed, but show "adding to pending revision" message
```

**Pros:**
- No frontend changes
- User can continue editing
- Reviewer sees accumulated changes

**Cons:**
- Complex merge logic (what if user changes same field twice?)
- Moderation runs multiple times (inefficient)
- Revision history loses granularity

### Option D: Queue All Changes (No Blocking)

Don't block edits, queue them all:

```
Backend:
- Allow multiple pending revisions per project
- Each edit creates new revision (current behavior minus blocking)
- Admin reviews all, approves/rejects each

Frontend:
- Show list of pending revisions
- User sees "3 edits pending review"
```

**Pros:**
- Simplest change (just remove 409 check)
- User never blocked

**Cons:**
- Moderation queue fills with fragmentary edits
- Confusing: 5 revisions for one "edit session"
- Order of approval matters (conflicts possible)

### Option E: Optimistic Local + Background Moderation

Save locally first, background moderation:

```
Frontend:
- All changes apply immediately to local state
- Background sync to server
- Show "syncing" / "pending review" indicators
- If moderation fails, show warning but don't block

Backend:
- Receive full state on each save
- Run moderation async (job queue)
- Flag project if any pending moderation
- Admin sees combined pending state
```

**Pros:**
- Best UX: instant feedback, no blocking
- User sees their changes immediately
- Moderation is informational, not blocking

**Cons:**
- Most complex implementation
- "Pending review" state is confusing
- Need to handle eventual rejection

## Recommendation

**Option A (Explicit Submit)** is recommended as the clearest path forward:

### Rationale

1. **User expectation**: "Edit page" implies making changes, then saving
2. **Moderation coherence**: One revision = one complete edit session
3. **Implementation clarity**: Standard form pattern, well-understood
4. **Risk mitigation**: No partial changes go live

### Suggested Implementation

**Phase 1: Frontend Changes**
- Add dirty state tracking for all fields
- Add "Save Changes" button (disabled when not dirty)
- Change field handlers to only update local state (no API call)
- Add "Discard Changes" option
- Add unsaved changes warning on navigation

**Phase 2: Backend Changes**
- Modify PATCH to expect all changed fields at once
- Run moderation on combined text content
- Create single revision with all changes

**Phase 3: UX Polish**
- Loading state on Save button
- Success confirmation
- Clear pending revision banner
- Auto-save to localStorage as backup

## Files Involved

| File | Current Role | Changes Needed |
|------|--------------|----------------|
| `apps/web/src/app/p/[slug]/edit/page.tsx` | Per-field PATCH calls | Collect dirty state, single submit |
| `apps/web/src/components/project/EditableProject.tsx` | Auto-save handlers | Local state only, add Save button |
| `apps/web/src/components/submit/InlineEditText.tsx` | onBlur → save | onBlur → local only |
| `apps/web/src/components/submit/InlineEditTextarea.tsx` | onBlur → save | onBlur → local only |
| `apps/api/src/routes/projects.ts` | Per-field PATCH | Multi-field PATCH (no change needed) |

## Questions to Resolve

1. **Auto-save backup**: Should we save to localStorage periodically in case browser closes?
2. **Partial submission**: Can user submit some fields while others are still being edited?
3. **Cancel behavior**: What happens to local changes on "Discard"? Just reset to server state?
4. **Draft/Submit distinction**: Is there value in a "Save Draft" (no moderation) vs "Submit" (with moderation) split?
5. **Concurrent editing**: What if user opens edit page in two tabs?

## Related Issues

- `debug/tools-change-pending-review.md` - Tools now auto-approve (no text to moderate)
- `debug/revision-banner-false-url-changes.md` - changedFields tracking for accurate display
- `TODO.md` - Future user-submitted tools will need moderation

## Verification After Fix

- [ ] User can edit multiple fields without being blocked
- [ ] Single "Save Changes" button submits all edits
- [ ] Moderation runs once on combined text content
- [ ] Single revision created with all changed fields
- [ ] "Discard Changes" resets to last saved state
- [ ] Navigation warning when unsaved changes exist
- [ ] Clear visual feedback for dirty/saving/saved states

# Dirty State Persists After Successful Save

## Problem

After successfully saving changes on the edit page, clicking the "Back to project" link shows "You have unsaved changes" warning even though the changes were saved to the database.

## Expected Behavior

1. User makes changes → `isDirty = true`
2. User clicks "Save Changes" → API call succeeds
3. `project` prop updates with new data from server
4. `isDirty` recalculates → should be `false` (local state matches project)
5. User clicks back → no warning

## Actual Behavior

1-4 same as above, but:
5. `isDirty` is still `true`
6. User clicks back → warning appears

## Analysis

### How State Works

**Initial mount:**
```typescript
const [title, setTitle] = useState(project.title);  // Only runs once!
const [vibeDetails, setVibeDetails] = useState(
  project.vibeDetailsJson || { idea: 50, design: 50, code: 50, prompts: 50, vibe: 50 }
);
```

**isDirty calculation:**
```typescript
const isDirty = useMemo(() => {
  if (title !== project.title) return true;
  // ...
  if (JSON.stringify(vibeDetails) !== JSON.stringify(project.vibeDetailsJson || {})) return true;
  // ...
}, [title, tagline, ..., project]);
```

### The Problem: useState Doesn't Re-initialize

`useState(initialValue)` only uses `initialValue` on the **first render**. When `project` prop changes after a save, the local state variables keep their current values.

This is actually **correct behavior** for our dirty tracking - we compare local state to the new project prop, and if they match, `isDirty` should be false.

### Root Cause: Data Format Mismatch

The issue is likely a **mismatch between local state format and server response format**.

#### Hypothesis 1: vibeDetailsJson Default Values

**Local state initialization:**
```typescript
const [vibeDetails, setVibeDetails] = useState(
  project.vibeDetailsJson || { idea: 50, design: 50, code: 50, prompts: 50, vibe: 50 }
);
```

**isDirty comparison:**
```typescript
JSON.stringify(vibeDetails) !== JSON.stringify(project.vibeDetailsJson || {})
```

**The bug:**
- If `project.vibeDetailsJson` is `null`, local state gets default object `{ idea: 50, ... }`
- Comparison: `JSON.stringify({ idea: 50, ... })` vs `JSON.stringify({})` → NOT EQUAL!
- `isDirty = true` even though user never touched vibe settings

**But wait** - this would cause `isDirty = true` on initial load, not just after save. Unless...

The project was created with vibe details, so on initial load both sides have data. But after save, if only title was changed, the server might return `vibeDetailsJson: null` for some reason?

#### Hypothesis 2: Server Returns Different Format

After PATCH, the server runs `fetchCompleteProject()` which might:
- Omit null fields (returning `undefined` instead of `null`)
- Change JSON key ordering
- Coerce types differently (string "50" vs number 50)

**Check:** What does `fetchCompleteProject()` return for `vibeDetailsJson`?

#### Hypothesis 3: Tools Array Object Reference

**Local state:**
```typescript
const [tools, setTools] = useState<string[]>(project.tools.map((t) => t.slug));
```

After save, even if the tools array has the same slugs, the comparison should work:
```typescript
const originalTools = new Set(project.tools.map((t) => t.slug));
const currentTools = new Set(tools);
// Set comparison...
```

This should be order-independent and work correctly.

#### Hypothesis 4: URL Empty String vs Null

**Local state:**
```typescript
const [mainUrl, setMainUrl] = useState(project.mainUrl || "");
```

**Comparison:**
```typescript
if (mainUrl !== (project.mainUrl || "")) return true;
```

If project has `mainUrl: null`:
- Local: `mainUrl = ""`
- Comparison: `"" !== (null || "")` → `"" !== ""` → false ✓

This should work correctly.

#### Hypothesis 5: Moderation Created Pending Revision

If the edit was flagged by moderation:
1. Server does NOT apply changes to database
2. Server returns the **unchanged** project data
3. Local state has new values, project has old values
4. `isDirty = true` (correctly!)

But user said "changes saved correctly" - so moderation must have approved.

**Check:** Was moderation involved? Did the revision status return as "approved"?

## Most Likely Cause

**Hypothesis 1 (vibeDetails default mismatch)** seems most likely, but with a twist:

The issue might be that after save:
1. Server returns project with `vibeDetailsJson: { ... actual values ... }`
2. But the JSON key ordering is different from local state
3. `JSON.stringify` produces different strings even for same data

**Example:**
```javascript
// Local (from user edits or defaults)
vibeDetails = { idea: 50, design: 50, code: 50, prompts: 50, vibe: 50 }

// Server (from database, possibly different key order)
project.vibeDetailsJson = { vibe: 50, prompts: 50, code: 50, design: 50, idea: 50 }

JSON.stringify(vibeDetails)                    // '{"idea":50,"design":50,...}'
JSON.stringify(project.vibeDetailsJson || {})  // '{"vibe":50,"prompts":50,...}'
// These are NOT equal!
```

PostgreSQL JSONB doesn't preserve key ordering, so the returned JSON might have keys in a different order than what was sent.

## Investigation Steps

1. Add console.log in `isDirty` calculation to see which comparison fails:
   ```typescript
   console.log('title dirty:', title !== project.title, { local: title, server: project.title });
   console.log('vibeDetails dirty:',
     JSON.stringify(vibeDetails) !== JSON.stringify(project.vibeDetailsJson || {}),
     { local: vibeDetails, server: project.vibeDetailsJson }
   );
   ```

2. Check the PATCH response in Network tab - what exactly does the server return?

3. Check if `vibeDetailsJson` has different key ordering after save

## Potential Fixes

### Fix 1: Order-Independent Object Comparison

Replace `JSON.stringify` with a proper deep equality check:

```typescript
function isEqualVibeDetails(a: Record<string, number>, b: Record<string, number> | null): boolean {
  const bNormalized = b || {};
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(bNormalized);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (a[key] !== bNormalized[key]) return false;
  }

  return true;
}

// In isDirty:
if (!isEqualVibeDetails(vibeDetails, project.vibeDetailsJson)) return true;
```

### Fix 2: Use Consistent Default Handling

Make sure both initialization and comparison use the same default:

```typescript
const DEFAULT_VIBE_DETAILS = { idea: 50, design: 50, code: 50, prompts: 50, vibe: 50 };

const [vibeDetails, setVibeDetails] = useState(
  project.vibeDetailsJson || DEFAULT_VIBE_DETAILS
);

// In isDirty - compare against same default:
const serverVibeDetails = project.vibeDetailsJson || DEFAULT_VIBE_DETAILS;
if (!isEqualVibeDetails(vibeDetails, serverVibeDetails)) return true;
```

### Fix 3: Reset Local State After Successful Save

After `onSubmit` resolves successfully, reset local state to match the new project:

```typescript
const submitChanges = async (changes: Record<string, unknown>) => {
  setIsSaving(true);
  try {
    await onSubmit(changes);
    // After successful save, the project prop will update via SWR mutate
    // Local state should now match project, but we can force reset to be safe
  } finally {
    setIsSaving(false);
  }
};
```

But this is tricky because we need to wait for the project prop to update first.

### Fix 4: Sync Local State When Project Prop Changes (useEffect)

Add an effect that syncs local state when project prop changes after a save:

```typescript
// Track if we just saved
const [justSaved, setJustSaved] = useState(false);

// In submitChanges:
await onSubmit(changes);
setJustSaved(true);

// Sync local state when project updates after save
useEffect(() => {
  if (justSaved) {
    setTitle(project.title);
    setTagline(project.tagline);
    // ... reset all fields
    setJustSaved(false);
  }
}, [project, justSaved]);
```

This is explicit but adds complexity.

## Recommended Fix

**Fix 1 (order-independent comparison)** is the cleanest solution:

1. It addresses the root cause (JSON.stringify key ordering)
2. Doesn't require syncing state
3. Is a minimal, focused change
4. Works for both initial load and after-save scenarios

## Files Involved

| File | Role |
|------|------|
| `apps/web/src/components/project/EditableProject.tsx` | `isDirty` calculation, local state |
| `apps/api/src/routes/projects.ts` | `fetchCompleteProject()` response |
| `packages/db/src/schema/projects.ts` | `vibeDetailsJson` column type |

## Implementation

**Status:** Complete

### Changes Made

**Centralized vibe configuration in `packages/shared/src/schemas.ts`:**

```typescript
// Vibe categories - single source of truth
export const VIBE_CATEGORIES = ["idea", "design", "code", "prompts", "vibe"] as const;
export type VibeCategory = (typeof VIBE_CATEGORIES)[number];
export type VibeDetails = Record<VibeCategory, number>;

export const DEFAULT_VIBE_SCORE = 50;
export const DEFAULT_VIBE_DETAILS: VibeDetails = VIBE_CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category]: DEFAULT_VIBE_SCORE }),
  {} as VibeDetails
);

// Helper functions
export function getVibeDetailsWithDefaults(details): VibeDetails { ... }
export function isEqualVibeDetails(a, b): boolean { ... }
```

**Benefits:**
- Single source of truth for vibe categories and defaults
- TypeScript types ensure consistency
- Adding/removing categories requires updating one file
- Components import from `@slop/shared`

### Files Modified

| File | Changes |
|------|---------|
| `packages/shared/src/schemas.ts` | Added centralized vibe configuration |
| `apps/web/src/components/project/EditableProject.tsx` | Import from shared, removed local constants |
| `apps/web/src/components/submit/DraftReview.tsx` | Import `DEFAULT_VIBE_DETAILS` from shared |
| `apps/web/src/components/submit/EditableProjectPreview.tsx` | Import `DEFAULT_VIBE_DETAILS` from shared |
| `apps/web/src/app/submit/manual/page.tsx` | Import `DEFAULT_VIBE_DETAILS` from shared |

## Verification

After fix:
- [ ] Make changes → Save → isDirty becomes false
- [ ] Click back arrow → no warning
- [ ] Change only vibe details → Save → isDirty becomes false
- [ ] Change multiple fields → Save → isDirty becomes false
- [ ] Moderation flags change → isDirty stays true (correct - changes not applied)

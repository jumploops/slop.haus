# Revision Banner Incorrectly Shows URL Fields as Changed

## Problem

When editing only the description field on `/p/[slug]/edit`, the revision status banner shows "main URL" and "repository URL" as changed fields, even though those fields were never modified.

## Investigation

### Data Flow Analysis

Traced the complete flow from frontend edit to banner display:

1. **Frontend Edit**: User edits description field
2. **Handler**: `handleDescriptionSave("new description")` calls `onFieldChange("description", value)`
3. **API Call**: `updateProject(slug, { description: "new description" })`
4. **PATCH Body**: `{ description: "new description" }` - only description field sent

5. **API Processing** (`apps/api/src/routes/projects.ts:486-500`):
   ```typescript
   const [revision] = await db
     .insert(projectRevisions)
     .values({
       projectId: existing.id,
       title: data.title,        // undefined (not in request)
       tagline: data.tagline,    // undefined (not in request)
       description: data.description,  // "new description"
       mainUrl: data.mainUrl,    // undefined (not in request)
       repoUrl: data.repoUrl,    // undefined (not in request)
       // ...
     })
     .returning();
   ```

6. **Database Storage**: Drizzle inserts `undefined` as `NULL` in PostgreSQL

7. **Revision Fetch**: Returns `{ mainUrl: null, repoUrl: null, ... }`

8. **Banner Display** (`apps/web/src/components/project/RevisionStatusBanner.tsx:22-27`):
   ```typescript
   const changedFields: string[] = [];
   if (revision.title) changedFields.push("title");
   if (revision.tagline) changedFields.push("tagline");
   if (revision.description) changedFields.push("description");
   if (revision.mainUrl !== undefined) changedFields.push("main URL");     // BUG!
   if (revision.repoUrl !== undefined) changedFields.push("repository URL"); // BUG!
   ```

### Root Cause

**The banner's change detection logic is flawed for URL fields.**

| Field Type | Check Used | Problem |
|------------|------------|---------|
| Text fields | `if (revision.title)` | Truthy check - empty/null won't trigger ✓ |
| URL fields | `if (revision.mainUrl !== undefined)` | `null !== undefined` is TRUE! ✗ |

When a revision is stored with `mainUrl: undefined`:
1. Database stores it as `NULL`
2. When fetched, JavaScript receives `null`
3. Check `null !== undefined` evaluates to `TRUE`
4. Banner incorrectly shows "main URL" as changed

### JavaScript Truth Table

```javascript
// What the code does:
revision.mainUrl !== undefined

// Possible values from database:
null !== undefined    // TRUE  ← Bug! Shows as "changed"
"https://..." !== undefined  // TRUE  ← Correct, shows as "changed"
undefined !== undefined      // FALSE ← Never happens (DB returns null, not undefined)
```

## Hypotheses

### Hypothesis 1: Banner Change Detection Bug (Most Likely)

**Theory**: The `!== undefined` check is incorrect because database NULL values become JavaScript `null`, not `undefined`.

**Evidence**:
- Text fields use truthy checks which work correctly
- URL fields use strict inequality with `undefined` which fails for `null`

**Fix Location**: `apps/web/src/components/project/RevisionStatusBanner.tsx:26-27`

**Proposed Fix**:
```typescript
// Option A: Check for truthy (consistent with other fields)
if (revision.mainUrl) changedFields.push("main URL");
if (revision.repoUrl) changedFields.push("repository URL");

// Option B: Explicit null check
if (revision.mainUrl != null) changedFields.push("main URL");  // != catches both null and undefined
if (revision.repoUrl != null) changedFields.push("repository URL");
```

### Hypothesis 2: Revision Storage Design Issue

**Theory**: Storing `NULL` for unchanged fields creates ambiguity - we can't distinguish between "field not changed" and "field explicitly cleared".

**Current Behavior**:
- User edits only description → revision has `mainUrl: NULL`
- User explicitly clears URL → revision has `mainUrl: NULL`
- These are indistinguishable!

**Alternative Design**: Only store fields that were actually changed, leaving others as `undefined`/not present. But this requires schema changes and is more complex.

### Hypothesis 3: Stale Pending Revision (Less Likely)

**Theory**: There's an old pending revision in the database from previous testing that actually DID change the URL fields.

**How to Check**:
```sql
SELECT * FROM project_revisions
WHERE status = 'pending'
ORDER BY submitted_at DESC;
```

**Evidence Against**: The user said they only edited the description. If there was a stale revision, they would have gotten a 409 error ("A revision is already pending review") before being able to create a new one.

## Affected Files

| File | Role |
|------|------|
| `apps/web/src/components/project/RevisionStatusBanner.tsx` | Banner change detection logic |
| `apps/api/src/routes/projects.ts` | Revision creation with undefined values |
| `packages/db/src/schema/projects.ts` | projectRevisions table schema |

## Verification Steps

After fix:
1. Edit only the description field
2. Trigger moderation flag (or check banner immediately)
3. Banner should show only "description" as changed
4. URL fields should NOT appear in changed fields list

## Related Observations

### Why Text Fields Work Correctly

The text field checks use truthy evaluation:
```typescript
if (revision.title) changedFields.push("title");      // null is falsy, won't trigger
if (revision.description) changedFields.push("description"); // "value" is truthy, triggers
```

This accidentally works because:
- `null` is falsy → won't show as changed
- Actual string values are truthy → will show as changed

### Potential Edge Case

With the truthy fix, explicitly setting a URL to empty string `""` would NOT show as changed (empty string is falsy). This might be acceptable since:
1. URLs are validated as valid URL format, so empty string would fail validation
2. The schema uses `nullable()` not empty string for "no URL"

## Recommendation

**Implemented: Option D - Explicit changedFields Array**

Rather than patching the banner's null-checking logic, we implemented a proper fix that tracks which fields were actually changed.

## Implementation

**Status:** Complete

### Schema Change
```typescript
// packages/db/src/schema/projects.ts
export const projectRevisions = pgTable("project_revisions", {
  // ... existing fields ...
  changedFields: text("changed_fields").array().default([]).notNull(),
});
```

### API Change
```typescript
// apps/api/src/routes/projects.ts - PATCH endpoint
const changedFields: string[] = [];
if (data.title !== undefined) changedFields.push("title");
if (data.tagline !== undefined) changedFields.push("tagline");
if (data.description !== undefined) changedFields.push("description");
if (data.mainUrl !== undefined) changedFields.push("mainUrl");
if (data.repoUrl !== undefined) changedFields.push("repoUrl");
// ... etc

const [revision] = await db.insert(projectRevisions).values({
  // ... field values ...
  changedFields,  // Explicit list of what changed
});
```

### Banner Change
```typescript
// apps/web/src/components/project/RevisionStatusBanner.tsx
const fieldLabels: Record<string, string> = {
  title: "title",
  tagline: "tagline",
  mainUrl: "main URL",
  // ... etc
};

// Use explicit changedFields instead of null-checking
const changedFields = (revision.changedFields || []).map(
  (field) => fieldLabels[field] || field
);
```

### Files Modified
| File | Change |
|------|--------|
| `packages/db/src/schema/projects.ts` | Added `changedFields` column |
| `packages/db/drizzle/0001_steady_joshua_kane.sql` | Migration generated |
| `apps/api/src/routes/projects.ts` | Populate `changedFields` on revision create, include in revisions query |
| `apps/web/src/lib/api/projects.ts` | Added `changedFields` to `ProjectRevision` type |
| `apps/web/src/components/project/RevisionStatusBanner.tsx` | Use `changedFields` array instead of null-checking |

### Benefits
1. **No ambiguity** - `changedFields` is the source of truth
2. **Future-proof** - Supports potential multi-edit/merge scenarios
3. **Backward compatible** - Old revisions without `changedFields` fall back to empty array
4. **Type-safe** - Explicit field list, not inferred from nulls

# Edit Project Page - undefined author.id Error

## Problem

When editing a project field on `/p/[slug]/edit`, the page crashes with:

```
TypeError: Cannot read properties of undefined (reading 'id')
    at EditProjectPage (page.tsx:63:57)
```

The error occurs at line 63:
```typescript
const isAuthor = session?.user?.id === project.author.id;
```

## Edit Workflow Analysis

The project edit system uses **synchronous moderation with two paths**:

### Path A: Auto-Approved (moderation passes)
```typescript
// apps/api/src/routes/projects.ts:456-500
if (modResult.approved) {
  // Changes applied IMMEDIATELY to live project
  const [updated] = await db.update(projects).set(updates)...
  await db.update(projectRevisions).set({ status: "approved" })...
  return c.json({ project: updated, revision: { status: "approved" } });
}
```
- Changes are applied **immediately** to the live project
- Revision is marked "approved" instantly
- Public project page **IS** updated
- No human review needed

### Path B: Held for Review (moderation flags)
```typescript
// apps/api/src/routes/projects.ts:504-509
return c.json({
  message: "Revision submitted for review",
  revision,
  project: existing,
});
```
- Changes are **NOT** applied to the live project
- Revision stays in "pending" status for human review
- Public project page is **unchanged**
- User sees a `RevisionStatusBanner` indicating pending review

### Key Insight

This is **not** a traditional draft system. It's "optimistic publishing with a safety net":
- Most edits (benign content) → **instant publication**
- Flagged edits (potentially problematic) → **held for human review**

## Investigation

### Error Analysis

The error `Cannot read properties of undefined (reading 'id')` indicates that `project.author` is undefined when the code tries to access `project.author.id`.

### Data Flow

1. **Initial Load**: `useSWR` fetches project via `fetchProject(slug)`
2. **API Response**: `GET /projects/:slug` returns project with author joined:
   ```typescript
   // apps/api/src/routes/projects.ts:166-228
   const [project] = await db.select({
     // ... project fields
     author: {
       id: user.id,
       name: user.name,
       image: user.image,
       devVerified: user.devVerified,
     },
   })
   .from(projects)
   .leftJoin(user, eq(projects.authorUserId, user.id))
   ```
3. **Edit Field**: User edits a field (title, tagline, etc.)
4. **Save Handler**: Calls `updateProject(slug, { [field]: value })`
5. **API Update**: `PATCH /projects/:slug` processes the update

### Root Cause

**The PATCH endpoint returns the raw project row without author data.**

When an edit is auto-approved, the endpoint returns:
```typescript
// apps/api/src/routes/projects.ts:500
return c.json({ project: updated, revision: { ... } });
```

Where `updated` comes from:
```typescript
// apps/api/src/routes/projects.ts:472-476
const [updated] = await db
  .update(projects)
  .set(updates)
  .where(eq(projects.id, existing.id))
  .returning();  // <-- Returns raw DB row, no joins!
```

The `updated` object is just the projects table row - it does NOT include:
- `author` (joined from users table)
- `media` (joined from projectMedia table)
- `tools` (joined from projectTools table)

### Client-Side Trigger

The edit page handler then updates the SWR cache with this incomplete data:
```typescript
// apps/web/src/app/p/[slug]/edit/page.tsx:73-77
const handleFieldChange = async (field: string, value: unknown) => {
  const result = await updateProject(slug, { [field]: value });
  mutate(result.project, false);  // <-- Overwrites cache with incomplete data!
  ...
};
```

After `mutate(result.project, false)`:
- SWR cache now has `project` without `author`
- Component re-renders
- Line 63 crashes trying to access `project.author.id`

### Both Paths Return Incomplete Data

| Path | Variable Returned | Source | Missing Data |
|------|-------------------|--------|--------------|
| Approved | `updated` | `db.update().returning()` | author, media, tools |
| Pending | `existing` | `db.select()` | author, media, tools |

**Approved path** (line 500):
```typescript
return c.json({ project: updated, revision: { ...revision, status: "approved" } });
```

**Pending path** (lines 505-509):
```typescript
return c.json({
  message: "Revision submitted for review",
  revision,
  project: existing,  // <-- Also missing author/media/tools!
});
```

Both crash the client because neither includes the joined `author` data.

## Hypotheses

### Hypothesis 1: Fix API Response (Recommended)

**Theory**: The PATCH endpoint should return the complete project data with author, media, and tools joined, matching the GET endpoint's response shape.

**Solution**: After updating the project, re-fetch with joins to return complete data.

### Hypothesis 2: Fix Client-Side Merge

**Theory**: Instead of replacing the entire SWR cache, merge only the changed fields.

**Solution**: Change `mutate(result.project, false)` to merge with existing data:
```typescript
mutate((prev) => prev ? { ...prev, ...result.project } : prev, false);
```

**Trade-off**: This would preserve stale author/media/tools data but wouldn't crash. However, if those fields ever changed, the UI would be out of sync.

### Hypothesis 3: Use SWR Revalidation

**Theory**: Don't use the API response to update cache; instead trigger a revalidate.

**Solution**: Change to `mutate()` (no args) which triggers a refetch.

**Trade-off**: Extra API call, but ensures data is always fresh.

## Recommended Fix

**Hypothesis 1** is the cleanest solution. The API should return consistent data shapes.

The PATCH endpoint needs to:
1. After updating the project, re-query to get joined data
2. Return the complete project object matching `ProjectDetail` type

This matches how the GET endpoint works and ensures the client always receives complete data.

## Files Involved

| File | Role |
|------|------|
| `apps/api/src/routes/projects.ts` | PATCH endpoint returning incomplete data |
| `apps/web/src/app/p/[slug]/edit/page.tsx` | Client calling mutate with incomplete data |
| `apps/web/src/lib/api/projects.ts` | Type definitions for ProjectDetail |

## Fix Implementation

**Status:** Implemented

### Changes Made

Added a helper function `fetchCompleteProject(projectId)` that fetches a project with all joined data (author, media, tools) - matching the response shape from the GET endpoint.

Updated both return paths in the PATCH endpoint to use this helper:

```typescript
// apps/api/src/routes/projects.ts

// Helper: fetch complete project with author, media, and tools
async function fetchCompleteProject(projectId: string) {
  const [project] = await db.select({
    // ... all project fields
    author: { id, name, image, devVerified },
  })
  .from(projects)
  .leftJoin(user, ...)
  .where(eq(projects.id, projectId));

  // Get media and tools
  const media = await db.select().from(projectMedia)...
  const tools = await db.select().from(projectTools)...

  return { ...project, media, tools };
}

// In PATCH endpoint - approved path:
const completeProject = await fetchCompleteProject(existing.id);
return c.json({ project: completeProject, revision: { ...revision, status: "approved" } });

// In PATCH endpoint - pending path:
const completeProject = await fetchCompleteProject(existing.id);
return c.json({ message: "...", revision, project: completeProject });
```

## Verification Checklist

After fix:
- [ ] Edit title field - should save and update without crash
- [ ] Edit tagline field - should save and update without crash
- [ ] Edit description field - should save and update without crash
- [ ] Edit vibe score - should save and update without crash
- [ ] Author info still displays correctly after edit
- [ ] Tools still display correctly after edit
- [ ] Screenshot still displays correctly after edit

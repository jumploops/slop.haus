# Screenshot Not Displaying Issue

## Problem Summary

After submitting a project (`bmbl-2`), no screenshot appears in the UI. The worker logs show `enrich_readme` and `moderate_async` ran, but **no `enrich_screenshot` job** was executed.

## Investigation Findings

### 1. Job Creation Logic (Root Cause Found)

**File**: `apps/api/src/routes/projects.ts` (lines 326-339)

```typescript
// Create enrichment job
if (data.mainUrl) {
  // If mainUrl exists, enrich with screenshot
  await db.insert(jobs).values({
    type: "enrich_screenshot",
    payload: { projectId: project.id },
  });
} else if (data.repoUrl) {
  // Otherwise if repoUrl exists, enrich with README
  await db.insert(jobs).values({
    type: "enrich_readme",
    payload: { projectId: project.id },
  });
}
```

**Problem**: This is an `if/else if` structure:
- If project has `mainUrl` → ONLY `enrich_screenshot` is queued
- If project has NO `mainUrl` but has `repoUrl` → ONLY `enrich_readme` is queued
- **If project has BOTH URLs**, README enrichment is skipped!

**Given the logs**: The project `bmbl-2` likely only has `repoUrl` (GitHub repo), no `mainUrl` (live site). So `enrich_screenshot` was **never queued**.

### 2. Missing Screenshot Scenarios

| mainUrl | repoUrl | Screenshot Job? | README Job? | Actual Behavior |
|---------|---------|-----------------|-------------|-----------------|
| ✓       | ✗       | ✓               | ✗           | Correct |
| ✗       | ✓       | ✗               | ✓           | No screenshot possible |
| ✓       | ✓       | ✓               | ✗           | **Missing README enrichment** |
| ✗       | ✗       | ✗               | ✗           | No enrichment |

### 3. Other Potential Issues

Even if the screenshot job runs, there are other potential failure points:

#### a) Storage Configuration

**File**: `apps/worker/src/lib/storage.ts`

```typescript
const basePath = process.env.STORAGE_LOCAL_PATH || "./uploads";
const publicUrl = process.env.STORAGE_PUBLIC_URL || "http://localhost:3001/uploads";
```

- Default saves to `./uploads` relative to worker directory
- Default public URL assumes API serves `/uploads` route
- **Issue**: API may not be configured to serve static files from uploads directory

#### b) API Static File Serving

Need to verify the API serves the uploads directory. Check for:
- Static file middleware in Hono
- Correct path mapping between storage and web server

#### c) Media Record Creation

**File**: `apps/worker/src/handlers/enrich-screenshot.ts` (lines 62-68)

```typescript
await db.insert(projectMedia).values({
  projectId,
  type: "screenshot",
  url,
  source: "firecrawl",
  isPrimary: !hasPrimaryScreenshot,
});
```

This looks correct, but we should verify:
- The URL being stored is accessible
- `isPrimary` logic works correctly

#### d) Frontend Display

**File**: `apps/web/src/components/project/ProjectDetails.tsx`

```typescript
const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];
const imageUrl = primaryMedia?.url || getPlaceholderImage(project.title);
```

- Falls back to placeholder if no media
- Relies on `project.media` array being populated

---

## Hypotheses

### Hypothesis 1: Project Missing mainUrl (Most Likely)

The submitted project (`bmbl-2`) only has a `repoUrl`, not a `mainUrl`. Since there's no live site URL, no screenshot can be taken.

**Evidence**: Logs show `enrich_readme` ran for repo URL, not `enrich_screenshot`.

**Verification**: Check the project record in database:
```sql
SELECT main_url, repo_url FROM projects WHERE slug = 'bmbl-2';
```

**Fix**: This is expected behavior - can't screenshot a GitHub repo page meaningfully. However, we could:
1. Allow screenshots of repo pages (less useful)
2. Queue both jobs when both URLs exist
3. Add UI indication that no screenshot is available

### Hypothesis 2: Storage/Static Files Not Configured

If screenshot jobs DO run, the saved files may not be accessible.

**Verification**:
1. Check if uploads directory exists and has files
2. Check if API serves static files
3. Check `STORAGE_PUBLIC_URL` environment variable

**Fix**: Configure API to serve static uploads, or use external storage (S3/R2).

### Hypothesis 3: Missing Job for Both URLs

When project has BOTH `mainUrl` and `repoUrl`, only screenshot job runs. README enrichment (for description) is skipped.

**Fix**: Change from `if/else if` to run both jobs when both URLs exist:
```typescript
if (data.mainUrl) {
  await db.insert(jobs).values({
    type: "enrich_screenshot",
    payload: { projectId: project.id },
  });
}
if (data.repoUrl) {
  await db.insert(jobs).values({
    type: "enrich_readme",
    payload: { projectId: project.id },
  });
}
```

---

## Verification Steps

1. **Check project data**:
   ```sql
   SELECT slug, main_url, repo_url, enrichment_status FROM projects WHERE slug = 'bmbl-2';
   ```

2. **Check media records**:
   ```sql
   SELECT * FROM project_media WHERE project_id = (SELECT id FROM projects WHERE slug = 'bmbl-2');
   ```

3. **Check job history**:
   ```sql
   SELECT type, status, payload, error FROM jobs WHERE payload->>'projectId' = '<project-id>' ORDER BY created_at;
   ```

4. **Check uploads directory**:
   ```bash
   ls -la ./uploads/screenshots/
   ```

5. **Check API static file serving**:
   - Does the API have middleware to serve `/uploads/*`?

---

## Additional Finding: Potential Storage Path Mismatch

**API static serving** (`apps/api/src/index.ts`):
```typescript
app.use(
  "/uploads/*",
  serveStatic({
    root: process.env.STORAGE_LOCAL_PATH || "./uploads",
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, ""),
  })
);
```

**Worker storage** (`apps/worker/src/lib/storage.ts`):
```typescript
const basePath = process.env.STORAGE_LOCAL_PATH || "./uploads";
```

**Issue**: Both use relative paths `./uploads`, but they run from different directories:
- API runs from `apps/api/` → saves to `apps/api/uploads/`
- Worker runs from `apps/worker/` → saves to `apps/worker/uploads/`

**If `STORAGE_LOCAL_PATH` is not set to an absolute path**, the worker saves files to a different location than where the API serves them from!

---

## Recommended Fixes

### Priority 1: Fix Storage Path (Critical if using local storage)
Ensure both API and worker use the same absolute path for uploads:
```bash
STORAGE_LOCAL_PATH=/absolute/path/to/uploads
```

### Priority 2: Run Both Enrichment Jobs
Change the job creation logic to queue both jobs when both URLs exist.

### Priority 3: UI Fallback Handling
Make it clearer when a project has no screenshot (e.g., show repo preview card instead of placeholder).

---

## Files to Review/Modify

1. `apps/api/src/routes/projects.ts` - Job creation logic (if/else if → both jobs)
2. `.env` files - `STORAGE_LOCAL_PATH` should be absolute path
3. `apps/api/src/index.ts` - Static file middleware path
4. `apps/worker/src/lib/storage.ts` - Storage path

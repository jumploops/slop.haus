# Project 404 After Submit - Debug Investigation

## Problem Summary

After submitting a project, the user sees a success toast but is redirected to a 404 page. The project exists in the database but has:
- `status` = `hidden` (instead of `published`)
- `enrichment_status` = `pending`

## Root Cause Identified

The project is being rejected by **synchronous moderation** during creation, which sets `status = 'hidden'`. The frontend doesn't handle this case gracefully and still redirects to the project page, which returns 404 because it only shows `published` projects.

---

## Code Flow Analysis

### 1. Project Creation (`apps/api/src/routes/projects.ts:230-341`)

```typescript
// 1. Project created with default status "published"
const [project] = await db.insert(projects).values({...}).returning();

// 2. Sync moderation runs
const modResult = await moderateProject({...});

// 3. If moderation fails, status changed to "hidden"
if (!modResult.approved) {
  await db.update(projects)
    .set({ status: "hidden", updatedAt: new Date() })
    .where(eq(projects.id, project.id));

  // Returns 201 with project (status: hidden) + moderation info
  return c.json({
    project: { ...project, status: "hidden" },
    moderation: {
      approved: false,
      reason: modResult.reason || "Content flagged for review",
    },
  }, 201);
}

// 4. If approved, create enrichment jobs and return project
```

### 2. Frontend Submit Handler (`apps/web/src/app/submit/page.tsx:77-89`)

```typescript
const project = await createProject(result.data);
showToast("Project submitted successfully!", "success");  // Always shows success
router.push(`/p/${project.slug}`);  // Always redirects, even if hidden
```

**Problem**: Frontend ignores moderation result and always:
1. Shows "success" toast
2. Redirects to project page

### 3. Project Page (`apps/web/src/app/p/[slug]/page.tsx:49-51`)

```typescript
if (!project || project.status !== "published") {
  notFound();  // Returns 404 for hidden projects
}
```

---

## Hypotheses for Why Moderation is Failing

### Hypothesis 1: Content Being Flagged (Most Likely)

The Anthropic moderation API is returning labels that trigger rejection.

**Evidence**: Status is "hidden" which only happens if `modResult.approved === false`

**Verification**:
```sql
SELECT * FROM moderation_events
WHERE target_id = (SELECT id FROM projects WHERE slug = 'shock-market-simulator-2')
ORDER BY created_at DESC;
```

This will show what labels were returned and why.

### Hypothesis 2: Moderation Logic Too Strict

Looking at `apps/api/src/lib/moderation.ts:92-93`:
```typescript
return {
  approved: !hasRejectLabel && labels.length === 0,  // ANY label = rejected
  ...
};
```

Approval requires:
- No reject labels (nsfw, illegal, malware)
- AND **zero labels at all**

Even benign labels like `spam` or `copyright` (which aren't in REJECT_LABELS) cause rejection.

**Fix**: Only reject on REJECT_LABELS, not all labels:
```typescript
return {
  approved: !hasRejectLabel,  // Only reject on serious labels
  ...
};
```

### Hypothesis 3: URL Pattern Matching

`moderateUrl()` rejects URLs matching certain patterns:
```typescript
const badPatterns = [
  /bit\.ly/i,
  /tinyurl\.com/i,
];
```

If the project's `mainUrl` or `repoUrl` contains these patterns, it's rejected.

**Verification**: Check the submitted URLs in the database.

### Hypothesis 4: Anthropic API Error Handling

If the Anthropic API returns an error or malformed response, the code might not be handling it correctly.

**Verification**: Check API server logs for moderation-related errors.

---

## Immediate Issues to Fix

### Issue 1: Frontend Doesn't Handle Moderation Rejection

The frontend always shows success and redirects, even when the project is hidden.

**Current behavior**:
- API returns: `{ project: {..., status: "hidden"}, moderation: { approved: false, reason: "..." } }`
- Frontend: Shows success toast, redirects to 404

**Expected behavior**:
- Show warning: "Your project is pending review"
- Redirect to a different page (user's projects list, or a "pending" page)

### Issue 2: Moderation May Be Too Aggressive

The current logic rejects on ANY label, not just serious violations.

---

## Debugging Steps

### Step 1: Check Moderation Events
```sql
-- See why the project was flagged
SELECT
  me.target_id,
  me.labels,
  me.decision,
  me.reason,
  me.created_at,
  p.slug,
  p.title
FROM moderation_events me
JOIN projects p ON me.target_id::uuid = p.id
WHERE p.slug = 'shock-market-simulator-2';
```

### Step 2: Check Project Data
```sql
SELECT
  slug, title, tagline, description,
  main_url, repo_url,
  status, enrichment_status,
  created_at
FROM projects
WHERE slug = 'shock-market-simulator-2';
```

### Step 3: Check API Logs

Look for moderation-related console output:
- "Moderation API error:"
- "Content flagged for review"
- Labels returned by Claude

### Step 4: Test API Directly
```bash
# Create a test project and see the full response
curl -X POST http://localhost:3001/api/v1/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{
    "title": "Test Project",
    "tagline": "A simple test",
    "vibeMode": "overview",
    "vibePercent": 50,
    "repoUrl": "https://github.com/user/repo"
  }'
```

### Step 5: Check Environment
```bash
# Is ANTHROPIC_API_KEY set?
echo $ANTHROPIC_API_KEY
```

If not set, moderation should auto-approve (fail open).

---

## Recommended Fixes

### Fix 1: Frontend Should Handle Hidden Projects (Priority: High)

```typescript
// apps/web/src/app/submit/page.tsx
const result = await createProject(result.data);

if (result.project.status === "hidden") {
  showToast(
    result.moderation?.reason || "Your project is pending review",
    "warning"
  );
  router.push("/settings/projects"); // Or a "pending" page
} else {
  showToast("Project submitted successfully!", "success");
  router.push(`/p/${result.project.slug}`);
}
```

### Fix 2: Adjust Moderation Approval Logic (Priority: Medium)

Only reject on serious violations:
```typescript
// apps/api/src/lib/moderation.ts
return {
  approved: !hasRejectLabel,  // Changed from: !hasRejectLabel && labels.length === 0
  labels,
  confidence,
  reason,
};
```

### Fix 3: API Return Type Clarity (Priority: Low)

Make it clearer when a project is pending review:
```typescript
// Return different status code for moderation hold
if (!modResult.approved) {
  return c.json({
    project: { ...project, status: "hidden" },
    moderation: { approved: false, reason: modResult.reason },
    pendingReview: true,  // Explicit flag
  }, 202);  // 202 Accepted (but not published)
}
```

---

## Files to Modify

1. **`apps/web/src/app/submit/page.tsx`** - Handle moderation rejection in UI
2. **`apps/web/src/lib/api/projects.ts`** - Update return type to include moderation info
3. **`apps/api/src/lib/moderation.ts`** - Possibly relax approval logic
4. **`apps/api/src/routes/projects.ts`** - Consider different status code for moderation hold

---

## Next Steps

1. Query `moderation_events` table to see what labels are being returned
2. Decide on moderation strictness (reject on any label vs only serious violations)
3. Implement frontend handling for hidden/pending projects
4. Add logging to moderation to debug in production

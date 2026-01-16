# Tool Changes Always Held for Pending Review

## Problem

When a user adds or changes tools on a project (e.g., adding "Next.js"), the revision is always marked as "pending review" even though:
1. The tool is a legitimate, pre-approved technology
2. No text content was changed that could violate policies

## Investigation

### PATCH Endpoint Logic Analysis

Looking at `apps/api/src/routes/projects.ts:515-589`:

```typescript
// Run moderation on changed text content
const textContent = [
  data.title,
  data.tagline,
  data.description,
].filter(Boolean).join("\n\n");

if (textContent) {
  const modResult = await moderateProject({...});
  if (modResult.approved) {
    // Auto-approve: apply changes immediately
    // ... apply updates including tools ...
    return c.json({ project, revision: { status: "approved" } });
  }
}

// Moderation flagged or no text changes - revision stays pending
return c.json({
  message: "Revision submitted for review",
  revision,
  project: completeProject,
});
```

### Root Cause: Flawed Control Flow

The logic has a critical flaw:

| Scenario | textContent | Moderation Runs? | Result |
|----------|-------------|------------------|--------|
| Title changed, passes moderation | "New Title" | Yes | **Auto-approved** ✓ |
| Title changed, fails moderation | "Bad Title" | Yes | **Pending** ✓ |
| Only tools changed | "" (empty) | **No** | **Pending** ✗ |
| Only vibe changed | "" (empty) | **No** | **Pending** ✗ |
| Only URLs changed | "" (empty) | **No** | **Pending** ✗ |

**The bug**: When `textContent` is empty (no text fields changed), the entire `if (textContent)` block is skipped, and the code falls through to "revision stays pending".

The comment even acknowledges this: `"Moderation flagged or no text changes"` - but "no text changes" should NOT result in pending review!

### Expected Behavior

```
Text changed → Run moderation → Approve if passes, hold if flags
No text changed → Auto-approve (nothing to moderate)
```

### Actual Behavior

```
Text changed → Run moderation → Approve if passes, hold if flags
No text changed → Hold for review (BUG!)
```

## Impact

Any change to these fields WITHOUT accompanying text changes will be held for review:
- `tools` (adding/removing technologies)
- `vibePercent` (slider change)
- `vibeMode` (overview/detailed toggle)
- `vibeDetails` (detailed vibe scores)
- `mainUrl` (without text changes)
- `repoUrl` (without text changes)

This creates unnecessary friction for users making routine updates.

## Secondary Issue: Tool Names Not Moderated

The user mentioned wanting to review tools that are "outside ToS (illegal/NSFW terms)". However:

1. **Tool changes are never moderated** - only title/tagline/description go through LLM moderation
2. **Tools come from a pre-defined database** - users can only select existing tools, not create arbitrary ones
3. **Tool slugs are not validated for content** - if someone added a tool called "porn-generator" to the database, it could be selected without moderation

### Current Tool Flow

```typescript
// PATCH endpoint - tools are applied directly, no moderation
if (data.tools !== undefined) {
  await db.delete(projectTools).where(...);
  if (data.tools.length > 0) {
    const toolRecords = await db.select().from(tools)
      .where(inArray(tools.slug, data.tools));
    // Inserts whatever tools match - no content check
  }
}
```

### Tool Database

Tools are pre-seeded in `packages/db/src/seed.ts`. Users cannot create new tools - they can only select from existing ones. This means:
- If all seeded tools are legitimate, tool selection is inherently safe
- The risk is only if someone adds a problematic tool to the database directly

## Hypotheses

### Hypothesis 1: Control Flow Bug (Primary Issue)

The `if (textContent)` block should have an `else` clause that auto-approves non-text changes:

```typescript
if (textContent) {
  // Run moderation on text content
  const modResult = await moderateProject({...});
  if (modResult.approved) {
    // Apply all changes including non-text
    return c.json({ status: "approved" });
  }
  // Text moderation failed - hold for review
  return c.json({ status: "pending" });
} else {
  // No text to moderate - auto-approve non-text changes
  // Apply tools, vibe, etc.
  return c.json({ status: "approved" });
}
```

### Hypothesis 2: Intentional Over-Caution (Unlikely)

Maybe this was intentional - require human review for ANY change? But this seems overly restrictive given:
- Most edits are auto-approved when text is involved
- Tools come from a curated database
- Vibe scores have no content risk

### Hypothesis 3: Tool Moderation Needed (Future Enhancement)

If tool names should be moderated (e.g., user-submitted tools in the future), a separate check could be added:

```typescript
if (data.tools !== undefined) {
  // Check tool names against blocklist or run through moderation
  const toolNames = await getToolNames(data.tools);
  const toolCheck = await moderateToolNames(toolNames);
  if (!toolCheck.approved) {
    return c.json({ status: "pending", reason: "Tool name flagged" });
  }
}
```

But since tools are currently database-curated, this is not immediately necessary.

## Recommendation

**Fix the control flow bug** - Non-text changes (tools, vibe, URLs) should be auto-approved since there's no content to moderate. The current behavior creates unnecessary friction.

The fix should:
1. Auto-approve when only non-text fields change
2. Still run moderation when text fields change
3. Still hold for review when text moderation fails

## Files Involved

| File | Role |
|------|------|
| `apps/api/src/routes/projects.ts` | PATCH endpoint with flawed control flow |
| `apps/api/src/lib/moderation.ts` | Moderation functions (text only, no tool check) |
| `packages/db/src/seed.ts` | Tool database seeding |

## Implementation

**Status:** Complete

### Fix Applied

Restructured the control flow in `apps/api/src/routes/projects.ts` to use a `shouldApprove` flag:

```typescript
// Determine if we should auto-approve
let shouldApprove = false;

if (textContent) {
  // Text content changed - run moderation
  const modResult = await moderateProject({
    title: data.title || existing.title,
    tagline: data.tagline || existing.tagline,
    description: data.description || existing.description,
  });
  shouldApprove = modResult.approved;
} else {
  // No text content changed (only tools, vibe, URLs, etc.)
  // Auto-approve since there's nothing to moderate
  shouldApprove = true;
}

if (shouldApprove) {
  // Apply changes immediately (both text and non-text fields)
  // ... update project, tools, etc ...
  return c.json({ project: completeProject, revision: { ...revision, status: "approved" } });
}

// Moderation flagged - revision stays pending for human review
return c.json({
  message: "Revision submitted for review",
  revision,
  project: completeProject,
});
```

### Key Changes

1. **Introduced `shouldApprove` flag** - Separates the decision from the return statement
2. **Explicit `else` branch** - When no text content, explicitly set `shouldApprove = true`
3. **Single approval path** - Both text-approved and no-text cases flow to the same approval block

### Files Modified

| File | Change |
|------|--------|
| `apps/api/src/routes/projects.ts` | Restructured moderation control flow |

### Related: Future Tool Moderation

Added to `TODO.md` under "Future Ideas":

> **User-submitted tools** - Allow users to suggest new tools/technologies not in the database. Requires:
> - Tool submission form (name, slug, optional icon URL)
> - Moderation flow for new tool names (flag overt dangerous/illegal/NSFW terms)
> - Admin approval queue for pending tools
> - Most legitimate tech tools should auto-approve; only flag clear violations
> - Consider reusing existing text moderation with tool-specific prompt

This is only relevant when user-submitted tools are implemented. Currently, tools come from a curated database.

## Verification

After fix:
- [x] Add a tool to a project → should auto-approve
- [x] Change vibe score → should auto-approve
- [x] Change description → should run moderation
- [x] Change description + tools → should run moderation on text, apply all if passes

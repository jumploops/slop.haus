# GitHub Projects Missing Screenshots

**Issue:** When a GitHub URL is submitted, the project ends up with no screenshot even though the LLM extracts a valid `mainUrl` (live website) from the README.

**Date:** 2026-01-13

---

## Problem Analysis

### Current Flow for GitHub URLs

```
1. User submits: https://github.com/user/project
2. POST /api/v1/drafts/analyze
   └─ Creates draft, queues `scrape_url` job
3. scrape_url handler runs
   └─ Uses GitHub config: { formats: ["markdown"], ... }
   └─ NO screenshot requested for GitHub URLs
   └─ Queues `analyze_content` job
4. analyze_content handler runs
   └─ LLM extracts: { mainUrl: "https://myproject.com", ... }
   └─ Saves suggestedMainUrl to draft
   └─ Draft status → "ready"
5. User reviews draft
   └─ Screenshot field is NULL
6. User submits project
   └─ ONLY NOW does it queue `enrich_screenshot` job (line 418-423 in drafts.ts)
```

### Root Cause

**File:** `apps/worker/src/lib/scrape-configs.ts` (lines 17-23)

```typescript
case "github":
case "gitlab":
  // Repos: just need markdown content, no screenshot needed
  return {
    formats: ["markdown"],  // <-- No screenshot!
    onlyMainContent: false,
    timeout: 30000,
  };
```

The design assumes that GitHub repos don't need screenshots, which is true for the repo page itself. However, when the LLM extracts a `mainUrl` (live site) from the README, we should scrape THAT URL to get a screenshot.

**File:** `apps/worker/src/handlers/analyze-content.ts` (lines 129-146)

After analysis completes, the handler saves `suggestedMainUrl` but does NOT trigger a follow-up scrape to get a screenshot from that URL.

---

## Affected Code Paths

### 1. `apps/worker/src/lib/scrape-configs.ts`
- GitHub/GitLab configs explicitly exclude screenshots
- This is intentional for the repo page, but we need screenshots from the live site

### 2. `apps/worker/src/handlers/scrape-url.ts`
- Only scrapes the input URL
- Screenshot saved only if config requests it AND Firecrawl returns one

### 3. `apps/worker/src/handlers/analyze-content.ts`
- Extracts `mainUrl` from content but doesn't act on it
- No follow-up scrape for screenshot

### 4. `apps/api/src/routes/drafts.ts` (lines 418-423)
- **Post-submission fallback:** Queues `enrich_screenshot` job if no screenshot AND mainUrl exists
- This is too late - user can't preview the screenshot before submitting

```typescript
// Queue enrichment jobs if needed
if (!draft.screenshotUrl && mainUrl) {
  await db.insert(jobs).values({
    type: "enrich_screenshot",
    payload: { projectId: project.id },
  });
}
```

---

## Solution Options

### Option A: Queue Follow-Up Scrape in `analyze_content` (Recommended)

After LLM extracts `mainUrl`, queue a new `scrape_url` job for that URL to get the screenshot.

**Pros:**
- Clean separation of concerns
- Reuses existing `scrape_url` infrastructure
- User sees screenshot during review

**Cons:**
- Adds another job/delay
- Need to handle draft state (stays in "analyzing" until screenshot done?)

**Implementation:**
```typescript
// In analyze_content.ts, after saving extracted data:
if (suggestedMainUrl && draft.detectedUrlType !== "live_site") {
  // Queue screenshot scrape for the live site
  await db.insert(jobs).values({
    type: "scrape_screenshot",
    payload: {
      draftId,
      url: suggestedMainUrl
    },
  });
  // Keep status as "analyzing" until screenshot job completes
} else {
  // Mark as ready
  await db.update(...).set({ status: "ready" });
}
```

### Option B: New Lightweight `scrape_screenshot` Job

Create a dedicated job that only fetches a screenshot (no markdown parsing).

**Pros:**
- Minimal payload, faster
- Clear intent
- Doesn't re-process content

**Cons:**
- New job type to maintain
- Still requires Firecrawl call

**Implementation:**
```typescript
// New handler: scrape-screenshot.ts
export async function handleScrapeScreenshot(payload: unknown): Promise<void> {
  const { draftId, url } = payload as { draftId: string; url: string };

  const result = await scrape({
    url,
    formats: [{
      type: "screenshot",
      fullPage: false,
      viewport: { width: 1280, height: 800 },
    }],
    onlyMainContent: true,
    timeout: 30000,
  });

  // Save screenshot to draft
  // Mark draft as "ready"
}
```

### Option C: Inline Screenshot Fetch in `analyze_content`

Directly fetch the screenshot within `analyze_content` handler.

**Pros:**
- Simplest implementation
- Single job handles everything

**Cons:**
- Couples analysis and scraping logic
- analyze_content becomes too complex
- Longer job execution time

### Option D: Change State Flow

Add a new status `"screenshot_pending"` between `"analyzing"` and `"ready"`.

```
pending → scraping → analyzing → screenshot_pending → ready
```

**Pros:**
- User can see progress
- Clean state machine

**Cons:**
- Requires frontend changes for new status
- More complex state management

---

## Recommended Solution: Option A + B Hybrid

1. Create new `scrape_screenshot` job type (lightweight, focused)
2. In `analyze_content`, after extracting mainUrl:
   - If URL type is GitHub/GitLab AND mainUrl exists AND mainUrl !== inputUrl:
     - Queue `scrape_screenshot` job
     - Keep status as `"analyzing"` (or new status like `"fetching_screenshot"`)
   - Else:
     - Mark as `"ready"`

3. In `scrape_screenshot` handler:
   - Fetch only screenshot from mainUrl
   - Update draft with screenshotUrl
   - Mark draft as `"ready"`

---

## Files to Modify

1. **`packages/db/src/schema/enrichment-drafts.ts`**
   - Optional: Add `"fetching_screenshot"` to status enum

2. **`apps/worker/src/handlers/analyze-content.ts`**
   - After analysis, check if follow-up screenshot scrape needed
   - Queue `scrape_screenshot` job if applicable

3. **`apps/worker/src/handlers/scrape-screenshot.ts`** (NEW)
   - New handler for screenshot-only scraping
   - Update draft with screenshot
   - Mark draft as ready

4. **`apps/worker/src/index.ts`**
   - Register new `scrape_screenshot` job handler

5. **`apps/web/src/components/submit/AnalysisProgress.tsx`**
   - Optional: Show "Capturing screenshot..." step

---

## Edge Cases to Handle

1. **mainUrl same as inputUrl** - Don't double-scrape
2. **mainUrl invalid/unreachable** - Don't fail the whole draft, just skip screenshot
3. **mainUrl is another repo** - Skip screenshot (it won't be useful)
4. **Race conditions** - Draft state management during async screenshot fetch
5. **Timeout on screenshot** - Don't block draft from becoming ready

---

## Testing Checklist

- [ ] Submit GitHub URL with mainUrl in README → screenshot captured
- [ ] Submit GitHub URL without mainUrl → no error, no screenshot (OK)
- [ ] Submit live site URL → screenshot captured as before
- [ ] Submit GitLab URL with homepage → screenshot captured
- [ ] Screenshot fetch fails → draft still becomes ready, no screenshot
- [ ] Screenshot fetch timeout → draft still becomes ready

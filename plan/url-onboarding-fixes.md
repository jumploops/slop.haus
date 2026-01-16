# URL Onboarding Fixes

Fixes for bugs and issues identified in the URL-first onboarding feature.

## Status: All Phases Complete

**Last Updated:** 2026-01-14

## Priority Order

1. **Phase 1: Bug Fixes** - ✅ Complete
2. **Phase 2: Security** - ✅ Complete
3. **Phase 3: UX Polish** - ✅ Complete
4. **Phase 4: Performance** - ✅ Complete

---

## Phase 1: Bug Fixes

### 1.1 Rate Limit Memory Cleanup

**Problem:** `analysisLimits` Map grows unbounded - old user entries never removed.

**File:** `apps/api/src/routes/drafts.ts`

**Fix:** Clean up old entries when checking rate limit.

```typescript
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;

  // Clean up old entries periodically (every 100 checks)
  if (Math.random() < 0.01) {
    for (const [id, timestamps] of analysisLimits.entries()) {
      const recent = timestamps.filter((t) => t > hourAgo);
      if (recent.length === 0) {
        analysisLimits.delete(id);
      } else {
        analysisLimits.set(id, recent);
      }
    }
  }

  const timestamps = analysisLimits.get(userId) || [];
  const recent = timestamps.filter((t) => t > hourAgo);

  if (recent.length >= 5) {
    return false;
  }

  recent.push(now);
  analysisLimits.set(userId, recent);
  return true;
}
```

**Why this works:** Probabilistic cleanup (1% chance per request) keeps memory bounded without adding overhead to every request.

---

### 1.2 Tool Matching False Positives

**Problem:** `ilike(tools.slug, '%go%')` matches "django", "mongodb", etc.

**File:** `apps/worker/src/lib/tool-matching.ts`

**Fix:** Use exact match for short terms, prefix match for longer ones.

```typescript
// Build search conditions
const conditions: SQL[] = [];

for (const term of searchTerms) {
  if (term.length <= 3) {
    // Short terms: exact match only
    conditions.push(eq(tools.slug, term));
  } else {
    // Longer terms: prefix match or exact
    conditions.push(
      or(
        eq(tools.slug, term),
        like(tools.slug, `${term}-%`),  // e.g., "react" matches "react-native"
        like(tools.slug, `%-${term}`)   // e.g., "native" matches "react-native"
      )
    );
  }
}
```

**Why this works:** Short slugs like "go", "py", "ts" only match exactly. Longer terms can match compound slugs.

---

### 1.3 SSE Connection Cleanup

**Problem:** If client disconnects, SSE endpoint continues polling for 2 minutes.

**File:** `apps/api/src/routes/drafts.ts`

**Fix:** Check if stream is still writable before each poll.

```typescript
return streamSSE(c, async (stream) => {
  let lastStatus = draft.status;
  let pollCount = 0;
  const maxPolls = 120;

  // Send initial status
  await stream.writeSSE({
    event: "status",
    data: JSON.stringify({ status: lastStatus, message: getStatusMessage(lastStatus) }),
  });

  while (pollCount < maxPolls) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    pollCount++;

    // Check if client disconnected
    if (stream.aborted) {
      console.log(`SSE client disconnected for draft ${draftId}`);
      break;
    }

    // ... rest of polling logic
  }
});
```

**Why this works:** Hono's streamSSE sets `stream.aborted` when client disconnects. Check it before each iteration.

---

## Phase 2: Security Hardening

### 2.1 Screenshot Fetch Timeout

**Problem:** Fetching Firecrawl screenshot URL has no timeout - could hang forever.

**File:** `apps/worker/src/handlers/scrape-url.ts`

**Fix:** Add AbortController with 30s timeout.

```typescript
if (result.data?.screenshot) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const imageResponse = await fetch(result.data.screenshot, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (imageResponse.ok) {
      // ... save screenshot
    }
  } catch (screenshotError) {
    if (screenshotError.name === 'AbortError') {
      console.warn(`Screenshot fetch timed out for draft ${draftId}`);
    } else {
      console.warn(`Failed to save screenshot for draft ${draftId}:`, screenshotError);
    }
  }
}
```

---

### 2.2 Stricter LLM Response Parsing

**Problem:** Regex-based JSON extraction could fail on edge cases.

**File:** `apps/worker/src/handlers/analyze-content.ts`

**Fix:** Add zod validation after parsing.

```typescript
import { z } from "zod";

const extractionSchema = z.object({
  title: z.string().max(255).default("Untitled"),
  tagline: z.string().max(500).default(""),
  description: z.string().max(10000).default(""),
  detectedTools: z.array(z.string()).default([]),
  suggestedVibePercent: z.number().min(0).max(100).default(50),
  linkedUrls: z.object({
    mainUrl: z.string().url().nullable().default(null),
    repoUrl: z.string().url().nullable().default(null),
  }).default({ mainUrl: null, repoUrl: null }),
});

// In handler:
let extraction: ExtractionResult;
try {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  extraction = extractionSchema.parse(parsed);
} catch (parseError) {
  console.error("Failed to parse LLM response:", responseText);
  throw new Error("Failed to parse extraction response");
}
```

**Why this works:** Zod provides defaults for missing fields and validates types, making extraction more robust.

---

### 2.3 URL Blocklist Expansion

**Problem:** URL shorteners not blocked.

**File:** `packages/shared/src/url-validation.ts`

**Fix:** Add common URL shorteners to blocklist.

```typescript
const BLOCKED_DOMAINS = [
  // URL shorteners
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "short.io",
  "rebrand.ly",
  // Add more as needed
];
```

---

## Phase 3: UX Polish

### 3.1 Field Save Indicator

**Problem:** No feedback when fields are auto-saved on blur.

**Files:**
- `apps/web/src/components/submit/DraftReview.tsx`
- `apps/web/src/app/globals.css`

**Fix:** Add saving state and indicator.

```typescript
// In DraftReview.tsx
const [savingField, setSavingField] = useState<string | null>(null);

const handleFieldBlur = async (field: string, value: unknown) => {
  setSavingField(field);
  try {
    await onUpdate(field, value);
  } finally {
    // Brief delay so user sees "Saved"
    setTimeout(() => setSavingField(null), 1000);
  }
};

// In form-field div:
<div className="form-field">
  <label htmlFor="title">
    Title *
    {savingField === "title" && <span className="save-indicator">Saving...</span>}
  </label>
  <input ... />
</div>
```

```css
/* In globals.css */
.save-indicator {
  font-size: 0.75rem;
  color: var(--muted);
  margin-left: var(--spacing-2);
}
```

---

### 3.2 Character Counts

**Problem:** Users don't know character limits until they hit them.

**Fix:** Add character count below inputs.

```typescript
<div className="form-field">
  <label htmlFor="tagline">Tagline *</label>
  <input
    id="tagline"
    value={tagline}
    onChange={(e) => setTagline(e.target.value)}
    maxLength={500}
    ...
  />
  <span className="char-count">{tagline.length}/500</span>
</div>
```

```css
.char-count {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: var(--spacing-1);
}

.char-count.warning {
  color: var(--warning);
}
```

---

### 3.3 Discard Confirmation

**Problem:** "Start Over" discards draft without confirmation.

**Fix:** Add confirmation modal.

```typescript
const [showDiscardModal, setShowDiscardModal] = useState(false);

// In actions:
<Button onClick={() => setShowDiscardModal(true)} variant="ghost">
  Start Over
</Button>

{showDiscardModal && (
  <ConfirmModal
    title="Discard draft?"
    message="You'll lose all changes and need to re-analyze the URL."
    confirmLabel="Discard"
    onConfirm={onStartOver}
    onCancel={() => setShowDiscardModal(false)}
  />
)}
```

---

### 3.4 Resume Failed Drafts

**Problem:** Failed drafts can't be retried.

**API Change:** Add retry endpoint.

```typescript
// POST /api/v1/drafts/:draftId/retry
draftRoutes.post("/:draftId/retry", requireAuth(), async (c) => {
  const session = c.get("session");
  const draftId = c.req.param("draftId");

  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(
      and(
        eq(enrichmentDrafts.id, draftId),
        eq(enrichmentDrafts.userId, session.user.id),
        eq(enrichmentDrafts.status, "failed"),
        isNull(enrichmentDrafts.deletedAt)
      )
    );

  if (!draft) {
    return c.json({ error: "Draft not found or not failed" }, 404);
  }

  // Reset and re-queue
  await db
    .update(enrichmentDrafts)
    .set({
      status: "pending",
      error: null,
      updatedAt: new Date(),
    })
    .where(eq(enrichmentDrafts.id, draftId));

  await db.insert(jobs).values({
    type: "scrape_url",
    payload: {
      draftId: draft.id,
      url: draft.inputUrl,
      urlType: draft.detectedUrlType,
    },
  });

  return c.json({ success: true }, 202);
});
```

**Frontend:** Add retry button to AnalysisError component.

---

## Phase 4: Performance (Optional)

### 4.1 Cache Tool Slugs

**Problem:** `matchToolsToDatabase` queries DB every analysis.

**Fix:** Cache on startup, refresh periodically.

```typescript
// In tool-matching.ts
let toolCache: Map<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getToolCache(): Promise<Map<string, string>> {
  if (toolCache && Date.now() - cacheTime < CACHE_TTL) {
    return toolCache;
  }

  const allTools = await db.select({ slug: tools.slug }).from(tools);
  toolCache = new Map(allTools.map((t) => [t.slug, t.slug]));
  cacheTime = Date.now();
  return toolCache;
}
```

---

## Verification Checklist

### Phase 1
- [x] Rate limit map doesn't grow unbounded (1% probabilistic cleanup)
- [x] "go" doesn't match "django" in tool detection (exact match for ≤3 chars)
- [x] SSE stops polling when client disconnects (checks stream.aborted)

### Phase 2
- [x] Screenshot fetch times out after 30s (AbortController)
- [x] LLM response with missing fields doesn't crash (zod defaults)
- [x] bit.ly URLs are rejected (expanded blocklist with 10 more shorteners)

### Phase 3
- [x] "Saving..." appears when editing fields (save indicator in label)
- [x] Character counts show below inputs (title/tagline/description with warning at 90%)
- [x] Discard shows confirmation modal (Modal component with cancel/discard buttons)
- [x] Failed drafts can be retried (POST /api/v1/drafts/:draftId/retry endpoint)

### Phase 4
- [x] Tool matching uses cache (5min TTL, logs "Refreshing tool slug cache...")

---

## Files Changed Summary

| Phase | File | Change |
|-------|------|--------|
| 1.1 | `apps/api/src/routes/drafts.ts` | Add cleanup to rate limit check |
| 1.2 | `apps/worker/src/lib/tool-matching.ts` | Use exact match for short terms |
| 1.3 | `apps/api/src/routes/drafts.ts` | Check stream.aborted in SSE loop |
| 2.1 | `apps/worker/src/handlers/scrape-url.ts` | Add timeout to screenshot fetch |
| 2.2 | `apps/worker/src/handlers/analyze-content.ts` | Add zod validation |
| 2.3 | `packages/shared/src/url-validation.ts` | Expand blocklist |
| 3.1 | `apps/web/src/components/submit/DraftReview.tsx` | Add save indicator |
| 3.2 | `apps/web/src/components/submit/DraftReview.tsx` | Add char counts |
| 3.3 | `apps/web/src/components/submit/DraftReview.tsx` | Add discard modal |
| 3.4 | `apps/api/src/routes/drafts.ts` | Add retry endpoint |
| 4.1 | `apps/worker/src/lib/tool-matching.ts` | Add caching |

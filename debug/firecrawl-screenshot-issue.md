# Firecrawl Screenshot Issue

## Problem Summary

When submitting a project, the screenshot enrichment via Firecrawl fails due to an improperly formatted request.

## Current Implementation

**File**: `apps/worker/src/lib/firecrawl.ts`

```typescript
// Current API endpoint (v1)
const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
  // ...
  body: JSON.stringify({
    url: options.url,
    formats: options.formats,  // e.g., ["screenshot"]
    ...(options.screenshotOptions && { screenshotOptions: options.screenshotOptions }),
  }),
});
```

**Screenshot call in** `apps/worker/src/handlers/enrich-screenshot.ts`:
```typescript
const result = await scrape({
  url: project.mainUrl,
  formats: ["screenshot"],
  screenshotOptions: {
    fullPage: false,
    width: 1280,
    height: 800,
  },
});
```

## Issues Identified

### Issue 1: Wrong API Version (Critical)

| Current | Expected (v2) |
|---------|---------------|
| `https://api.firecrawl.dev/v1/scrape` | `https://api.firecrawl.dev/v2/scrape` |

The v1 API may be deprecated or have different request/response formats.

### Issue 2: Screenshot Format Structure (Critical)

**Current format** (v1 style):
```json
{
  "url": "https://example.com",
  "formats": ["screenshot"],
  "screenshotOptions": {
    "fullPage": false,
    "width": 1280,
    "height": 800
  }
}
```

**v2 format** (per documentation):
```json
{
  "url": "https://example.com",
  "formats": [
    { "type": "screenshot", "fullPage": false, "quality": 80, "viewport": { ... } }
  ]
}
```

Key differences:
- Screenshot must be an **object** in the formats array, not a string
- No separate `screenshotOptions` property at the top level
- Options are embedded within the format object
- Uses `viewport` instead of separate `width`/`height` (needs verification)

### Issue 3: Response Structure May Differ

The v2 API may return the screenshot data in a different location/format than expected. Current code expects:
```typescript
result.data?.screenshot  // Base64 encoded image
```

This needs verification against v2 response structure.

---

## Hypotheses for Fixing

### Hypothesis 1: Update to v2 API with Correct Format (Recommended)

Update the Firecrawl client to use v2 API with proper format objects:

```typescript
// Updated request body for v2
{
  url: options.url,
  formats: options.formats.map(f => {
    if (f === "screenshot" && options.screenshotOptions) {
      return {
        type: "screenshot",
        fullPage: options.screenshotOptions.fullPage,
        // Map width/height to viewport if needed
      };
    }
    return f; // "markdown" stays as string
  }),
}
```

**Pros**: Follows current API specification, future-proof
**Cons**: Requires refactoring the interface and all callers
**Risk**: Medium - need to verify viewport format

### Hypothesis 2: Unified Format Interface

Redesign `FirecrawlScrapeOptions` to match v2 API directly:

```typescript
export interface FirecrawlScrapeOptions {
  url: string;
  formats: (string | ScreenshotFormat | JsonFormat)[];
  // Remove screenshotOptions, embed in formats
}

interface ScreenshotFormat {
  type: "screenshot";
  fullPage?: boolean;
  quality?: number;
  viewport?: { width: number; height: number };
}
```

**Pros**: Clean interface that mirrors API
**Cons**: Breaking change to existing handler code
**Risk**: Low - cleaner abstraction

### Hypothesis 3: Backward-Compatible Wrapper

Keep the current interface but internally transform to v2 format:

```typescript
// In scrape() function
const transformedFormats = options.formats.map(format => {
  if (format === "screenshot") {
    return {
      type: "screenshot",
      ...options.screenshotOptions
    };
  }
  return format;
});
```

**Pros**: No changes needed to handler code
**Cons**: Hidden complexity, may miss edge cases
**Risk**: Low

---

## Additional Concerns from Documentation

### 1. Caching Behavior

v2 has aggressive caching by default (`maxAge: 172800000` = 2 days). For screenshots of newly submitted projects, we may want:
```json
{ "maxAge": 0 }  // Always fetch fresh
```

### 2. Timeout Settings

Default timeout is 30 seconds. For screenshot capture which requires full page rendering, this may be insufficient for complex sites. Consider:
```json
{ "timeout": 60000 }  // 60 seconds
```

### 3. Markdown Format Still Valid

The `"markdown"` string format appears unchanged in v2, so `enrich-readme.ts` should work once the endpoint URL is updated. However, it's still using v1 endpoint.

### 4. Response Data Location

Need to verify where screenshot data lives in v2 response. Documentation shows format objects in request but doesn't clearly show response structure for screenshots.

---

## Recommended Fix Order

1. **First**: Update API endpoint from v1 to v2 in `firecrawl.ts`
2. **Second**: Update screenshot format to use object syntax
3. **Third**: Add `maxAge: 0` for fresh screenshots
4. **Fourth**: Consider increasing timeout for screenshot operations
5. **Fifth**: Verify response structure and update result parsing if needed

---

## Files to Modify

- `apps/worker/src/lib/firecrawl.ts` - Main Firecrawl client
- `apps/worker/src/handlers/enrich-screenshot.ts` - Screenshot handler (if interface changes)
- `apps/worker/src/handlers/enrich-readme.ts` - Potentially just endpoint fix needed

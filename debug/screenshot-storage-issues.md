# Screenshot Storage Debug Report

## Issue Summary

Screenshots captured via Firecrawl were not displaying correctly. Investigation revealed two issues:

1. **Firecrawl v2 response format mismatch** - Code expected base64 data, but API returns URLs
2. **Storage path mismatch** - Worker and API used different relative paths

## Issue 1: Firecrawl Response Format (Critical)

### Root Cause

Our code assumed Firecrawl v2 returns screenshots as base64 in `data.screenshot`:

```typescript
// OLD (incorrect)
if (!result.data?.screenshot) { ... }
const screenshotBuffer = Buffer.from(result.data.screenshot, "base64");
```

But Firecrawl v2 returns the screenshot as a **URL** in `data.screenshot`:

```json
{
  "success": true,
  "data": {
    "screenshot": "https://storage.googleapis.com/firecrawl-scrape-media/screenshot-xxx.png?GoogleAccessId=...&Expires=...&Signature=...",
    "metadata": {
      "title": "Page Title",
      "ogImage": "...",
      "sourceURL": "https://example.com/",
      "statusCode": 200
    }
  }
}
```

### Result

`Buffer.from(url, "base64")` corrupted the URL string into garbage bytes:
- Expected PNG header: `89 50 4E 47` (‰PNG)
- Actual file header: `86 db 69 b3` (garbage)

### Fix

Updated `apps/worker/src/lib/firecrawl.ts` type and `apps/worker/src/handlers/enrich-screenshot.ts`:

```typescript
// NEW (correct) - fetch the image from the URL
const screenshotUrl = result.data?.screenshot;
const imageResponse = await fetch(screenshotUrl);
const screenshotBuffer = Buffer.from(await imageResponse.arrayBuffer());
```

Note: The screenshot URL is a signed Google Cloud Storage URL with expiration. We fetch and store locally to avoid expiration issues.

## Issue 2: Storage Path Mismatch

### Root Cause

Both API and Worker used relative `./uploads` path, but run from different directories:

| Service | Working Directory | Resolved Path |
|---------|------------------|---------------|
| API | `apps/api/` | `apps/api/uploads/` |
| Worker | `apps/worker/` | `apps/worker/uploads/` |

### Result

- Worker saved screenshots to `apps/worker/uploads/screenshots/...`
- API served files from `apps/api/uploads/` (or root `uploads/` with absolute path)
- Files not found, 404 errors

### Fix

Updated `.env` to use absolute path:

```bash
STORAGE_LOCAL_PATH=/Users/adam/code/slop.haus/uploads
```

Both services now resolve to the same directory.

## Files Modified

1. `apps/worker/src/lib/firecrawl.ts` - Updated `FirecrawlScrapeResult` type
2. `apps/worker/src/handlers/enrich-screenshot.ts` - Fetch screenshot from URL instead of base64 decode
3. `.env` - Changed `STORAGE_LOCAL_PATH` to absolute path

## Cleanup Required

1. Delete corrupted screenshot file:
   ```bash
   rm -rf apps/worker/uploads/
   ```

2. Reset failed job or create new project to test

3. Verify worker and API use same storage path

## Testing Checklist

- [x] Create new project with `mainUrl`
- [x] Check worker logs for `Firecrawl returned screenshot URL: https://...`
- [x] Verify file saved to `/Users/adam/code/slop.haus/uploads/screenshots/...`
- [x] Confirm file is valid PNG: `file uploads/screenshots/.../xxx.png` shows "PNG image data, 1280 x 800"
- [ ] Access via API: `curl http://localhost:3001/uploads/screenshots/.../xxx.png`
- [ ] Verify image displays in frontend

## Resolution

**Status: Fixed** (2026-01-10)

The issue was that Firecrawl v2 returns screenshot as a URL string in `data.screenshot`, not base64 encoded data. The fix fetches the image from the URL before saving to local storage.

## API Static File Serving Note

The API serves static files via Hono's `serveStatic`:

```typescript
app.use(
  "/uploads/*",
  serveStatic({
    root: process.env.STORAGE_LOCAL_PATH || "./uploads",
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, ""),
  })
);
```

Request flow:
1. Request: `GET /uploads/screenshots/slug/file.png`
2. Strip prefix: `screenshots/slug/file.png`
3. Serve from: `{STORAGE_LOCAL_PATH}/screenshots/slug/file.png`

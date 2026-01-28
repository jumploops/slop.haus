# Phase 2: README Image Extraction (Draft Pipeline)

**Status:** In Progress

## Goals
- For GitHub/GitLab drafts with no `mainUrl`, attempt README image extraction and store a screenshot before draft is marked `ready`.

## Tasks
- Implement README image extraction in the draft pipeline:
  - Parse `draft.scrapedContent.markdown` for image URLs.
  - Normalize URLs per Phase 1 decision.
  - Pick best candidate and attempt download.
  - Reject images that are too small or invalid content-type.
  - Upload to storage and set `draft.screenshotUrl` (same storage path as screenshots).
- Decide integration point:
  - **Option A:** Inline in `handleAnalyzeContent` after LLM extraction.
  - **Option B:** New job `extract_readme_image` queued from `handleAnalyzeContent`.
- Ensure best-effort behavior (failure should not fail draft).

## Files (Expected)
- `apps/worker/src/handlers/analyze-content.ts`
- `apps/worker/src/lib/readme-images.ts`
- `apps/worker/src/lib/storage.ts` (reuse)
- `apps/worker/src/handlers/index.ts` (if new job type)

## Code Sketch
```ts
const candidate = selectScreenshotCandidate(imageUrls);
if (candidate) {
  const imageBuffer = await fetchImage(candidate);
  const url = await storage.upload(key, imageBuffer, "image/png");
  await db.update(enrichmentDrafts).set({ screenshotUrl: url, updatedAt: new Date() });
}
```

## Verification Checklist
- GitHub-only draft with README screenshots shows screenshot in review UI.
- Drafts still reach `ready` even if extraction fails.

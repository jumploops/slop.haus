# Phase 1: Discovery + Helper Utilities

**Status:** In Progress

## Goals
- Confirm how Firecrawl markdown represents README images (absolute vs relative URLs).
- Decide URL normalization strategy for README image links.
- Define image selection heuristics (quality + relevance).
- Verify GitHub social graph image URL format and caching behavior.

## Tasks
- Inspect sample Firecrawl markdown from a GitHub repo with images (locally or staging logs).
- Decide normalization strategy:
  - Prefer absolute URLs if present.
  - If relative, resolve against repo URL and/or raw content URL strategy.
- Define selection heuristic (order of preference):
  - First image with filename or alt text matching `screenshot|demo|preview|ui|app`.
  - Filter out tiny images (badges/logos) by size threshold after download.
- Add worker utility functions:
  - `extractMarkdownImages(markdown: string): string[]`
  - `selectScreenshotCandidate(urls: string[]): string | null`
- Identify where to store helper (likely `apps/worker/src/lib/readme-images.ts`).

## Files (Expected)
- `apps/worker/src/lib/readme-images.ts` (new)
- `apps/worker/src/lib/firecrawl.ts` (reuse `fetchWithTimeout`)

## Code Sketch
```ts
export function extractMarkdownImages(markdown: string): string[] {
  // parse ![alt](url) and return list
}

export function selectScreenshotCandidate(urls: string[]): string | null {
  // keyword + ordering heuristic
}
```

## Verification Checklist
- Document the final URL normalization approach.
- Document the candidate selection rule.
- Confirm GitHub OG URL format we will use.

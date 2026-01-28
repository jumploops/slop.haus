# Phase 3: GitHub Social Graph Fallback + Submission Wiring

**Status:** In Progress

## Goals
- If README image extraction fails, fallback to GitHub social graph image.
- Ensure submitted projects store correct `project_media.source` values.

## Tasks
- Add helper to derive GitHub OG image URL from repo URL.
- If no README image was set, use OG image fallback:
  - Download + upload to storage for consistency with existing screenshots.
- Update `media_source` enum with `readme_image` and `github_og`.
- When submitting drafts to projects:
  - Insert `project_media` with source based on how the screenshot was obtained.
  - Preserve existing Firecrawl screenshot behavior for `mainUrl`.

## Files (Expected)
- `packages/db/src/schema/projects.ts` (mediaSource enum)
- `apps/worker/src/lib/readme-images.ts` (helper for OG URL)
- `apps/api/src/routes/drafts.ts`
- `apps/worker/src/handlers/analyze-content.ts` (fallback logic)

## Code Sketch
```ts
export function buildGithubOgUrl(repoUrl: string): string {
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`;
}
```

## Verification Checklist
- GitHub-only repo with no README images gets OG fallback.
- `project_media.source` is set to `readme_image` or `github_og`.
- Main URL screenshots remain `firecrawl`.

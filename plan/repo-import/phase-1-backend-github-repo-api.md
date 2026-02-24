# Phase 1: Backend GitHub Repo API

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** API  
**Depends On:** None

## Implementation Notes

- Added `GET /api/v1/auth/github/repos` in `authRoutes`.
- Uses Better Auth `auth.api.getAccessToken` to fetch a refresh-aware GitHub access token.
- Fetches all pages from `https://api.github.com/user/repos` via Link-header pagination.
- Returns normalized public repo summaries including fork/archive flags.

## Goal

Add an authenticated endpoint that returns the signed-in user's public GitHub repositories, fetched ephemerally from GitHub with automatic pagination.

## Files To Change

- `/Users/adam/code/slop.haus/apps/api/src/routes/auth.ts`
- `/Users/adam/code/slop.haus/apps/api/src/lib/auth.ts` (only if helper access is needed for Better Auth API calls)
- `/Users/adam/code/slop.haus/apps/api/src/middleware/auth.ts` (only if additional helper methods are needed)

## API Contract

- **Route:** `GET /api/v1/auth/github/repos`
- **Auth:** `requireAuth()`
- **Behavior:**
  - If GitHub not linked: `{ githubLinked: false, repos: [] }`
  - If linked: `{ githubLinked: true, repos: [...] }`

Response item (v1):

```ts
type GitHubRepoSummary = {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  language: string | null;
  stargazersCount: number;
  updatedAt: string;
};
```

## Tasks

1. Add route handler in `authRoutes` for `/github/repos`.
2. Verify GitHub linkage from linked providers list.
3. Acquire provider access token via Better Auth token retrieval (refresh-aware path).
4. Call GitHub `GET /user/repos` with:
   - `visibility=public`
   - `affiliation=owner,collaborator,organization_member`
   - `sort=updated`
   - `direction=desc`
   - `per_page=100`
5. Implement Link-header pagination (`rel="next"` loop) until complete.
6. Normalize to response shape and return JSON.
7. Add resilient error mapping:
   - GitHub token/permission issues -> clear API error
   - GitHub upstream failure -> safe failure message

## Code Snippets

```ts
function getNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const part = linkHeader
    .split(",")
    .map((s) => s.trim())
    .find((s) => s.endsWith('rel="next"'));
  if (!part) return null;
  const match = part.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}
```

```ts
let nextUrl = initialUrl;
const allRepos = [];

while (nextUrl) {
  const res = await fetch(nextUrl, { headers });
  if (!res.ok) throw new Error(`GitHub request failed: ${res.status}`);
  allRepos.push(...(await res.json()));
  nextUrl = getNextLink(res.headers.get("link"));
}
```

## Verification Checklist

- [x] Linked GitHub user receives non-empty `repos` when repos exist.
- [x] Unlinked user receives `githubLinked: false` and empty list.
- [x] Pagination returns combined results across multiple pages.
- [x] Forked and archived public repos are included.
- [x] Endpoint does not write repo data to DB.
- [x] `pnpm -F @slop/api exec tsc --noEmit`

## Exit Criteria

- Endpoint contract is stable and usable by web picker UI.
- Pagination and linkage states are correct for v1 behavior.

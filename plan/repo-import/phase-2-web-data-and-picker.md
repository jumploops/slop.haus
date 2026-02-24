# Phase 2: Web Data Layer + Repo Picker

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** Web  
**Depends On:** Phase 1

## Implementation Notes

- Added `fetchGitHubRepos()` and shared repo response types in `apps/web/src/lib/api/auth.ts`.
- Implemented new `GitHubRepoPicker` component with loading, error, empty, search/filter, and select states.
- Picker remains non-persistent and only emits selected repo URL to parent components.

## Goal

Create a reusable GitHub repo picker component and web API client support for fetching public repos from the new backend endpoint.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/lib/api/auth.ts`
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/GitHubRepoPicker.tsx` (new)
- `/Users/adam/code/slop.haus/apps/web/src/lib/utils.ts` (only if helper utilities are needed)

## Tasks

1. Add `fetchGitHubRepos()` client method in `apps/web/src/lib/api/auth.ts`.
2. Define frontend types for `GitHubRepoSummary` and endpoint response.
3. Build `GitHubRepoPicker` component:
   - loads repos from `/auth/github/repos`
   - includes loading, empty, error states
   - supports client-side search/filter by repo name/full name
   - emits selected repo URL via callback
4. Keep picker purely additive: no mutation or storage behavior.
5. Ensure styling uses existing semantic tokens and UI patterns.

## Component Contract (Proposed)

```ts
interface GitHubRepoPickerProps {
  onSelectRepo: (repoUrl: string) => void;
  className?: string;
}
```

```tsx
<GitHubRepoPicker onSelectRepo={(url) => setRepoUrl(url)} />
```

## UX Requirements

- If `githubLinked: false`, render no repo list (caller handles gate/callout UI).
- If linked but no repos, show explicit empty state.
- If request fails, show non-blocking error state and keep manual URL flow viable.

## Verification Checklist

- [x] API client method returns typed data from `/auth/github/repos`.
- [x] Picker renders loading/empty/error/success states correctly.
- [x] Selecting a repo emits its `htmlUrl` to parent callback.
- [x] Search/filter works on medium-to-large repo lists.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Reusable picker component is ready to integrate into submit pages.
- Data-layer contracts are stable and typed.

# Phase 3: Submit Integration + UX Copy

## Status

**Status:** ✅ Completed (2026-02-24)  
**Owner:** Web  
**Depends On:** Phase 2

## Implementation Notes

- Integrated `GitHubRepoPicker` into `/submit` and `/submit/manual`.
- Updated `UrlInput` to support controlled values so picker selection can prefill analysis URL.
- Preserved `RequireGitHub` wrappers and submission gating behavior.
- Updated gating/callout copy in `RequireGitHub`, settings connections, and login modal.
- No picker integration was added to `/submit/draft/[draftId]`.

## Goal

Integrate the repo picker into initial submit pages while preserving existing GitHub gating and preserving manual URL entry alongside the picker.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/app/submit/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/submit/UrlInput.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/submit/manual/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/RequireGitHub.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/app/settings/connections/page.tsx` (copy update)
- `/Users/adam/code/slop.haus/apps/web/src/components/auth/LoginModal.tsx` (copy update)

## Tasks

1. Integrate `GitHubRepoPicker` into `/submit`:
   - allow selecting a repo to prefill URL input
   - keep manual URL typing path unchanged
2. Integrate `GitHubRepoPicker` into `/submit/manual`:
   - allow selecting a repo to set `repoUrl`
   - keep `mainUrl` + `repoUrl` fields fully editable
3. Update `UrlInput` if needed to support external prefill/control from picker.
4. Keep `RequireGitHub` wrappers in place (no gate policy changes).
5. Improve non-GitHub callout copy to mention easy public-repo selection once linked.
6. Do not integrate picker into `/submit/draft/[draftId]`.

## Code Snippets

```tsx
// submit/manual integration concept
<GitHubRepoPicker onSelectRepo={(url) => setRepoUrl(url)} />
<Input
  label="Repository URL"
  type="url"
  value={repoUrl}
  onChange={(e) => setRepoUrl(e.target.value)}
/>
```

```tsx
// URL input enhancement concept
<UrlInput
  value={url}
  onChange={setUrl}
  onAnalyze={handleAnalyze}
  isLoading={isLoading}
  error={error}
/>
```

## Verification Checklist

- [x] `/submit` shows picker for GitHub-linked users and still supports manual URL input.
- [x] `/submit/manual` can prefill `repoUrl` from picker and still supports manual edits.
- [x] Non-GitHub users continue seeing current gate UI, with updated callout copy.
- [x] No picker appears on draft review page.
- [x] Existing submit behavior (`analyze`, manual submit) remains functional.
- [x] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- End-to-end submit UX includes optional repo selection and unchanged manual controls.
- Copy aligns with product messaging and gate policy.

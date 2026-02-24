# GitHub Public Repo Picker for Submission

**Doc status:** Draft  
**Date:** 2026-02-24  
**Owner:** slop.haus team

## 1) Objective

Add a repo picker to submission flows for users with a linked GitHub account, while preserving manual URL entry alongside the picker.

Requirements from product:

- GitHub-authenticated/linked users should see their public repositories and select one quickly.
- Non-GitHub users should not see the repo picker UI and should instead see guidance to link GitHub.
- Manual URL submission must remain available (live site, GitHub repo, GitLab repo, etc.) for GitHub-linked submitters, even when repo picker is shown.
- Do not persist repo list in our DB; fetch from GitHub ephemerally.
- Handle GitHub API pagination automatically.

## 2) Current Codebase Snapshot

### API/auth

- Auth is handled by Better Auth in [`apps/api/src/lib/auth.ts`](../apps/api/src/lib/auth.ts).
- GitHub and Google social providers are configured there.
- Linked providers are represented by Better Auth `account` rows and surfaced by:
  - [`apps/api/src/middleware/auth.ts`](../apps/api/src/middleware/auth.ts) (`hasGitHubLinked`, `requireGitHub`)
  - [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts) (`/me`, `/accounts`, unlink flow)
- Submission endpoints are currently GitHub-gated:
  - `POST /api/v1/projects` in [`apps/api/src/routes/projects.ts`](../apps/api/src/routes/projects.ts)
  - `POST /api/v1/drafts/analyze` and `POST /api/v1/drafts/:draftId/submit` in [`apps/api/src/routes/drafts.ts`](../apps/api/src/routes/drafts.ts)

### DB schema

- Better Auth tables are in [`packages/db/src/schema/users.ts`](../packages/db/src/schema/users.ts):
  - `account.providerId`, `account.accessToken`, `account.refreshToken`, `account.scope`, etc.
- Project submission data is in [`packages/db/src/schema/projects.ts`](../packages/db/src/schema/projects.ts).
- No table currently stores external repo catalogs (and we do not want one).

### Web app

- Submit pages currently wrap with `RequireGitHub`:
  - [`apps/web/src/app/submit/page.tsx`](../apps/web/src/app/submit/page.tsx)
  - [`apps/web/src/app/submit/manual/page.tsx`](../apps/web/src/app/submit/manual/page.tsx)
  - [`apps/web/src/app/submit/draft/[draftId]/page.tsx`](../apps/web/src/app/submit/draft/[draftId]/page.tsx)
- `RequireGitHub` blocks all content and shows "GitHub Connection Required":
  - [`apps/web/src/components/auth/RequireGitHub.tsx`](../apps/web/src/components/auth/RequireGitHub.tsx)
- Current auth payload already includes `hasGitHub`:
  - [`apps/web/src/lib/api/auth.ts`](../apps/web/src/lib/api/auth.ts)

### OAuth/linking behavior already in place

- Better Auth GitHub defaults include `read:user` and `user:email` scopes (from installed Better Auth core source).
- Account linking requires same email by default unless `allowDifferentEmails` is explicitly enabled (currently not enabled in our config).

## 3) Proposed Architecture

### 3.1 New API endpoint: fetch GitHub repos (ephemeral)

Add a new authenticated endpoint:

- `GET /api/v1/auth/github/repos`

Behavior:

- Requires signed-in non-anonymous user.
- If user has no linked GitHub account:
  - Return `200` with `{ githubLinked: false, repos: [] }` (non-error UI state).
- If linked:
  - Acquire token via Better Auth `getAccessToken` API (preferred over direct DB token reads).
  - Call GitHub REST API `GET https://api.github.com/user/repos`.
  - Auto-follow pagination until exhausted.
  - Normalize and return only fields needed by UI.

Suggested response shape:

```ts
type GitHubRepoListResponse = {
  githubLinked: boolean;
  repos: Array<{
    id: number;
    name: string;
    fullName: string;      // owner/repo
    htmlUrl: string;
    description: string | null;
    isPrivate: boolean;    // should be false for this feature's default
    isFork: boolean;
    language: string | null;
    stargazersCount: number;
    updatedAt: string;
  }>;
};
```

GitHub request parameters (initial proposal):

- `visibility=public`
- `affiliation=owner,collaborator,organization_member`
- `sort=updated`
- `direction=desc`
- `per_page=100`

Filtering policy:

- Include all public repos returned by GitHub for the authenticated user.
- Do not hide forks.
- Do not hide archived repos.

Pagination algorithm:

```ts
let pageUrl = "https://api.github.com/user/repos?...&per_page=100&page=1";
const all = [];
while (pageUrl) {
  const res = await fetch(pageUrl, { headers: { Authorization: `Bearer ${token}` } });
  all.push(...await res.json());
  pageUrl = parseNextLinkHeader(res.headers.get("link")); // null when no next page
}
```

### 3.2 Web: repo picker that does not replace manual input

Add a submit-focused UI component (example path):

- `apps/web/src/components/submit/GitHubRepoPicker.tsx`

Behavior:

- Uses `/auth/me` and `/auth/github/repos`.
- `hasGitHub === true`: show picker (search/filter, selectable rows/chips, loading/error states).
- `hasGitHub === false`: do not render picker list; keep existing blocked submit UI pattern and add a callout that linking GitHub enables one-click public-repo selection.
- Selecting a repo populates existing URL field(s), but user can still type/edit manually.

Integration points:

- URL-first flow: [`apps/web/src/app/submit/page.tsx`](../apps/web/src/app/submit/page.tsx)
  - Keep `UrlInput`; repo picker can prefill URL input.
- Manual flow: [`apps/web/src/app/submit/manual/page.tsx`](../apps/web/src/app/submit/manual/page.tsx)
  - Picker sets `repoUrl` input value.
- Do not add picker to draft review page (`/submit/draft/[draftId]`).

### 3.3 Submission gating policy

Keep current gating behavior unchanged:

- Web submit pages remain wrapped by `RequireGitHub`.
- API submit endpoints remain protected by `requireGitHub()`.
- Non-GitHub users continue seeing the existing GitHub-link requirement UI, now with additional copy that linking GitHub unlocks easy public-repo selection.

No auth/permission policy change is required for this feature.

## 4) Data, Security, and Performance

- No DB migrations required.
- No repo persistence required.
- Tokens remain server-side only; frontend never receives OAuth token.
- Prefer Better Auth token retrieval (`getAccessToken`) for expiration/refresh handling.
- No server-side caching in v1.
- Handle GitHub API failures gracefully with non-blocking UI fallback to manual URL entry.

## 5) Implementation Outline

1. Add API route handler under auth routes for GitHub repo list.
2. Add web API client method in [`apps/web/src/lib/api/auth.ts`](../apps/web/src/lib/api/auth.ts).
3. Build `GitHubRepoPicker` UI component.
4. Integrate picker into submit/manual pages while preserving existing input fields.
5. Keep submission guards unchanged (`RequireGitHub` and `requireGitHub` remain).
6. Update copy in settings/login/submit UX to reflect new behavior.

## 6) Testing Plan

API tests:

- Linked GitHub user with single page of repos.
- Linked GitHub user with multiple pages (`Link` header traversal).
- Unlinked user gets `githubLinked: false`.
- Token missing/expired -> clear error/fallback behavior.

Web tests:

- `hasGitHub=true`: picker renders, selecting repo fills URL field.
- `hasGitHub=false`: picker hidden, link-GitHub guidance shown.
- Manual URL submission still works for GitHub-linked users with and without picker interaction.

Regression checks:

- Typecheck `@slop/api`, `@slop/web`, `@slop/shared`, `@slop/db`.
- Verify existing draft/manual submit flows remain functional.

## 7) Product Decisions (Confirmed)

1. GitHub remains required for submission (no change to submit gating policy).
2. Show all public repos (owner, collaborator, org-member visible repos).
3. Include forks and archived repos (no default filtering).
4. Keep current OAuth scopes (`read:user`, `user:email`) with no additional scope expansion now.
5. No short-lived server-side cache in v1.
6. Render repo picker only on initial submit pages (URL-first + manual), not draft review.

# Submission Tabs + GitHub Link Return

**Doc status:** Draft (Updated with product decisions)  
**Date:** 2026-02-24  
**Owner:** slop.haus team

## 1) Confirmed Product Decisions

1. Non-GitHub-linked users are allowed to submit via URL flow and manual flow.
2. GitHub repo selection remains available as a dedicated submit path.
3. If user links GitHub from submit repo flow, redirect back to `/submit/repo`.
4. Submit experience should use a mobile-friendly tab system with dedicated URLs.
5. Default tab:
   - `hasGitHub = true` -> `GitHub Repo` tab
   - `hasGitHub = false` -> `Project URL` tab

## 2) Current Implementation Snapshot

### 2.1 Web app

- [`apps/web/src/app/submit/page.tsx`](../apps/web/src/app/submit/page.tsx)
  - Wrapped in `RequireAuth` + `RequireGitHub`.
  - Current UI mixes URL analyzer + GitHub repo picker in one screen.
- [`apps/web/src/app/submit/manual/page.tsx`](../apps/web/src/app/submit/manual/page.tsx)
  - Wrapped in `RequireAuth` + `RequireGitHub`.
- [`apps/web/src/app/submit/draft/[draftId]/page.tsx`](../apps/web/src/app/submit/draft/[draftId]/page.tsx)
  - Wrapped in `RequireGitHub`.
- [`apps/web/src/components/auth/RequireGitHub.tsx`](../apps/web/src/components/auth/RequireGitHub.tsx)
  - Blocking gate UI for non-linked users.

### 2.2 API

- Repo list endpoint already exists with pagination handling:
  - [`apps/api/src/routes/auth.ts`](../apps/api/src/routes/auth.ts) `GET /api/v1/auth/github/repos`
- Submission endpoints currently require linked GitHub:
  - [`apps/api/src/routes/drafts.ts`](../apps/api/src/routes/drafts.ts) `POST /drafts/analyze`
  - [`apps/api/src/routes/drafts.ts`](../apps/api/src/routes/drafts.ts) `POST /drafts/:draftId/submit`
  - [`apps/api/src/routes/projects.ts`](../apps/api/src/routes/projects.ts) `POST /projects`

### 2.3 DB schema

- Auth provider links in Better Auth `account` table:
  - [`packages/db/src/schema/users.ts`](../packages/db/src/schema/users.ts)
- Submission data:
  - [`packages/db/src/schema/enrichment-drafts.ts`](../packages/db/src/schema/enrichment-drafts.ts)
  - [`packages/db/src/schema/projects.ts`](../packages/db/src/schema/projects.ts)
- No repo catalog persistence needed.

## 3) Proposed UX Architecture (Tab + Route Based)

### 3.1 Route map

- `/submit` -> smart default redirect (based on `hasGitHub`)
- `/submit/url` -> URL analysis flow
- `/submit/repo` -> GitHub repo selection flow
- `/submit/manual` -> Manual details form

`/submit` should not be a heavy UI page. It should resolve user capability and redirect quickly:

- has GitHub -> `router.replace("/submit/repo")`
- no GitHub -> `router.replace("/submit/url")`

### 3.2 Shared tab nav (mobile-first)

All three pages render the same tab header with links:

- `Project URL`
- `GitHub Repo`
- `Manual Details`

Mobile behavior:

- Full-width tab bar at top of submit content.
- Large tap targets; no dense inline controls.
- Current tab clearly highlighted.
- Page content beneath tab bar is single-purpose for the selected route.

Desktop behavior:

- Same route-level tabs (not a separate desktop-only layout).
- Keeps behavior consistent and deep-linkable across devices.

### 3.3 Tab content behavior

- `/submit/url`: existing `UrlInput` + analyze progress/error states.
- `/submit/repo`:
  - `hasGitHub = true`: show repo picker list and one-click analyze.
  - `hasGitHub = false`: show link GitHub callout (same-email note), plus optional shortcut to URL/manual tabs.
- `/submit/manual`: existing manual project form.

## 4) GitHub Linking Return Flow (Required)

In `/submit/repo` when user is not linked:

1. User clicks `Link GitHub Account`.
2. Call:
   - `linkSocial({ provider: "github", callbackURL: "<app>/submit/repo?linked=1" })`
3. Better Auth returns to `/submit/repo`.
4. Page revalidates `/auth/me` and `/auth/github/repos`.
5. If linked successfully, swap callout for repo list without extra user navigation.

Email matching note stays visible in the callout:

- “Use the same email as your current account when linking providers.”

## 5) Auth Policy and Middleware Changes

To match confirmed product decision (non-GitHub users can submit URL/manual), submit gates must change.

### 5.1 Web

- Remove `RequireGitHub` wrappers from:
  - [`apps/web/src/app/submit/page.tsx`](../apps/web/src/app/submit/page.tsx)
  - [`apps/web/src/app/submit/manual/page.tsx`](../apps/web/src/app/submit/manual/page.tsx)
  - [`apps/web/src/app/submit/draft/[draftId]/page.tsx`](../apps/web/src/app/submit/draft/[draftId]/page.tsx)
- Keep `RequireAuth` in place.
- Keep `RequireGitHub` component for contexts where hard GitHub gating is still desired.

### 5.2 API

- Change submit endpoints to `requireAuth()`:
  - `POST /drafts/analyze`
  - `POST /drafts/:draftId/submit`
  - `POST /projects`
- Keep `/auth/github/repos` as `requireAuth()` + `githubLinked` response model.

### 5.3 Database

- No schema changes.
- No migrations.

## 6) Back Navigation Behavior

Tabs already give direct navigation, but each tab view should still include a small back affordance for expected UX:

- If browser history exists: `router.back()`
- Fallback target: `/submit` (which smart-redirects to default tab)

This keeps the “back-button for each flow” requirement without adding an extra chooser page.

## 7) Edge Cases

- User opens `/submit/repo` without linked GitHub:
  - No error state; render link callout.
- OAuth canceled/failed:
  - Return to `/submit/repo` and keep link callout visible.
- User links in another tab:
  - Repo tab should refresh/revalidate and eventually show repos.
- Large repo accounts:
  - Existing backend pagination loop already handles all pages.

## 8) Verification Checklist (Implementation Phase)

- `/submit` redirects to:
  - `/submit/repo` for linked users.
  - `/submit/url` for non-linked users.
- Tab bar is visible and usable on mobile and desktop.
- Each tab has a working back affordance.
- Non-linked users can complete URL analyze flow and manual submission flow.
- `/submit/repo` for non-linked users shows GitHub link CTA + same-email note.
- Linking from repo tab returns to `/submit/repo` and reveals repo list.
- Linked users can still click `Use Repo` to auto-analyze.
- API submit endpoints accept authenticated non-GitHub users.

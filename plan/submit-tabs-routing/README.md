# Submit Tabs Routing Implementation Plan

## Overview

Implement route-based submit tabs with mobile-friendly navigation:

- `/submit/url`
- `/submit/repo`
- `/submit/manual`

and make `/submit` smart-redirect to default tab:

- GitHub-linked users -> `/submit/repo`
- Non-linked users -> `/submit/url`

Also remove GitHub-required submission gating so authenticated non-GitHub users can submit via URL/manual flows.

**Design Doc:** `design/submit-mode-selector-and-github-link-return.md`

## Status: Completed

**Last Updated:** 2026-02-24

## Confirmed Product Decisions

- Non-GitHub-linked users can submit via URL and manual flows.
- Repo flow is on a dedicated route (`/submit/repo`).
- Linking from repo flow should return to repo flow.
- Mobile-friendly tab UI with dedicated URLs.
- Default tab: repo for linked users, url for non-linked users.

## Phase Summary

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | [Auth Policy + API Gates](./phase-1-auth-policy-and-api-gates.md) | ✅ Complete | Replaced submit `requireGitHub` guards with `requireAuth` |
| 2 | [Submit Route Tabs + Shared Nav](./phase-2-submit-route-tabs.md) | ✅ Complete | Added `/submit/url` and `/submit/repo` with shared tab nav |
| 3 | [GitHub Link Return + UX Copy](./phase-3-link-return-and-copy.md) | ✅ Complete | Implemented `/submit/repo` linking callback + copy updates |
| 4 | [Verification + Cleanup](./phase-4-verification.md) | ✅ Complete | Typechecks and flow verification completed |

## Exit Criteria

- `/submit` redirects to role-appropriate default tab.
- Non-GitHub users can submit via URL/manual.
- Repo tab shows link CTA when unlinked and returns to `/submit/repo` after link.
- Tab routes are usable on mobile and desktop.

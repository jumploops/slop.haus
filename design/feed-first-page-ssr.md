# Feed First-Page SSR

Status: draft  
Owner: TBD  
Date: 2026-03-05

## Goal
Render the first page of the feed in the initial HTML/SSR payload so project cards appear immediately on page load, while preserving existing client-side interactivity:

- sort switching
- pagination / load more
- intro dismissal
- display mode persistence
- slop mode

The target is a simple, robust architecture, not a broad feed rewrite.

## Current Implementation Review

### Feed page is fully client-rendered today
- [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx) is a client component.
- It fetches feed data with `useSWRInfinite(...)`.
- While that client fetch is in flight, the page renders skeleton cards.

### Feed API is already suitable for SSR bootstrap
- [`apps/api/src/routes/projects.ts`](/Users/adam/code/slop.haus/apps/api/src/routes/projects.ts) exposes a public `GET /api/v1/projects` route.
- The route already returns everything needed for initial feed rendering:
  - `featuredProjects`
  - `projects`
  - `pagination`

### The app already has a server-rendered page pattern
- [`apps/web/src/app/p/[slug]/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/p/[slug]/page.tsx) is already an `async` server page.
- It fetches project data before render and returns rendered HTML with data included.

### Current API helper is usable but not ideal for feed SSR
- [`apps/web/src/lib/api.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/api.ts) is browser-oriented and does not express SSR feed caching/freshness explicitly.
- It also does not forward request cookies explicitly on the server side.
- Feed is public today, so cookie forwarding is not required for correctness, but the coupling is still weak.

### Existing envs already support a shared API base
- The repo already defines `API_URL` and `NEXT_PUBLIC_API_URL` in [`.env`](/Users/adam/code/slop.haus/.env), [`.env.prod`](/Users/adam/code/slop.haus/.env.prod), and [`.env.example`](/Users/adam/code/slop.haus/.env.example).
- [`apps/web/src/lib/api.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/api.ts) already uses `NEXT_PUBLIC_API_URL` for browser fetches.
- In practice, `web` and `api` run as separate services and use the same deployed API base, so the SSR helper can safely reuse `process.env.NEXT_PUBLIC_API_URL`.

## Decisions

### 1) Convert `/` into a server wrapper page
Change [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx) from the main client implementation into a thin server component that:

- reads `searchParams`
- resolves `sort` and `window` from the URL
- fetches page 1 of the requested feed view
- catches fetch errors
- renders a client shell component with:
  - `initialFeed: FeedResponse | null`
  - `initialSort`
  - `initialWindow`

Reasoning:
- This gets the first page into SSR HTML.
- It also makes non-default feed views shareable and SSR-backed immediately.
- It keeps localStorage/session/UI state in a client component where it belongs.

### 2) Make sort and time window URL-backed now
Move `sort` and `window` out of local-only state and into route search params.

Recommended URL shape:
- `/` maps to defaults: `sort=hot`, `window=all`
- non-default examples:
  - `/?sort=new`
  - `/?window=7d`
  - `/?sort=top&window=30d`

Recommended behavior:
- server page parses `searchParams` and fetches page 1 for that view
- client shell initializes from the parsed values passed by the server
- user changes to sort/window update the URL and reset pagination to page 1
- load-more pagination remains client-only in v1 and is not reflected in the URL

Reasoning:
- This avoids a split-brain model where SSR always shows defaults and the client then snaps to a different view.
- It makes feed views linkable and reload-stable.
- It limits scope by not trying to URL-model infinite pagination yet.

### 3) Extract current interactive logic into a client shell
Move the current interactive feed implementation into a new client component, for example:

- new: `apps/web/src/components/feed/FeedPageClient.tsx`

This client shell owns:

- `useSWRInfinite(...)`
- intro dismissal
- display mode persistence
- slop mode-driven presentation
- load more behavior
- router updates for sort/window changes

Reasoning:
- Clean server/client boundary.
- Minimal behavioral churn inside the interactive logic.

### 4) Seed `useSWRInfinite` with SSR data
Initialize the client shell with the server-fetched first page:

- pass `initialFeed` into the client component
- use `fallbackData: initialFeed ? [initialFeed] : undefined`
- keep initial `size = 1`

SWR behavior for v1:

- `revalidateOnFocus: false`
- `revalidateFirstPage: false`

Reasoning:
- Prevent an immediate duplicate fetch on hydration.
- Use SSR data directly for initial paint.
- Preserve client fetching for user-driven changes after mount.

### 5) Add a dedicated server-side feed fetch helper
Add a small server-oriented helper instead of relying directly on the browser-oriented API helper.

Possible location:

- new: `apps/web/src/lib/server/feed.ts`

Responsibilities:

- build the feed query string
- fetch `GET /api/v1/projects?...`
- use `process.env.NEXT_PUBLIC_API_URL` as the base URL
- set explicit caching semantics for the feed SSR request
- return `FeedResponse`

Caching for v1:

- `cache: "no-store"`

Reasoning:
- Feed freshness matters.
- `hot` ordering and new submissions should not be silently cached by Next server fetch.
- Reusing `NEXT_PUBLIC_API_URL` matches the existing browser data path and the current separate-service deployment model.

### 6) Preserve client-only UI concerns as client-only
Do not move these into SSR logic:

- intro dismissal (`localStorage`)
- display mode (`localStorage`)
- slop mode (`localStorage`)
- session-driven admin reset control

These should remain in the client shell.

Reasoning:
- They are browser-state concerns.
- They were already the source of hydration fragility when mixed into initial render logic.

### 7) Server fetch failure should degrade gracefully
If the server fetch for page 1 fails:

- do not hard-fail the whole page by default
- pass `initialFeed = null`
- still pass parsed `initialSort` and `initialWindow`
- let the client shell fall back to the client-fetch path

Reasoning:
- Keeps the page resilient during transient API failures.
- Avoids turning a recoverable feed failure into a full route failure.

## Proposed Data Flow

1. Request hits `/` or `/?sort=...&window=...`.
2. Server page parses and validates `sort` and `window`.
3. Server page fetches page 1 of that feed view using `NEXT_PUBLIC_API_URL` and `cache: "no-store"`.
4. Server renders HTML with real project cards when fetch succeeds.
5. Client shell hydrates with `initialFeed`, `initialSort`, and `initialWindow`.
6. `useSWRInfinite(...)` uses the SSR data as page 1 and does not immediately revalidate it.
7. Later sort/window changes update the URL and bootstrap a new page-1 SWR key.
8. Later pagination continues client-side via `setSize(...)`.

## Files Likely To Change

- update: [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx)
- new: `apps/web/src/components/feed/FeedPageClient.tsx`
- new: `apps/web/src/lib/server/feed.ts`
- update: [`apps/web/src/lib/api/projects.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts) for shared feed query helpers/types if needed
- possible env documentation update in [`.env.example`](/Users/adam/code/slop.haus/.env.example) if `apps/web` needs clearer notes around `NEXT_PUBLIC_API_URL` reuse in SSR

## Edge Cases

### 1) Avoiding duplicate first-page fetch
If `useSWRInfinite(...)` is not seeded/configured carefully, the client will immediately refetch page 1 after hydration.

Mitigation:
- `fallbackData`
- `revalidateFirstPage: false`

### 2) Graceful server fetch fallback
If SSR fetch fails, the route should still render the client shell so the page can recover client-side instead of returning a server error page.

### 3) Invalid search params
The server page must validate `sort` and `window` and normalize bad values to safe defaults.

Recommended normalization:
- unknown `sort` -> `hot`
- unknown `window` -> `all`

This should happen before server fetch so SSR and hydration agree.

### 4) Sort/window changes must reset correctly
Changing sort or time window must:

- reset to page 1
- use a fresh SWR key for the new route state
- drop old paginated pages from the previous view
- continue to use the API’s existing featured-project behavior for `hot + page=1`

### 5) Featured section consistency
The API already excludes featured IDs from the regular hot list and only includes the featured strip on `hot/page=1`.

Implication:
- SSR bootstrap should reuse the existing API contract rather than reimplement featured logic in the web app.

### 6) Router churn and history behavior
If every sort/window toggle does a `push`, browser history can become noisy.

Recommended approach:
- use `router.replace(...)` for feed control changes in v1

This keeps the URL authoritative without polluting back-button history for every filter click.

### 7) Public now, potentially personalized later
The feed response is public today, so server fetch does not need forwarded cookies.

If later requirements add user-specific fields to the feed payload:
- the server fetch helper will need explicit cookie/header forwarding
- caching strategy will need to be revisited
- the `NEXT_PUBLIC_API_URL`-based helper will need an auth-aware branch

### 8) Freshness vs. performance
`cache: "no-store"` gives the most predictable results, but it also means every request hits the API directly.

Implication:
- this is correct for v1
- if traffic or latency becomes a problem, short revalidation can be revisited later with real measurements

### 9) Search-param canonicalization
If defaults are omitted from the URL, the client and server need a single canonical rule for when to keep or drop params.

Recommended rule:
- omit default params from the URL
- only include params when they differ from `sort=hot` and `window=all`

This keeps URLs clean while preserving SSR correctness.

## Open Questions

No blocking open questions for the design pass.

Follow-up implementation choices can still be made during planning, but the main architectural decisions are now set:

- SSR first page
- URL-backed `sort` and `window`
- `cache: "no-store"`
- no immediate first-page background revalidation
- server-side feed fetch via `NEXT_PUBLIC_API_URL`

## Recommendation
Implement the smallest robust version:

- server wrapper page for `/`
- URL-backed `sort` and `window`
- dedicated server feed helper using `NEXT_PUBLIC_API_URL` with `cache: "no-store"`
- new client shell seeded with `initialFeed`
- graceful fallback to client fetch when server bootstrap fails

That gets first-page projects into SSR immediately, removes skeleton dependence on initial load, makes feed views shareable, and preserves the existing client interaction model without a large rewrite.

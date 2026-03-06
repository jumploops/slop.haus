# Debug: Feed Filter Navigation Triggers Server Re-Render

**Status:** Draft  
**Owner:** Web  
**Date:** 2026-03-06

## Problem

After the feed first-page SSR refactor, switching between feed controls like `hot`, `new`, `top`, or changing the time window now causes a server request and a visible full-page re-render.

Expected behavior from product perspective:
- URL should update
- feed data should update
- page should not feel like a fresh route render for every filter click

## Current Implementation Review

### 1) Filter controls now navigate by URL

In [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx):

- `handleSortChange(...)` calls `router.replace(nextHref)`
- `handleWindowChange(...)` calls `router.replace(nextHref)`

That means filter changes are no longer local state updates. They are route navigations.

### 2) The root feed route is now a server component keyed off `searchParams`

In [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx):

- the page is an async server component
- it awaits `searchParams`
- it parses `sort` and `window`
- it fetches page 1 on the server for that route state

This means the current route tree depends directly on `searchParams`.

### 3) Server fetch is explicitly uncached

In [`apps/web/src/lib/server/feed.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/server/feed.ts):

- page-1 bootstrap fetch uses `cache: "no-store"`

So every navigation to a new filter state forces a fresh server fetch.

### 4) The client shell is explicitly remounted on filter changes

Also in [`apps/web/src/app/page.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/page.tsx):

- `FeedPageClient` is rendered with `key={`${sort}:${window}`}`

Implication:
- when filter state changes, React treats it as a new client subtree
- local client state resets
- the transition feels even more like a full render

### 5) SWR is no longer the first source of truth for filter changes

In [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx):

- `sort` and `timeWindow` are derived from `initialSort` / `initialWindow`
- those props come from the server route
- `useSWRInfinite(...)` is seeded from server bootstrap data

So SWR is now downstream of the route transition, not the driver of the first update.

## Findings

### Finding 1: This is expected from the current architecture

The current implementation makes `sort` and `window` part of the server route contract.

That means:
- clicking a filter changes the URL
- changing the URL causes App Router navigation
- App Router asks the server for a new RSC payload for that route state
- the server page fetches page 1 again
- the client shell receives new props and remounts

So the observed server request is not accidental. It is a direct consequence of the chosen SSR + URL-backed design.

### Finding 2: `router.replace(...)` does not mean “client-only update” here

`router.replace(...)` avoids noisy history, but it is still a navigation.

Because the target route is a server component that reads `searchParams`, `replace(...)` still causes a server round-trip for the new route state.

### Finding 3: The explicit `key` amplifies the visible reset

Even if the server request is acceptable, the `key={`${sort}:${window}`}` on `FeedPageClient` guarantees a full client remount for every filter change.

That likely contributes to the “full render” feel by resetting local UI state such as:
- intro visibility state
- display mode in-memory state before localStorage re-applies
- SWR pagination state
- transient interaction state

Important nuance:
- removing the key alone would not stop the server request
- it would only reduce how hard the client subtree resets

### Finding 4: `cache: "no-store"` makes every filter navigation fully dynamic

Even if App Router were navigating efficiently, the server bootstrap fetch is intentionally uncached.

That is correct for freshness, but it guarantees that every filter transition pays the full server fetch cost.

## Root Cause Summary

The behavior is caused by the combination of four implementation decisions:

1. Filter changes update the route via `router.replace(...)`
2. The route is a server component that reads `searchParams`
3. The server fetch is `cache: "no-store"`
4. The client shell is keyed by `sort/window`, forcing remount on every filter change

Together, these produce exactly the observed behavior: server request + visible full rerender on each feed filter change.

## Hypotheses

### Hypothesis 1: The primary cause is route ownership of filter state

As long as `sort` and `window` are owned by the server route, filter changes will continue to trigger server navigations.

This is the most important architectural fact.

### Hypothesis 2: The `key` is making the UX feel worse than it strictly has to

The route navigation is unavoidable under the current model, but the explicit client remount likely makes the transition noticeably harsher.

### Hypothesis 3: We may want SSR only for initial page load, not for every filter transition

If the product goal is:
- real cards in initial HTML
- but client-smooth transitions after first load

then the current architecture is too route-centric for interactions.

## Likely Fix Directions (Not Implemented)

### Option A: Keep SSR for first load, move filter changes back to client state

Model:
- server renders initial route only
- client shell owns active `sort` / `window` after hydration
- URL can still be updated with `history.replaceState` or another non-navigation approach
- SWR drives subsequent filter transitions client-side

Pros:
- preserves SSR first load
- restores fast in-page transitions
- likely closest to desired UX

Cons:
- route URL stops being the immediate source of truth for live filter changes unless carefully synchronized
- non-default deep links still need a bootstrap path

### Option B: Keep URL-backed state, but stop forcing client remount

Model:
- keep server route ownership
- remove or reduce the `key={`${sort}:${window}`}` remount behavior

Pros:
- smaller change
- may reduce the visual harshness

Cons:
- does not remove the server request
- only softens the symptom

### Option C: Keep current architecture and accept server navigations

Model:
- leave route-driven SSR behavior as-is
- polish loading/transition behavior only

Pros:
- simplest technically

Cons:
- does not meet the current UX expectation

## Recommendation

If the product expectation is “URL changes, data changes, but no full route-like rerender”, then **Option A** is likely the right direction:

- use SSR to bootstrap the first render only
- let the client shell own interactive filter transitions after hydration
- keep the URL synchronized without making every filter change a server-owned route navigation

If minimal churn is preferred first, **Option B** is a reasonable intermediate step, but it will not eliminate the server request.

## Open Questions

1. Is the priority to preserve shareable URL-backed state as the primary source of truth at all times, or just to keep the URL in sync for copy/reload purposes?
2. Is a server request on filter change acceptable if the transition is visually smoother, or is avoiding the request itself the goal?
3. Do we want non-default deep links to SSR accurately on first load only, or on every in-app filter transition too?

## Practical Takeaway

The current behavior is not a bug in isolation. It is the natural consequence of making filter state part of the server route.

If we want client-smooth filter transitions, the state ownership model needs to change.

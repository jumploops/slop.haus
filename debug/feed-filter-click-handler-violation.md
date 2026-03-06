# Debug: Feed Filter Click Handler Violation

**Status:** Draft  
**Owner:** Web  
**Date:** 2026-03-06

## Problem

After moving feed filter transitions back to the client, the browser console reports warnings like:

```text
[Violation] 'click' handler took 262ms
react-dom-client.development.js:16844 [Violation] 'click' handler took 256ms
```

Observed context:
- warnings appear during feed filter interactions (`Hot` / `New` / `Top`, and possibly window changes)
- stack points at `react-dom-client.development.js`, which indicates React dev-mode event handling

## Current Implementation Review

### 1) The filter click handler itself is very small

In [`apps/web/src/components/feed/FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx):

- `handleSortChange(...)` only calls `setSort(nextSort)` when the value changes
- `handleWindowChange(...)` only calls `setTimeWindow(nextWindow)` when the value changes

In [`apps/web/src/components/ui/Tabs.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/ui/Tabs.tsx):

- each tab button just calls `onTabChange(tab.id)`

Conclusion:
- the raw click handler body is not intrinsically expensive
- the warning is much more likely caused by the synchronous React render/commit work triggered by that state update

### 2) A filter change re-renders the entire feed client shell

`FeedPageClient` owns:
- active `sort`
- active `timeWindow`
- `useSWRInfinite(...)`
- intro state
- display mode state
- the full project list render tree

When `sort` changes:
- `useSWRInfinite(...)` key changes immediately
- `pages`, `featuredProjects`, `projects`, `pagination`, and related derived values all recompute
- the whole feed list subtree re-renders

### 3) The project list render tree is heavy

Each feed update re-renders many [`ProjectCard`](/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx) instances.

Per card, current render work includes:
- `useLike(...)`
- `useFavorite(...)`
- `useRouter()`
- date/relative-time formatting
- vibe label lookup
- slop-band/slop-score calculations
- placeholder image resolution
- slop offset/hash calculations
- multiple event handlers and conditional UI branches
- image elements and card layout DOM

Implication:
- even if no single computation is catastrophic, 20+ cards plus featured cards can create noticeable synchronous render cost

### 4) Filter changes can synchronously unmount the current list

Current `useSWRInfinite(...)` config in [`FeedPageClient.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/feed/FeedPageClient.tsx):

- uses `fallbackData` only when current state matches the initial SSR bootstrap state
- for a new client-selected filter state, `fallbackData` is typically `undefined`

Inference:
- when switching from one filter to another, the previous list can be torn down immediately before the new data arrives
- unmounting a large tree of `ProjectCard`s can itself consume significant main-thread time during the click-triggered update

### 5) There is follow-up work after the click-triggered render

After filter state changes:
- `useEffect(... [sort, timeWindow])` calls `window.history.replaceState(...)`
- `useEffect(... [sort, timeWindow, setSize])` calls `setSize(1)`

These effects are not the click handler itself, but they add more work to the transition path.

Important nuance:
- they are secondary contributors
- the primary cost is still likely the immediate React update across the feed subtree

### 6) Dev mode is likely amplifying the warning

The console stack references `react-dom-client.development.js`.

That matters because:
- React dev mode adds extra checks/instrumentation
- Chrome violation warnings are sensitive to main-thread blocking in development
- production performance may be materially better than what the warning suggests

This does **not** mean the warning should be ignored, but it does mean dev numbers are likely worse than production.

## Findings

### Finding 1: The problem is not the tab/button handler body

The click handler logic is trivial.

The expensive work is the synchronous React render/commit cycle caused by changing feed filter state.

### Finding 2: The feed list likely re-renders too much per filter click

Because the filter state lives high in `FeedPageClient`, changing it forces recomputation and rerender of:
- feed layout controls
- featured section
- full project list
- all `ProjectCard`s currently mounted

### Finding 3: `ProjectCard` is a likely hot path

`ProjectCard` is feature-rich and not memoized.

That means every filter-driven feed render walks a large number of fairly heavy card component trees.

### Finding 4: Immediate teardown of the current list may be a major contributor

For non-bootstrap filter states, the new SWR key likely means current data is dropped before replacement data arrives.

That can make a filter click expensive even before the network finishes, because React is unmounting many cards right away.

### Finding 5: The warning is likely real, but dev-only overhead is inflating it

The presence of `react-dom-client.development.js` strongly suggests the measured click duration is partly a development artifact.

Hypothesis:
- production may still be acceptable
- but the current transition path is probably heavier than it needs to be even outside dev

## Hypotheses

### Hypothesis 1: The dominant cost is full-list reconciliation, not the click callback

Most likely source of the warning:
- `setSort(...)` or `setTimeWindow(...)`
- React immediately reconciles a large feed subtree
- current list unmounts or rerenders
- browser reports long click task

### Hypothesis 2: Preserving previous data during filter transitions would reduce the violation

If the UI keeps the previous list mounted while the next filter loads, the click-triggered synchronous teardown cost may drop.

Tradeoff:
- that introduces a stale-data/loading-overlay pattern instead of immediate clear/reset

### Hypothesis 3: `ProjectCard` render cost is high enough that memoization or decomposition could help

Potential render hot spots:
- list of many cards
- hooks per card
- repeated derived calculations per card
- large DOM/image subtree per card

### Hypothesis 4: The current feed state is too high up for cheap transitions

Because `FeedPageClient` owns both controls and the entire list, a small control click causes a large render blast radius.

## Likely Fix Directions (Not Implemented)

### Option A: Keep previous feed data visible while next filter loads

Model:
- do not immediately clear the current list when the SWR key changes
- show a lighter loading state while new results load

Pros:
- reduces synchronous teardown cost
- likely improves perceived responsiveness

Cons:
- requires careful UX to avoid confusing stale-data flashes

### Option B: Reduce render blast radius in the feed tree

Model:
- memoize cards or split feed sections so control updates do not force unnecessary rerenders

Pros:
- directly addresses render cost

Cons:
- more component-level tuning work
- can add complexity if overdone

### Option C: Optimize `ProjectCard` itself

Model:
- identify and reduce expensive per-render work inside `ProjectCard`
- consider memoization for stable props

Pros:
- likely useful beyond this one issue

Cons:
- requires profiling/measurement discipline

### Option D: Accept dev-only warnings if production interaction is fine

Model:
- verify production build/browser behavior before optimizing aggressively

Pros:
- avoids premature optimization

Cons:
- risks normalizing a transition path that is still heavier than needed

## Recommendation

The next investigation should probably focus on **render cost**, not click handler logic.

Recommended order:
1. confirm whether current filter change immediately clears/unmounts the old list
2. treat `ProjectCard` as the primary render hot path
3. decide whether we want to preserve previous data during filter transitions or optimize full rerenders directly
4. sanity-check production behavior before overfitting to dev-only warnings

## Practical Takeaway

This warning is most likely a symptom of a large synchronous feed rerender triggered by a small state change.

The click handler is just the entry point. The expensive part is everything React does right after it.

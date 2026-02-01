# Feed Load More Replaces Projects (Pagination Bug)

## Problem
Clicking **Load More** does not append projects. Instead, the list swaps to a different set of 20, so previously visible projects disappear.

## Investigation Findings
- **Client-side feed state** in `apps/web/src/app/page.tsx` uses `useSWR` with the key `['feed', sort, timeWindow, page]` and renders `data.projects` directly.
- When **Load More** increments `page`, SWR fetches the new page and **replaces** `data.projects` with the latest page, because the response only contains one page.
- There is **no accumulation** logic (no `useSWRInfinite`, no local `allProjects` state, no `mutate` merging).
- API pagination appears correct (`apps/api/src/routes/projects.ts` uses `limit` + `offset`) and returns a single page, which is expected.
- The UI also shows `Showing {data.projects.length} of {data.pagination.total}` which reflects just the current page length.

## Hypotheses
1. **Missing client-side accumulation**
   - The feed is using single-page SWR instead of an accumulated list. Load More increments page, which swaps the list instead of appending.

2. **Pagination UI expects offset but uses page replacement**
   - The “Load More” button is implemented as a page change, but the render code doesn’t combine results.

3. **SWR cache key strategy prevents aggregation**
   - Each page is treated as a distinct SWR cache entry and there’s no merged cache or `useSWRInfinite` hook in place.

## Likely Fix Direction (No Code Yet)
- Use `useSWRInfinite` and flatten pages, or keep a local `allProjects` state that appends results when `page` changes.
- Update “Showing X of Y” to reflect cumulative length.
- Ensure sort/window changes reset to page 1 and clear accumulated results.

# Phase 4: Web Feed + Project Detail UI

## Status

**Status:** ✅ Completed (2026-03-02)  
**Owner:** Web  
**Depends On:** Phase 2, Phase 3

## Goal

Render featured projects at the top of the `hot` feed and add admin-only feature controls on project detail pages, matching finalized rank/badge rules.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/src/lib/api/projects.ts`
- `/Users/adam/code/slop.haus/apps/web/src/lib/api/admin.ts`
- `/Users/adam/code/slop.haus/apps/web/src/app/page.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectCard.tsx`
- `/Users/adam/code/slop.haus/apps/web/src/components/project/ProjectDetails.tsx`

## UI Behavior Target

- Featured section:
  - Appears only when `sort === "hot"` and first page has `featuredProjects`.
  - Displays up to 3 cards from API `featuredProjects`.
  - Uses gold square + star badge for featured marker.
- Standard list:
  - Excludes featured items on `hot` page 1 via API response.
  - Numeric rank labels are for non-featured items only.
  - First non-featured card displays rank `1`.
  - Rank remains monotonic across pagination for non-featured list.
- Admin controls:
  - Show only for `session.user.role === "admin"` on project detail page.
  - Toggle between `Feature` and `Unfeature` actions.
  - Trigger new admin API endpoints and reflect updated state.

## Tasks

1. Extend `FeedResponse` typing with `featuredProjects`.
2. Update feed page data handling:
   - Read `featuredProjects` from first page.
   - Render dedicated featured section above standard feed grid/list.
   - Keep standard ranking independent from featured count.
3. Extend `ProjectCard` to support featured marker variant:
   - Gold square with star icon in place of numeric badge.
4. Add project detail admin action button(s):
   - Fetch current featured state from project payload.
   - Call `featureProject` / `unfeatureProject`.
   - Provide loading/error/success UX consistent with existing patterns.
5. Ensure responsive behavior in all display modes (`list-sm`, `list-lg`, `grid`).

## Design Notes

- Do not introduce palette utility classes; use semantic tokens and existing component conventions.
- Keep rank semantics stable for users by numbering only the standard list.
- Maintain existing card behavior for non-featured contexts.

## Code Snippets (Conceptual)

```ts
const featuredProjects = sort === "hot" ? (pages[0]?.featuredProjects ?? []) : [];
const standardProjects = pages.flatMap((page) => page.projects);
```

```tsx
{isFeatured ? (
  <div className="...gold badge styles...">★</div>
) : (
  <div className="...rank badge styles...">{rank}</div>
)}
```

```ts
const nonFeaturedRank = index + 1; // independent of featured count
```

## Verification Checklist

- [ ] Featured section renders only on `hot` page 1.
- [ ] Featured cards show gold star marker, not numeric rank.
- [ ] Non-featured ranks start at `1` on hot page 1.
- [ ] Non-featured rank progression remains monotonic after load-more pagination.
- [ ] `new` and `top` display no featured section.
- [ ] Admin sees feature toggle on project detail page; non-admin does not.
- [ ] Feature/unfeature action updates UI state and handles API errors cleanly.
- [ ] `pnpm -F @slop/web exec tsc --noEmit`

## Exit Criteria

- Web UX matches all finalized featured/ranking/admin-control requirements across feed modes and viewport sizes.

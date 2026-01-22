# Phase 4: Page-Level Reskins

**Status:** Pending

## Goals

- Bring all primary pages in `apps/web/src/app` in line with clean-ui.
- Use `STYLE_GUIDE.md` for pages not represented in `clean-ui/`.

## Tasks

1. Feed page.
   - Update `apps/web/src/app/page.tsx` to match clean-ui feed layout.
   - Align sorting controls (tabs + time window select) with clean-ui visual language.

2. Project detail page.
   - Update `apps/web/src/app/p/[slug]/page.tsx` and project detail components
     to match clean-ui layout and review sections.
   - Implement clean-ui `ReviewCard` and `ReviewForm` patterns using real data.

3. Submit page.
   - Apply style guide patterns to forms and inputs.
   - Ensure tokens and typography match clean-ui.

4. Settings + Admin pages.
   - Apply consistent card layouts, dashed borders, monospace headers.
   - Align navigation layout with clean-ui tokens.

5. Favorites + My Projects.
   - Update listing layout to use clean-ui card patterns.

## Files to Change (Expected)

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/p/[slug]/page.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/components/comment/*` (review UI)
- `apps/web/src/app/submit/*`
- `apps/web/src/app/settings/*`
- `apps/web/src/app/admin/*`
- `apps/web/src/app/favorites/*`
- `apps/web/src/app/my/*`

## Reference Files

- `clean-ui/app/page.tsx`
- `clean-ui/app/project/[id]/page.tsx`
- `clean-ui/components/review-card.tsx`
- `clean-ui/components/review-form.tsx`
- `clean-ui/STYLE_GUIDE.md`

## Verification Checklist

- [ ] Feed page matches clean-ui layout and spacing.
- [ ] Project detail page aligns with clean-ui review UI.
- [ ] Form pages (submit/settings) follow style guide.
- [ ] Admin + favorites pages are consistent with new tokens.
- [ ] No legacy `bg-bg` / `text-fg` tokens remain on pages.

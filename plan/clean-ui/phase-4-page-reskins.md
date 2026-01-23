# Phase 4: Page-Level Reskins

**Status:** In Progress

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

6. Edit project flow.
   - Reskin edit page loading/error states.
   - Align EditableProject, revision banner, and screenshot editor with clean-ui tokens.

7. Theme gallery page.
   - Use style guide for header + cards.

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
- `apps/web/src/app/p/[slug]/edit/page.tsx`
- `apps/web/src/components/project/EditableProject.tsx`
- `apps/web/src/components/project/RevisionStatusBanner.tsx`
- `apps/web/src/components/project/ScreenshotEditor.tsx`
- `apps/web/src/components/project/UrlChangeModal.tsx`
- `apps/web/src/app/theme-gallery/page.tsx`

## Reference Files

- `clean-ui/app/page.tsx`
- `clean-ui/app/project/[id]/page.tsx`
- `clean-ui/components/review-card.tsx`
- `clean-ui/components/review-form.tsx`
- `clean-ui/STYLE_GUIDE.md`

## Verification Checklist

- [x] Feed page matches clean-ui layout and spacing.
- [x] Project detail page aligns with clean-ui review UI.
- [x] Form pages (submit/settings) follow style guide.
- [x] Admin + favorites pages are consistent with new tokens.
- [x] Edit project flow uses clean-ui card styles.
- [x] No legacy `bg-bg` / `text-fg` tokens remain on pages.

## Implementation Notes

- Feed page now includes clean-ui hero + date header + updated controls.
- Project detail layout, review thread, and review form are reskinned to clean-ui styles.
- Submit flow (URL, manual, draft review) and settings pages are now aligned to clean-ui tokens and typography.
- Admin, favorites, my projects, and auth gates are aligned to clean-ui card styles.
- Edit project flow components now match clean-ui card structure and typography.
- Theme gallery header and cards updated to clean-ui layout.

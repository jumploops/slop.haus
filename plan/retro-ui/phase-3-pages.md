# Phase 3: Page-Level Reskin

**Status:** Completed

## Objective

Apply the retro aesthetic to all pages and page-level components, replacing legacy class placeholders and aligning layout with the reference UI.

## Files to Change

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/favorites/page.tsx`
- `apps/web/src/app/my/projects/page.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/app/error.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/auth/AuthButtons.tsx`
- `apps/web/src/components/auth/RequireGitHub.tsx`
- `apps/web/src/components/project/ProjectCard.tsx`
- `apps/web/src/components/project/ProjectDetails.tsx`
- `apps/web/src/components/project/ScoreWidget.tsx`
- `apps/web/src/components/project/VoteButtons.tsx`
- `apps/web/src/components/comment/*`
- `apps/web/src/app/submit/*`
- `apps/web/src/components/submit/DraftReview.tsx`
- `apps/web/src/app/settings/*`
- `apps/web/src/app/admin/*`
- `apps/web/src/app/theme-gallery/*`
- `apps/web/src/components/theme/ThemeGenerator.tsx`
- `apps/web/src/components/theme/ThemePreview.tsx`
- `apps/web/src/components/ui/Toast.tsx`

## Tasks

- Add a retro-styled under-construction banner and gradient header treatment in the global layout or header.
- Add a retro footer (gradient strip, retro microcopy) in `apps/web/src/app/layout.tsx`.
- Replace legacy class placeholders (`feed-controls`, `empty-state`, `project-page`, etc.) with explicit Tailwind composition or shared wrappers.
- Update the feed layout and `ProjectCard` to match the retro list-item pattern (rank, thumbnail, slop/vibe badges, retro tags).
- Define and implement the mapping for retro score labels (SLOP/VIBE) using existing data fields.
- Restyle the project detail page to use retro inset/outset panels, ASCII-style headers, and retro badges.
- Update comments UI to match retro panel styling.
- Restyle favorites, my projects, and auth/account UI (dropdown, GitHub requirement).
- Reskin submit review flow, theme gallery widgets, toast, and app error/404 states.
- Audit submit/settings/admin/theme-gallery pages and apply retro panels, buttons, and typography consistently.

## Code Snippets

```tsx
// apps/web/src/app/layout.tsx
<body className="bg-bg text-fg font-sans">
  <div className="bg-warning border-y-4 border-black py-2 overflow-hidden">
    <div className="whitespace-nowrap animate-[marquee_15s_linear_infinite]">
      *** UNDER CONSTRUCTION *** PARDON OUR DUST! ***
    </div>
  </div>
  <Header />
  <main className="max-w-[var(--app-container-max)] mx-auto px-4 py-6">{children}</main>
  <footer className="border-t-4 border-black bg-gradient-to-r from-slop-teal via-slop-purple to-slop-pink py-4" />
</body>
```

```tsx
// apps/web/src/components/project/ProjectCard.tsx
<article className="border-2 border-black bg-white shadow-[2px_2px_0_#000]">
  {/* Thumbnail + meta + retro score badges */}
</article>
```

## Verification Checklist

- Feed, project detail, submit, admin, settings, and theme-gallery pages all render with retro visual language.
- Favorites, my-projects, and auth-required surfaces align with retro styling.
- Error/404 screens and toasts reflect the retro panel treatment.
- Legacy placeholder class names removed or no longer relied upon.
- Header/footer match the gradient + beveled style of the reference UI.
- Score badges and tags display consistently across feed and project pages.

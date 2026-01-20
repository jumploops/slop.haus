# Plan: Remove globals.css and Complete Tailwind Migration

**Created:** 2026-01-18
**Status:** ✅ COMPLETE
**Last Updated:** 2026-01-18

## Progress Summary

| Phase | Description | Status | Lines Removed |
|-------|-------------|--------|---------------|
| 1 | Remove dead code | ✅ Complete | ~2,160 lines |
| 2 | Migrate remaining classes to Tailwind | ✅ Complete | ~1,340 lines |
| 3 | Update component files | ✅ Complete | - |
| 4 | Move shared styles to theme.css | ✅ Complete | - |
| 5 | Delete globals.css and verify | ✅ Complete | - |

**Final result:** globals.css DELETED (~3,500 lines removed total)

## Overview

globals.css has become technical debt after the Tailwind v4 migration. An audit reveals:
- **~200 CSS classes defined**
- **~40 classes actually used** (20%)
- **~115+ classes are dead code** (58%)
- **~3,400 lines of CSS**, most of which is unused

This plan removes globals.css entirely by:
1. Deleting dead code
2. Migrating remaining used classes to Tailwind utilities
3. Removing the file and its import

## Phase 1: Remove Dead Code

**Status:** COMPLETE

Reduced globals.css from ~3,500 lines to ~1,340 lines (62% reduction).

**Removed:**
- Base styles (body, a, h1-h3) - duplicates of theme.css
- Layout classes (.container, .header, .logo, .nav, .main)
- Button variants (.btn-primary, .btn-secondary, .btn-ghost, .btn-danger, .btn-sm, .btn-lg, .btn-loading, .btn-spinner)
- Input variants (.input-wrapper, .input-label, .input-error, etc.)
- Navigation (.tabs, .tab, .feed-tabs)
- Vibe/Vote system (.vibe-*, .vote-*)
- Avatar variants (.avatar-sm, .avatar-md, .avatar-lg, etc.)
- Badge system (.badge-*)
- Toast system (.toast-*)
- Comment system (.comment-*)
- Settings layout (.settings-*)
- Profile/Connections (.profile-*, .connection-*)
- Admin layout (.admin-layout, .admin-sidebar, .admin-nav-*, etc.)
- Mod queue (.mod-queue-*)
- Users list (.users-list, .user-list-*)
- Mobile nav (.mobile-nav-*)
- Tools selector (.tools-selector-*)
- GitHub requirement (.github-requirement-*)
- URL input (.url-input-*)
- Analysis progress (.analysis-*, .progress-step*)
- Tag editor (.tag-editor-*, .tag, .tag-remove)
- Inline edit (.inline-edit-*)
- Utility classes (.flex, .items-center, .gap-*, etc.)
- Duplicate keyframes

**Kept (still used):**
- Skeleton animation and variants
- Empty state
- Project card styles
- Project details styles
- Score widget styles
- Modal styles
- Draft review / form styles
- Admin page / revision styles
- User dropdown / auth styles
- Preview / editable styles
- Favorites page styles
- My projects page styles
- Error / not-found page styles
- Revision banner styles
- Screenshot editor styles
- Accessibility / reduced motion / print styles

### Dead Code Categories (All Removed in Phase 1)

All dead code has been removed. See "Removed" list above for details.

## Phase 2: Migrate Remaining Used Classes

**Status:** Not Started

These classes are actively used and need migration to Tailwind utilities.

### 2.1 Base Styles (body, a)

**Files affected:** None (already in theme.css)
**Action:** Remove duplicate body/a styles from globals.css

```css
/* REMOVE - duplicates theme.css @layer base */
body { ... }
a { ... }
a:hover { ... }
```

### 2.2 Layout Classes

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `container` | 7 files | Replace with `max-w-[var(--app-container-max)] mx-auto px-4` |
| `main` | 2 files | Replace with Tailwind utilities |
| `header` | 10 files | Keep `.header` styles in Header component or use Tailwind |

**Files to update:**
- [ ] Check each file using `container` class
- [ ] Check each file using `main` class
- [ ] `Header.tsx` - evaluate if `.header` CSS needed

### 2.3 Project Components

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `project-details` | 2 files | Convert grid layout to Tailwind |
| `project-details-header` | 2 files | `grid grid-cols-2 gap-8` |
| `project-details-info` | 1 file | Tailwind utilities |
| `project-details-media` | 1 file | `w-full` |
| `project-details-image` | 1 file | `w-full aspect-[16/10] object-cover rounded-lg bg-bg-secondary` |
| `project-details-tagline` | 1 file | `text-muted text-lg mb-4` |
| `project-details-author` | 1 file | `flex items-center gap-2 mb-3` |
| `project-details-meta` | 1 file | `text-xs text-muted flex flex-col gap-1 mb-6` |
| `project-details-links` | 1 file | `flex flex-wrap gap-3` |
| `project-details-body` | 1 file | `grid grid-cols-[1fr_300px] gap-8` |
| `project-details-main` | 1 file | `min-w-0` |
| `project-details-description` | 1 file | Tailwind utilities |
| `project-details-tools` | 1 file | `mt-6` |
| `project-details-sidebar` | 1 file | Responsive ordering |
| `project-page` | 1 file | `max-w-[900px] mx-auto` |
| `project-card` | 2 files | Border/padding/transition utilities |
| `project-card-header` | 1 file | `flex gap-4 mb-4` |
| `project-card-content` | 1 file | `flex-1 min-w-0` |
| `project-card-actions` | 1 file | `flex items-center gap-2` |

**Files to update:**
- [ ] `ProjectDetails.tsx`
- [ ] `EditableProject.tsx`
- [ ] `EditableProjectPreview.tsx`
- [ ] `ProjectCard.tsx`

### 2.4 Modal Components

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `modal` | 5 files | Keep as component CSS or convert to Tailwind |
| `modal-content` | 3 files | `p-6` |
| `modal-header` | - | `flex items-center justify-between mb-4` |
| `modal-title` | - | `text-xl font-semibold` |
| `modal-close` | - | Button styling |
| `modal-body` | - | `text-fg` |
| `login-modal` | 1 file | Tailwind utilities |
| `login-modal-description` | 1 file | `text-muted mb-6 text-center` |
| `login-modal-buttons` | 1 file | `flex flex-col gap-3` |
| `login-modal-btn` | 1 file | Button + width utilities |
| `login-modal-note` | 1 file | `text-xs text-muted text-center mt-6` |
| `delete-modal-content` | 2 files | `max-w-[400px]` |
| `delete-modal-actions` | 2 files | `flex gap-3 justify-end mt-4 pt-4 border-t border-border` |
| `url-change-modal-content` | 1 file | Same as delete modal |
| `url-change-modal-actions` | 1 file | Same as delete modal |

**Files to update:**
- [ ] `Modal.tsx` (UI component)
- [ ] `LoginModal.tsx`
- [ ] `DeleteProjectModal.tsx`
- [ ] `UrlChangeModal.tsx`

### 2.5 Form Components

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `form-field` | 2 files | `mb-4` + nested label/input styling |
| `form-section` | 1 file | `bg-bg-secondary border border-border rounded-lg p-6` |
| `form-actions` | 1 file | `flex gap-4 justify-end mt-8` |
| `draft-review-page` | 1 file | `p-6` |
| `draft-review-container` | 1 file | `max-w-[700px] mx-auto` |
| `draft-review-header` | 1 file | `mb-6` |
| `draft-review-section` | 1 file | `mb-6 pb-6 border-b border-border` |
| `draft-review-error` | 1 file | `mb-4` |
| `draft-review-actions` | 1 file | `flex flex-col gap-3` |
| `draft-review-loading` | 1 file | `text-center p-8` |

**Files to update:**
- [ ] `DraftReview.tsx`
- [ ] Any files using `form-field`

### 2.6 Admin/Revision Components

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `admin-page` | 2 files | Tailwind utilities |
| `admin-page-description` | - | `text-muted mb-6` |
| `revision-item` | 1 file | Card styling |
| `revision-header` | 1 file | `flex justify-between items-center mb-4` |
| `revision-time` | 1 file | `text-xs text-muted` |
| `revision-changes` | 1 file | `flex flex-col gap-3` |
| `revision-field` | 1 file | `p-3 bg-bg rounded-md` |
| `revision-new-value` | 1 file | `text-sm` |
| `revision-description` | 1 file | `max-h-[150px] overflow-y-auto whitespace-pre-wrap` |
| `revision-actions` | 1 file | `flex gap-2 pt-4 mt-4 border-t border-border` |
| `revisions-list` | 1 file | `flex flex-col gap-4 mt-6` |

**Files to update:**
- [ ] `admin/page.tsx`
- [ ] `admin/revisions/page.tsx`

### 2.7 Preview/Editing Components

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `project-preview-container` | 1 file | `max-w-[900px] mx-auto p-4` |
| `preview-banner` | 1 file | `bg-accent/10 border border-accent-dim rounded-md p-3 mb-6 text-center` |
| `preview-mode` | 2 files | Modifier class for project-details |
| `preview-actions` | 1 file | `flex gap-3 justify-center mt-6 pt-6 border-t border-border` |
| `preview-error` | 1 file | `my-4 p-3 bg-danger/10 border border-danger rounded-md` |
| `preview-url-editors` | 1 file | `mt-6 p-4 bg-bg-secondary border border-border rounded-md` |
| `editable-field` | 2 files | Complex hover/focus states |
| `edit-project-header` | 1 file | `flex justify-between items-center mb-4 pb-4 border-b border-border` |
| `edit-project-loading` | 1 file | `max-w-[900px] mx-auto p-4` |
| `edit-header-left` | 1 file | `flex items-center` |
| `edit-header-right` | 1 file | `flex items-center gap-3` |

**Files to update:**
- [ ] `EditableProject.tsx`
- [ ] `EditableProjectPreview.tsx`

### 2.8 Loading States

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `skeleton` | 7 files | Keep - has shimmer animation |
| `skeleton-text` | 3 files | `h-4 w-full` + skeleton base |
| `skeleton-image` | 1 file | `w-[120px] h-[80px]` + skeleton base |
| `skeleton-avatar` | 1 file | `w-8 h-8 rounded-full` + skeleton base |
| `skeleton-title` | - | `h-6 w-3/5` + skeleton base |
| `skeleton-tagline` | - | `h-4 w-4/5` + skeleton base |
| `empty-state` | 7 files | `text-center p-12 text-muted` |

**Decision:** Keep skeleton animation in theme.css `@layer components`

### 2.9 Score Widget

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `score-widget` | 2 files | `bg-bg-secondary border border-border rounded-lg p-6` |
| `score-widget-section` | 2 files | `mb-6 last:mb-0` |
| `score-channels` | 2 files | `flex flex-col gap-4` |
| `score-channel-row` | 2 files | `flex items-center gap-3` |

**Files to update:**
- [ ] `ScoreWidget.tsx`

### 2.10 User Menu

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `auth-buttons` | 1 file | `relative` + flex utilities |
| `user-menu-trigger` | 1 file | Button styling with avatar |
| `user-dropdown` | 1 file | `absolute top-full right-0 mt-2 min-w-[180px] bg-bg-secondary border border-border rounded-lg shadow-lg z-[1000]` |
| `user-dropdown-item` | 1 file | `flex items-center gap-3 w-full px-4 py-3 text-sm hover:bg-border` |
| `user-dropdown-divider` | 1 file | `h-px bg-border my-1` |

**Files to update:**
- [ ] `AuthButtons.tsx`

### 2.11 My Projects Page

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `my-projects-page` | 1 file | `max-w-[900px] mx-auto p-4` |
| `my-projects-header` | 1 file | `flex justify-between items-start mb-6 gap-4` |
| `my-projects-description` | 1 file | `text-muted mt-2` |
| `my-projects-list` | 1 file | `flex flex-col gap-3` |
| `my-project-card` | 1 file | Card styling |
| `my-project-card-image` | 1 file | `shrink-0 w-[100px] h-[75px] rounded-sm overflow-hidden bg-bg` |
| `my-project-card-content` | 1 file | `flex-1 min-w-0` |
| `my-project-card-header` | 1 file | `flex items-center gap-2 mb-1` |
| `my-project-card-title` | 1 file | `font-semibold truncate` |
| `my-project-card-tagline` | 1 file | `text-muted text-sm line-clamp-2` |
| `my-project-card-meta` | 1 file | `flex gap-3 text-xs text-muted` |
| `my-project-card-actions` | 1 file | `flex gap-2 shrink-0` |

**Files to update:**
- [ ] `my/page.tsx`

### 2.12 Other Pages

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `favorites-page` | 1 file | `py-8` |
| `favorites-header` | 1 file | `mb-8` |
| `favorites-description` | 1 file | `text-muted` |
| `favorite-btn` | 1 file | `p-2` |
| `not-found-page` | 1 file | `flex items-center justify-center min-h-[calc(100vh-200px)] p-8` |
| `not-found-content` | 1 file | `text-center` |
| `error-page` | 1 file | Same as not-found-page |
| `error-content` | 1 file | `text-center max-w-[480px]` |
| `error-actions` | 1 file | `flex gap-3 justify-center` |
| `error-details` | 1 file | `mt-8 text-left p-4 bg-bg-secondary rounded-lg text-xs` |

**Files to update:**
- [ ] `favorites/page.tsx`
- [ ] `not-found.tsx`
- [ ] `error.tsx`

### 2.13 Revision Status Banner

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `revision-banner` | 1 file | `p-4 rounded-md mb-4` |
| `revision-banner-pending` | 1 file | `bg-warning/10 border border-warning` |
| `revision-banner-rejected` | 1 file | `bg-danger/10 border border-danger` |
| `revision-banner-header` | 1 file | `flex gap-3 items-start` |
| `revision-banner-icon` | 1 file | `shrink-0 mt-0.5` |
| `revision-banner-content` | 1 file | `flex-1` |
| `revision-banner-title` | 1 file | `font-semibold mb-1` |
| `revision-banner-subtitle` | 1 file | `text-muted text-sm` |
| `revision-banner-dismiss` | 1 file | Button styling |
| `revision-banner-toggle` | 1 file | Button styling |
| `revision-banner-details` | 1 file | `mt-3 pt-3 border-t border-white/10` |
| `revision-banner-fields` | 1 file | List styling |
| `revision-banner-reason` | 1 file | `mb-3` |
| `revision-banner-timestamp` | 1 file | `text-xs text-muted` |

**Files to update:**
- [ ] `RevisionStatusBanner.tsx`

### 2.14 Screenshot Editor

| Class | Usage | Migration Strategy |
|-------|-------|-------------------|
| `screenshot-editor` | 1 file | `flex flex-col gap-3` |
| `screenshot-editor-preview` | 1 file | `w-full aspect-video overflow-hidden rounded-md bg-bg-secondary` |
| `screenshot-editor-image` | 1 file | `w-full h-full object-cover` |
| `screenshot-editor-actions` | 1 file | `flex gap-2` |
| `screenshot-editor-error` | 1 file | `text-danger text-sm` |
| `screenshot-editor-hint` | 1 file | `text-muted text-xs` |

**Files to update:**
- [ ] `ScreenshotEditor.tsx`

### 2.15 Utility Classes (Duplicate Tailwind)

**Action:** Remove entirely - these duplicate Tailwind utilities:
```css
.flex { display: flex; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.text-center { text-align: center; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-4 { gap: 1rem; }
.text-muted { color: var(--muted); }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mb-4 { margin-bottom: 1rem; }
```

### 2.16 Keyframes & Animations

**Action:** Move to theme.css `@layer components` or animations.css:
- `@keyframes spin` (duplicate - keep one)
- `@keyframes shimmer` (for skeleton)
- `@keyframes slideIn` (for toast)
- `@keyframes slideInRight` (for mobile nav)
- `@keyframes pulse` (for loading states)

### 2.17 Media Queries

**Action:** Convert responsive styles to Tailwind responsive prefixes:
- `@media (max-width: 768px)` → `md:` breakpoint
- `@media (max-width: 640px)` → `sm:` breakpoint

### 2.18 Accessibility & Print

**Action:** Move to theme.css `@layer base`:
```css
:focus-visible { ... }
.visually-hidden { ... }
@media (prefers-reduced-motion: reduce) { ... }
@media print { ... }
```

## Phase 3: Component-by-Component Migration

**Status:** Not Started

Work through each component file, replacing CSS classes with Tailwind utilities.

### Migration Order (by impact)

1. [ ] **Layout components** - Header.tsx, layout.tsx
2. [ ] **Project components** - ProjectCard.tsx, ProjectDetails.tsx
3. [ ] **Modal components** - Modal.tsx, LoginModal.tsx, DeleteProjectModal.tsx
4. [ ] **Form components** - DraftReview.tsx
5. [ ] **Admin components** - admin/page.tsx, admin/revisions/page.tsx
6. [ ] **Preview components** - EditableProject.tsx, EditableProjectPreview.tsx
7. [ ] **Page components** - favorites/page.tsx, my/page.tsx, not-found.tsx, error.tsx
8. [ ] **Other components** - ScoreWidget.tsx, RevisionStatusBanner.tsx, ScreenshotEditor.tsx, AuthButtons.tsx

## Phase 4: Move Shared Styles to theme.css

**Status:** Not Started

Some styles should live in theme.css `@layer components`:

```css
@layer components {
  /* Skeleton animation */
  .skeleton {
    background: linear-gradient(
      90deg,
      var(--border) 25%,
      var(--background-secondary) 50%,
      var(--border) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 0.25rem;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
}
```

## Phase 5: Cleanup

**Status:** Not Started

- [ ] Delete globals.css
- [ ] Update app.css to remove `@import "./globals.css"`
- [ ] Run full build to catch any missing styles
- [ ] Visual QA of all pages
- [ ] Update AGENTS.md with new CSS guidelines

## Verification Checklist

After migration, verify these pages work correctly:

- [ ] Home page (feed)
- [ ] Project detail page (`/p/[slug]`)
- [ ] Submit page (`/submit`)
- [ ] Draft review page
- [ ] Edit project page (`/p/[slug]/edit`)
- [ ] My projects page (`/my`)
- [ ] Favorites page (`/favorites`)
- [ ] Settings pages (`/settings/*`)
- [ ] Admin pages (`/admin/*`)
- [ ] 404 page
- [ ] Error page
- [ ] Login modal
- [ ] Mobile navigation
- [ ] All responsive breakpoints

## Notes

- Keep CSS variables in theme.css - they enable theming
- Use Tailwind arbitrary values `[var(--name)]` for CSS variable references
- Prefer Tailwind utilities over custom CSS
- Only add to `@layer components` for truly reusable patterns (skeleton, etc.)

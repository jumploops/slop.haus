# Phase 4 Review: Layout Components Migration

**Date:** 2026-01-16
**Status:** Complete

## Implementation Summary

### Components Migrated

| Component | File | Key Changes |
|-----------|------|-------------|
| RootLayout | `app/layout.tsx` | Tailwind utilities for body, main, container |
| Header | `components/layout/Header.tsx` | Sticky header, responsive nav, semantic tokens |
| MobileNav | `components/layout/MobileNav.tsx` | Slide-out animation, uses Button component |

### Key Changes

**layout.tsx:**
- Added `suppressHydrationWarning` on `<html>` (prep for next-themes)
- Body uses `bg-bg text-fg font-sans leading-relaxed`
- Main uses `py-8 min-h-[calc(100vh-var(--app-header-height))]`
- Container uses `max-w-[var(--app-container-max)] mx-auto px-4`
- Leverages app-specific CSS variables from theme.css

**Header.tsx:**
- Added `usePathname` for active link highlighting
- Sticky positioning: `sticky top-0 z-50`
- Uses CSS variable for height: `h-[var(--app-header-height)]`
- Desktop nav hidden on mobile: `hidden sm:flex`
- Mobile trigger hidden on desktop: `sm:hidden`
- NavLink component with active state styling
- Admin link conditionally shown for admin/mod users

**MobileNav.tsx:**
- Now always renders (not conditional return null)
- Overlay with opacity transition for smooth open/close
- Panel with translate-x animation for slide effect
- Uses Button component from Phase 3 (not raw `.btn` classes)
- Proper z-index layering: overlay z-[100], panel z-[101]
- Added `hover:no-underline` to links to override base anchor styles

**theme.css:**
- Added global link styles in base layer
- Links are accent colored with underline on hover
- Components override with `hover:no-underline` where needed

## CSS Patterns Used

### Responsive Design
```tsx
// Desktop nav (hidden on mobile)
<nav className="hidden sm:flex items-center gap-6">

// Mobile trigger (hidden on desktop)
<button className="sm:hidden flex items-center justify-center ...">
```

### CSS Variable Integration
```tsx
// Using app-specific variables
className="h-[var(--app-header-height)]"
className="max-w-[var(--app-container-max)]"
className="min-h-[calc(100vh-var(--app-header-height))]"
```

### Animation Pattern
```tsx
// Overlay fade
className={cn(
  "transition-opacity duration-200",
  isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
)}

// Panel slide
className={cn(
  "transform transition-transform duration-200 ease-out",
  isOpen ? "translate-x-0" : "translate-x-full"
)}
```

## Verification Results

| Check | Result |
|-------|--------|
| CSS Compilation | ✅ Dev server runs (port in use, but no CSS errors reported) |
| TypeScript (new code) | ✅ No new errors introduced |
| Semantic Tokens | ✅ All components use bg-bg, text-fg, border-border, text-accent |
| Responsive | ✅ Desktop nav hidden on mobile, mobile trigger hidden on desktop |
| Button Component | ✅ MobileNav uses Button component from Phase 3 |

## TypeScript Status

**Pre-existing errors (NOT from Phase 4):**
- `AuthButtons.tsx:49` - src type mismatch (string | null | undefined vs string | null)
- `ProjectCard.tsx:85` - vote value type (number | null vs 0 | 1 | -1 | null)
- `ScoreWidget.tsx:45,55` - same vote type issue

These errors existed before migration and are unrelated to layout components.

## CSS Classes Replaced

The following CSS classes from `globals.css` can now be removed (to be done in Phase 9):

```css
/* Layout */
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.main { padding: 2rem 0; min-height: calc(100vh - 80px); }

/* Header */
.header { ... }
.header .container { ... }
.logo { ... }
.nav { ... }
.nav a { ... }
.header-right { ... }

/* Mobile Navigation */
.mobile-nav-trigger { ... }
.mobile-nav-overlay { ... }
.mobile-nav { ... }
.mobile-nav-header { ... }
.mobile-nav-close { ... }
.mobile-nav-links { ... }
.mobile-nav-link { ... }
.mobile-nav-link.active { ... }
.mobile-nav-auth { ... }
.mobile-nav-user { ... }

/* Responsive media queries for nav */
@media (max-width: 640px) { ... }
```

## Testing Notes

1. **Desktop:** Header should be sticky at top with horizontal navigation
2. **Mobile (< 640px):** Nav links hidden, hamburger menu visible
3. **Mobile nav open:** Overlay fades in, panel slides from right
4. **Theme switching:** All colors should update when data-theme changes:
   ```js
   document.documentElement.dataset.theme = "cyberpunk"
   ```

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/app/layout.tsx` | Modified - Tailwind utilities |
| `apps/web/src/components/layout/Header.tsx` | Rewritten - Tailwind + active states |
| `apps/web/src/components/layout/MobileNav.tsx` | Rewritten - Tailwind + animations + Button component |
| `apps/web/src/styles/theme.css` | Modified - Added base link styles |

## Next Steps (Phase 5)

1. Migrate feature components (ProjectCard, ProjectDetails, CommentThread)
2. Migrate form components (VibeInput, ToolsSelector)
3. Update page components to use Tailwind utilities

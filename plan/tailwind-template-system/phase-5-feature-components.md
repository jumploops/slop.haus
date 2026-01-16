# Phase 5: Migrate Feature Components

**Status:** Not Started

## Overview

Migrate all remaining feature-specific components to Tailwind utilities. This is the largest phase, covering project display, comments, forms, settings, and admin pages.

## Component Groups

### Group A: Project Display (Priority: High)
| Component | File | CSS Lines |
|-----------|------|-----------|
| ProjectCard | `components/project/ProjectCard.tsx` | ~70 |
| ProjectDetails | `components/project/ProjectDetails.tsx` | ~100 |
| VibeMeter | `components/project/VibeMeter.tsx` | ~25 |
| VoteButtons | `components/project/VoteButtons.tsx` | ~40 |
| ScoreWidget | `components/project/ScoreWidget.tsx` | ~50 |

### Group B: Comments
| Component | File | CSS Lines |
|-----------|------|-----------|
| CommentThread | `components/comment/CommentThread.tsx` | ~20 |
| CommentItem | `components/comment/CommentItem.tsx` | ~50 |
| CommentForm | `components/comment/CommentForm.tsx` | ~30 |

### Group C: Forms & Submit
| Component | File | CSS Lines |
|-----------|------|-----------|
| VibeInput | `components/form/VibeInput.tsx` | ~100 |
| ToolsSelector | `components/form/ToolsSelector.tsx` | ~60 |
| UrlInput | `components/submit/UrlInput.tsx` | ~40 |
| AnalysisProgress | `components/submit/AnalysisProgress.tsx` | ~50 |
| InlineEditTextarea | `components/submit/InlineEditTextarea.tsx` | ~30 |

### Group D: Settings Pages
| Component | File | CSS Lines |
|-----------|------|-----------|
| Settings Layout | `app/settings/layout.tsx` | ~50 |
| Profile Page | `app/settings/profile/page.tsx` | ~40 |
| Connections Page | `app/settings/connections/page.tsx` | ~50 |

### Group E: Admin Pages
| Component | File | CSS Lines |
|-----------|------|-----------|
| Admin Layout | `app/admin/layout.tsx` | ~50 |
| Mod Queue | `app/admin/page.tsx` | ~80 |
| Users Page | `app/admin/users/page.tsx` | ~40 |
| Revisions Page | `app/admin/revisions/page.tsx` | ~60 |

### Group F: Edit/Preview
| Component | File | CSS Lines |
|-----------|------|-----------|
| EditableProject | `components/project/EditableProject.tsx` | ~100 |
| ScreenshotEditor | `components/project/ScreenshotEditor.tsx` | ~40 |
| DeleteProjectModal | `components/project/DeleteProjectModal.tsx` | ~20 |
| UrlChangeModal | `components/project/UrlChangeModal.tsx` | ~20 |

## Prerequisites

- Phase 4 complete (Layout components migrated)
- All UI primitives using Tailwind

## Migration Strategy

Migrate one group at a time, in order A → F. Within each group, migrate components in dependency order (leaf components first).

## Tasks

### 5.1 ProjectCard Component

**Current CSS classes:**
- `.project-card` - Card container
- `.project-card-header` - Thumbnail + content layout
- `.project-card-thumbnail` - Image styling
- `.project-card-content` - Title/tagline area
- `.project-card-footer` - Meta + actions
- `.project-card .tagline`, `.project-card .meta`

**Migrated implementation:**

```tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { VibeMeter } from "./VibeMeter";
import { VoteButtons } from "./VoteButtons";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function ProjectCard({ project, channel = "normal", showFavoriteButton, onFavoriteChange }: ProjectCardProps) {
  // ... hooks

  return (
    <article className="border border-border rounded-lg p-6 mb-4 bg-bg hover:border-accent-dim transition-colors">
      {/* Header: Thumbnail + Content */}
      <div className="flex gap-4 mb-4">
        <Link href={`/p/${project.slug}`}>
          <img
            src={thumbnailUrl}
            alt={project.title}
            className="w-[120px] h-[80px] rounded object-cover bg-bg-secondary flex-shrink-0"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="mb-1">
            <Link href={`/p/${project.slug}`} className="text-fg hover:text-accent no-underline">
              {project.title}
            </Link>
          </h3>
          <p className="text-muted text-sm mb-2">{project.tagline}</p>
          <VibeMeter percent={project.vibePercent} size="sm" />
        </div>
      </div>

      {/* Footer: Meta + Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex gap-6 text-sm text-muted flex-wrap">
          <span className="flex items-center gap-2">
            <Avatar src={project.author.image} alt={project.author.name} size="sm" />
            <span>{project.author.name}</span>
            {project.author.devVerified && <Badge variant="dev">Dev</Badge>}
          </span>
          <span>{formatRelativeTime(project.createdAt)}</span>
          <span>{project.commentCount} comments</span>
        </div>
        <div className="flex items-center gap-2">
          {showFavoriteButton && (
            <Button variant={isFavorited ? "secondary" : "ghost"} onClick={toggleFavorite} disabled={favoriteLoading}>
              <HeartIcon filled={isFavorited} />
            </Button>
          )}
          <VoteButtons score={score} currentVote={currentVote} onVote={(v) => submitVote(channel, v)} disabled={isVoting} />
        </div>
      </div>
    </article>
  );
}
```

### 5.2 VibeMeter Component

```tsx
import { cn } from "@/lib/utils";

interface VibeMeterProps {
  percent: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function VibeMeter({ percent, size = "md", showLabel = false }: VibeMeterProps) {
  return (
    <div>
      <div
        className={cn(
          "w-full bg-border rounded overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-accent-dim to-accent rounded transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Vibe</span>
          <span>{percent}%</span>
        </div>
      )}
    </div>
  );
}
```

### 5.3 VoteButtons Component

```tsx
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  score: number;
  currentVote: 1 | -1 | null;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function VoteButtons({ score, currentVote, onVote, disabled, size = "md" }: VoteButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded transition-colors",
          size === "sm" ? "w-7 h-7" : "w-8 h-8",
          "bg-transparent border-none cursor-pointer",
          "text-muted hover:bg-border hover:text-fg",
          currentVote === 1 && "text-accent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Upvote"
      >
        <UpArrowIcon />
      </button>

      <span
        className={cn(
          "min-w-[2rem] text-center text-sm font-medium",
          score > 0 && "text-accent",
          score < 0 && "text-danger"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded transition-colors",
          size === "sm" ? "w-7 h-7" : "w-8 h-8",
          "bg-transparent border-none cursor-pointer",
          "text-muted hover:bg-border hover:text-fg",
          currentVote === -1 && "text-danger",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Downvote"
      >
        <DownArrowIcon />
      </button>
    </div>
  );
}
```

### 5.4 Comment Components

**CommentItem:**
```tsx
export function CommentItem({ comment, onReply, onDelete }: CommentItemProps) {
  return (
    <div className="p-4 bg-bg-secondary rounded-lg border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={comment.author.image} alt={comment.author.name} size="sm" />
        <span className="font-medium">{comment.author.name}</span>
        <span className="text-muted text-xs">{formatRelativeTime(comment.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed">{comment.body}</p>
      <div className="flex gap-4 mt-3">
        <button className="text-xs text-muted hover:text-fg bg-transparent border-none cursor-pointer">
          Reply
        </button>
      </div>
    </div>
  );
}
```

### 5.5 Settings Layout

```tsx
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-[200px_1fr] gap-8 py-8 min-h-[calc(100vh-200px)] md:grid-cols-1">
      <aside className="border-r border-border pr-8 md:border-r-0 md:border-b md:pr-0 md:pb-4">
        <h2 className="text-xl mb-4">Settings</h2>
        <nav className="flex flex-col gap-1 md:flex-row md:flex-wrap">
          <SettingsNavItem href="/settings/profile" active={pathname === "/settings/profile"}>
            Profile
          </SettingsNavItem>
          <SettingsNavItem href="/settings/connections" active={pathname === "/settings/connections"}>
            Connections
          </SettingsNavItem>
        </nav>
      </aside>
      <main className="max-w-[600px]">{children}</main>
    </div>
  );
}

function SettingsNavItem({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 rounded-md text-muted transition-colors",
        "hover:text-fg hover:bg-bg-secondary",
        active && "text-fg bg-bg-secondary"
      )}
    >
      {children}
    </Link>
  );
}
```

### 5.6 Admin Layout

Similar pattern to Settings Layout, but with danger accent for admin indicator.

## CSS Cleanup

After each component group migration, remove corresponding CSS from `globals.css`. Track progress:

| Group | CSS Lines | Status |
|-------|-----------|--------|
| A: Project Display | ~285 | Pending |
| B: Comments | ~100 | Pending |
| C: Forms & Submit | ~280 | Pending |
| D: Settings | ~140 | Pending |
| E: Admin | ~230 | Pending |
| F: Edit/Preview | ~350 | Pending |

## Verification Checklist

For each component:
- [ ] Visual appearance matches original
- [ ] Interactive states (hover, focus, active) work
- [ ] Responsive behavior preserved
- [ ] Theme colors apply correctly
- [ ] No TypeScript errors
- [ ] No console warnings

## Files Changed

| Group | Files |
|-------|-------|
| A | `ProjectCard.tsx`, `ProjectDetails.tsx`, `VibeMeter.tsx`, `VoteButtons.tsx`, `ScoreWidget.tsx` |
| B | `CommentThread.tsx`, `CommentItem.tsx`, `CommentForm.tsx` |
| C | `VibeInput.tsx`, `ToolsSelector.tsx`, `UrlInput.tsx`, `AnalysisProgress.tsx`, `InlineEditTextarea.tsx` |
| D | `settings/layout.tsx`, `settings/profile/page.tsx`, `settings/connections/page.tsx` |
| E | `admin/layout.tsx`, `admin/page.tsx`, `admin/users/page.tsx`, `admin/revisions/page.tsx` |
| F | `EditableProject.tsx`, `ScreenshotEditor.tsx`, `DeleteProjectModal.tsx`, `UrlChangeModal.tsx` |

## Notes

### Responsive Patterns

Use Tailwind's responsive prefixes consistently:
- `sm:` - 640px+ (tablet+)
- `md:` - 768px+ (desktop)
- `lg:` - 1024px+ (large desktop)

Default styles are mobile-first.

### Complex Layouts

For grid layouts with CSS variable values, use arbitrary values:
```tsx
className="grid-cols-[var(--app-grid-cols)]"
className="max-w-[var(--app-container-max)]"
```

### Form Styling

VibeInput and ToolsSelector have complex interactive states. Test thoroughly:
- Slider thumb styling
- Dropdown positioning
- Tag chips appearance
- Focus states

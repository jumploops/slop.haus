# Phase 4: Migrate Layout Components

**Status:** Not Started

## Overview

Migrate the app shell and layout components to Tailwind utilities. These components wrap all page content and establish the visual foundation.

## Components to Migrate

| Component | File | Description |
|-----------|------|-------------|
| Header | `components/layout/Header.tsx` | Sticky nav bar |
| MobileNav | `components/layout/MobileNav.tsx` | Slide-out mobile menu |
| RootLayout | `app/layout.tsx` | Main/container wrappers |

## Prerequisites

- Phase 3 complete (UI primitives migrated)
- Button, Avatar, Badge components using Tailwind

## Tasks

### 4.1 Layout Container Classes

**Current CSS (`globals.css`):**
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
}
```

**Migration approach:** Use app-specific CSS variables with Tailwind arbitrary values.

**File:** `apps/web/src/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeHydrationScript }} />
      </head>
      <body className="bg-bg text-fg font-sans leading-relaxed">
        <Providers>
          <Header />
          <main className="py-8 min-h-[calc(100vh-80px)]">
            <div className="max-w-[var(--app-container-max)] mx-auto px-4">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
```

### 4.2 Header Component

**Current CSS classes used:**
- `.header` - Sticky positioning, border, background
- `.header .container` - Flex layout
- `.logo` - Brand styling
- `.nav` - Navigation links
- `.header-right` - Auth buttons area

**File:** `apps/web/src/components/layout/Header.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { MobileNav } from "./MobileNav";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-100 bg-bg border-b border-border">
      <div className="max-w-[var(--app-container-max)] mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-accent hover:no-underline"
        >
          slop.haus
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex gap-6">
          <NavLink href="/" active={pathname === "/"}>
            Feed
          </NavLink>
          <NavLink href="/submit" active={pathname === "/submit"}>
            Submit
          </NavLink>
          <NavLink href="/favorites" active={pathname === "/favorites"}>
            Favorites
          </NavLink>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <AuthButtons />
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-fg hover:text-accent transition-colors duration-200",
        active && "text-accent"
      )}
    >
      {children}
    </Link>
  );
}
```

### 4.3 MobileNav Component

**Current CSS classes used:**
- `.mobile-nav-trigger` - Hamburger button
- `.mobile-nav-overlay` - Dark backdrop
- `.mobile-nav` - Slide-out panel
- `.mobile-nav-header`, `.mobile-nav-close`
- `.mobile-nav-links`, `.mobile-nav-link`
- `.mobile-nav-auth`

**File:** `apps/web/src/components/layout/MobileNav.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/AuthButtons";
import { authClient } from "@/lib/auth-client";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger button - only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "sm:hidden flex items-center justify-center",
          "w-10 h-10 rounded-md",
          "bg-transparent hover:bg-border",
          "text-fg"
        )}
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed top-0 right-0 bottom-0 w-[280px] max-w-full",
          "bg-bg border-l border-border z-201",
          "flex flex-col",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-lg font-bold text-accent">slop.haus</span>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-8 h-8 rounded text-muted hover:text-fg hover:bg-border"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <MobileNavLink href="/" active={pathname === "/"}>
            Feed
          </MobileNavLink>
          <MobileNavLink href="/submit" active={pathname === "/submit"}>
            Submit
          </MobileNavLink>
          <MobileNavLink href="/favorites" active={pathname === "/favorites"}>
            Favorites
          </MobileNavLink>
          {session?.user && (
            <>
              <MobileNavLink href="/my/projects" active={pathname === "/my/projects"}>
                My Projects
              </MobileNavLink>
              <MobileNavLink href="/settings" active={pathname.startsWith("/settings")}>
                Settings
              </MobileNavLink>
            </>
          )}
        </nav>

        {/* Auth section */}
        <div className="p-4 border-t border-border">
          <AuthButtons />
        </div>
      </div>
    </>
  );
}

function MobileNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "block px-4 py-3 rounded-md transition-colors",
        active
          ? "bg-border text-accent"
          : "text-fg hover:bg-border"
      )}
    >
      {children}
    </Link>
  );
}

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
```

### 4.4 Global Link Styles

**Current CSS:**
```css
a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

**Migration:** Add to `theme.css` base layer or keep in a minimal `base.css`:

```css
/* In theme.css after @theme block */
@layer base {
  a {
    @apply text-accent no-underline hover:underline;
  }
}
```

**Or use Tailwind's `@apply` in a custom base:**
```css
@layer base {
  body {
    @apply bg-bg text-fg font-sans leading-relaxed;
  }

  a {
    @apply text-accent;
  }

  a:hover {
    @apply underline;
  }
}
```

## CSS Cleanup

After migration, remove from `globals.css`:

```css
/* Layout */
.container { ... }
.header { ... }
.header .container { ... }
.logo { ... }
.nav { ... }
.nav a { ... }
.main { ... }

/* Mobile Navigation */
.header-right { ... }
.mobile-nav-trigger { ... }
.mobile-nav-overlay { ... }
.mobile-nav { ... }
.mobile-nav-header { ... }
.mobile-nav-close { ... }
.mobile-nav-links { ... }
.mobile-nav-link { ... }
.mobile-nav-auth { ... }
.mobile-nav-user { ... }

/* Responsive rules for nav */
@media (max-width: 640px) {
  .nav { display: none; }
  .mobile-nav-trigger { display: flex; }
  .auth-buttons { display: none; }
}
```

## Verification Checklist

- [ ] Header renders correctly on desktop
- [ ] Header renders correctly on mobile
- [ ] Mobile nav opens/closes smoothly
- [ ] Navigation links highlight when active
- [ ] Logo links to home
- [ ] Auth buttons appear correctly
- [ ] Sticky header works on scroll
- [ ] Theme colors apply to header
- [ ] No layout shift on page load

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/app/layout.tsx` | Modify |
| `apps/web/src/components/layout/Header.tsx` | Rewrite |
| `apps/web/src/components/layout/MobileNav.tsx` | Rewrite |
| `apps/web/src/styles/theme.css` | Add base layer styles |
| `apps/web/src/app/globals.css` | Remove migrated classes |

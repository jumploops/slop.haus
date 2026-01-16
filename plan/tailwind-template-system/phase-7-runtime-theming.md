# Phase 7: Runtime Theme Switching

**Status:** Not Started

## Overview

Implement client-side theme management using **next-themes**, a battle-tested library for Next.js that handles:
- No-flash theme hydration
- localStorage persistence
- System preference detection
- SSR compatibility

## Why next-themes?

Instead of building a custom ThemeManager, we use `next-themes` because:
1. **Handles SSR flash** - Injects blocking script automatically
2. **System preference** - Detects `prefers-color-scheme` out of the box
3. **Maintained** - Active community, handles edge cases
4. **Simple API** - `useTheme()` hook with minimal setup

## Prerequisites

- Phase 1 complete (next-themes installed)
- Phase 6 complete (preset themes defined in `presets.css`)
- All components using semantic tokens

## Tasks

### 7.1 Create Theme Provider

**File:** `apps/web/src/components/theme/ThemeProvider.tsx`

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Available preset themes
export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "The classic slop.haus look" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan aesthetic" },
  { id: "warm", name: "Warm", description: "Cozy orange tones" },
  { id: "light", name: "Light", description: "High contrast light mode" },
  { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
  { id: "forest", name: "Forest", description: "Natural green tones" },
] as const;

export type PresetThemeId = (typeof PRESET_THEMES)[number]["id"];

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="default"
      themes={PRESET_THEMES.map((t) => t.id)}
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="slop-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
```

**Configuration options:**
- `attribute="data-theme"` - Sets `data-theme` attribute (matches our CSS)
- `defaultTheme="default"` - Fallback when no theme stored
- `themes` - List of valid theme names
- `enableSystem={false}` - Disable auto dark/light (we have custom themes)
- `storageKey` - localStorage key for persistence

### 7.2 Update Providers

**File:** `apps/web/src/app/providers.tsx`

```tsx
"use client";

import { SWRConfig } from "swr";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          dedupingInterval: 5000,
        }}
      >
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
```

### 7.3 Update Layout

**File:** `apps/web/src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import "./app.css";

export const metadata: Metadata = {
  title: "slop.haus",
  description: "Showcase for AI-built apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <main className="main">
            <div className="container">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
```

**Note:** `suppressHydrationWarning` on `<html>` is required because next-themes modifies it before React hydrates.

### 7.4 Create useThemePreset Hook

Wrapper around next-themes for our specific use case:

**File:** `apps/web/src/hooks/useThemePreset.ts`

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PRESET_THEMES, type PresetThemeId } from "@/components/theme/ThemeProvider";

const RUNTIME_STYLE_ID = "user-theme-styles";

export function useThemePreset() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Apply a preset theme
   */
  const applyPreset = (id: PresetThemeId) => {
    // Clear any user theme styles
    clearUserStyles();
    setTheme(id);
  };

  /**
   * Apply a user-generated theme (CSS variable overrides)
   * For LLM-generated themes, we inject a style tag and use a special theme ID
   */
  const applyUserTheme = (id: string, cssText: string) => {
    // Inject runtime styles
    let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = RUNTIME_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = cssText;

    // Set a user theme identifier (next-themes handles persistence)
    setTheme(`user:${id}`);
  };

  /**
   * Reset to default theme
   */
  const reset = () => {
    clearUserStyles();
    setTheme("default");
  };

  const clearUserStyles = () => {
    const style = document.getElementById(RUNTIME_STYLE_ID);
    if (style) style.remove();
  };

  // Derive current state
  const currentTheme = mounted ? theme : "default";
  const isUserTheme = currentTheme?.startsWith("user:");
  const currentPresetId = isUserTheme ? null : currentTheme;
  const currentPreset = PRESET_THEMES.find((t) => t.id === currentPresetId);

  return {
    // State
    theme: currentTheme,
    isUserTheme,
    currentPreset,
    presets: PRESET_THEMES,
    mounted,

    // Actions
    applyPreset,
    applyUserTheme,
    reset,
  };
}
```

### 7.5 Theme Switcher Component

**File:** `apps/web/src/components/theme/ThemeSwitcher.tsx`

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useThemePreset } from "@/hooks/useThemePreset";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, isUserTheme, currentPreset, presets, applyPreset, reset, mounted } = useThemePreset();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted">
        <PaletteIcon className="w-4 h-4" />
        <span>Theme</span>
      </button>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md",
          "text-sm text-muted hover:text-fg",
          "bg-transparent hover:bg-border",
          "border border-transparent hover:border-border",
          "transition-colors duration-200"
        )}
      >
        <PaletteIcon className="w-4 h-4" />
        <span>{isUserTheme ? "Custom" : currentPreset?.name || "Theme"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-bg-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <p className="text-xs text-muted px-2 py-1 uppercase tracking-wide">
              Presets
            </p>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  applyPreset(preset.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm",
                  "hover:bg-border transition-colors",
                  theme === preset.id && !isUserTheme
                    ? "text-accent"
                    : "text-fg"
                )}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="block text-xs text-muted">{preset.description}</span>
              </button>
            ))}
          </div>

          {isUserTheme && (
            <>
              <div className="border-t border-border" />
              <div className="p-2">
                <button
                  onClick={() => {
                    reset();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-muted hover:text-fg hover:bg-border"
                >
                  Reset to Default
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
      <circle cx="16" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
```

### 7.6 Add ThemeSwitcher to Header

**File:** `apps/web/src/components/layout/Header.tsx`

Add `<ThemeSwitcher />` to the header navigation, typically near the auth buttons.

```tsx
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

// In the header JSX:
<div className="flex items-center gap-4">
  <ThemeSwitcher />
  <AuthButtons />
</div>
```

## Handling User-Generated Themes

For LLM-generated themes (Phase 8), we need to handle themes that aren't in the preset list:

1. **Theme ID format**: User themes use `user:${id}` pattern
2. **CSS injection**: Styles are injected into a `<style id="user-theme-styles">` element
3. **Persistence**: next-themes handles localStorage, but we need to also persist the CSS

**Extended storage for user themes:**

```tsx
// When applying a user theme, also save the CSS
const saveUserTheme = (id: string, cssText: string) => {
  localStorage.setItem(`slop-user-theme:${id}`, cssText);
};

// On mount, restore user theme CSS if needed
useEffect(() => {
  if (theme?.startsWith("user:")) {
    const id = theme.replace("user:", "");
    const cssText = localStorage.getItem(`slop-user-theme:${id}`);
    if (cssText) {
      // Re-inject the styles
      applyUserTheme(id, cssText);
    }
  }
}, []);
```

## Verification Checklist

- [ ] Theme switcher appears in header
- [ ] Clicking preset applies theme instantly (no refresh)
- [ ] Theme persists across page refresh
- [ ] No flash of default theme on reload
- [ ] Reset returns to default theme
- [ ] Theme works with all migrated components
- [ ] Mobile nav also reflects theme changes
- [ ] Server-side rendering works (no hydration errors)

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/components/theme/ThemeProvider.tsx` | Create new |
| `apps/web/src/hooks/useThemePreset.ts` | Create new |
| `apps/web/src/components/theme/ThemeSwitcher.tsx` | Create new |
| `apps/web/src/app/providers.tsx` | Add ThemeProvider |
| `apps/web/src/app/layout.tsx` | Add suppressHydrationWarning |
| `apps/web/src/components/layout/Header.tsx` | Add ThemeSwitcher |

## Security Notes

For user-generated themes (Phase 8):
1. Only CSS custom property assignments allowed
2. No `url()`, `@import`, or arbitrary selectors
3. Server validates and sanitizes all CSS before returning
4. Client treats cssText as opaque string (no parsing)

## Comparison: next-themes vs Custom ThemeManager

| Feature | next-themes | Custom ThemeManager |
|---------|-------------|---------------------|
| Flash prevention | Built-in | Manual script |
| System preference | Built-in | Manual |
| SSR support | Yes | Requires care |
| localStorage | Automatic | Manual |
| Maintenance | Community | Us |
| Bundle size | ~2KB | ~1KB |
| User themes | Needs extension | Native |

**Verdict**: next-themes handles 90% of the complexity. We extend it slightly for user-generated theme support.

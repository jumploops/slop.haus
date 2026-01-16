# Phase 6: Preset Themes

**Status:** Not Started

## Overview

Define and test curated preset themes that ship with the app. These are static CSS variable overrides that apply instantly without any server interaction.

## Prerequisites

- Phases 1-5 complete (all components using semantic tokens)
- Theme variables defined in `@theme` block

## Theme Design Principles

1. **Maintain contrast ratios** - WCAG AA minimum (4.5:1 for text)
2. **Preserve semantic meaning** - Accent should still feel like "brand"
3. **Test all components** - Especially edge cases (badges, errors)
4. **Consider dark/light** - Not all themes need to be dark

## Tasks

### 6.1 Define Preset Themes

**CRITICAL**: Presets must override BASE variables (e.g., `--background`), NOT the `@theme inline` mapped variables (e.g., `--color-bg`). The two-layer pattern works because `@theme inline` preserves `var()` references - changing the base variable updates everything.

**File:** `apps/web/src/styles/presets.css`

```css
/* ============================================
   PRESET THEMES

   IMPORTANT: Override BASE variables from :root,
   NOT the @theme inline mapped variables.

   Base variables: --background, --foreground, --accent, etc.
   Mapped variables: --color-bg, --color-fg (DON'T override these)

   Applied via data-theme attribute on <html>.
   Using OKLCH for perceptual uniformity.
   ============================================ */

/* --------------------------------------------
   DEFAULT THEME
   The baseline design - no overrides needed.
   Included for explicitness and theme picker.
   -------------------------------------------- */
:root[data-theme="default"],
.theme-scope[data-theme="default"] {
  /* Uses base :root values as-is */
}

/* --------------------------------------------
   CYBERPUNK THEME
   Neon cyan on dark blue. Futuristic aesthetic.
   -------------------------------------------- */
:root[data-theme="cyberpunk"],
.theme-scope[data-theme="cyberpunk"] {
  /* Backgrounds */
  --background: oklch(0.05 0.02 250);
  --background-secondary: oklch(0.08 0.03 250);

  /* Text */
  --foreground: oklch(0.92 0.03 200);
  --muted: oklch(0.55 0.05 200);

  /* Borders */
  --border: oklch(0.2 0.04 250);

  /* Accent - neon cyan */
  --accent: oklch(0.85 0.2 180);
  --accent-dim: oklch(0.7 0.18 180);
  --accent-foreground: oklch(0.05 0 0);

  /* Semantic (keep danger/warning visible) */
  --danger: oklch(0.65 0.25 25);
  --warning: oklch(0.85 0.18 85);
  --success: oklch(0.85 0.2 180);

  /* Shape adjustments - sharper corners */
  --radius: 4px;
}

/* --------------------------------------------
   WARM THEME
   Orange accent on warm dark brown. Cozy feel.
   -------------------------------------------- */
:root[data-theme="warm"],
.theme-scope[data-theme="warm"] {
  /* Backgrounds */
  --background: oklch(0.12 0.02 60);
  --background-secondary: oklch(0.16 0.02 60);

  /* Text */
  --foreground: oklch(0.95 0.01 80);
  --muted: oklch(0.6 0.03 70);

  /* Borders */
  --border: oklch(0.28 0.03 60);

  /* Accent - warm orange */
  --accent: oklch(0.75 0.18 55);
  --accent-dim: oklch(0.65 0.16 55);
  --accent-foreground: oklch(0.12 0 0);

  /* Semantic */
  --danger: oklch(0.65 0.22 25);
  --warning: oklch(0.85 0.15 85);
  --success: oklch(0.7 0.18 160);
}

/* --------------------------------------------
   LIGHT THEME
   High contrast light mode. Clean and readable.
   -------------------------------------------- */
:root[data-theme="light"],
.theme-scope[data-theme="light"] {
  /* Backgrounds */
  --background: oklch(1 0 0);
  --background-secondary: oklch(0.97 0 0);

  /* Text */
  --foreground: oklch(0.15 0 0);
  --muted: oklch(0.45 0 0);

  /* Borders */
  --border: oklch(0.88 0 0);

  /* Accent (darker for contrast on white) */
  --accent: oklch(0.55 0.2 155);
  --accent-dim: oklch(0.45 0.18 155);
  --accent-foreground: oklch(1 0 0);

  /* Semantic */
  --danger: oklch(0.55 0.22 25);
  --warning: oklch(0.7 0.15 70);
  --success: oklch(0.55 0.18 155);
}

/* --------------------------------------------
   MIDNIGHT THEME
   Deep purple accent on near-black. Elegant.
   -------------------------------------------- */
:root[data-theme="midnight"],
.theme-scope[data-theme="midnight"] {
  /* Backgrounds */
  --background: oklch(0.08 0.01 280);
  --background-secondary: oklch(0.12 0.015 280);

  /* Text */
  --foreground: oklch(0.92 0.01 280);
  --muted: oklch(0.55 0.02 280);

  /* Borders */
  --border: oklch(0.22 0.02 280);

  /* Accent - purple */
  --accent: oklch(0.7 0.15 290);
  --accent-dim: oklch(0.6 0.18 290);
  --accent-foreground: oklch(0.08 0 0);

  /* Semantic */
  --danger: oklch(0.65 0.2 25);
  --warning: oklch(0.8 0.15 85);
  --success: oklch(0.7 0.18 160);
}

/* --------------------------------------------
   FOREST THEME
   Green accent on dark forest tones. Natural.
   -------------------------------------------- */
:root[data-theme="forest"],
.theme-scope[data-theme="forest"] {
  /* Backgrounds */
  --background: oklch(0.1 0.02 140);
  --background-secondary: oklch(0.14 0.025 140);

  /* Text */
  --foreground: oklch(0.92 0.02 140);
  --muted: oklch(0.55 0.04 140);

  /* Borders */
  --border: oklch(0.24 0.03 140);

  /* Accent - forest green */
  --accent: oklch(0.75 0.18 145);
  --accent-dim: oklch(0.6 0.16 145);
  --accent-foreground: oklch(0.1 0 0);

  /* Semantic */
  --danger: oklch(0.65 0.2 25);
  --warning: oklch(0.8 0.15 85);
  --success: oklch(0.75 0.18 145);
}
```

### 6.2 Update Theme Hook

**File:** `apps/web/src/hooks/useTheme.ts`

```ts
export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "The classic slop.haus look" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
  { id: "warm", name: "Warm", description: "Cozy orange tones" },
  { id: "light", name: "Light", description: "Clean light mode" },
  { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
  { id: "forest", name: "Forest", description: "Natural green tones" },
] as const;

export type PresetThemeId = (typeof PRESET_THEMES)[number]["id"];
```

### 6.3 Theme Preview Component

For testing themes in isolation:

**File:** `apps/web/src/components/theme/ThemePreview.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

interface ThemePreviewProps {
  themeId: string;
}

export function ThemePreview({ themeId }: ThemePreviewProps) {
  return (
    <div className="theme-scope p-6 rounded-lg border border-border bg-bg" data-theme={themeId}>
      <h3 className="text-lg font-bold mb-4 text-fg">Theme Preview</h3>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge>Default</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="dev">Dev</Badge>
      </div>

      {/* Input */}
      <div className="mb-4">
        <Input placeholder="Sample input..." />
      </div>

      {/* Card-like content */}
      <div className="p-4 bg-bg-secondary rounded-md border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Avatar alt="Test User" size="md" />
          <div>
            <p className="font-medium text-fg">Test User</p>
            <p className="text-sm text-muted">2 hours ago</p>
          </div>
        </div>
        <p className="text-fg">
          This is sample content to preview how text looks in this theme.
        </p>
        <p className="text-muted text-sm mt-2">
          Secondary text appears more muted.
        </p>
      </div>

      {/* Links and accents */}
      <div className="mt-4 text-sm">
        <a href="#" className="text-accent hover:underline">Accent link</a>
        <span className="text-muted mx-2">•</span>
        <span className="text-success">Success text</span>
        <span className="text-muted mx-2">•</span>
        <span className="text-warning">Warning text</span>
        <span className="text-muted mx-2">•</span>
        <span className="text-danger">Danger text</span>
      </div>
    </div>
  );
}
```

### 6.4 Theme Gallery Page (Development Only)

**File:** `apps/web/src/app/theme-gallery/page.tsx`

```tsx
import { PRESET_THEMES } from "@/hooks/useTheme";
import { ThemePreview } from "@/components/theme/ThemePreview";

export default function ThemeGalleryPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">Theme Gallery</h1>
      <p className="text-muted mb-8">Preview all available themes side by side.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PRESET_THEMES.map((theme) => (
          <div key={theme.id}>
            <h2 className="font-medium mb-2">{theme.name}</h2>
            <p className="text-sm text-muted mb-3">{theme.description}</p>
            <ThemePreview themeId={theme.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Verification Checklist

For each preset theme, verify:

### Visual Checks
- [ ] Background colors apply correctly
- [ ] Text is readable (sufficient contrast)
- [ ] Borders are visible but not harsh
- [ ] Accent color stands out appropriately
- [ ] Hover states are noticeable

### Component Checks
- [ ] Buttons (all variants)
- [ ] Badges (all variants)
- [ ] Inputs (normal, focus, error states)
- [ ] Modals
- [ ] Cards
- [ ] Avatars
- [ ] Navigation (header, mobile nav)

### Semantic Color Checks
- [ ] Success states visible
- [ ] Warning states visible
- [ ] Error/danger states visible
- [ ] Dev badges distinguishable

### Accessibility
- [ ] Text contrast ≥ 4.5:1 (AA)
- [ ] Focus indicators visible
- [ ] Link vs text distinguishable

## Contrast Validation Tool

Use this to check contrast ratios:

```ts
function getContrastRatio(fg: string, bg: string): number {
  // Convert hex to relative luminance
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Usage:
// getContrastRatio("#ededed", "#0a0a0a") → ~17.4 (excellent)
// getContrastRatio("#888888", "#0a0a0a") → ~5.3 (AA pass)
```

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/styles/presets.css` | Create/expand |
| `apps/web/src/hooks/useTheme.ts` | Update PRESET_THEMES |
| `apps/web/src/components/theme/ThemePreview.tsx` | Create new |
| `apps/web/src/app/theme-gallery/page.tsx` | Create new (dev only) |

## Notes

### Theme Naming

Use evocative names that describe the mood, not just the colors:
- ✅ "Cyberpunk", "Midnight", "Forest"
- ❌ "Blue Dark", "Purple Theme", "Green Mode"

### Adding New Themes

To add a new preset:
1. Add CSS block to `presets.css`
2. Add entry to `PRESET_THEMES` array
3. Test with ThemePreview component
4. Verify contrast ratios

### User Theme vs Preset

Presets are static CSS in the bundle. User themes (Phase 8) are runtime-injected CSS strings. The architecture keeps them separate:
- Presets: `presets.css` → bundled
- User: `#runtime-theme` → injected

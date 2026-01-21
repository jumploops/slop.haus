# Semantic Token Contract

This document defines the themeable tokens used throughout slop.haus.

## Architecture

The theming system uses a two-layer CSS variable pattern:

```
:root
└── BASE variables (--bg, --fg, --accent, etc.)
    └── Mapped to Tailwind via @theme inline

presets.css
└── [data-theme="name"] overrides BASE variables

Runtime themes (user-generated)
└── Injected CSS overrides BASE variables
```

## Color Tokens

| Token | Tailwind Utility | Purpose |
|-------|------------------|---------|
| `--bg` | `bg-bg` | Primary background |
| `--bg-secondary` | `bg-bg-secondary` | Cards, inputs, elevated surfaces |
| `--fg` | `text-fg` | Primary text |
| `--muted` | `text-muted` | Secondary/helper text |
| `--border` | `border-border` | Borders, dividers |
| `--accent` | `bg-accent`, `text-accent` | Brand color, interactive elements |
| `--accent-dim` | `bg-accent-dim` | Hover state for accent |
| `--danger` | `bg-danger`, `text-danger` | Error states |
| `--warning` | `bg-warning`, `text-warning` | Warning states |
| `--success` | `bg-success`, `text-success` | Success states |

### Slop Palette Tokens

| Token | Tailwind Utility | Purpose |
|-------|------------------|---------|
| `--slop-green` | `bg-slop-green`, `text-slop-green` | SLOP score + success accents |
| `--slop-coral` | `bg-slop-coral`, `text-slop-coral` | VIBE score + highlights |
| `--slop-blue` | `bg-slop-blue`, `text-slop-blue` | Links + primary headings |
| `--slop-yellow` | `bg-slop-yellow`, `text-slop-yellow` | Tags + warnings |
| `--slop-pink` | `bg-slop-pink`, `text-slop-pink` | Decorative accents |
| `--slop-teal` | `bg-slop-teal`, `text-slop-teal` | Decorative accents |
| `--slop-purple` | `bg-slop-purple`, `text-slop-purple` | Section headers + labels |

## Spacing

Spacing utilities derive from Tailwind's default scale:

| Utility | Value |
|---------|-------|
| `p-1`, `m-1`, `gap-1` | 0.25rem |
| `p-2`, `m-2`, `gap-2` | 0.5rem |
| `p-4`, `m-4`, `gap-4` | 1rem |
| `p-6`, `m-6`, `gap-6` | 1.5rem |
| `p-8`, `m-8`, `gap-8` | 2rem |

## Border Radius

| Token | Tailwind Utility | Value |
|-------|------------------|-------|
| `--radius-sm` | `rounded-sm` | 0px |
| `--radius` | `rounded-md` | 0px |
| `--radius-lg` | `rounded-lg` | 0px |

## Typography

- Default `--font-sans`: `"Comic Sans MS", "Comic Sans", cursive`
- Default `--font-mono`: `"Courier New", Courier, monospace`

## Component Patterns

### Buttons

Use the `Button` component from `@/components/ui/Button`:

```tsx
import { Button, buttonVariants } from "@/components/ui/Button";

// As a button
<Button variant="primary">Click me</Button>

// As a link styled like a button
<Link href="/foo" className={buttonVariants({ variant: "primary" })}>
  Go somewhere
</Link>
```

Variants: `primary`, `secondary`, `ghost`, `danger`
Sizes: `sm`, `md`, `lg`

### Badges

Use the `Badge` component from `@/components/ui/Badge`:

```tsx
import { Badge } from "@/components/ui/Badge";

<Badge variant="success">Published</Badge>
```

Variants: `default`, `secondary`, `success`, `warning`, `danger`, `dev`, `admin`, `mod`

### Inputs

Use the `Input` component from `@/components/ui/Input`:

```tsx
import { Input, Textarea } from "@/components/ui/Input";

<Input label="Email" error={errors.email} />
<Textarea label="Description" />
```

### Other Components

- `Avatar` - User avatars with fallback initials
- `Modal` - Dialog overlays
- `Tabs` - Tab navigation
- `Skeleton` - Loading placeholders
- `Toast` - Notifications (via `useToast` hook)

## Theme Files

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | `@theme` token definitions + Tailwind mapping |
| `src/styles/presets.css` | Preset theme overrides (cyberpunk, warm, etc.) |
| `src/app/globals.css` | Page-specific layouts + legacy CSS (being migrated) |

## Preset Themes

| ID | Name | Description |
|----|------|-------------|
| `default` | Default | The classic slop.haus look |
| `cyberpunk` | Cyberpunk | Neon cyan on dark blue |
| `warm` | Warm | Cozy orange tones |
| `light` | Light | Clean light mode |
| `midnight` | Midnight | Elegant purple accent |
| `forest` | Forest | Natural green tones |

## Usage Guidelines

### DO

- Use semantic Tailwind utilities: `bg-bg`, `text-fg`, `border-border`
- Use the spacing scale: `p-4`, `gap-2`, `mt-6`
- Use radius tokens: `rounded-md`, `rounded-lg`
- Use UI components from `@/components/ui/`
- Use `cn()` from `@/lib/utils` for class merging

### DON'T

- Use raw palette classes: `bg-slate-900`, `text-gray-500`
- Use arbitrary colors: `bg-[#1a1a1a]`
- Use raw pixel values: `p-[16px]`
- Create new CSS classes for styling - use Tailwind utilities

## Migration Status

As of the retro reskin:

- **Fully Tailwind:** Button, Badge, Input, Textarea, Tabs, Modal, Avatar, Toast, Skeleton
- **Page Layouts:** All primary pages now use Tailwind utilities (legacy layout classnames removed)

## Adding New Tokens

1. Add to `:root` in `globals.css` (base value)
2. Add to `@theme` block in `theme.css` (Tailwind mapping)
3. Add override in each preset in `presets.css`
4. Update this document
5. Test with all preset themes

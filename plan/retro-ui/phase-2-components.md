# Phase 2: Retro Component Variants

**Status:** Not started

## Objective

Restyle core UI primitives to match retro patterns (beveled buttons, inset inputs, sharp corners) while keeping Tailwind utilities and semantic tokens.

## Files to Change

- `apps/web/src/components/ui/button-variants.ts`
- `apps/web/src/components/ui/Button.tsx`
- `apps/web/src/components/ui/Badge.tsx`
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/Tabs.tsx`
- `apps/web/src/components/ui/Avatar.tsx`
- `apps/web/src/components/ui/Skeleton.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/MobileNav.tsx`

## Tasks

- Update button variants to use retro bevels, higher-contrast borders, and sharp edges by default.
- Add retro-friendly badge variants (e.g., slop/vibe tags) using `bg-slop-*` utilities.
- Update inputs/textarea to inset styling, border thickness, and tighter retro padding.
- Restyle tabs to look like retro button groups instead of minimal underline tabs.
- Adjust avatars to match retro border treatments (square edges, black border) where appropriate.
- Restyle skeletons to better fit the lighter retro palette.
- Remove ThemeSwitcher UI from `apps/web/src/components/layout/Header.tsx` and adjust header layout accordingly.
- Ensure mobile nav styles follow retro buttons and panels.

## Code Snippets

```ts
// apps/web/src/components/ui/button-variants.ts
primary: [
  "border-2 border-black",
  "bg-gradient-to-b from-bg-secondary via-bg to-border",
  "shadow-[2px_2px_0_#000]",
  "hover:translate-x-[1px] hover:translate-y-[1px]",
]
```

```tsx
// apps/web/src/components/ui/Input.tsx
className={cn(
  "px-3 py-2",
  "bg-white text-fg text-sm",
  "border-2 border-black",
  "shadow-[inset_1px_1px_0_#fff,inset_-1px_-1px_0_#808080]",
  "focus:outline-none focus:border-accent",
  className
)}
```

## Verification Checklist

- Buttons, inputs, badges, and tabs read as retro-styled without ad-hoc classes on pages.
- Theme switcher UI no longer appears in the header or mobile nav.
- Mobile nav still functions and matches the retro visual language.

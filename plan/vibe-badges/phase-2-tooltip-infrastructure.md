# Phase 2: Tooltip Infrastructure

## Status

**Status:** ✅ Completed  
**Owner:** Web  
**Depends On:** None

## Goal

Add a reusable tooltip primitive to `apps/web` so `VibeBadge` can ship with tooltip behavior in v1.

## Files To Change

- `/Users/adam/code/slop.haus/apps/web/package.json`
- `/Users/adam/code/slop.haus/pnpm-lock.yaml`
- `/Users/adam/code/slop.haus/apps/web/src/components/ui/Tooltip.tsx` (new)

## Tasks

1. Add dependency `@radix-ui/react-tooltip` to `apps/web`.
2. Create a shared tooltip wrapper component under `components/ui` with exports:
   - `TooltipProvider`
   - `Tooltip`
   - `TooltipTrigger`
   - `TooltipContent`
3. Match repo conventions:
   - `cn()` for class composition,
   - semantic token classes (`bg-popover`, `text-popover-foreground`, `border-border`),
   - no raw palette classes.
4. Ensure default provider delay and sensible `sideOffset` are set for compact badges.
5. Ensure tooltip content supports keyboard focus and screen-reader-friendly structure.

## Implementation Notes

- Keep API close to Radix primitives while hiding repetitive setup.
- Avoid introducing extra animation dependencies.
- Keep styles minimal and neutral to reuse outside vibe features.

## Code Snippets (Conceptual)

```tsx
export function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root {...props} />
    </TooltipProvider>
  );
}
```

```tsx
<TooltipContent className="border border-border bg-popover text-popover-foreground">
  ...
</TooltipContent>
```

## Verification Checklist

- [ ] Dependency is present in `apps/web/package.json` and lockfile is updated.
- [ ] `Tooltip` wrapper builds and can be imported from web components.
- [ ] Tooltip is accessible via keyboard focus and hover.
- [ ] Tooltip styles are readable in light and dark modes.

## Exit Criteria

- `apps/web` has stable, reusable tooltip infrastructure required for v1 badge behavior.

## Progress Notes

- Implemented `apps/web/src/components/ui/Tooltip.tsx` with Radix primitives.
- Added `@radix-ui/react-tooltip` to `apps/web/package.json`.
- Lockfile now includes tooltip dependency updates.

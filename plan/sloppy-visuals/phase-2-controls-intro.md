# Phase 2 — Feed Controls + Intro Slop

**Status:** Complete  
**Goal:** Add playful messiness to feed controls and intro area without breaking affordances.

## Targets
- Feed intro banner + dismiss button
- Sort tabs, time window select, display toggles

## Proposed Changes
1. **Sticky-note / taped intro**: add taped corners + slight skew to the intro card and dismiss button.
2. **Uneven button edges**: introduce subtle skew/clip to tab buttons + view toggles to feel cut by hand.
3. **Smudged highlight accents**: add irregular background swash behind the feed headline.
4. **Offset header items**: nudge control groups slightly off grid (small translate/rotate).

## Files to Change
- `apps/web/src/app/page.tsx`
- `apps/web/src/components/ui/Tabs.tsx`
- `apps/web/src/app/globals.css` (if shared utility needed)

## Implementation Notes
- Keep controls accessible: preserve focus rings, text clarity, and button sizes.
- All transforms should be stable (no random per render).
- Favor Tailwind utilities + existing UI components.

## Sketch / Pseudocode
```tsx
<Tabs
  className={cn("rotate-[-0.4deg]", "shadow-[...]", className)}
  ...
/>
```

```tsx
<div className="relative">
  <span className="absolute inset-x-0 top-2 -z-10 h-3 -rotate-1 bg-primary/15" />
  <h1 className="font-mono text-3xl">Confess your slop</h1>
</div>
```

## Verification Checklist
- Controls remain fully clickable on mobile.
- No hover-only affordances (slop visible at rest).
- Focus states remain visible and accessible.
- Dismiss button still obvious and reachable.

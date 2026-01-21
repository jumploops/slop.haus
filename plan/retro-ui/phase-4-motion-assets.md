# Phase 4: Motion + Assets

**Status:** Not started

## Objective

Add retro motion flourishes and approved assets, keeping motion respectful of reduced-motion preferences.

## Files to Change

- `apps/web/src/styles/animations.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/project/*`
- `apps/web/src/components/comment/*`
- `apps/web/public/*` (new assets)

## Tasks

- Add keyframes for marquee, blink, rainbow text, wobble, and slow spin in `apps/web/src/styles/animations.css`.
- Apply animations using Tailwind `animate-[...]` utilities (avoid new CSS class names).
- Ensure `prefers-reduced-motion` continues to suppress animations.
- Create `apps/web/public` and copy assets from `reference-ui/public` (badges, avatars, awards, placeholders).
- Replace placeholder imagery with approved retro assets where appropriate.

## Code Snippets

```css
/* apps/web/src/styles/animations.css */
@keyframes marquee {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

```tsx
// Example usage
<span className="animate-[blink_1s_step-end_infinite]">NEW!</span>
```

## Verification Checklist

- Marquee and blink animations render as expected on modern browsers.
- Reduced-motion users do not see animations.
- Retro badges and placeholders load from `apps/web/public`.

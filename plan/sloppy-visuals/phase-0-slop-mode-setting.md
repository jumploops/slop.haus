# Phase 0 — Slop Mode Setting

**Status:** Complete  
**Goal:** Add a user-facing toggle for “Slop Mode” that mirrors the existing light/dark/system menu pattern, defaults to ON, and persists per-user in localStorage.

## UX Summary
- A simple toggle in the header options menu (same area as the theme selector).
- Default state: **Slop Mode ON**.
- If the user turns it off, persist the preference in localStorage.
- Should apply globally to visual treatments (not only the feed).

## Technical Approach

### State + Persistence
- Create a small client-side state store via React context (`SlopModeProvider`).
- On mount, read localStorage key `slop:mode`:
  - If missing → default to `true`.
  - If present → coerce to boolean.
- On change, update localStorage and state.

### Suggested API
```ts
interface SlopModeContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}
```

### LocalStorage Key
- `slop:mode` (string: `"on" | "off"`)

### Component Hook
```ts
const { enabled, toggle } = useSlopMode();
```

## UI Placement
- Add a menu row in the header options menu (same visual style as theme selector).
- Copy the UX pattern from the light/dark selector (button row with label + value).
- Label: “Slop Mode”
- Value text: “On” / “Off”

## File Candidates
- `apps/web/src/app/providers.tsx` (register provider)
- `apps/web/src/components/layout/Header.tsx` (options menu UI)
- `apps/web/src/components/layout/MobileNav.tsx` (mobile menu parity)
- `apps/web/src/lib/slop-mode.tsx` (new context + hook)

## Rollout Plan
1. Add `SlopModeProvider` and `useSlopMode`.
2. Wire provider into `Providers` tree.
3. Add toggle UI to header options menu and mobile nav.
4. Update feed (and any other slop features) to respect `enabled`.

## Verification Checklist
- Default is ON when no localStorage value exists.
- Toggling updates UI immediately and persists after refresh.
- Works in both desktop header menu + mobile nav.
- No SSR mismatch (reads localStorage only in `useEffect`).

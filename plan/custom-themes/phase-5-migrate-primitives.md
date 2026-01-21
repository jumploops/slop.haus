# Phase 5: Migrate Core Primitives

Status: completed

## Goal

Move core primitives to semantic classes so themes can control structure and layout safely.

## Scope

- Button, Input, Textarea, Badge, Modal, Tabs, Toast, Avatar.
- Replace raw utility strings with semantic classes.
- Remove raw palette usage in primitives.

## Files to Change

- `apps/web/src/components/ui/Button.tsx`
- `apps/web/src/components/ui/button-variants.ts`
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/Badge.tsx`
- `apps/web/src/components/ui/Modal.tsx`
- `apps/web/src/components/ui/Tabs.tsx`
- `apps/web/src/components/ui/Toast.tsx`
- `apps/web/src/components/ui/Avatar.tsx`

## Implementation Notes

- Replace CVA class strings with semantic classes (e.g., `.btn`, `.btn-primary`).
- Ensure size variants map to `.btn-sm`, `.btn-md`, `.btn-lg`.
- Move visual styling into `recipes.css`.

## Verification Checklist

- [ ] Primitives render correctly in default theme.
- [ ] ThemePreview reflects semantic changes.
- [ ] No raw palette classes remain in primitives.

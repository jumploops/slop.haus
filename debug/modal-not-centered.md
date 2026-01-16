# Modal Not Centered

**Status:** Resolved (2026-01-15)

## Problem

Modals (e.g., Delete Project confirmation) appear in the top-left of the viewport instead of being centered.

## Affected Components

All modals use the same base `Modal` component, so all are affected:

| Component | File |
|-----------|------|
| DeleteProjectModal | `apps/web/src/components/project/DeleteProjectModal.tsx` |
| UrlChangeModal | `apps/web/src/components/project/UrlChangeModal.tsx` |
| LoginModal | `apps/web/src/components/auth/LoginModal.tsx` |

## Implementation Details

### Modal Component (`apps/web/src/components/ui/Modal.tsx`)

Uses the native HTML `<dialog>` element with `showModal()`:

```tsx
<dialog
  ref={dialogRef}
  className={cn("modal", className)}
  onClick={handleBackdropClick}
>
  <div className="modal-content">
    {/* ... */}
  </div>
</dialog>
```

The `showModal()` API is called via `useEffect` when `isOpen` becomes true.

### Modal CSS (`apps/web/src/app/globals.css`, lines 575-621)

```css
.modal {
  border: none;
  border-radius: 12px;
  background: var(--bg);
  color: var(--fg);
  padding: 0;
  max-width: 500px;
  width: 90%;
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.75);
}
```

**Note:** No explicit centering styles are defined.

## Root Cause Analysis

### Hypothesis: CSS Reset Overrides Dialog Centering

The native `<dialog>` element's default browser styles include:

```css
dialog[open] {
  position: fixed;
  inset: 0;        /* top: 0; right: 0; bottom: 0; left: 0; */
  margin: auto;    /* THIS centers the dialog */
}
```

However, the global CSS reset in `globals.css` (lines 1-5) includes:

```css
* {
  box-sizing: border-box;
  margin: 0;      /* <-- This overrides margin: auto */
  padding: 0;
}
```

The `* { margin: 0; }` universal selector has lower specificity than the browser's `dialog[open]` styles, BUT in some browsers/conditions, it can still override the default centering behavior.

**This is the most likely cause.**

### Alternative Hypotheses

1. **Browser-specific behavior**: Different browsers may handle the `<dialog>` default styles differently when CSS resets are present.

2. **Missing `open` attribute**: The `<dialog>` element might not have the `[open]` attribute applied correctly. However, `showModal()` should handle this automatically.

3. **Z-index or stacking context**: Unlikely to affect positioning, but could interact with other fixed elements.

## Fix Options

### Option A: Add `margin: auto` to `.modal`

```css
.modal {
  border: none;
  border-radius: 12px;
  background: var(--bg);
  color: var(--fg);
  padding: 0;
  max-width: 500px;
  width: 90%;
  margin: auto;  /* <-- Add this */
}
```

**Pros:**
- Simple, single-line fix
- Restores native dialog centering behavior
- Works with the existing `position: fixed` from browser defaults

**Cons:**
- Relies on browser defaults for `position: fixed` and `inset: 0`

### Option B: Explicit centering with `inset` and `margin`

```css
.modal {
  border: none;
  border-radius: 12px;
  background: var(--bg);
  color: var(--fg);
  padding: 0;
  max-width: 500px;
  width: 90%;
  /* Explicit centering - doesn't rely on browser defaults */
  position: fixed;
  inset: 0;
  margin: auto;
  height: fit-content;  /* Prevent full-height stretching */
}
```

**Pros:**
- Fully explicit, doesn't rely on browser defaults
- More robust across browsers

**Cons:**
- More CSS to maintain
- `height: fit-content` needed to prevent vertical stretching

### Option C: Flexbox centering on dialog

```css
.modal {
  border: none;
  border-radius: 12px;
  background: var(--bg);
  color: var(--fg);
  padding: 0;
  max-width: 500px;
  width: 90%;
  /* Flexbox centering */
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Pros:**
- Modern flexbox approach

**Cons:**
- Changes the display model of `<dialog>`
- May interfere with how dialog content is laid out
- Overcomplicates a simple fix

### Option D: Exclude `<dialog>` from global reset

```css
*:not(dialog) {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

dialog {
  box-sizing: border-box;
  padding: 0;
  /* margin intentionally not reset */
}
```

**Pros:**
- Fixes root cause at the source
- Allows browser defaults to work

**Cons:**
- Changes global reset behavior
- Could have unintended side effects
- More complex selector

## Recommended Fix

**Option A** is the simplest and most targeted fix. Adding `margin: auto` to `.modal` restores the expected centering behavior without overcomplicating the CSS.

If Option A doesn't work in all browsers, fall back to **Option B** for fully explicit positioning.

## Implementation Plan

1. Add `margin: auto` to `.modal` class in `globals.css`
2. Test all three modals:
   - Delete Project modal (edit page)
   - URL Change modal (edit page)
   - Login modal (header sign-in)
3. Test across browsers (Chrome, Firefox, Safari) if possible

## Resolution

Implemented Option A - added `margin: auto` to `.modal` class in `globals.css`:

```css
.modal {
  /* ... existing styles ... */
  margin: auto;
}
```

## Verification Checklist

- [ ] Delete Project modal centers correctly
- [ ] URL Change modal centers correctly
- [ ] Login modal centers correctly
- [ ] Modals work on mobile viewports
- [ ] Backdrop click still closes modal
- [ ] Escape key still closes modal

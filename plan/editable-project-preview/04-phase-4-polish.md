# Phase 4: Polish & Accessibility

**Status:** Not Started
**Depends On:** Phase 3
**Enables:** Feature Complete

---

## Goals

1. Implement full keyboard navigation for all editable fields
2. Add ARIA attributes for screen reader support
3. Optimize mobile experience (touch interactions, bottom sheets)
4. Add animations and transitions for smooth interactions
5. Implement comprehensive error handling and loading states
6. Clean up deprecated code
7. Final testing and bug fixes

---

## 4.1 Keyboard Navigation

### Focus Order

Establish logical tab order through editable elements:

```
1. Title
2. Tagline
3. Main URL button
4. Repo URL button
5. Description (About section)
6. Tools/Tags
7. Vibe Score
8. Submit button
9. Start Over button
```

### Keyboard Interactions by Component

**InlineEditText / InlineEditTextarea:**
- `Tab`: Move to next editable field
- `Enter` (text) / `Ctrl+Enter` (textarea): Save and exit edit mode
- `Escape`: Cancel edit and revert
- `Space` or `Enter` (when focused, not editing): Activate edit mode

**Popover (Tags, Vibe):**
- `Enter` or `Space`: Open popover when trigger focused
- `Escape`: Close popover
- `Tab`: Cycle through popover contents
- Focus trap: Tab doesn't leave popover while open

**EditableLink (Modal):**
- `Enter` or `Space`: Open modal when button focused
- `Escape`: Close modal (cancel)
- `Tab`: Cycle between input, cancel, save buttons
- `Enter` (in input): Save and close

**EditableMedia:**
- `Enter` or `Space`: Open file picker when focused
- Focus indicator visible on image

### Implementation Steps

1. Add `tabIndex={0}` to all editable field triggers
2. Add `onKeyDown` handlers for Enter/Space activation
3. Implement focus trap utility for popovers and modals
4. Add focus restoration after popover/modal close
5. Ensure visible focus indicators on all interactive elements
6. Test with keyboard-only navigation

---

## 4.2 ARIA Attributes

### Editable Fields

```tsx
// InlineEditText (display mode)
<span
  role="button"
  tabIndex={0}
  aria-label={`${label}: ${value || 'empty'}. Click to edit.`}
  aria-describedby={helpTextId}
>

// InlineEditText (edit mode)
<input
  aria-label={label}
  aria-required={required}
  aria-invalid={hasError}
  aria-describedby={errorId}
/>
```

### Popovers

```tsx
<div className="popover-container">
  <button
    aria-haspopup="dialog"
    aria-expanded={isOpen}
    aria-controls={popoverId}
  >
    {trigger}
  </button>

  {isOpen && (
    <div
      id={popoverId}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {children}
    </div>
  )}
</div>
```

### Media

```tsx
<div
  role="button"
  tabIndex={0}
  aria-label="Project screenshot. Click to replace image."
>
  <img alt={projectTitle} />
</div>
```

### Live Regions

```tsx
// Announce saves and errors
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {saveMessage}
</div>
```

### Implementation Steps

1. Add role attributes to all interactive elements
2. Add aria-label/aria-labelledby to form controls
3. Add aria-expanded/aria-haspopup to popover triggers
4. Add aria-modal and focus trap to modals
5. Create live region for status announcements
6. Add sr-only class for screen-reader-only content
7. Test with VoiceOver (Mac) and/or NVDA (Windows)

---

## 4.3 Mobile Optimizations

### Touch Interactions

- Remove hover-dependent affordances on touch devices
- Always show edit indicators (pencil icons) on mobile
- Increase tap target sizes (min 44x44px)
- Add touch feedback (active states)

### Bottom Sheets (Mobile Popovers)

Convert popovers to bottom sheets on small screens:

```css
@media (max-width: 640px) {
  .popover-content {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    max-height: 80vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    animation: slideUp 0.2s ease-out;
  }

  .popover-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

### Mobile Layout Adjustments

- Single column layout for preview
- Full-width editable fields
- Larger touch targets for buttons
- Simplified media overlay (just icon, no text)

### Implementation Steps

1. Add touch device detection (or use CSS hover media query)
2. Update Popover component to support bottom sheet mode
3. Add backdrop for mobile popovers
4. Increase button/tap target sizes
5. Update overlay to always show on mobile
6. Test on actual mobile devices / device emulation

---

## 4.4 Animations & Transitions

### Field Hover/Focus

```css
.editable-field {
  transition:
    background-color 0.15s ease,
    outline-color 0.15s ease,
    outline-offset 0.15s ease;
}
```

### Edit Mode Transition

```css
.inline-edit-input {
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0.8; }
  to { opacity: 1; }
}
```

### Popover Enter/Exit

```css
.popover-content {
  animation: popIn 0.15s ease-out;
  transform-origin: top left;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popover-content.closing {
  animation: popOut 0.1s ease-in forwards;
}

@keyframes popOut {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

### Save Indicator

Brief flash/pulse when field saves:

```css
.editable-field.just-saved {
  animation: saveFlash 0.3s ease-out;
}

@keyframes saveFlash {
  0% { background-color: var(--color-success-bg); }
  100% { background-color: transparent; }
}
```

### Implementation Steps

1. Add CSS transitions to editable fields
2. Add enter animations to popovers
3. Implement exit animations (requires tracking closing state)
4. Add save confirmation flash
5. Respect `prefers-reduced-motion` media query
6. Keep animations subtle and fast (< 200ms)

---

## 4.5 Error Handling & Loading States

### Field-Level Errors

Show inline error when save fails:

```tsx
<div className="editable-field">
  <InlineEditText ... />
  {fieldError && (
    <span className="field-error" role="alert">
      {fieldError}
    </span>
  )}
</div>
```

### Retry Logic

```typescript
const handleSave = async (field: string, value: unknown) => {
  setFieldError(null);

  try {
    await onFieldChange(field, value);
    showSaveConfirmation(field);
  } catch (error) {
    setFieldError(`Failed to save. Tap to retry.`);
    // Don't revert value - let user try again
  }
};
```

### Loading States

- Disable submit button while any field is saving
- Show subtle loading indicator on saving field
- Prevent editing another field while one is saving (optional)

### Global Error Banner

For critical errors (draft not found, session expired):

```tsx
{globalError && (
  <div className="preview-error-banner" role="alert">
    <p>{globalError}</p>
    <Button onClick={handleRetry}>Retry</Button>
  </div>
)}
```

### Implementation Steps

1. Add error state to each editable component
2. Implement inline error display
3. Add retry functionality
4. Add loading/saving indicators
5. Add global error banner for critical errors
6. Test error scenarios (network failure, validation errors)

---

## 4.6 Code Cleanup

### Files to Remove

After Phase 4 is stable and tested:

```
apps/web/src/components/submit/DraftReview.tsx  (deprecated)
```

### Files to Update

Remove unused imports/exports related to old DraftReview.

### Code Quality

1. Run TypeScript strict mode checks
2. Run ESLint and fix warnings
3. Remove console.log statements
4. Add JSDoc comments to public component APIs
5. Ensure consistent naming conventions

---

## 4.7 Final Testing

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Accessibility Testing

- [ ] Keyboard-only navigation complete flow
- [ ] VoiceOver (macOS/iOS)
- [ ] Screen reader announces all actions
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA

### Performance Testing

- [ ] No layout shifts during editing
- [ ] Animations run at 60fps
- [ ] No unnecessary re-renders
- [ ] Bundle size impact acceptable

### User Flow Testing

- [ ] Complete flow: URL input → analysis → review → edit all fields → submit
- [ ] Partial flow: Edit only title, submit
- [ ] Error flow: Network failure during save
- [ ] Cancel flow: Start editing, cancel, verify no changes saved

---

## Testing Checklist (Phase 4 Specific)

### Keyboard
- [ ] Tab navigates through all editable fields in order
- [ ] Enter/Space activates edit mode
- [ ] Escape cancels edit
- [ ] Focus trapped in open popovers
- [ ] Focus returns after popover closes
- [ ] No keyboard traps

### Screen Reader
- [ ] All fields announced with labels
- [ ] Edit state changes announced
- [ ] Errors announced immediately
- [ ] Save confirmations announced
- [ ] Modal/popover announced as dialogs

### Mobile
- [ ] All fields editable via touch
- [ ] Popovers become bottom sheets
- [ ] No hover-only functionality
- [ ] Adequate tap target sizes
- [ ] Works in portrait and landscape

### Animations
- [ ] Transitions smooth (no jank)
- [ ] Respects reduced-motion preference
- [ ] Popover enter/exit animated
- [ ] Save flash visible but not distracting

### Error Handling
- [ ] Network errors show inline message
- [ ] Can retry after error
- [ ] Validation errors prevent save
- [ ] Critical errors show banner
- [ ] No silent failures

---

## Definition of Done

1. Full keyboard navigation implemented
2. All ARIA attributes added
3. Mobile bottom sheets implemented
4. Animations and transitions added
5. Error handling comprehensive
6. Loading states implemented
7. `DraftReview.tsx` removed
8. Cross-browser testing passed
9. Accessibility testing passed
10. All tests in checklist passing
11. No console errors or warnings
12. Code reviewed and merged

---

## Notes

- **Reduced Motion:** Always respect `prefers-reduced-motion` - disable animations or use instant transitions
- **Focus Visible:** Use `:focus-visible` for keyboard-only focus indicators
- **Touch Detection:** Use `@media (hover: none)` to detect touch devices
- **Bottom Sheet Library:** Consider using `react-spring` or `framer-motion` for bottom sheet gestures
- **Testing Tools:** Use Lighthouse accessibility audit, axe DevTools

# Draft Review Input Styling Issue

## Problem

On the `/submit/draft/[id]` page, input elements in the "Basic Info" and "Links" sections have no styling (browser defaults), while "Technologies" and "Vibe Score" sections look correct.

## Investigation

### 1. Component Structure Analysis

**DraftReview.tsx** structure:
```tsx
{/* Basic Info - UNSTYLED */}
<div className="draft-review-section">
  <div className="form-field">
    <label htmlFor="title">Title *</label>
    <input id="title" type="text" ... />
  </div>
  <div className="form-field">
    <label htmlFor="tagline">Tagline *</label>
    <input id="tagline" type="text" ... />
  </div>
  <div className="form-field">
    <label htmlFor="description">Description</label>
    <textarea id="description" ... />
  </div>
</div>

{/* Links - UNSTYLED */}
<div className="draft-review-section">
  <div className="form-field">
    <input type="url" ... />
  </div>
</div>

{/* Technologies - STYLED */}
<div className="draft-review-section">
  <TagEditor ... />  {/* Has its own CSS */}
</div>

{/* Vibe Score - STYLED */}
<div className="draft-review-section">
  <VibeInput ... />  {/* Has its own CSS */}
</div>
```

### 2. CSS Analysis

**TagEditor styling exists:**
```css
.tag-editor-input input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--background);
  color: var(--foreground);
}
```

**VibeInput uses custom slider elements** - not regular inputs, has its own `.vibe-slider` styling.

**Missing styles:**
- No `.form-field` CSS class defined anywhere
- No global `input` or `textarea` element styling
- No `.draft-review-section input` or similar scoped styling

### 3. Root Cause

The `.form-field` class is used in JSX but **never defined in CSS**. The inputs and textareas inside are completely unstyled, falling back to browser defaults.

## Solution

Add form field styling to globals.css. Two options:

### Option A: Global input/textarea styling
```css
/* Apply to all inputs in the app */
input[type="text"],
input[type="url"],
input[type="email"],
textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 1rem;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
}
```

### Option B: Scoped `.form-field` styling (recommended)
```css
/* Form fields - used in draft review and other forms */
.form-field {
  margin-bottom: var(--spacing-4);
}

.form-field label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: 500;
  font-size: 0.875rem;
}

.form-field input,
.form-field textarea {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--fg);
  font-size: 1rem;
  font-family: inherit;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.form-field textarea {
  resize: vertical;
  min-height: 100px;
}
```

**Recommendation:** Option B (scoped) is safer - won't accidentally affect other inputs like search bars or the URL input on /submit.

## Files to Update

- `apps/web/src/app/globals.css` - Add `.form-field` styles

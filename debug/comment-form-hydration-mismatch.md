# Debug: CommentForm Hydration Mismatch

**Date:** 2026-01-20
**Status:** RESOLVED

## Problem Statement

Hydration error on project pages when refreshing:

```
Uncaught Error: Hydration failed because the server rendered HTML didn't match the client.
```

The error shows a mismatch between server and client rendered HTML:
- **Server rendered:** `<div className="py-4 text-center">` (sign-in message)
- **Client expected:** `<form onSubmit={function handleSubmit} className="mb-6">` (comment form)

## Environment

- Next.js: 15.5.9
- React: 19.2.3
- better-auth (client)
- Page: `/p/[slug]` (project detail)

## Investigation Findings

### 1. Code Structure Analysis

**CommentForm.tsx (lines 25-36):**
```tsx
"use client";

export function CommentForm({ ... }) {
  const { data: session } = useSession();  // ← Only gets 'data', not 'isPending'
  // ...

  if (!session?.user) {
    return (
      <div className="py-4 text-center">  // ← Server renders THIS
        <p className="text-muted text-sm">Sign in to leave a comment</p>
      </div>
    );
  }

  // ... returns <form> if session.user exists  // ← Client renders THIS
}
```

### 2. Root Cause: Missing isPending Check

The `useSession()` hook from better-auth returns:
- `data`: The session object (null during loading, then user data if logged in)
- `isPending`: Boolean indicating if session is still being fetched

**The problem sequence:**

1. **Server-side render (SSR):**
   - `useSession()` returns `{ data: null, isPending: ??? }`
   - No session cookie available during SSR
   - `!session?.user` is true → renders the "Sign in" div

2. **Client-side hydration:**
   - React expects the initial client render to match server HTML
   - `useSession()` starts fetching session from API
   - If user IS logged in, `session.user` becomes truthy
   - Component wants to render `<form>` but server sent `<div>`
   - **HYDRATION MISMATCH**

### 3. Comparison with Working Pattern

**AuthButtons.tsx (lines 11, 27-33)** handles this correctly:
```tsx
const { data: session, isPending } = useSession();

if (isPending) {
  return (
    <div className="relative">
      <div className="w-8 h-8" />  // ← Consistent placeholder during loading
    </div>
  );
}

if (session?.user) {
  // ... user is logged in
}

return (
  // ... sign in button
);
```

By checking `isPending` first, AuthButtons renders a consistent placeholder on both server and client during the initial render, avoiding the mismatch.

### 4. Why It Only Happens on Refresh

- **Navigation (client-side):** Session is already loaded, no mismatch
- **Hard refresh:** Server renders with no session, client has session in cookie → mismatch

## Hypotheses

### Hypothesis 1: Add isPending Check (HIGH CONFIDENCE)

**Issue:** CommentForm doesn't wait for session to load before making rendering decisions.

**Solution:** Add `isPending` to the destructure and render a placeholder during loading:

```tsx
export function CommentForm({ ... }) {
  const { data: session, isPending } = useSession();
  // ...

  // Show loading state during hydration
  if (isPending) {
    return (
      <div className="py-4">
        {/* Placeholder that matches neither state exactly */}
        <div className="h-[120px]" /> {/* Approximate height of form */}
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted text-sm">Sign in to leave a comment</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {/* ... */}
    </form>
  );
}
```

### Hypothesis 2: Suppress Hydration Warnings (NOT RECOMMENDED)

Could add `suppressHydrationWarning` to the component, but this:
- Doesn't fix the actual issue
- Just hides the error
- Can cause UI flicker

### Hypothesis 3: Move Session Check to Parent (MEDIUM CONFIDENCE)

Could lift session state to `CommentThread` and pass down, but:
- CommentForm is also used for replies (nested)
- Would require more refactoring
- Hypothesis 1 is simpler

## Recommended Solution

**Hypothesis 1** - Add `isPending` check to CommentForm:

```tsx
export function CommentForm({ ... }) {
  const { data: session, isPending } = useSession();
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Render placeholder during session loading to avoid hydration mismatch
  if (isPending) {
    return <div className="py-4 h-[120px]" />;
  }

  if (!session?.user) {
    return (
      <div className="py-4 text-center">
        <p className="text-muted text-sm">Sign in to leave a comment</p>
      </div>
    );
  }

  // ... rest of component (form)
}
```

## Resolution

**Applied Hypothesis 1** - Added `isPending` check to CommentForm.

### Change Made

**`apps/web/src/components/comment/CommentForm.tsx`:**
```tsx
// Before
const { data: session } = useSession();

// After
const { data: session, isPending } = useSession();

// Added check before session?.user check
if (isPending) {
  return <div className="py-4 h-[120px]" />;
}
```

### Verification

- ✅ TypeScript check passes
- ✅ Build succeeds

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/components/comment/CommentForm.tsx` | Added `isPending` check |

## Verification Steps

1. Apply the fix
2. Log in to the app
3. Navigate to a project page
4. Hard refresh (Cmd+R or F5)
5. Verify no hydration error in console
6. Verify comment form appears correctly after loading

## Related Patterns

Other components that use `useSession()` should also check `isPending`:
- ✅ `AuthButtons.tsx` - Already handles correctly
- ⚠️ Any other components using conditional rendering based on session

## References

- [React Hydration Mismatch](https://react.dev/link/hydration-mismatch)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [better-auth useSession hook](https://www.better-auth.com/docs/api-reference/client)

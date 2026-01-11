# Admin Routing 404 Debug Report

## Issue

Clicking "Admin" link in the header navigates to `/admin/mod-queue` which returns a 404. However, `/admin` works and displays the mod queue correctly.

## Current State Analysis

### File Structure
```
apps/web/src/app/admin/
├── layout.tsx          # Admin layout with sidebar nav
├── page.tsx            # Mod Queue (serves at /admin)
├── users/
│   └── page.tsx        # Users page (serves at /admin/users)
└── revisions/
    └── page.tsx        # Revisions page (serves at /admin/revisions)
```

**Key observation:** There is NO `/admin/mod-queue/page.tsx` file.

### Link Analysis

| Location | Link Target | Status |
|----------|-------------|--------|
| `Header.tsx:26` | `/admin/mod-queue` | **BROKEN** - no page exists |
| `MobileNav.tsx:73` | `/admin/mod-queue` | **BROKEN** - no page exists |
| `admin/layout.tsx:9` | `/admin` | **WORKS** - page exists |

### API vs Frontend Mismatch

- **API endpoint:** `GET /api/v1/admin/mod-queue` (correct, this is the backend)
- **Frontend route:** `/admin` (where page.tsx actually renders the mod queue)
- **Broken links:** Point to `/admin/mod-queue` (frontend route that doesn't exist)

### Plan vs Implementation

The plan file specified:
```
**Mod Queue** (`/admin/mod-queue`)
```

But implementation placed mod queue at `/admin` (the index page).

---

## Hypotheses for Fix

### Hypothesis 1: Update Links to Match Existing Structure (Recommended)
**Change:** Update Header.tsx and MobileNav.tsx to link to `/admin` instead of `/admin/mod-queue`.

**Pros:**
- Minimal change (2 files, 1 line each)
- No file restructuring needed
- `/admin` as the default admin landing page makes sense (mod queue is the primary admin task)

**Cons:**
- Deviates from original plan
- URL doesn't explicitly describe the page content

**Files to change:**
- `components/layout/Header.tsx:26` → change `/admin/mod-queue` to `/admin`
- `components/layout/MobileNav.tsx:73` → change `/admin/mod-queue` to `/admin`

---

### Hypothesis 2: Create the Missing Route (Match the Plan)
**Change:** Move or copy mod queue page to `/admin/mod-queue/page.tsx` and make `/admin/page.tsx` a redirect or dashboard.

**Pros:**
- Matches original plan
- URL is descriptive
- Leaves room for an admin dashboard at `/admin`

**Cons:**
- More files to change
- Need to decide what `/admin` shows (redirect? dashboard?)
- Potential for future confusion if both routes exist

**Files to change:**
- Create `app/admin/mod-queue/page.tsx` (move content from `app/admin/page.tsx`)
- Update `app/admin/page.tsx` to redirect to `/admin/mod-queue` or show dashboard
- Update `app/admin/layout.tsx:9` to use `/admin/mod-queue`

---

### Hypothesis 3: Use Route Groups for Cleaner Structure
**Change:** Restructure using Next.js route groups to have both work.

```
apps/web/src/app/admin/
├── layout.tsx
├── page.tsx                    # Redirect to mod-queue
├── (queue)/
│   └── mod-queue/
│       └── page.tsx            # Actual mod queue
├── users/
│   └── page.tsx
└── revisions/
    └── page.tsx
```

**Pros:**
- Clean separation of concerns
- Both `/admin` and `/admin/mod-queue` work
- Follows Next.js conventions

**Cons:**
- Most complex change
- Over-engineering for a simple issue
- Route groups add mental overhead

---

### Hypothesis 4: Add a Redirect
**Change:** Keep mod queue at `/admin/page.tsx` but add a redirect from `/admin/mod-queue`.

Create `app/admin/mod-queue/page.tsx`:
```tsx
import { redirect } from "next/navigation";
export default function ModQueueRedirect() {
  redirect("/admin");
}
```

**Pros:**
- Both URLs work
- Backwards compatible if links exist elsewhere
- Minimal page.tsx content

**Cons:**
- Extra file that just redirects
- Users may bookmark the wrong URL
- Slight performance hit from redirect

---

### Hypothesis 5: Client-Side Redirect in Layout
**Change:** Add client-side redirect logic in admin layout for `/admin/mod-queue`.

**Pros:**
- Single file change
- Handles the edge case

**Cons:**
- Client-side redirects are slower
- Layout shouldn't handle routing logic
- Hacky solution

---

## Recommendation

**Hypothesis 1** is the cleanest solution. The mod queue being at `/admin` makes semantic sense - it's the default/primary admin view. Simply update the two broken links.

If we want the URL to be explicit (`/admin/mod-queue`), then **Hypothesis 2** is the right choice, but requires deciding what the admin index page should show.

## Additional Observations

1. The SWR cache key in `admin/page.tsx` uses `/admin/mod-queue?filter=...` - this is fine, it's just a cache key string, not a route.

2. The `admin/layout.tsx` already has the correct link to `/admin` for "Mod Queue" in the sidebar navigation.

3. TypeScript will not catch this bug since link hrefs are just strings.

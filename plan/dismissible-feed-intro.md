# Dismissible Feed Intro - Implementation Plan

Status: draft
Owner: TBD

## Overview
Replace the static “Fresh Slop Daily” intro on the feed with a dismissible onboarding banner. The banner should encourage posting AI‑assisted apps, be dismissible via an “X”, and never reappear once dismissed (localStorage).

## Requirements (from feedback)
- Use copy option #8 (unhinged):
  - **Title:** “Confess your slop”
  - **Body:** “This is the one place slop is encouraged. Humans will judge you anyway.”
- Title keeps the current rotated badge styling.
- Add a secondary callout line: “Don’t be afraid, it’s just AI.”
- Dismiss control is a simple “X” icon/button.
- Once dismissed, it never returns (no expiry).
- Store state in `localStorage` (new key can re‑enable in future).
- Add a **reset** control for admins only (in the footer, bottom‑right), which clears the localStorage flag so the banner reappears.

## Current implementation
- File: `apps/web/src/app/page.tsx`
- Current intro uses:
  - Rotated dashed badge headline (“Fresh Slop Daily”).
  - Subtext paragraph.
  - A date strip between dividers.

## Proposed structure
- New dismissible banner replaces the current intro block.
- Layout suggestion:
  - Top row: rotated title badge + dismiss “X” aligned right.
  - Body text (short paragraph).
  - Secondary callout in the date‑strip style, using the existing pill styling (replacing the actual date).
- Footer reset (admin only):
  - Small button in bottom‑right of the viewport.
  - Only rendered if the current user is an admin.
  - On click: remove the localStorage key and show the banner again.

## LocalStorage behavior
- Key: `slop:feedIntroDismissed`
- On mount: if key is true, hide banner.
- On dismiss: set key to true and hide immediately.
- No TTL or reappear logic.
- Reset button clears the key and re‑enables the banner.

## Implementation notes
- Use `useEffect` to read localStorage (client component).
- Avoid SSR mismatch: default to “hidden until loaded” or default visible and update after mount.
- Consider extracting a small component (`FeedIntroBanner`) inside `page.tsx` for clarity (optional).
- Admin detection likely via existing session hook (e.g., `useSession`) to check `role === "admin"`.

## Files to change
- `apps/web/src/app/page.tsx`

## QA checklist
- Banner shows on first visit.
- Clicking “X” hides it immediately.
- Refreshing the page keeps it hidden.
- Admin sees reset control bottom‑right; non‑admins never see it.
- Reset clears localStorage and banner reappears on the same session.
- Title retains rotated badge styling.
- Secondary callout uses the date‑strip style with new copy.

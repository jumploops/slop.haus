# Debug: Feed Hydration Mismatch from Client-Only Initial State

## Status

- **Type:** Investigation only (no runtime code changes)
- **Date:** 2026-03-03
- **Scope:** `apps/web` hydration mismatch on `/`

## Problem Statement

Frontend hydration fails on the feed page with:

- `Hydration failed because the server rendered HTML didn't match the client`
- Server markup shows the feed controls row first
- Client markup shows the intro banner first

The diff in the reported stack points to branch-level divergence in `FeedPage` (intro section vs controls section), which is a classic SSR/client initial-state mismatch.

## Investigation Findings

### 1) `FeedPage` initializes branch-driving state from browser-only APIs

In [apps/web/src/app/page.tsx](apps/web/src/app/page.tsx):

- `showIntro` is initialized by `getInitialShowIntro()`:
  - server: `false` (because `window` is unavailable)
  - client: derived from `localStorage` (`slop:feedIntroDismissed`)
- `displayMode` is initialized by `getInitialDisplayMode()`:
  - server: always `"list-lg"`
  - client: derived from `localStorage` + `matchMedia`

That means server HTML and first client render can diverge before hydration completes.

### 2) `showIntro` mismatch exactly explains the reported DOM branch mismatch

The error diff shows:

- server rendered controls row container
- client rendered intro banner container

This maps directly to `{showIntro && (...)}` in `FeedPage`.

### 3) `slopEnabled` can also diverge at hydration time

In [apps/web/src/lib/slop-mode.tsx](apps/web/src/lib/slop-mode.tsx):

- initial state reads `localStorage` on client
- server defaults to `true`

If a user has slop mode set to off, class names can differ across server/client render paths in multiple components (`Header`, `FeedPage`, etc.). This may not always throw immediately, but it increases hydration mismatch risk.

### 4) `useIsClient` itself is likely not the root cause here

[apps/web/src/hooks/useIsClient.ts](apps/web/src/hooks/useIsClient.ts) uses `useSyncExternalStore` with a stable server snapshot (`false`), which is hydration-safe by design. The current feed mismatch is primarily caused by localStorage-derived initial state in render-time initialization.

## Root Cause Hypothesis

High confidence:

- The feed page currently mixes SSR with client-specific initial state (`window`, `localStorage`, `matchMedia`) during initial render path selection.
- This causes different first render trees between server and browser and triggers hydration failure.

## Fix Options (2-5)

### Option 1: Deterministic SSR defaults + hydrate-after-mount reconciliation

Use SSR-safe defaults for first render (`showIntro=false`, `displayMode="list-lg"`, `slopEnabled=true`) and reconcile from storage after mount.

- Pros:
  - Smallest code change
  - Predictable initial HTML
- Cons:
  - Brief UI flip after hydration (intro may pop in)
  - Must handle lints around `setState` inside effects cleanly

### Option 2: `useSyncExternalStore` for persisted UI prefs (Recommended)

Move persisted UI preferences (`showIntro`, `displayMode`, `slopMode`) to hydration-safe external-store hooks.

- `getServerSnapshot` returns deterministic SSR defaults
- `getSnapshot` reads localStorage on client
- subscribe to `storage` and custom local events for updates

- Pros:
  - Hydration-safe without ad-hoc microtask workarounds
  - Scales across all localStorage-backed UI state
  - Keeps SSR benefits
- Cons:
  - More upfront refactor than Option 1
  - Requires a small shared abstraction for storage-backed preferences

### Option 3: Client-only rendering for mismatch-prone subtree

Render the feed content only after client hydration (or via `dynamic(..., { ssr: false })` for a subtree/page).

- Pros:
  - Eliminates hydration mismatch in that subtree
  - Simple mental model
- Cons:
  - Gives up SSR for that content
  - Worse initial render/SEO characteristics
  - Possible loading flash

### Option 4: Server-provided preference snapshot (cookie-backed)

Persist UI prefs in cookies (in addition to localStorage), read them server-side, and pass initial values into client components.

- Pros:
  - SSR and hydration both consistent
  - Minimal UI flip
- Cons:
  - More plumbing (cookie write/read + prop threading)
  - Duplicates persistence logic unless localStorage is replaced

### Option 5: `suppressHydrationWarning` / ignore mismatch (Not recommended)

Suppress warnings on divergent nodes.

- Pros:
  - Fastest short-term unblock
- Cons:
  - Masks real rendering divergence
  - Hydration still re-renders subtree and can cause subtle bugs

## Recommendation

Recommend **Option 2** (hydration-safe external-store hooks) as the clean long-term fix.

If we want the fastest safe patch first, do **Option 1** immediately for `FeedPage` and `SlopModeProvider`, then follow with Option 2 refactor to unify all persisted UI prefs.

## Suggested Verification (post-fix)

1. Hard-refresh `/` with `slop:feedIntroDismissed` unset and set to `"true"`.
2. Repeat with `slop:mode` set to `"on"` and `"off"`.
3. Validate no hydration warnings in dev console.
4. Confirm no branch-level DOM diff on first paint (intro row vs controls row).
5. Check mobile width where `list-lg` normalization to `list-sm` applies.

# Debug: Cookie Consent Buttons No-Op

## Status

- Type: investigation resolved
- Opened: 2026-03-09
- Updated: 2026-03-09
- Scope: root consent banner and privacy-preferences dialog interactions
- Resolution: confirmed root cause and fix implemented

## Problem Statement

The cookie-consent UI was visible, and the buttons still showed hover states, but the actions appeared to be no-ops:

- `Accept Cookies`
- `Reject`
- `Manage preferences`

An attempted guard in the shared modal around `dialog.showModal()` / `dialog.close()` did not resolve the issue, so the problem required a deeper review of the consent subtree.

## Files Reviewed

- [`apps/web/src/app/layout.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/layout.tsx)
- [`apps/web/src/app/providers.tsx`](/Users/adam/code/slop.haus/apps/web/src/app/providers.tsx)
- [`apps/web/src/components/privacy/ConsentManager.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx)
- [`apps/web/src/components/privacy/CookieConsentBanner.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookieConsentBanner.tsx)
- [`apps/web/src/components/privacy/CookiePreferencesDialog.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/CookiePreferencesDialog.tsx)
- [`apps/web/src/components/privacy/PrivacyChoicesButton.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/PrivacyChoicesButton.tsx)
- [`apps/web/src/components/ui/Button.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/ui/Button.tsx)
- [`apps/web/src/components/ui/Modal.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/ui/Modal.tsx)
- [`apps/web/src/lib/privacy/consent.ts`](/Users/adam/code/slop.haus/apps/web/src/lib/privacy/consent.ts)

## Current Implementation Map

### 1. Initial consent state is seeded on the server

`layout.tsx` reads the consent-context and consent-state cookies and passes them into `Providers`, which passes them into `ConsentManager`.

Implication:

- the first render is intended to be SSR-aligned rather than mounted client-only later

### 2. `ConsentManager` owns all consent UI state

`ConsentManager` currently owns:

- `bannerOpen`
- `preferencesOpen`
- `context`
- `consentState`

It also:

- listens for `OPEN_PRIVACY_CHOICES_EVENT`
- listens for `COOKIE_CONSENT_RESET_EVENT`
- persists decisions via `persistCookieConsentState(...)`
- emits `COOKIE_CONSENT_UPDATED_EVENT`

### 3. Banner buttons are thin pass-through handlers

`CookieConsentBanner` does not contain business logic. It simply calls:

- `onAccept`
- `onReject`
- `onManage`

Implication:

- if all three actions are no-ops, the issue is probably above the banner component itself or below it in shared event/hydration plumbing

### 4. `Manage preferences` depends on the shared `Modal`

The preferences UI is rendered through the shared `<Modal>` component, which uses native `<dialog>` plus `showModal()` / `close()`.

Important note:

- a guard was added so `showModal()` only runs when closed and `close()` only runs when open
- this did not fix the overall interaction bug

### 5. The consent subtree is mounted inside the global provider stack

The consent manager is mounted in `Providers` alongside:

- theme provider
- slop-mode provider
- SWR provider
- toast provider
- anonymous-auth bootstrap
- login-modal context

Implication:

- a provider-tree hydration/runtime issue can break consent interactivity even if the consent code itself looks correct

## Findings So Far

### 1. The bug is broader than `commitConsent(...)`

Because `Manage preferences` is also a no-op, the problem is not limited to cookie persistence or analytics event emission. The broken surface spans:

- state-closing actions (`Accept`, `Reject`)
- modal-opening action (`Manage preferences`)

That shifts suspicion away from only `persistCookieConsentState(...)` and toward:

- missing event attachment
- hydration/runtime failure
- subtree remount/reset behavior

### 2. The current `ConsentManager` does browser reads during render

`ConsentManager` now derives an `initialSnapshot` via `resolveInitialConsentSnapshot(...)`, which reads:

- `document.cookie`
- local storage consent state

during render on the client side.

Why this matters:

- this is a meaningful behavioral change from the simpler earlier shape
- it increases the chance of a client/server render mismatch or client-only render divergence
- if hydration fails for this subtree, the UI can remain visible while React handlers never attach

### 3. The failed modal guard weakens the native-dialog-only explanation

The modal was still worth guarding, but it does not explain why `Accept` and `Reject` also fail. At this point, native dialog behavior is probably:

- either a secondary issue
- or only one symptom of a broader hydration/runtime problem

### 4. Hover working but clicks doing nothing strongly suggests an attachment problem

The current symptom profile is important:

- CSS hover works
- button visuals render
- multiple click paths appear inert

That is a good match for:

- SSR HTML rendering successfully
- React interactivity not attaching or being broken after mount

It is a weaker match for:

- a single state-management bug in one handler
- a styling-only pointer-events issue

## Confirmed Root Cause

The issue was a hydration-state mismatch inside `ConsentManager`.

What was happening:

- the server rendered the banner open from `initialContext` + `initialConsentState`
- the client render immediately re-derived consent state from browser storage during render via `resolveInitialConsentSnapshot(...)`
- in the failing case, the client thought consent was already present and computed `bannerOpen: false`
- the user still saw the SSR banner markup on screen, but the client-managed React tree for the banner had already diverged

Observed confirmation from the temporary debug logs:

- `ConsentManager:state` reported `bannerOpen: false` and a populated `consentState`
- the user was still visually seeing the banner
- clicking the visible buttons produced no click logs at all

Interpretation:

- the visible banner was stale SSR markup, not the hydrated interactive React banner subtree
- this is why hover still worked but button handlers never fired

## Fix Applied

The fix was to make `ConsentManager` render from the server-seeded props first and defer any client-only persisted-consent reconciliation until after hydration.

Concretely:

- removed the render-time browser-state snapshot path from `ConsentManager`
- restored initial state to:
  - `bannerEnabled && initialContext.required && !initialConsentState`
  - `initialContext`
  - `initialConsentState`
- added a post-hydration reconciliation effect that only applies persisted browser consent after the initial render, and only when SSR did not already provide consent state

Relevant file:

- [`apps/web/src/components/privacy/ConsentManager.tsx`](/Users/adam/code/slop.haus/apps/web/src/components/privacy/ConsentManager.tsx)

## Confirmed Outcome

After the fix and temporary instrumentation:

- click logs fired for `Accept`
- `commitConsent(...)` executed
- cookie/localStorage persistence completed
- consent-updated event emission completed
- `ConsentManager` state transitioned from:
  - `bannerOpen: true, consentState: null`
  - to `bannerOpen: false, consentState: { ... }`

The consent banner is now interactive again.

## Hypotheses Outcome

### Confirmed

- The consent subtree was not hydrating cleanly because the client render diverged from the server render.

### Rejected or De-prioritized

- Native `<dialog>` behavior was not the primary cause.
- A simple `commitConsent(...)` persistence failure was not the primary cause.
- A pointer-events or z-index bug was not the primary cause.

## Ranked Hypotheses

### 1. The consent subtree is not hydrating cleanly

Confidence: high

Why:

- all three actions are broken, including the simple `setPreferencesOpen(true)` path
- the UI still renders and hovers, which is consistent with SSR markup remaining visible without working handlers
- `ConsentManager` now does browser-state reads during render, which is a plausible hydration-risk change

What to verify next:

- browser console for hydration/runtime errors tied to `ConsentManager`, `Providers`, or nearby client components
- temporary logs in `CookieConsentBanner` handlers to confirm whether clicks reach React

### 2. A render-time or mount-time error in the provider tree is breaking consent interactivity

Confidence: medium-high

Why:

- `ConsentManager` is mounted high in a shared client-provider subtree
- other nearby client systems include anonymous auth, analytics, toast context, and login modal state
- a provider-level runtime error can prevent this subtree from hydrating correctly

What to verify next:

- whether the consent subtree mounts successfully
- whether any nearby provider is throwing during hydration or passive effects

### 3. `ConsentManager` state updates are firing but the component is immediately being reset or remounted

Confidence: medium

Why:

- the provider tree is global
- consent state is seeded from SSR props plus browser reads
- a remount could recreate the initial banner state and make clicks appear to do nothing

What to verify next:

- mount/unmount logs for `ConsentManager`
- render logs around `bannerOpen` and `preferencesOpen`

### 4. The modal implementation is still contributing, but is not the primary root cause

Confidence: low-medium

Why:

- `Manage preferences` depends on the modal
- but `Accept` and `Reject` do not
- the modal guard attempt was not sufficient

What to verify next:

- whether `onManage` fires at all
- whether `preferencesOpen` changes even if the modal does not appear

### 5. A click-target or overlay issue is swallowing click events

Confidence: low

Why:

- hover works, which weakens the overlay explanation
- the banner has a higher z-index than the obvious fixed feed reset button
- no current evidence shows another visible overlay directly over the banner

What to verify next:

- inspect the actual event target in DevTools
- confirm no higher-z transparent overlay is intercepting pointer-up/click

### 6. Storage persistence or analytics event emission is throwing inside `commitConsent(...)`

Confidence: low

Why:

- this could explain `Accept` / `Reject`
- but it does not explain `Manage preferences`, which should only update local UI state

What to verify next:

- wrap or log inside `commitConsent(...)`
- confirm whether `persistCookieConsentState(...)` or `emitCookieConsentUpdated(...)` throws

## Suggested Next Validation Steps

These are the next checks I would run before choosing a fix:

1. Add temporary logging to the three banner handlers.
   - Goal: determine whether clicks reach React at all.
2. Add temporary mount/render logs to `ConsentManager`.
   - Goal: determine whether the component is hydrating, remounting, or resetting.
3. If handlers never fire:
   - treat this as a hydration/runtime-attachment issue first
   - inspect console for mount or hydration errors in the provider tree
4. If handlers do fire but state does not stick:
   - inspect for remount/reset behavior
   - inspect for exceptions inside `commitConsent(...)`
5. If only `Manage preferences` fails after that:
   - isolate `Modal` / native `<dialog>` behavior separately

## Follow-Up Notes

- The temporary consent debug logs used during diagnosis were removed after confirmation.
- The modal guard around `showModal()` / `close()` can remain; it was not the main fix, but it is still a reasonable safety check.

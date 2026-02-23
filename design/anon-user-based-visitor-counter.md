# Design Doc: 90s-Style Unique Visitor Counter in 2026 Using Better Auth Anonymous Plugin

## Summary

We will implement a classic “unique visitor” counter by giving every first-time browser an **anonymous Better Auth user + session cookie**, then incrementing a global counter **only when that anonymous user is first created** (not on every page view). The Better Auth **Anonymous plugin** is designed for this: it provides an authenticated experience without collecting PII, and supports linking the anonymous user to a real account later. ([Better Auth][1])

To reduce Postgres load for normal browsing, we will enable **Better Auth session cookie caching**, so “get session” checks can be validated from the cookie instead of querying the DB on each request. ([Better Auth][2])

---

## Goals

1. **Count “unique visitors” (per browser/device)** without page-view increments.
2. **Avoid Postgres queries on most requests** (especially session reads).
3. Support later **account linking** (anonymous → email/social/passkey), preserving in-app state like carts, drafts, etc. ([Better Auth][1])
4. Keep implementation simple enough to hand off to a dev to integrate quickly.

---

## Non-goals

* Perfect uniqueness across devices/browsers/incognito (cookie-based identity can’t do this).
* Bot-proof analytics.
* Replacing a full analytics platform.

---

## Assumptions

* You already run Better Auth with Postgres (AWS RDS), and you can add a plugin + run migrations.
* You have a single “auth server” (either inside Next.js API routes or in a separate Node service).
* Your “visitor counter” is an all-time counter (we’ll note daily/weekly as open questions).

---

## Background: Why Better Auth Anonymous Plugin

Better Auth Anonymous plugin:

* Creates a user/session without requiring email/password/OAuth/PII. ([Better Auth][1])
* Adds an `isAnonymous` field to the user schema. ([Better Auth][1])
* Exposes `signIn.anonymous()` on the client. ([Better Auth][1])
* If an anonymous user later signs in/up via another method, you can run `onLinkAccount` to migrate state. By default, the anonymous user record is deleted after linking. ([Better Auth][1])
* The plugin’s anonymous sign-in endpoint is `POST /sign-in/anonymous` (relative to your Better Auth base path). ([GitHub][3])
* It intentionally prevents “sign in anonymously again” when there’s already an active anonymous session. ([GitHub][3])

---

## High-level Architecture

### Flow A — First-time visitor

1. Browser loads site.
2. Client checks if a session exists.
3. If no session, client calls `authClient.signIn.anonymous()`. ([Better Auth][1])
4. Better Auth creates:

   * User row (`isAnonymous = true`)
   * Session row + session cookie
5. Our hook runs after `/sign-in/anonymous` succeeds and increments the visitor counter.

### Flow B — Returning visitor

1. Browser already has session cookie.
2. Session is validated using **cookie cache** (no DB read most of the time). ([Better Auth][2])
3. Visitor counter does **not** increment.

### Flow C — Visitor converts to real account

1. Anonymous user signs in/up via email/social/etc.
2. Anonymous plugin runs `onLinkAccount`, letting us transfer app data (cart, etc.). ([Better Auth][1])
3. Anonymous user record is deleted by default (configurable). ([Better Auth][1])
4. Visitor counter **does not** increment again.

---

## Data Model

### 1) Better Auth schema change (required)

Anonymous plugin requires adding this user field:

* `isAnonymous` (boolean, nullable per docs). ([Better Auth][1])

This is handled via Better Auth CLI migrate/generate. ([Better Auth][1])

### 2) Visitor counter storage (new, app-owned)

We want the counter read to be cheap and the write to be atomic. Two practical options:

**Option 2A (recommended for correctness): single-row counter table**

```sql
create table if not exists site_counters (
  key text primary key,
  value bigint not null
);

insert into site_counters(key, value)
values ('unique_visitors', 0)
on conflict (key) do nothing;
```

Increment:

```sql
update site_counters
set value = value + 1
where key = 'unique_visitors'
returning value;
```

Read:

```sql
select value
from site_counters
where key = 'unique_visitors';
```

This is simple, accurate, and works well for “mildly popular” traffic since it’s only hit on *new* visitors.

**Option 2B: Postgres sequence**
Faster per-increment, but depending on operational settings can complicate “exact count” semantics. Use only if you’re comfortable with sequence behavior.

---

## Implementation Plan

### Step 1 — Enable Anonymous plugin on the server

In your Better Auth server instance (commonly `src/lib/auth.ts` or similar per docs): ([Better Auth][4])

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  // existing config...
  plugins: [
    anonymous({
      // Recommended: set a clear domain for generated temp emails
      emailDomainName: "example.com",

      // Move anonymous user state -> new account state here
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Example: move cart items, drafts, etc from anonymousUser.user.id -> newUser.user.id
      },

      // Optional: decide whether anonymous user is auto-deleted on link
      // disableDeleteAnonymousUser: true,
    }),
  ],

  // Performance: reduce DB hits for getSession by validating via cookie most of the time
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
      // strategy: "compact" // default; smallest/fastest (see docs)
    },
  },
});
```

Notes:

* Anonymous plugin provides `/delete-anonymous-user`, and by default anonymous user is deleted when linking. ([Better Auth][1])
* If you set `disableDeleteAnonymousUser: true`, the anonymous user can no longer call `/delete-anonymous-user`. ([Better Auth][1])
* Cookie cache reduces DB calls but means session revocation may not be reflected until cache expires (maxAge). ([Better Auth][2])

### Step 2 — Run DB migration / generate schema

From the Anonymous plugin docs: ([Better Auth][1])

* If you use Better Auth’s built-in Kysely adapter, `migrate` can apply directly:

  * `npx @better-auth/cli migrate`
* For Prisma/Drizzle/etc, use:

  * `npx @better-auth/cli generate`
  * then apply via your ORM migration workflow

Also: Better Auth’s CLI “migrate” is only supported for the built-in Kysely adapter; other adapters should use “generate” and apply manually. ([Better Auth][5])

### Step 3 — Mount Better Auth handler (if not already)

If auth is inside Next.js App Router: ([Better Auth][4])

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

If auth is in a separate Node/Express service: ([Better Auth][4])

```ts
app.all("/api/auth/*", toNodeHandler(auth));
```

### Step 4 — Add Anonymous client plugin

In your Next.js client auth client (commonly `lib/auth-client.ts`):

> Note: The docs show `createAuthClient` from `better-auth/client` in the anonymous plugin page, but the installation guide shows React/Next apps often use `better-auth/react`. Both patterns exist in docs; the key requirement is to include `anonymousClient()` in the client plugins. ([Better Auth][4])

```ts
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // baseURL: process.env.NEXT_PUBLIC_AUTH_BASE_URL, // if auth is on a different domain
  plugins: [anonymousClient()],
});
```

### Step 5 — Ensure anonymous identity is created once (client-side)

We want this to happen:

* once per browser (when no session exists)
* not on every route transition
* safely, without spamming `signIn.anonymous()`

Better Auth documentation emphasizes: call client methods from the client side (server calls use `auth.api`). ([Better Auth][6])

Example component:

```tsx
// app/_components/EnsureAnonymous.tsx
"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";

export function EnsureAnonymous() {
  const ran = useRef(false);
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (ran.current) return;
    if (isPending) return;

    // Already have a session (anonymous or real) => do nothing
    if (session) {
      ran.current = true;
      return;
    }

    ran.current = true;

    // Create anonymous user + session cookie
    authClient.signIn.anonymous().catch((err) => {
      // Anonymous plugin rejects sign-in if an anonymous session already exists,
      // so treat failures as non-fatal.
      console.error("Anonymous sign-in failed", err);
    });
  }, [session, isPending]);

  return null;
}
```

Add this to `app/layout.tsx` so it runs on all pages:

```tsx
import { EnsureAnonymous } from "./_components/EnsureAnonymous";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnsureAnonymous />
        {children}
      </body>
    </html>
  );
}
```

Why this is safe:

* The anonymous endpoint is `/sign-in/anonymous` and the plugin blocks calling it again while an anonymous session is active. ([GitHub][3])

---

## Step 6 — Increment the visitor counter on successful anonymous sign-in

### Recommended approach: Better Auth **after hook** on `/sign-in/anonymous`

Better Auth hooks give you `ctx.path` and (in after hooks) `ctx.context.newSession`. ([Better Auth][7])
And the anonymous plugin endpoint path is `/sign-in/anonymous`. ([GitHub][3])

```ts
// lib/auth.ts
import { createAuthMiddleware } from "better-auth/api";
// import your db client/pool for Postgres

export const auth = betterAuth({
  // ...existing config...
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Only for brand-new anonymous sign-ins
      if (ctx.path !== "/sign-in/anonymous") return;

      const newSession = ctx.context.newSession;
      if (!newSession) return;

      // Optional belt-and-suspenders:
      // if (!newSession.user.isAnonymous) return;

      // Increment the counter (single-row counter table)
      await db.query(
        `update site_counters
         set value = value + 1
         where key = 'unique_visitors'`
      );
    }),
  },
});
```

Why this is better than “count on page view”:

* DB write happens only on “first visit per browser cookie”, not per request.

### Alternative: `databaseHooks.user.create.after`

Better Auth supports database hooks (before/after lifecycle), configurable via `databaseHooks`. ([Better Auth][8])
You could increment the counter for any new user where `isAnonymous = true`.

This can be cleaner if you want the counter to increment even when sign-in is initiated from server-side calls, but it may be broader than desired (any creation of anonymous users counts). Also, you must be careful if you write rows that depend on transactional state. (See “Open Questions”.)

---

## Step 7 — Serve the counter fast (without DB reads on every page view)

Even if the counter is stored in Postgres, you can avoid hitting Postgres from every client by making the counter endpoint cacheable.

### Endpoint design

* `GET /api/visitor-count`
* returns `{ value: number }`
* sets caching headers:

  * `Cache-Control: public, max-age=60, stale-while-revalidate=600`

This typically yields:

* DB read at most once/minute per CDN edge (or per browser), not per page view.

### UI

A 90s-style display can be:

* simple text (“You are visitor #12345”)
* an SVG image that looks like an odometer (optional)

(Implementation of the UI is straightforward once the number endpoint exists.)

---

## Account Linking Strategy

If you want to preserve “anonymous activity” (cart, drafts, etc.) across signup:

* Use `onLinkAccount` from the anonymous plugin. ([Better Auth][1])
* Move app-owned data keyed by anonymous user ID → new user ID.
* Expect the anonymous user to be deleted by default after linking, unless disabled. ([Better Auth][1])

---

## Security & Privacy Considerations

1. **Cookie-based identity** may fall under “tracking” depending on jurisdiction and how you use it (even though it’s auth/session oriented). Decide if you need a consent gate before calling `signIn.anonymous()`. (Open question.)
2. The anonymous plugin generates a temp email (customizable). ([Better Auth][1])
   If you integrate with systems that require a real email (billing/CRM), ensure you don’t trigger those flows for anonymous users.
3. Cookie cache tradeoff: revoked sessions may remain valid until cache expiration. ([Better Auth][2])
   For “visitor identity” this is usually fine.

---

## Testing Plan

### Local / staging tests

1. **Fresh browser profile**:

   * Load homepage → a user is created with `isAnonymous=true`
   * counter increments by 1
2. **Refresh / navigate**:

   * No further increments
3. **Link account**:

   * Sign up with email/social → `onLinkAccount` runs
   * counter does not increment
4. **Delete cookies**:

   * Load again → new anonymous user created; counter increments
5. **Concurrency**:

   * Simulate multiple first-time visits simultaneously → counter increments exactly once per first-time session creation

### Observability

* Log when `/sign-in/anonymous` succeeds and the counter is incremented.
* Track failure rate for `signIn.anonymous()` calls.

---

## Rollout Plan

1. Add plugin + schema migration in staging.
2. Enable cookie cache in staging (monitor for session issues). ([Better Auth][2])
3. Deploy client “EnsureAnonymous” component behind a feature flag.
4. Deploy counter increment hook.
5. Gradually enable to 10% / 50% / 100% traffic.

---

## Known Behaviors / Gotchas to Account For

* Anonymous plugin intentionally blocks calling anonymous sign-in again when an anonymous session is already active. ([GitHub][3])
  This is good for idempotency, but it means your client code should treat “already anonymous” failures as non-fatal.

* Better Auth “after hooks” provide `ctx.path` and a `ctx.context.newSession` only in after hooks, which we rely on. ([Better Auth][7])

---

## Open Questions

### Product/analytics semantics

1. Do we want **all-time unique visitors**, or **daily/weekly uniques** too?
- Just all time

2. Should we count **only engaged visitors** (e.g., after clicking/scrolling/accepting cookies), instead of counting every first load (which includes bots)?
- Nope, any anon user including bots

3. Should internal/admin users be excluded?
- No

### Auth & identity behavior

4. Do we need anonymous identity on **every page**, including marketing pages, or only when a user enters the “app” area?
- The whole site is an "app", we can revisit this later

5. If auth server is on a different domain/subdomain, confirm cookie and CORS/trusted-origin configuration (baseURL, trusted origins, cookie settings).
- This is already handled, the site is on one domain (slop.haus) and the api is on another (api.slop.haus)

### Data retention & cost

6. Do we want a cleanup job for anonymous users who never convert (e.g., delete after 30/90 days)?
- No

7. If we keep `disableDeleteAnonymousUser = true`, do we still want a separate “GDPR delete” flow? (Because anonymous users won’t be able to call `/delete-anonymous-user`.) ([Better Auth][1])
- No? What are the implications here?

### Implementation choices

8. Visitor counter storage: use the **single-row counter table** (accurate) vs a **sequence** (faster but trickier semantics).
- Single-row counter seems fine

9. Hooking strategy: use **after hook on `/sign-in/anonymous`** (tight scope) vs **databaseHooks.user.create.after** (broader but centralized). ([Better Auth][7])
- Probably on the user.create.after, in case users (i.e. agents/bots) can create accounts without visiting the site directly (i.e. via API auth)

10. Confirm Better Auth version: have there been anonymous-plugin edge cases in the version you’re pinned to? (If you’ve seen odd behavior, we should review the exact version and changelog.)
- We're not beholden to the current user

---

## Acceptance Criteria

* ✅ First-time browser increments the counter exactly once.
* ✅ Returning browser does not increment.
* ✅ Session reads don’t hammer Postgres due to cookie caching. ([Better Auth][2])
* ✅ Sign up/sign in links anonymous state and does not double-count. ([Better Auth][1])
* ✅ Counter endpoint is cacheable and cheap to serve.

---

If you want, I can also add a concrete “developer task list” (PR checklist style) and a suggested folder/file map for a typical Next.js App Router + separate Node API deployment—but the design above should already be directly implementable.

[1]: https://www.better-auth.com/docs/plugins/anonymous "Anonymous | Better Auth"
[2]: https://www.better-auth.com/docs/concepts/session-management "Session Management | Better Auth"
[3]: https://raw.githubusercontent.com/better-auth/better-auth/main/packages/better-auth/src/plugins/anonymous/index.ts "raw.githubusercontent.com"
[4]: https://www.better-auth.com/docs/installation "Installation | Better Auth"
[5]: https://www.better-auth.com/docs/concepts/database "Database | Better Auth"
[6]: https://www.better-auth.com/docs/basic-usage "Basic Usage | Better Auth"
[7]: https://www.better-auth.com/docs/concepts/hooks "Hooks | Better Auth"
[8]: https://www.better-auth.com/docs/reference/options "Options | Better Auth"


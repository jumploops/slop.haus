# GitHub Repo Picker Access Audit

## Question

Can a user only see repositories tied to their own linked GitHub account in the repo picker, and are we preventing global GitHub user/repo search from this UI?

## Short Answer

- **Yes**: the repo picker is session-bound and token-bound to the currently authenticated user.
- **Yes**: there is no current API/UI path in the picker flow to query arbitrary GitHub users or global GitHub search.

## Investigation Summary

### 1) Repo-list endpoint is authenticated and bound to current session

- `GET /auth/github/repos` is protected by `requireAuth()`:
  - `apps/api/src/routes/auth.ts:132`
- `requireAuth()` resolves session from request headers/cookies and rejects unauthenticated/anonymous users:
  - `apps/api/src/middleware/auth.ts:42`
  - `apps/api/src/middleware/auth.ts:98`

### 2) Server fetches repos with the current user’s GitHub token

- Route checks linked providers for `session.user.id`:
  - `apps/api/src/routes/auth.ts:133`
  - `apps/api/src/routes/auth.ts:135`
- Access token is acquired via Better Auth using request headers from that same session context:
  - `apps/api/src/routes/auth.ts:152`
  - `apps/api/src/routes/auth.ts:154`
- GitHub call is made to `/user/repos` (authenticated-user endpoint), not `/users/:username/repos` and not search API:
  - `apps/api/src/routes/auth.ts:46`
- Pagination follows `Link: rel="next"` only:
  - `apps/api/src/routes/auth.ts:29`
  - `apps/api/src/routes/auth.ts:78`

### 3) Frontend search is local filtering only (no upstream GitHub search)

- Picker fetches only `/auth/github/repos`:
  - `apps/web/src/components/submit/GitHubRepoPicker.tsx:25`
  - `apps/web/src/lib/api/auth.ts:69`
- Search box filters `data.repos` in-memory via `useMemo`, no network request:
  - `apps/web/src/components/submit/GitHubRepoPicker.tsx:29`
  - `apps/web/src/components/submit/GitHubRepoPicker.tsx:34`

### 4) Web API calls are session-cookie bound

- API client uses `credentials: "include"`:
  - `apps/web/src/lib/api.ts:46`

## Important Nuances

1. The repo list is not strictly “owner-only.”  
   We request:
   - `visibility=public`
   - `affiliation=owner,collaborator,organization_member`
   So users may see public repos they collaborate on or access via org membership, not just repos they own:
   - `apps/api/src/routes/auth.ts:47`
   - `apps/api/src/routes/auth.ts:49`

2. This restriction applies to the **repo picker flow** only.  
   URL/manual submission can still analyze arbitrary public URLs (including GitHub repos) if pasted directly:
   - `apps/api/src/routes/drafts.ts:65`
   - `apps/api/src/routes/drafts.ts:95`
   - `apps/api/src/routes/drafts.ts:101`

3. OAuth scope enforcement is not explicitly asserted in code at request time.  
   The route reads `tokenResult.scopes` but does not validate required scopes before calling GitHub:
   - `apps/api/src/routes/auth.ts:147`

## Conclusion

For the repo picker itself, current implementation does **not** provide global GitHub browsing/search and is tied to the authenticated user’s linked GitHub token. The main caveat is intentional: the returned set includes all public repos accessible to that account (owner/collaborator/org-member), not owner-only.

# Phase 2: Authentication

## Goal
Implement OAuth login with Google and GitHub, plus account linking.

## Tasks

### 2.1 Install and configure Better Auth
- Install `better-auth` and Drizzle adapter
- Configure with `experimental.joins: true` for performance
- Set up auth instance in packages/db or apps/api

### 2.2 Google OAuth
- Create Google Cloud OAuth credentials
- Configure callback URL
- Test login flow

### 2.3 GitHub OAuth
- Create GitHub OAuth app
- Configure callback URL
- Test login flow

### 2.4 Account linking flows
- Implement "Link GitHub" for Google-first users
- Implement "Link Google" for GitHub-first users
- **No auto-merge by email** - explicit linking only
- Store link in accounts table (same user_id, different provider)

### 2.5 Auth API routes
```
POST /api/v1/auth/login/google
POST /api/v1/auth/login/github
POST /api/v1/auth/logout
POST /api/v1/auth/link/google   (requires session)
POST /api/v1/auth/link/github   (requires session)
DELETE /api/v1/auth/unlink/:provider
GET /api/v1/auth/me
```

### 2.6 Session middleware
- Create middleware that validates session token
- Attach user to request context
- Helper: `requireAuth()` middleware
- Helper: `requireGitHub()` middleware (for submissions)

### 2.7 Frontend auth state
- Create auth context/hooks for web app
- Login/logout buttons
- "Link account" UI in settings

## Dependencies
- Phase 1 (auth tables exist)

## Output
- Users can sign in with Google or GitHub
- Users can link both providers to one account
- Session persists across requests
- Auth state available in frontend

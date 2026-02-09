# slop.haus Implementation Plan

## Overview

This plan breaks down the slop.haus design into 11 implementation phases. Each phase builds on the previous ones and delivers working functionality.

## Current Status: MVP Complete

**Last Updated:** 2026-01-10

All phases implemented and working. Remaining work is CSS polish and production hardening.

## Feature Plans

| Feature | Status | Description |
|---------|--------|-------------|
| [URL-First Onboarding](./url-first-onboarding/) | Not Started | Simplified submit flow: enter URL → auto-extract → review → submit |
| [Username System](./username-system/) | Proposed | Replace provider display names with usernames (GitHub prefill, Google generated), plus editable username UX |

## Phase Summary

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | [Bootstrap](./phase-0-bootstrap.md) | ✅ Complete | Monorepo setup, tooling, DB connection |
| 1 | [Schema](./phase-1-schema.md) | ✅ Complete | Drizzle schema for all tables |
| 2 | [Auth](./phase-2-auth.md) | ✅ Complete | OAuth (Google/GitHub), account linking |
| 3 | [Projects Core](./phase-3-projects-core.md) | ✅ Complete | Submit, list, detail APIs |
| 4 | [Voting](./phase-4-voting.md) | ✅ Complete | Anonymous voting, dual score channels |
| 5 | [Comments](./phase-5-comments.md) | ✅ Complete | Threaded HN-style comments |
| 5.5 | [Fixes](./phase-5.5-fixes.md) | ✅ Complete | Bug fixes and refinements |
| 6 | [Enrichment](./phase-6-enrichment.md) | ✅ Complete | Firecrawl screenshots, background jobs |
| 7 | [Moderation](./phase-7-moderation.md) | ✅ Complete | LLM moderation, flagging, mod queue |
| 8 | [Edit Staging](./phase-8-edit-staging.md) | ✅ Complete | Revision system for edits |
| 9 | [Frontend](./phase-9-frontend.md) | ✅ Complete | Next.js web application |
| 9.5 | [Enrichment Testing](./phase-9.5-enrichment-testing.md) | ✅ Complete | Firecrawl v2 integration |
| 10 | [Moderation Confidence](./phase-10-moderation-confidence.md) | ✅ Complete | Per-label confidence scoring |
| 10 | [Polish](./phase-10-polish.md) | ⚠️ Partial | CSS, mobile, production hardening |

## Recent Fixes (2026-01-10)

1. **Firecrawl v2** - Updated to handle URL-based screenshots (not base64)
2. **Better-auth roles** - Added `user.additionalFields` for role/devVerified in session
3. **Admin routing** - Fixed links to use `/admin` instead of `/admin/mod-queue`
4. **Storage paths** - Use absolute paths to avoid worker/API mismatch

See `debug/` directory for detailed debug reports.

## Recommended Build Order

### Milestone 1: Foundation (Phases 0-2) ✅
Get the basics running: monorepo, database, authentication.

### Milestone 2: Core Loop (Phases 3-5) ✅
Ship the core product: projects, voting, comments. This is a usable MVP.

### Milestone 3: Quality & Trust (Phases 6-8) ✅
Add enrichment, moderation, and edit staging for production quality.

### Milestone 4: Ship It (Phases 9-10) ✅
Build the frontend, validate enrichment, and harden for launch.

## Tech Stack Summary

- **Runtime:** Node.js + TypeScript
- **API:** Hono
- **Frontend:** Next.js 15 (App Router) + React 19
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth with Drizzle adapter
- **Enrichment:** Firecrawl API (v2)
- **Background Jobs:** Postgres-based job queue
- **Object Storage:** Local filesystem (S3/R2 for production)

## Key Design Decisions

1. **Anonymous voting** with cookie-based rater identity
2. **Dual score channels** (Normal + Dev) with separate rankings
3. **Dev credential issuance** for anonymous-but-gated dev votes
4. **Two-stage moderation**: sync LLM check + async post-enrichment
5. **Confidence-based moderation**: Per-label confidence (low/medium/high/absolute)
6. **Edit staging** via revisions table, not direct updates
7. **Threaded comments** with adjacency list + depth tracking

## Running Locally

```bash
# Install dependencies
pnpm install

# Start all services (in separate terminals)
pnpm --filter @slop/api dev      # API on :3001
pnpm --filter @slop/web dev      # Web on :3000
pnpm --filter @slop/worker dev   # Background worker

# Database
pnpm db:push                      # Apply schema changes
```

## Environment Setup

See `.env.example` for required variables. Key notes:
- `STORAGE_LOCAL_PATH` must be an absolute path
- OAuth callbacks go to API (port 3001), not frontend

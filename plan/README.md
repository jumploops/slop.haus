# slop.haus Implementation Plan

## Overview

This plan breaks down the slop.haus design into 11 implementation phases. Each phase builds on the previous ones and delivers working functionality.

## Phase Summary

| Phase | Name | Description | Depends On |
|-------|------|-------------|------------|
| 0 | [Bootstrap](./phase-0-bootstrap.md) | Monorepo setup, tooling, DB connection | - |
| 1 | [Schema](./phase-1-schema.md) | Drizzle schema for all tables | 0 |
| 2 | [Auth](./phase-2-auth.md) | OAuth (Google/GitHub), account linking | 1 |
| 3 | [Projects Core](./phase-3-projects-core.md) | Submit, list, detail APIs | 2 |
| 4 | [Voting](./phase-4-voting.md) | Anonymous voting, dual score channels | 3 |
| 5 | [Comments](./phase-5-comments.md) | Threaded HN-style comments | 2, 3 |
| 6 | [Enrichment](./phase-6-enrichment.md) | Firecrawl screenshots, background jobs | 3 |
| 7 | [Moderation](./phase-7-moderation.md) | LLM moderation, flagging, mod queue | 3, 5, 6 |
| 8 | [Edit Staging](./phase-8-edit-staging.md) | Revision system for edits | 3, 7 |
| 9 | [Frontend](./phase-9-frontend.md) | Next.js web application | 2-8 |
| 10 | [Polish](./phase-10-polish.md) | Performance, security, production | All |

## Recommended Build Order

### Milestone 1: Foundation (Phases 0-2)
Get the basics running: monorepo, database, authentication.

### Milestone 2: Core Loop (Phases 3-5)
Ship the core product: projects, voting, comments. This is a usable MVP.

### Milestone 3: Quality & Trust (Phases 6-8)
Add enrichment, moderation, and edit staging for production quality.

### Milestone 4: Ship It (Phases 9-10)
Build the frontend and harden for launch.

## Tech Stack Summary

- **Runtime:** Node.js + TypeScript
- **API:** Hono
- **Frontend:** Next.js 14+ (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth with Drizzle adapter
- **Enrichment:** Firecrawl API
- **Background Jobs:** Postgres-based job queue
- **Object Storage:** S3-compatible (R2, etc.)

## Key Design Decisions

1. **Anonymous voting** with cookie-based rater identity
2. **Dual score channels** (Normal + Dev) with separate rankings
3. **Dev credential issuance** for anonymous-but-gated dev votes
4. **Two-stage moderation**: sync LLM check + async post-enrichment
5. **Edit staging** via revisions table, not direct updates
6. **Threaded comments** with adjacency list + depth tracking

## Getting Started

Begin with Phase 0 to set up the development environment.

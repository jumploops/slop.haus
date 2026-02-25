# slop.haus

A showcase for vibecoded projects - apps built with AI assistance.

## Tech Stack

- **Frontend:** Next.js 15, React 19, SWR
- **Backend:** Hono, better-auth
- **Database:** PostgreSQL, Drizzle ORM
- **Worker:** Custom job queue (Postgres-based)
- **External:** Firecrawl (scraping), Claude (LLM)

## Project Structure

```
apps/
  api/       # Hono API server (port 3001)
  web/       # Next.js frontend (port 3000)
  worker/    # Background job processor
packages/
  db/        # Drizzle schema & migrations
  shared/    # Shared types & utilities
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Push database schema
pnpm db:push

# Reset and seed local database (destructive)
pnpm db:reset

# Seed without reset (non-destructive)
pnpm --filter @slop/db seed
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/slophaus
AUTH_SECRET=generate-a-random-string

# OAuth (at least one)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# External services
FIRECRAWL_API_KEY=       # For URL scraping
ANTHROPIC_API_KEY=       # For LLM analysis & moderation

# Storage (MVP)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads
STORAGE_PUBLIC_URL=http://localhost:3001/uploads

# URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
NEXT_PUBLIC_GA_MEASUREMENT_ID=   # Optional, format: G-XXXXXXXXXX
```

## Development

```bash
# Run all services (api, web, worker)
pnpm dev

# Database commands
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:push       # Push schema (dev)
pnpm db:studio     # Open Drizzle Studio
pnpm db:reset      # Reset + seed local DB (destructive)
```

`db:reset` is guarded to local DB hosts by default.  
Set `ALLOW_DB_RESET=1` to bypass the host check.

## Ports

| Service | Port |
|---------|------|
| Web     | 3000 |
| API     | 3001 |
| Worker  | N/A  |

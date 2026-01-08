# Phase 0: Project Bootstrap

## Goal
Set up the monorepo structure, tooling, and database connection.

## Tasks

### 0.1 Initialize pnpm monorepo
- Create root `package.json` with `"type": "module"`
- Create `pnpm-workspace.yaml` defining workspace packages
- Set up TypeScript config (`tsconfig.json` base + extends pattern)

### 0.2 Create package structure
```
apps/
  web/          # Next.js frontend
  api/          # Hono API server
packages/
  db/           # Drizzle schema + migrations
  shared/       # Shared types, Zod schemas, utilities
```

### 0.3 Set up packages/db
- Install drizzle-orm, drizzle-kit, postgres driver
- Create `drizzle.config.ts`
- Set up connection with environment variables
- Test connection

### 0.4 Set up apps/api
- Initialize Hono server
- Add CORS, logging middleware
- Health check endpoint
- Connect to database

### 0.5 Set up apps/web
- Initialize Next.js 14+ with App Router
- Configure to use packages/shared types
- Basic layout and home page placeholder

### 0.6 Developer tooling
- ESLint + Prettier configs
- `.env.example` with required vars
- Docker compose for local Postgres
- npm scripts for dev/build/migrate

## Dependencies
None (this is the foundation)

## Output
- Working monorepo where `pnpm dev` starts both api and web
- Database connection verified
- All packages can import from each other

# Developer Guidelines

Conventions and best practices for working on this repository.

## Project Structure

```
apps/
  api/       # Hono API server - routes, middleware, auth
  web/       # Next.js frontend - pages, components, hooks
  worker/    # Background jobs - handlers, scheduled tasks
packages/
  db/        # Drizzle schema, migrations, seed data
  shared/    # Shared types, schemas (zod), utilities
```

## Markdown-Based Planning

This project uses markdown documents for planning and debugging. **Always create planning docs before implementing complex features.**

### Directories

| Directory | Purpose | When to Use |
|-----------|---------|-------------|
| `plan/` | Feature implementation plans | Multi-phase features, architectural decisions |
| `debug/` | Investigation documents | Debugging issues, root cause analysis |
| `design/` | Design specs and mockups | UI/UX decisions, component designs |

### Planning Workflow

1. **Before implementing a feature:**
   - Create `plan/feature-name/README.md` with overview and phase breakdown
   - Create `plan/feature-name/phase-N-name.md` for each phase
   - Include status, files to change, code snippets, verification checklist

2. **When debugging issues:**
   - Create `debug/issue-name.md` before changing code
   - Document: problem, investigation steps, root cause, solution
   - This prevents repeated mistakes and documents tribal knowledge

3. **Update status** in plan docs as you complete phases

### Example Plan Structure

```
plan/url-first-onboarding/
  README.md           # Overview, phase table, dependencies
  phase-1-database.md # Status, tasks, files, code snippets
  phase-2-scraping.md
  ...
```

## Code Conventions

### API Routes (Hono)

```typescript
// apps/api/src/routes/example.ts
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";

const exampleRoutes = new Hono();

exampleRoutes.get("/", requireAuth(), async (c) => {
  const session = c.get("session");
  // ...
  return c.json({ data });
});

export { exampleRoutes };
```

### Database Queries (Drizzle)

```typescript
import { db } from "@slop/db";
import { tableName } from "@slop/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// Always filter soft-deleted records
const results = await db
  .select()
  .from(tableName)
  .where(and(
    eq(tableName.userId, userId),
    isNull(tableName.deletedAt)  // Soft delete pattern
  ));
```

### Frontend Components

```typescript
// apps/web/src/components/feature/ComponentName.tsx
"use client";  // Only if using hooks/interactivity

import { useState } from "react";

interface ComponentNameProps {
  // Props interface
}

export function ComponentName({ prop }: ComponentNameProps) {
  // Component implementation
}
```

### Shared Types

```typescript
// packages/shared/src/feature-types.ts
export interface FeatureType {
  // Shared between api, web, worker
}

// packages/shared/src/schemas.ts
export const featureSchema = z.object({
  // Zod schemas for validation
});
```

## Common Patterns

### Soft Delete

Tables with user data use soft delete (`deletedAt` timestamp):

```typescript
// Always exclude deleted records
.where(isNull(table.deletedAt))

// Soft delete instead of hard delete
.set({ deletedAt: new Date() })
```

### Job Queue

Background jobs use a Postgres-based queue:

```typescript
// Queue a job
await db.insert(jobs).values({
  type: "job_type",
  payload: { ... },
});

// Handler in apps/worker/src/handlers/
export async function handleJobType(payload: unknown): Promise<void> {
  // Process job
}

// Register in apps/worker/src/index.ts
registerHandler("job_type", handleJobType);
```

### API Client (Frontend)

```typescript
// apps/web/src/lib/api/feature.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function getFeature(): Promise<FeatureResponse> {
  const res = await fetch(`${API_BASE}/api/v1/feature`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}
```

### CSS Variables

Global CSS uses variables defined in `:root`. Always use them:

```css
/* Spacing: --spacing-1 through --spacing-8 (0.25rem to 2.5rem) */
padding: var(--spacing-4);

/* Colors */
background: var(--bg);
color: var(--fg);
border-color: var(--border);

/* Border radius */
border-radius: var(--radius);
```

## Things to Avoid

1. **Don't use undefined CSS variables** - Check `:root` in globals.css before using `var(--name)`

2. **Don't forget soft delete filters** - Always add `isNull(table.deletedAt)` to queries

3. **Don't use SDK packages when native fetch works** - This project uses native `fetch` for Anthropic API calls

4. **Don't create new files when editing existing ones works** - Prefer modifying existing code

5. **Don't add dependencies without checking if functionality exists** - Check packages/shared first

6. **Don't skip the planning phase** - Create plan docs for multi-file changes

## Type Checking

Run TypeScript checks per package using pnpm filter:

```bash
# API (Hono server)
pnpm -F @slop/api exec tsc --noEmit

# Worker (background jobs)
pnpm -F @slop/worker exec tsc --noEmit

# Web (Next.js) - has stricter JSX config
pnpm -F @slop/web exec tsc --noEmit

# Shared package
pnpm -F @slop/shared exec tsc --noEmit

# Database package
pnpm -F @slop/db exec tsc --noEmit
```

To preview errors without flooding the terminal:

```bash
pnpm -F @slop/web exec tsc --noEmit 2>&1 | head -50
```

## Environment

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Ports: web=3000, api=3001

## Progress Tracking

- `PROGRESS.md` - High-level feature progress
- `TODO.md` - Future enhancements backlog
- Plan docs have status fields - keep them updated

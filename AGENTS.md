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

### Theming System

The frontend uses Tailwind CSS v4 with semantic color tokens. All colors are themeable via CSS variables.

**Use semantic Tailwind utilities:**

```tsx
// DO - use semantic utilities
<div className="bg-bg text-fg border border-border">
  <span className="text-muted">Helper text</span>
  <button className="bg-accent text-accent-foreground">Primary</button>
</div>

// DON'T - use palette classes
<div className="bg-slate-900 text-gray-100">  // Bad!
```

**Available color utilities:**

| Utility | Purpose |
|---------|---------|
| `bg-bg`, `text-fg` | Primary background/foreground |
| `bg-bg-secondary` | Cards, inputs, elevated surfaces |
| `text-muted` | Secondary text |
| `border-border` | Borders and dividers |
| `bg-accent`, `text-accent` | Brand/interactive color |
| `bg-danger`, `text-danger` | Error states |
| `bg-warning`, `text-warning` | Warning states |
| `bg-success`, `text-success` | Success states |

**Use UI components:**

```tsx
import { Button, buttonVariants } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";

// Button as element
<Button variant="primary" size="md">Click me</Button>

// Button styles on a Link
<Link href="/foo" className={buttonVariants({ variant: "primary" })}>
  Go somewhere
</Link>

// Badge
<Badge variant="success">Published</Badge>
```

**Theme files:**

| File | Purpose |
|------|---------|
| `src/styles/theme.css` | Tailwind `@theme` token definitions |
| `src/styles/presets.css` | Preset theme overrides |
| `src/app/globals.css` | Base variables + page layouts |
| `src/styles/TOKEN-CONTRACT.md` | Full token documentation |

**Class merging:**

Always use `cn()` from `@/lib/utils` for conditional classes:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "p-4 rounded-md",
  isActive && "bg-accent",
  className
)} />
```

## Things to Avoid

1. **Don't use Tailwind palette classes** - Use semantic tokens (`bg-bg`, `text-fg`) not raw colors (`bg-slate-900`)

2. **Don't forget soft delete filters** - Always add `isNull(table.deletedAt)` to queries

3. **Don't use SDK packages when native fetch works** - This project uses native `fetch` for Anthropic API calls

4. **Don't create new files when editing existing ones works** - Prefer modifying existing code

5. **Don't add dependencies without checking if functionality exists** - Check packages/shared first

6. **Don't skip the planning phase** - Create plan docs for multi-file changes

7. **Don't create raw CSS classes** - Use Tailwind utilities or existing UI components

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

## Database Workflow

For local/dev environments, use Drizzle push (not migrate):

```bash
pnpm db:push
```

`pnpm db:migrate` is reserved for production/CI when applying tracked migrations.

### Migration Safety Rules

1. **Source of truth for production is tracked migrations, not `db:push`**
   - `db:push` is allowed for local iteration only.
   - Before merge/deploy, ensure required schema changes exist in tracked migrations.

2. **Never add/edit migration SQL without matching Drizzle metadata updates**
   - Keep `packages/db/drizzle/*.sql` and `packages/db/drizzle/meta/*` in sync.
   - If `drizzle-kit generate` fails, fix metadata chain issues before adding more migrations.
   - Migration files in `packages/db/drizzle/` must be committed to git.

3. **Run production migrations against the exact deployed DB URL**
   - Use environment-provided `DATABASE_URL` in CI/Render shell.
   - Do not rely on local `.env.prod` as deployment source of truth.

4. **Pre-deploy verification**
   - Confirm target DB host/db name from `DATABASE_URL`.
   - Confirm `drizzle.__drizzle_migrations` (or `public.__drizzle_migrations`) includes latest tag after migration.

5. **Production command**

```bash
pnpm db:migrate:prod
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

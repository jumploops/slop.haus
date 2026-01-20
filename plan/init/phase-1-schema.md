# Phase 1: Database Schema

## Goal
Define all core tables with Drizzle ORM.

## Tasks

### 1.1 Auth tables (Better Auth compatible)
```typescript
// users
- id: uuid primary key
- email: string (nullable, not unique - provider emails vary)
- name: string
- image: string (nullable)
- role: enum('user', 'mod', 'admin') default 'user'
- dev_verified: boolean default false
- created_at, updated_at

// accounts (OAuth providers)
- id: uuid
- user_id: uuid FK -> users
- provider: string ('google' | 'github')
- provider_account_id: string
- access_token, refresh_token, etc.
- unique(provider, provider_account_id)

// sessions
- id: uuid
- user_id: uuid FK -> users
- token: string unique
- expires_at: timestamp
```

### 1.2 Projects tables
```typescript
// projects
- id: uuid
- slug: string unique
- author_user_id: uuid FK -> users
- title: string
- tagline: string
- description: text
- main_url: string (nullable)
- repo_url: string (nullable)
- vibe_mode: enum('overview', 'detailed')
- vibe_percent: integer (0-100)
- vibe_details_json: jsonb (nullable)
- normal_up, normal_down, normal_score: integer defaults 0
- dev_up, dev_down, dev_score: integer defaults 0
- status: enum('published', 'hidden', 'removed') default 'published'
- created_at, updated_at, last_edited_at

// project_revisions
- id: uuid
- project_id: uuid FK -> projects
- status: enum('pending', 'approved', 'rejected')
- title, tagline, description, main_url, repo_url, vibe fields (all nullable - only changed fields)
- submitted_at, reviewed_at
- reviewer_user_id: uuid (nullable)

// project_media
- id: uuid
- project_id: uuid FK -> projects
- type: enum('screenshot', 'video')
- url: string
- source: enum('firecrawl', 'user_upload')
- is_primary: boolean
- created_at

// tools (lookup table)
- id: uuid
- name: string unique
- slug: string unique

// project_tools (junction)
- project_id: uuid FK
- tool_id: uuid FK
- primary key (project_id, tool_id)
```

### 1.3 Votes table
```typescript
// project_votes
- id: uuid
- project_id: uuid FK -> projects
- rater_type: enum('public', 'dev')
- rater_key_hash: string (hashed cookie value)
- value: integer (-1 or +1)
- created_at
- unique(project_id, rater_type, rater_key_hash)
```

### 1.4 Comments table
```typescript
// comments
- id: uuid
- project_id: uuid FK -> projects
- author_user_id: uuid FK -> users
- parent_comment_id: uuid FK -> comments (nullable)
- depth: integer default 0
- body: text
- status: enum('visible', 'hidden', 'removed') default 'visible'
- created_at, updated_at
```

### 1.5 Moderation tables
```typescript
// moderation_events
- id: uuid
- target_type: enum('project', 'comment', 'revision')
- target_id: uuid
- model: string (which LLM)
- labels: jsonb (classification results)
- decision: enum('approved', 'flagged', 'rejected')
- created_at

// flags
- id: uuid
- target_type: enum('project', 'comment')
- target_id: uuid
- user_id: uuid FK -> users
- reason: string
- created_at
- unique(target_type, target_id, user_id)
```

### 1.6 Jobs table (background processing)
```typescript
// jobs
- id: uuid
- type: string ('enrich_screenshot', 'enrich_readme', 'moderate_async')
- payload: jsonb
- status: enum('pending', 'processing', 'completed', 'failed')
- attempts: integer default 0
- max_attempts: integer default 3
- run_at: timestamp
- started_at, completed_at
- error: text (nullable)
- created_at
```

### 1.7 Favorites table
```typescript
// favorites
- user_id: uuid FK -> users
- project_id: uuid FK -> projects
- created_at
- primary key (user_id, project_id)
```

## Dependencies
- Phase 0 complete

## Output
- All Drizzle schema files in packages/db/schema/
- Initial migration generated and applied
- Type exports for use in api/web

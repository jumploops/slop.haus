# URL-First Onboarding Flow

**Project:** slop.haus — vibecoded app showcase & rating site
**Doc status:** Draft
**Date:** 2026-01-10

---

## 1) Problem Statement

### Current Flow (Form-First)

```
User fills out form → Submits → Project created → Async enrichment
```

**Issues:**
- Verbose form with many required fields upfront
- User must manually enter title, tagline, description, vibe score, tools
- Enrichment (screenshots, README) happens AFTER submission
- No immediate feedback on URL content
- Higher cognitive load = higher abandonment

### Proposed Flow (URL-First)

```
User enters URL → Immediate scraping → LLM extracts fields → User reviews/edits → Submits
```

**Benefits:**
- Single text input to start
- Immediate visual feedback (loading state → preview)
- Auto-populated fields reduce typing
- User reviews/confirms AI's best-guess
- Same data quality, lower friction

---

## 2) User Experience Flow

### Step 1: URL Input
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Share your vibecoded project                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Enter URL (live site, GitHub, Chrome Store, etc.) _ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Analyze Project]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Simple single input
- Placeholder hints at accepted URL types
- Auth check happens here (must have GitHub linked)

### Step 2: Analysis in Progress
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Analyzing: github.com/user/cool-project                    │
│                                                             │
│  [■■■■■□□□□□] Scraping page...                              │
│                                                             │
│  ✓ Detected: GitHub Repository                              │
│  ○ Extracting README...                                     │
│  ○ Analyzing content...                                     │
│  ○ Generating preview...                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Real-time progress updates (via SSE or polling)
- Shows detected URL type
- Progress steps provide transparency

### Step 3: Review & Edit Draft
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Review Your Project                                        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [Screenshot Preview]                                │    │
│  │                                                     │    │
│  │                  Change screenshot ↗               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Title: [Cool Project_____________________________]         │
│  Tagline: [AI-powered widget for doing things____]         │
│                                                             │
│  Description:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ A tool for automating repetitive tasks using       │   │
│  │ natural language processing and...                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Links:                                                     │
│  Live URL: [https://coolproject.com___________________]     │
│  Repo URL: [https://github.com/user/cool-project______]     │
│                                                             │
│  Tags (detected):                                           │
│  [TypeScript ✕] [React ✕] [OpenAI ✕] [+ Add tag]           │
│                                                             │
│  Vibe Score:                                                │
│  [■■■■■■■■□□] 80% AI                                        │
│                                                             │
│  [Submit Project]              [Start Over]                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- All fields editable
- Screenshot can be re-captured or replaced
- Tags shown as removable chips with add functionality
- Vibe score defaults to a sensible value (can be edited)

---

## 3) URL Detection & Classification

### Supported URL Types

| Type | Pattern Examples | Primary Data Source |
|------|-----------------|---------------------|
| **GitHub** | `github.com/*`, `raw.githubusercontent.com/*` | README.md, repo metadata |
| **GitLab** | `gitlab.com/*` | README.md, repo metadata |
| **Live Site** | Any other HTTPS URL | Page content, OG tags, screenshot |
| **Chrome Web Store** | `chrome.google.com/webstore/*` | Extension page, screenshots |
| **Steam** | `store.steampowered.com/app/*` | Game page, screenshots |
| **npm** | `npmjs.com/package/*` | Package page, README |
| **PyPI** | `pypi.org/project/*` | Package page, README |

### Detection Logic

```typescript
type UrlType =
  | "github"
  | "gitlab"
  | "npm"
  | "pypi"
  | "chrome_webstore"
  | "steam"
  | "live_site";

interface DetectedUrl {
  type: UrlType;
  originalUrl: string;
  canonicalUrl: string;
  isRepo: boolean;  // true for github, gitlab, npm, pypi
  isStorefront: boolean;  // true for chrome_webstore, steam
}

function detectUrlType(url: string): DetectedUrl {
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();

  if (host === "github.com" || host === "www.github.com") {
    return { type: "github", isRepo: true, ... };
  }
  if (host === "gitlab.com" || host === "www.gitlab.com") {
    return { type: "gitlab", isRepo: true, ... };
  }
  if (host === "npmjs.com" || host === "www.npmjs.com") {
    return { type: "npm", isRepo: true, ... };
  }
  // ... etc

  return { type: "live_site", isRepo: false, ... };
}
```

### URL Normalization

- Remove trailing slashes
- Remove query params (except for Chrome Web Store IDs, Steam app IDs)
- Normalize `www.` prefix
- Handle mobile URLs (e.g., `m.github.com`)

---

## 4) Scraping Strategy by URL Type

### GitHub/GitLab Repositories

**Data to Extract:**
1. **README content** (markdown) → description, tagline
2. **Repo metadata** → title (repo name)
3. **Languages** → auto-detect tools/tags
4. **Topics/Tags** → auto-detect tools/tags
5. **Homepage URL** → populate `mainUrl` if exists

**Firecrawl Call:**
```typescript
{
  url: "https://github.com/user/project",
  formats: ["markdown"],
  onlyMainContent: false,  // Need full page for metadata
}
```

**Additional API Call (GitHub):**
```typescript
// If we want richer metadata, hit GitHub API directly
GET /repos/{owner}/{repo}
→ name, description, homepage, topics, languages_url
```

### Live Sites

**Data to Extract:**
1. **Screenshot** → primary media
2. **OG tags** → title, description, image
3. **Page content** → tagline extraction
4. **Tech detection** → tools/tags (Wappalyzer-style)

**Firecrawl Call:**
```typescript
{
  url: "https://example.com",
  formats: [
    "markdown",
    {
      type: "screenshot",
      fullPage: false,
      viewport: { width: 1280, height: 800 }
    }
  ],
  onlyMainContent: true,
}
```

### Chrome Web Store

**Data to Extract:**
1. **Extension name** → title
2. **Short description** → tagline
3. **Full description** → description
4. **Screenshots** → primary media
5. **Category** → tags

### npm/PyPI

**Data to Extract:**
1. **Package name** → title
2. **Description** → tagline
3. **README** → description
4. **Keywords/classifiers** → tags
5. **Repository URL** → populate `repoUrl`

---

## 5) LLM Field Extraction

### Claude Haiku Prompt

```typescript
const EXTRACTION_PROMPT = `You are extracting structured metadata from a web page or repository for a developer project showcase.

Given the following content scraped from a URL, extract the project information.

URL: {URL}
URL Type: {URL_TYPE}
Content:
"""
{SCRAPED_CONTENT}
"""

{METADATA_IF_AVAILABLE}

Extract the following fields as JSON:

{
  "title": "Short project name (max 100 chars)",
  "tagline": "One-sentence description (max 200 chars)",
  "description": "Longer description, 2-4 sentences (max 500 chars)",
  "detectedTools": ["array", "of", "detected", "technologies"],
  "suggestedVibePercent": 50,
  "linkedUrls": {
    "mainUrl": "live site URL if found",
    "repoUrl": "repository URL if found"
  }
}

Guidelines:
- title: Use the actual project name, not the org/user prefix
- tagline: Capture the core value proposition in one sentence
- description: Expand on tagline with key features/use cases
- detectedTools: Include programming languages, frameworks, APIs, services detected
- suggestedVibePercent: Estimate 0-100 based on content (0=fully human, 100=fully AI)
  - Look for mentions of AI tools, generated code, vibecoding
  - If no AI indicators, suggest 50 as neutral default
- linkedUrls: Extract any URLs mentioned (homepage, repo, demo links)

Respond ONLY with valid JSON.`;
```

### Tool Detection from Content

**Method 1: Direct Mentions**
- Scan README/content for technology names
- Match against our `tools` database

**Method 2: Language Detection (GitHub)**
- Use GitHub API `/repos/{owner}/{repo}/languages`
- Map to tool slugs: `TypeScript` → `typescript`, `Python` → `python`

**Method 3: Package Manifest Analysis (future)**
- Parse `package.json` → dependencies
- Parse `requirements.txt`, `Cargo.toml`, etc.
- Map packages to tool slugs

### Vibe Score Estimation

**Initial Approach (MVP):**
- Default to 50% (neutral)
- Look for AI mentions in content:
  - "built with GPT", "Claude", "Copilot", "AI-generated", "vibecoded"
  - If found → suggest 70-90%
  - If explicitly human-coded → suggest 20-40%

**Future Enhancement (out of scope):**
- Analyze actual code structure
- Detect AI-generated patterns
- Use commit history patterns

---

## 6) Database Schema Changes

### New Table: `enrichment_drafts`

Store the scraped/analyzed data before user confirms submission.

```sql
CREATE TABLE enrichment_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,

  -- Input
  input_url TEXT NOT NULL,
  detected_url_type VARCHAR(50) NOT NULL,

  -- Scraped Data (raw)
  scraped_content JSONB,
  scraped_metadata JSONB,
  screenshot_url TEXT,  -- Temporary storage URL

  -- LLM Extracted Fields (suggested)
  suggested_title VARCHAR(255),
  suggested_tagline VARCHAR(500),
  suggested_description TEXT,
  suggested_tools JSONB,  -- ["typescript", "react", ...]
  suggested_vibe_percent INTEGER,
  suggested_main_url TEXT,
  suggested_repo_url TEXT,

  -- User Edits (final values before submit)
  final_title VARCHAR(255),
  final_tagline VARCHAR(500),
  final_description TEXT,
  final_tools JSONB,
  final_vibe_percent INTEGER,
  final_main_url TEXT,
  final_repo_url TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, scraping, analyzing, ready, submitted, expired
  error TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP  -- Auto-cleanup after 24 hours
);

CREATE INDEX idx_enrichment_drafts_user_id ON enrichment_drafts(user_id);
CREATE INDEX idx_enrichment_drafts_status ON enrichment_drafts(status);
CREATE INDEX idx_enrichment_drafts_expires_at ON enrichment_drafts(expires_at);
```

### Modified: `jobs` table

Add new job types:
- `scrape_url` - Initial URL scraping
- `analyze_content` - LLM extraction

```typescript
type JobType =
  | "enrich_screenshot"
  | "enrich_readme"
  | "moderate_async"
  | "scrape_url"      // NEW
  | "analyze_content" // NEW
```

---

## 7) API Design

### POST `/api/v1/drafts/analyze`

Start the URL analysis process.

**Request:**
```json
{
  "url": "https://github.com/user/project"
}
```

**Response (202 Accepted):**
```json
{
  "draftId": "uuid",
  "status": "scraping",
  "detectedUrlType": "github",
  "estimatedTime": 15
}
```

**Errors:**
- `400` - Invalid URL format
- `401` - Not authenticated
- `403` - GitHub not linked
- `422` - URL blocked (known bad patterns)

### GET `/api/v1/drafts/:draftId`

Get current draft status and data.

**Response (pending/scraping/analyzing):**
```json
{
  "draftId": "uuid",
  "status": "analyzing",
  "progress": {
    "scraping": "completed",
    "analyzing": "in_progress"
  }
}
```

**Response (ready):**
```json
{
  "draftId": "uuid",
  "status": "ready",
  "inputUrl": "https://github.com/user/project",
  "detectedUrlType": "github",
  "screenshot": "https://storage.../screenshot.png",
  "suggested": {
    "title": "Cool Project",
    "tagline": "An AI-powered widget",
    "description": "Full description...",
    "tools": ["typescript", "react", "openai"],
    "vibePercent": 75,
    "mainUrl": "https://coolproject.com",
    "repoUrl": "https://github.com/user/project"
  }
}
```

### PATCH `/api/v1/drafts/:draftId`

Update draft with user edits (before final submit).

**Request:**
```json
{
  "title": "My Edited Title",
  "tagline": "My edited tagline",
  "tools": ["typescript", "react"],
  "vibePercent": 80
}
```

### POST `/api/v1/drafts/:draftId/submit`

Convert draft to actual project submission.

**Request:**
```json
{
  "vibeMode": "overview"
}
```

**Response:**
Same as current `POST /api/v1/projects` response.

**Process:**
1. Read final_* fields from draft (or suggested_* as fallback)
2. Create project using existing logic
3. Mark draft as `submitted`
4. Redirect to `/p/{slug}`

### GET `/api/v1/drafts/:draftId/events` (SSE)

Real-time updates during analysis.

**Event types:**
```
event: status
data: {"status": "scraping", "message": "Fetching page content..."}

event: status
data: {"status": "analyzing", "message": "Extracting project details..."}

event: progress
data: {"step": "screenshot", "status": "completed"}

event: complete
data: {"draftId": "uuid"}

event: error
data: {"error": "Failed to scrape URL", "code": "SCRAPE_FAILED"}
```

---

## 8) Job Processing Flow

### Job: `scrape_url`

**Payload:**
```json
{
  "draftId": "uuid",
  "url": "https://github.com/user/project",
  "urlType": "github"
}
```

**Process:**
1. Call Firecrawl with appropriate config for URL type
2. Store raw content in `enrichment_drafts.scraped_content`
3. Store metadata in `enrichment_drafts.scraped_metadata`
4. If screenshot captured, store URL
5. Update draft status to `analyzing`
6. Queue `analyze_content` job

### Job: `analyze_content`

**Payload:**
```json
{
  "draftId": "uuid"
}
```

**Process:**
1. Load draft with scraped content
2. Build LLM prompt with content + metadata
3. Call Claude Haiku
4. Parse JSON response
5. Update draft with `suggested_*` fields
6. Match detected tools against `tools` table
7. Update draft status to `ready`

---

## 9) Frontend Components

### New Components

```
apps/web/src/
├── app/
│   └── submit/
│       ├── page.tsx              # Refactored to URL-first
│       └── draft/[draftId]/
│           └── page.tsx          # Review/edit draft
├── components/
│   └── submit/
│       ├── UrlInput.tsx          # Step 1: URL input
│       ├── AnalysisProgress.tsx  # Step 2: Loading state
│       ├── DraftReview.tsx       # Step 3: Review/edit
│       ├── ScreenshotPreview.tsx # Screenshot display/replace
│       └── TagEditor.tsx         # Add/remove tags
```

### Component: `UrlInput`

```tsx
interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

function UrlInput({ onAnalyze, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    try {
      new URL(url); // Basic validation
      onAnalyze(url);
    } catch {
      setError("Please enter a valid URL");
    }
  };

  return (
    <div className="url-input">
      <label>Share your vibecoded project</label>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL (live site, GitHub, Chrome Store, etc.)"
        disabled={isLoading}
      />
      <button onClick={handleSubmit} disabled={isLoading || !url}>
        {isLoading ? "Analyzing..." : "Analyze Project"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### Component: `AnalysisProgress`

```tsx
interface AnalysisProgressProps {
  draftId: string;
  detectedType: UrlType;
  onComplete: () => void;
  onError: (error: string) => void;
}

function AnalysisProgress({ draftId, detectedType, onComplete, onError }) {
  const [steps, setSteps] = useState({
    scraping: "in_progress",
    analyzing: "pending",
  });

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/api/v1/drafts/${draftId}/events`
    );

    eventSource.addEventListener("progress", (e) => {
      const data = JSON.parse(e.data);
      setSteps(prev => ({ ...prev, [data.step]: data.status }));
    });

    eventSource.addEventListener("complete", () => {
      onComplete();
      eventSource.close();
    });

    eventSource.addEventListener("error", (e) => {
      onError(JSON.parse(e.data).error);
      eventSource.close();
    });

    return () => eventSource.close();
  }, [draftId]);

  return (
    <div className="analysis-progress">
      <h2>Analyzing: {detectedType}</h2>
      <ProgressStep label="Scraping page" status={steps.scraping} />
      <ProgressStep label="Extracting details" status={steps.analyzing} />
    </div>
  );
}
```

### Component: `DraftReview`

Reuses existing form components (`VibeInput`, `ToolsSelector`) but pre-populated.

---

## 10) Migration & Rollout Strategy

### Phase 1: Backend Infrastructure (MVP)
1. Add `enrichment_drafts` table
2. Add new job types
3. Implement `/api/v1/drafts/*` endpoints
4. Add Haiku integration for content extraction

### Phase 2: Frontend Refactor
1. Replace `/submit` page with URL-first flow
2. Add new components
3. Keep old form available via "Manual entry" link (fallback)

### Phase 3: Polish
1. SSE for real-time progress
2. Screenshot replacement UI
3. Better error handling
4. URL validation improvements

### Backward Compatibility

- Existing projects unaffected
- Old submit form available at `/submit/manual` (optional)
- API endpoint `POST /projects` still works for direct submissions

---

## 11) Error Handling

### Scraping Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| URL unreachable | "Couldn't reach this URL. Check it's correct and publicly accessible." | Allow retry |
| Rate limited | "Too many requests. Please wait a moment and try again." | Auto-retry with backoff |
| Timeout | "The page took too long to load. Try again?" | Allow retry |
| Blocked by robots.txt | "This site doesn't allow automated access." | Allow manual entry |
| CAPTCHA detected | "This page requires human verification." | Suggest manual entry |

### Analysis Errors

| Error | User Message | Recovery |
|-------|--------------|----------|
| LLM timeout | "Analysis took too long. Retrying..." | Auto-retry once |
| Parse failure | "Couldn't extract project details." | Show partial data + manual entry |
| Empty content | "Page doesn't have enough content to analyze." | Prompt manual entry |

---

## 12) Security Considerations

### URL Validation
- Block internal IPs (127.0.0.1, 10.x.x.x, 192.168.x.x)
- Block file:// and other non-http(s) protocols
- Rate limit per user (5 analyses per hour)
- Block known malicious domains

### Content Limits
- Max scraped content: 100KB
- Max screenshot size: 5MB
- Draft expiry: 24 hours

### LLM Safety
- Use existing moderation on LLM output
- Don't trust LLM-suggested URLs without validation
- Sanitize all output before storing

---

## 13) Metrics & Analytics

### Track
- URL analysis completion rate
- Time to complete (scraping + analysis)
- LLM extraction accuracy (user edit rate per field)
- Most common URL types submitted
- Error rates by URL type

### Success Criteria
- 80%+ of users complete URL-first flow without falling back to manual
- Average submission time reduced by 50%
- Field edit rate < 30% (LLM doing good job)

---

## 14) Future Enhancements (Out of Scope)

### Code Analysis for Vibe Score
- Clone repo
- Analyze code patterns
- Detect AI-generated code signatures
- Compute vibe score from code

### Multi-URL Support
- Accept multiple URLs at once
- Combine live site + repo in single analysis

### Browser Extension
- One-click submit from any page
- Auto-fill URL from current tab

### Social Proof Detection
- Extract GitHub stars, npm downloads
- Show on project page

---

## 15) Implementation Checklist

### Backend
- [ ] Create `enrichment_drafts` table migration
- [ ] Add `scrape_url` job handler
- [ ] Add `analyze_content` job handler
- [ ] Add Claude Haiku integration
- [ ] Implement `/api/v1/drafts` endpoints
- [ ] Add SSE endpoint for progress
- [ ] Add draft expiry cleanup job
- [ ] Add URL validation/blocking

### Frontend
- [ ] Create `UrlInput` component
- [ ] Create `AnalysisProgress` component
- [ ] Create `DraftReview` component
- [ ] Create `ScreenshotPreview` component
- [ ] Create `TagEditor` component
- [ ] Refactor `/submit` page
- [ ] Add `/submit/draft/[draftId]` route
- [ ] Add manual entry fallback link

### Testing
- [ ] Unit tests for URL detection
- [ ] Unit tests for LLM extraction parsing
- [ ] Integration tests for full flow
- [ ] E2E tests for submit journey

---

## 16) Appendix: Current vs New Flow Comparison

### Current Flow
```
1. User navigates to /submit
2. User fills: title, tagline, description, mainUrl, repoUrl, vibeMode, vibePercent, tools
3. User clicks Submit
4. Backend validates, creates project, queues enrichment jobs
5. User redirected to /p/{slug}
6. Worker scrapes URL, updates screenshot/description asynchronously
```

### New Flow
```
1. User navigates to /submit
2. User enters: URL only
3. User clicks Analyze
4. Backend creates draft, queues scrape job
5. User sees progress indicator
6. Worker scrapes URL
7. Worker analyzes content with LLM
8. User sees pre-filled form
9. User reviews/edits fields
10. User clicks Submit
11. Backend creates project from draft
12. User redirected to /p/{slug}
```

### Key Differences

| Aspect | Current | New |
|--------|---------|-----|
| Initial input | ~8 fields | 1 field |
| Scraping timing | After submit | Before submit |
| User effort | High (fill everything) | Low (review/confirm) |
| Screenshot preview | None until after submit | Shown before submit |
| Tag suggestions | None | AI-detected |
| Vibe score | User guesses | AI suggests |
| Fallback | N/A | Manual entry available |

---

## 17) Open Questions

1. **Draft storage location**: Use same storage for temporary screenshots, or separate temp bucket?

2. **Draft sharing**: Should users be able to share a draft URL before submitting? (Probably no for MVP)

3. **Retry UX**: If analysis fails, should we auto-retry once or immediately show error?

4. **Tool matching**: Fuzzy match detected tools against DB, or require exact matches?

5. **Rate limits**: 5 analyses/hour reasonable? Should verified devs get higher limits?

---

## 18) References

- [Firecrawl API Docs](https://docs.firecrawl.dev/api-reference/endpoint/scrape)
- [Claude Haiku Pricing](https://www.anthropic.com/pricing) - ~$0.25/1M input, $1.25/1M output
- Current submit flow: `apps/web/src/app/submit/page.tsx`
- Current enrichment: `apps/worker/src/handlers/enrich-*.ts`
- Current validation: `packages/shared/src/schemas.ts`

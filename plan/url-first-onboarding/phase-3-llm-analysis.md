# Phase 3: LLM Analysis

## Status: ✅ Complete (2026-01-11)

**Implementation Notes:**
- Created `buildExtractionPrompt()` for structured metadata extraction
- Created `matchToolsToDatabase()` with alias support for common tool names
- Created `handleAnalyzeContent` job handler that:
  - Calls Claude 3.5 Haiku with scraped content
  - Parses JSON response with markdown wrapper handling
  - Matches detected tools to database entries
  - Sets appropriate mainUrl/repoUrl based on input URL type
  - Transitions draft status to "ready" on success
- Used native fetch (consistent with moderation.ts) instead of @anthropic-ai/sdk
- Registered handler in worker

## Goal

Implement Claude Haiku integration to extract structured project metadata from scraped content.

## Dependencies

- Phase 1 complete (database schema)
- Phase 2 complete (scraping populates `scraped_content`)

## Tasks

### 3.1 Create Extraction Prompt

**File:** `apps/worker/src/lib/extraction-prompt.ts`

```typescript
import type { UrlType } from "@slop/shared";

export function buildExtractionPrompt(
  url: string,
  urlType: UrlType,
  scrapedContent: { markdown?: string; links?: string[] },
  metadata: Record<string, unknown>
): string {
  const content = scrapedContent.markdown || "";
  const truncatedContent = content.slice(0, 15000); // Limit context size

  const metadataSection = Object.keys(metadata).length > 0
    ? `\nPage Metadata:\n${JSON.stringify(metadata, null, 2)}`
    : "";

  return `You are extracting structured metadata from a web page or repository for a developer project showcase site called slop.haus.

Given the following content scraped from a URL, extract project information.

URL: ${url}
URL Type: ${urlType}
${metadataSection}

Page Content:
"""
${truncatedContent}
"""

Extract the following fields as JSON:

{
  "title": "Short project name (max 100 chars, no org prefix like 'user/')",
  "tagline": "One-sentence value proposition (max 200 chars)",
  "description": "2-4 sentence description of what it does and why (max 500 chars)",
  "detectedTools": ["array", "of", "detected", "technologies"],
  "suggestedVibePercent": 50,
  "linkedUrls": {
    "mainUrl": "live demo/site URL if found, or null",
    "repoUrl": "source code repository URL if found, or null"
  }
}

Guidelines:

**title**: Extract the actual project name.
- For GitHub: Use repo name, not "owner/repo"
- For npm: Use package name
- Remove emojis and special characters
- Capitalize appropriately

**tagline**: Capture the core value in one sentence.
- What does this project DO?
- Start with a verb or "A tool for..." / "An app that..."
- Be specific, not generic

**description**: Expand with key features.
- 2-4 sentences max
- Mention 1-2 key features or use cases
- Avoid marketing fluff

**detectedTools**: List technologies mentioned or detected.
- Programming languages (TypeScript, Python, Rust, etc.)
- Frameworks (React, Next.js, FastAPI, etc.)
- APIs/Services (OpenAI, Stripe, Firebase, etc.)
- Only include if you're confident they're used
- Use lowercase slugs: "typescript" not "TypeScript"

**suggestedVibePercent**: Estimate the AI/human ratio (0-100).
- 0 = Fully human-coded
- 100 = Fully AI-generated / "vibecoded"
- Look for mentions of: AI tools, Claude, GPT, Copilot, "vibecoded", "AI-generated"
- If AI tools mentioned prominently: 70-90
- If code looks AI-assisted: 50-70
- If no AI indicators: 30-50 (neutral default)
- If explicitly "hand-crafted" / "no AI": 10-30

**linkedUrls**: Extract related URLs.
- mainUrl: Live demo, hosted app, or homepage
- repoUrl: GitHub/GitLab/etc source code link
- Set to null if not found
- Don't repeat the input URL unless it fits a different category

Respond ONLY with valid JSON, no markdown formatting or explanation.`;
}
```

### 3.2 Tool Matching Logic

**File:** `apps/worker/src/lib/tool-matching.ts`

```typescript
import { db } from "@slop/db";
import { tools } from "@slop/db/schema";
import { ilike, or } from "drizzle-orm";

// Common aliases for tool names
const TOOL_ALIASES: Record<string, string[]> = {
  typescript: ["ts", "typescript"],
  javascript: ["js", "javascript", "node", "nodejs"],
  python: ["py", "python", "python3"],
  react: ["react", "reactjs", "react.js"],
  nextjs: ["next", "nextjs", "next.js"],
  vue: ["vue", "vuejs", "vue.js"],
  angular: ["angular", "angularjs"],
  tailwind: ["tailwind", "tailwindcss"],
  openai: ["openai", "gpt", "chatgpt", "gpt-4", "gpt-3"],
  anthropic: ["anthropic", "claude"],
  vercel: ["vercel"],
  supabase: ["supabase"],
  prisma: ["prisma"],
  drizzle: ["drizzle", "drizzle-orm"],
};

export async function matchToolsToDatabase(
  detectedTools: string[]
): Promise<string[]> {
  if (detectedTools.length === 0) return [];

  // Normalize detected tools
  const normalizedDetected = detectedTools.map((t) => t.toLowerCase().trim());

  // Build search conditions
  const searchTerms = new Set<string>();
  for (const detected of normalizedDetected) {
    searchTerms.add(detected);
    // Check if this matches any alias
    for (const [canonical, aliases] of Object.entries(TOOL_ALIASES)) {
      if (aliases.includes(detected)) {
        searchTerms.add(canonical);
      }
    }
  }

  // Query database for matching tools
  const conditions = Array.from(searchTerms).map((term) =>
    ilike(tools.slug, `%${term}%`)
  );

  if (conditions.length === 0) return [];

  const matchedTools = await db
    .select({ slug: tools.slug })
    .from(tools)
    .where(or(...conditions));

  // Return unique slugs, max 10
  const slugs = [...new Set(matchedTools.map((t) => t.slug))];
  return slugs.slice(0, 10);
}
```

### 3.3 Analyze Content Job Handler

**File:** `apps/worker/src/handlers/analyze-content.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@slop/db";
import { enrichmentDrafts } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { buildExtractionPrompt } from "../lib/extraction-prompt";
import { matchToolsToDatabase } from "../lib/tool-matching";

const anthropic = new Anthropic();

interface AnalyzeContentPayload {
  draftId: string;
}

interface ExtractionResult {
  title: string;
  tagline: string;
  description: string;
  detectedTools: string[];
  suggestedVibePercent: number;
  linkedUrls: {
    mainUrl: string | null;
    repoUrl: string | null;
  };
}

export async function handleAnalyzeContent(
  payload: AnalyzeContentPayload
): Promise<void> {
  const { draftId } = payload;

  // 1. Load draft
  const [draft] = await db
    .select()
    .from(enrichmentDrafts)
    .where(eq(enrichmentDrafts.id, draftId));

  if (!draft) {
    throw new Error(`Draft not found: ${draftId}`);
  }

  if (draft.status !== "analyzing") {
    console.log(`Draft ${draftId} not in analyzing state, skipping`);
    return;
  }

  try {
    // 2. Build prompt
    const scrapedContent = (draft.scrapedContent as { markdown?: string; links?: string[] }) || {};
    const metadata = (draft.scrapedMetadata as Record<string, unknown>) || {};

    const prompt = buildExtractionPrompt(
      draft.inputUrl,
      draft.detectedUrlType,
      scrapedContent,
      metadata
    );

    // 3. Call Claude Haiku
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // 4. Parse response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let extraction: ExtractionResult;
    try {
      // Try to extract JSON from response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      extraction = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", responseText);
      throw new Error("Failed to parse extraction response");
    }

    // 5. Match detected tools to database
    const matchedTools = await matchToolsToDatabase(extraction.detectedTools);

    // 6. Determine URLs
    let suggestedMainUrl = extraction.linkedUrls?.mainUrl || null;
    let suggestedRepoUrl = extraction.linkedUrls?.repoUrl || null;

    // If input URL is a repo, use it as repoUrl
    if (draft.detectedUrlType === "github" || draft.detectedUrlType === "gitlab") {
      suggestedRepoUrl = suggestedRepoUrl || draft.inputUrl;
    } else {
      // If input URL is a live site, use it as mainUrl
      suggestedMainUrl = suggestedMainUrl || draft.inputUrl;
    }

    // 7. Update draft with extracted data
    await db
      .update(enrichmentDrafts)
      .set({
        status: "ready",
        suggestedTitle: extraction.title?.slice(0, 255) || null,
        suggestedTagline: extraction.tagline?.slice(0, 500) || null,
        suggestedDescription: extraction.description?.slice(0, 10000) || null,
        suggestedTools: matchedTools,
        suggestedVibePercent: Math.min(100, Math.max(0, extraction.suggestedVibePercent || 50)),
        suggestedMainUrl,
        suggestedRepoUrl,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await db
      .update(enrichmentDrafts)
      .set({
        status: "failed",
        error: `Analysis failed: ${errorMessage}`,
        updatedAt: new Date(),
      })
      .where(eq(enrichmentDrafts.id, draftId));

    throw error;
  }
}
```

### 3.4 Register Handler in Worker

**File:** `apps/worker/src/index.ts`

Add to handler registration:

```typescript
import { handleAnalyzeContent } from "./handlers/analyze-content";

// In the job type switch/map:
case "analyze_content":
  await handleAnalyzeContent(job.payload);
  break;
```

### 3.5 Add Anthropic SDK Dependency

```bash
pnpm --filter @slop/worker add @anthropic-ai/sdk
```

Or if already installed for moderation, just ensure it's available.

## Verification

- [ ] Extraction prompt generates well-structured request
- [ ] Claude Haiku returns valid JSON response
- [ ] JSON parsing handles edge cases (markdown wrapping, etc.)
- [ ] Tool matching finds database entries for common tools
- [ ] Vibe percent is clamped to 0-100
- [ ] URLs are correctly categorized (mainUrl vs repoUrl)
- [ ] Draft status transitions: `analyzing` → `ready`
- [ ] Failed analysis sets status to `failed`

## Test Cases

### Extraction Parsing
```typescript
// Valid JSON
parseResponse('{"title": "My Project", ...}') // works

// Markdown-wrapped JSON
parseResponse('```json\n{"title": "My Project"}\n```') // works

// Invalid response
parseResponse('I cannot help with that') // throws
```

### Tool Matching
```typescript
// Direct match
matchToolsToDatabase(["typescript"]) // ["typescript"]

// Alias match
matchToolsToDatabase(["ts", "node"]) // ["typescript", "javascript"]

// Partial match
matchToolsToDatabase(["react", "unknown-tool"]) // ["react"]
```

### URL Categorization
```typescript
// GitHub input → repoUrl
detectUrlType("https://github.com/user/repo")
// suggestedRepoUrl = input URL

// Live site input → mainUrl
detectUrlType("https://myapp.com")
// suggestedMainUrl = input URL
```

## Files Changed

| File | Change |
|------|--------|
| `apps/worker/src/lib/extraction-prompt.ts` | NEW |
| `apps/worker/src/lib/tool-matching.ts` | NEW |
| `apps/worker/src/handlers/analyze-content.ts` | NEW |
| `apps/worker/src/index.ts` | Register handler |
| `apps/worker/package.json` | Add @anthropic-ai/sdk (if needed) |

## Cost Estimation

Claude 3.5 Haiku pricing:
- Input: $0.25 / 1M tokens
- Output: $1.25 / 1M tokens

Per analysis:
- ~4,000 input tokens (prompt + content)
- ~200 output tokens (JSON response)

Cost per analysis: ~$0.001 (1/10th of a cent)

1,000 submissions/day = ~$1/day

## Notes

- Content is truncated to 15,000 chars to stay within context limits
- Tool matching uses fuzzy search + aliases for better coverage
- Vibe percent defaults to 50 if not detected
- Failed parsing attempts are logged for debugging
- Consider caching tool database queries for performance

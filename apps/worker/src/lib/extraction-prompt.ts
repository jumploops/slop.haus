import type { UrlType } from "@slop/shared";

export function buildExtractionPrompt(
  url: string,
  urlType: UrlType,
  scrapedContent: { markdown?: string; links?: string[] },
  metadata: Record<string, unknown>
): string {
  const content = scrapedContent.markdown || "";
  const truncatedContent = content.slice(0, 15000); // Limit context size

  const metadataSection =
    Object.keys(metadata).length > 0
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

import { themeSpecSchema, type ThemeSpec } from "@slop/shared";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const THEME_MODEL = "claude-3-haiku-20240307";

const SYSTEM_PROMPT = `You are a theme designer for a web application called slop.haus (a showcase for AI-built apps).

When given a theme description, output a JSON object matching this schema:
{
  "name": "string (1-50 chars, creative name for the theme)",
  "description": "string (optional, max 200 chars)",
  "colors": {
    "bg": "#RRGGBB (main background, usually dark for this site)",
    "bgSecondary": "#RRGGBB (cards, inputs - slightly lighter/different than bg)",
    "fg": "#RRGGBB (main text color, high contrast with bg)",
    "muted": "#RRGGBB (secondary text, readable but clearly secondary)",
    "border": "#RRGGBB (borders, dividers - subtle but visible)",
    "accent": "#RRGGBB (brand color, buttons, links - should pop)"
  },
  "typography": {
    "fontFamily": "system" | "comic-sans" | "mono" | "serif" | "retro-pixel",
    "baseFontSize": 12-20,
    "lineHeight": 1.2-2
  },
  "spacing": {
    "scale": "compact" | "normal" | "spacious" | "tight" | "relaxed",
    "cardPadding": "sm" | "md" | "lg",
    "pageGutter": "sm" | "md" | "lg"
  },
  "structure": {
    "borderWidth": 1 | 2 | 3,
    "borderStyle": "solid" | "outset" | "inset" | "double",
    "radius": "none" | "sm" | "md" | "lg" | "full",
    "shadowStyle": "none" | "soft" | "hard" | "glow"
  },
  "layout": {
    "containerMax": "960" | "1120" | "1200" | "1360",
    "gridCols": 1 | 2 | 3 | 4,
    "layoutVariant": "feed" | "grid" | "split",
    "sidebar": "none" | "left" | "right"
  },
  "components": {
    "button": { "style": "flat" | "bevel" | "outline", "pressedEffect": "none" | "inset" | "darken" },
    "card": { "style": "flat" | "inset" | "outset" },
    "input": { "style": "flat" | "inset" },
    "link": { "underline": "always" | "hover" | "none" }
  },
  "background": {
    "pattern": "none" | "dots" | "grid" | "checkerboard" | "scanlines",
    "patternOpacity": 0-0.2
  },
  "features": {
    "visitorCounter": true | false,
    "webring": true | false,
    "constructionBanner": true | false,
    "retroBadges": true | false,
    "marquee": true | false
  },
  "radius": "sharp" | "subtle" | "rounded" | "pill" (optional legacy),
  "density": "compact" | "normal" | "spacious" (optional legacy)
}

Guidelines:
- Ensure good contrast between fg/bg (at least 4.5:1 ratio)
- Ensure muted is readable but clearly secondary (at least 3:1)
- Accent should pop against the background
- Border should be subtle but visible
- bgSecondary should be distinguishable from bg
- Output ONLY valid JSON, no markdown, explanation, or code blocks`;

export async function generateTheme(prompt: string): Promise<ThemeSpec> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: THEME_MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Create a theme based on this description: "${prompt}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Extract text content
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );
  if (!textBlock?.text) {
    throw new Error("No text response from LLM");
  }

  // Parse JSON - handle potential markdown code blocks
  let jsonText = textBlock.text.trim();

  // Remove markdown code blocks if present
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  // Validate against schema
  const result = themeSpecSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(`Invalid theme spec: ${issues}`);
  }

  return result.data;
}

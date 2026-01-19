import { themeSpecSchema, type ThemeSpec } from "@slop/shared";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const THEME_MODEL = "claude-3-haiku-20240307";

const SYSTEM_PROMPT = `You are a theme designer for a web application called slop.haus (a showcase for AI-built apps).

When given a theme description, output a JSON object matching this schema:
{
  "name": "string (1-50 chars, creative name for the theme)",
  "description": "string (optional, max 200 chars)",
  "colors": {
    "bg": "#xxxxxx (main background, usually dark for this site)",
    "bgSecondary": "#xxxxxx (cards, inputs - slightly lighter/different than bg)",
    "fg": "#xxxxxx (main text color, high contrast with bg)",
    "muted": "#xxxxxx (secondary text, readable but clearly secondary)",
    "border": "#xxxxxx (borders, dividers - subtle but visible)",
    "accent": "#xxxxxx (brand color, buttons, links - should pop)"
  },
  "radius": "sharp" | "subtle" | "rounded" | "pill" (optional),
  "density": "compact" | "normal" | "spacious" (optional)
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

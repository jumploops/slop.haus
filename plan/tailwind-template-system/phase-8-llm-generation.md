# Phase 8: LLM Theme Generation

**Status:** Not Started

## Overview

Implement backend endpoints that allow users to generate custom themes via natural language prompts. The LLM returns a structured ThemeSpec JSON, which the server validates and compiles into safe CSS variable overrides.

## Architecture

```
User Prompt → API → LLM → ThemeSpec JSON → Validation → CSS Compilation → Client
     │                         │                              │
     │                         ▼                              ▼
     │                   Schema Check              :root[data-theme="user:xxx"] {
     │                   Contrast Check              --color-bg: #value;
     │                   Value Clamping              ...
     ▼                                             }
  "Make it cyberpunk
   with neon pink"
```

## Prerequisites

- Phase 7 complete (runtime theme switching works)
- Anthropic API access configured

## Tasks

### 8.1 ThemeSpec Schema

**File:** `packages/shared/src/theme-schema.ts`

```ts
import { z } from "zod";

// Hex color validation
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color");

// CSS length validation (px, rem, em)
const cssLength = z.string().regex(/^\d+(\.\d+)?(px|rem|em)$/, "Must be a valid CSS length");

/**
 * ThemeSpec - The structured output from LLM theme generation.
 *
 * This is intentionally a subset of all themeable tokens.
 * The server derives additional tokens (hover states, contrast colors)
 * to keep the LLM output small and consistent.
 */
export const themeSpecSchema = z.object({
  // Metadata
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),

  // Core colors (required)
  colors: z.object({
    bg: hexColor,
    bgSecondary: hexColor,
    fg: hexColor,
    muted: hexColor,
    border: hexColor,
    accent: hexColor,
  }),

  // Optional adjustments
  radius: z.enum(["sharp", "subtle", "rounded", "pill"]).optional(),
  density: z.enum(["compact", "normal", "spacious"]).optional(),
});

export type ThemeSpec = z.infer<typeof themeSpecSchema>;

/**
 * Compiled theme output - ready for injection
 */
export interface CompiledTheme {
  id: string;
  spec: ThemeSpec;
  cssText: string;
  warnings: string[];
}
```

### 8.2 Theme Compiler

**File:** `apps/api/src/lib/theme-compiler.ts`

```ts
import { ThemeSpec } from "@slop/shared";

interface CompilerOptions {
  themeId: string;
}

interface CompilerResult {
  cssText: string;
  warnings: string[];
}

/**
 * Derives additional color values from base colors
 */
function deriveColors(colors: ThemeSpec["colors"]) {
  return {
    // Accent dim (hover state) - darken accent by ~15%
    accentDim: darkenHex(colors.accent, 0.15),

    // Accent contrast - use bg or fg depending on accent luminance
    accentContrast: getLuminance(colors.accent) > 0.5 ? colors.bg : colors.fg,

    // Keep semantic colors safe
    danger: "#ff4444",
    warning: "#ffaa00",
    success: colors.accent, // Use accent as success
  };
}

/**
 * Maps radius preset to actual values
 */
function getRadiusValues(radius: ThemeSpec["radius"] = "subtle") {
  const presets = {
    sharp: { sm: "0", md: "2px", lg: "4px" },
    subtle: { sm: "0.25rem", md: "0.5rem", lg: "0.75rem" },
    rounded: { sm: "0.5rem", md: "0.75rem", lg: "1rem" },
    pill: { sm: "9999px", md: "9999px", lg: "9999px" },
  };
  return presets[radius];
}

/**
 * Maps density preset to spacing base
 */
function getSpacingBase(density: ThemeSpec["density"] = "normal") {
  const presets = {
    compact: "0.22rem",
    normal: "0.25rem",
    spacious: "0.3rem",
  };
  return presets[density];
}

/**
 * Compiles a ThemeSpec into CSS variable overrides
 */
export function compileTheme(spec: ThemeSpec, options: CompilerOptions): CompilerResult {
  const { themeId } = options;
  const warnings: string[] = [];

  // Derive additional colors
  const derived = deriveColors(spec.colors);

  // Check contrast ratios
  const fgContrast = getContrastRatio(spec.colors.fg, spec.colors.bg);
  if (fgContrast < 4.5) {
    warnings.push(`Low contrast: fg on bg is ${fgContrast.toFixed(1)}:1 (should be ≥4.5:1)`);
  }

  const mutedContrast = getContrastRatio(spec.colors.muted, spec.colors.bg);
  if (mutedContrast < 3) {
    warnings.push(`Very low contrast: muted on bg is ${mutedContrast.toFixed(1)}:1`);
  }

  // Build CSS
  const radius = getRadiusValues(spec.radius);
  const spacing = getSpacingBase(spec.density);

  const cssText = `
:root[data-theme="user:${themeId}"],
.theme-scope[data-theme="user:${themeId}"] {
  /* Base colors */
  --color-bg: ${spec.colors.bg};
  --color-bg-secondary: ${spec.colors.bgSecondary};
  --color-fg: ${spec.colors.fg};
  --color-muted: ${spec.colors.muted};
  --color-border: ${spec.colors.border};

  /* Accent colors */
  --color-accent: ${spec.colors.accent};
  --color-accent-dim: ${derived.accentDim};
  --color-accent-contrast: ${derived.accentContrast};

  /* Semantic colors */
  --color-danger: ${derived.danger};
  --color-warning: ${derived.warning};
  --color-success: ${derived.success};

  /* Radius */
  --radius-sm: ${radius.sm};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};

  /* Spacing base */
  --spacing: ${spacing};
}
`.trim();

  return { cssText, warnings };
}

// Helper functions
function darkenHex(hex: string, amount: number): string {
  const rgb = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((rgb >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((rgb >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (rgb & 0xff) * (1 - amount));
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### 8.3 LLM Theme Generator

**Note:** Following project convention, we use native `fetch` instead of the Anthropic SDK.

**File:** `apps/api/src/lib/theme-generator.ts`

```ts
import { themeSpecSchema, type ThemeSpec } from "@slop/shared";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a theme designer for a web application called slop.haus (a showcase for AI-built apps).

When given a theme description, output a JSON object matching this schema:
{
  "name": "string (1-50 chars)",
  "description": "string (optional, max 200 chars)",
  "colors": {
    "bg": "#xxxxxx (main background, usually dark)",
    "bgSecondary": "#xxxxxx (cards, inputs - slightly lighter than bg)",
    "fg": "#xxxxxx (main text color)",
    "muted": "#xxxxxx (secondary text, should contrast with bg)",
    "border": "#xxxxxx (borders, dividers)",
    "accent": "#xxxxxx (brand color, buttons, links)"
  },
  "radius": "sharp" | "subtle" | "rounded" | "pill" (optional),
  "density": "compact" | "normal" | "spacious" (optional)
}

Guidelines:
- Ensure good contrast between fg/bg (at least 4.5:1)
- Ensure muted is readable but clearly secondary
- Accent should pop against the background
- Border should be subtle but visible
- bgSecondary should be distinguishable from bg
- Output ONLY valid JSON, no markdown or explanation`;

export async function generateTheme(prompt: string): Promise<ThemeSpec> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
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
  const textBlock = data.content?.find((block: { type: string }) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("No text response from LLM");
  }

  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  // Validate against schema
  const result = themeSpecSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Invalid theme spec: ${result.error.message}`);
  }

  return result.data;
}
```

### 8.4 API Routes

**File:** `apps/api/src/routes/themes.ts`

```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { generateTheme } from "../lib/theme-generator";
import { compileTheme } from "../lib/theme-compiler";
import { themeSpecSchema } from "@slop/shared";
import { nanoid } from "nanoid";

const themesRoutes = new Hono();

/**
 * POST /api/v1/themes/generate
 * Generate a theme from a natural language prompt
 */
themesRoutes.post(
  "/generate",
  zValidator(
    "json",
    z.object({
      prompt: z.string().min(3).max(500),
    })
  ),
  async (c) => {
    const { prompt } = c.req.valid("json");

    try {
      // Generate theme spec via LLM
      const spec = await generateTheme(prompt);

      // Compile to CSS
      const themeId = nanoid(10);
      const { cssText, warnings } = compileTheme(spec, { themeId });

      return c.json({
        success: true,
        data: {
          themeId,
          spec,
          cssText,
          warnings,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Theme generation failed";
      return c.json({ success: false, error: message }, 400);
    }
  }
);

/**
 * POST /api/v1/themes/compile
 * Compile a ThemeSpec to CSS (for testing/debugging)
 */
themesRoutes.post(
  "/compile",
  zValidator("json", z.object({ spec: themeSpecSchema })),
  async (c) => {
    const { spec } = c.req.valid("json");

    const themeId = nanoid(10);
    const { cssText, warnings } = compileTheme(spec, { themeId });

    return c.json({
      success: true,
      data: { themeId, cssText, warnings },
    });
  }
);

/**
 * GET /api/v1/themes/presets
 * List available preset themes
 */
themesRoutes.get("/presets", (c) => {
  return c.json({
    success: true,
    data: {
      presets: [
        { id: "default", name: "Default", description: "The classic slop.haus look" },
        { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
        { id: "warm", name: "Warm", description: "Cozy orange tones" },
        { id: "light", name: "Light", description: "Clean light mode" },
        { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
        { id: "forest", name: "Forest", description: "Natural green tones" },
      ],
    },
  });
});

export { themesRoutes };
```

### 8.5 Frontend: Theme Generator UI

**File:** `apps/web/src/components/theme/ThemeGenerator.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function ThemeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { applyUserTheme } = useTheme();
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/themes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      // Apply the generated theme
      applyUserTheme(data.data.themeId, data.data.cssText);

      // Show warnings if any
      if (data.data.warnings.length > 0) {
        showToast(`Theme applied with warnings: ${data.data.warnings.join(", ")}`, "warning");
      } else {
        showToast(`Theme "${data.data.spec.name}" applied!`, "success");
      }

      setPrompt("");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to generate theme", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 bg-bg-secondary rounded-lg border border-border">
      <h3 className="font-medium mb-3">Generate Custom Theme</h3>
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your theme... (e.g., 'cyberpunk with neon pink')"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <Button onClick={handleGenerate} loading={isGenerating} disabled={!prompt.trim()}>
          Generate
        </Button>
      </div>
      <p className="text-xs text-muted mt-2">
        Tip: Describe colors, mood, or reference existing styles
      </p>
    </div>
  );
}
```

## Security Considerations

### Input Validation
- Prompt length capped at 500 characters
- ThemeSpec validated against strict Zod schema
- Only hex colors allowed (no rgb, hsl, or named colors)

### Output Sanitization
- CSS output is template-based, not arbitrary
- No `url()`, `@import`, or selectors beyond data-theme
- Only CSS custom property assignments

### Rate Limiting
- Consider adding rate limiting to `/themes/generate`
- LLM calls are expensive, may need auth requirement

## Files Changed

| File | Action |
|------|--------|
| `packages/shared/src/theme-schema.ts` | Create new |
| `apps/api/src/lib/theme-compiler.ts` | Create new |
| `apps/api/src/lib/theme-generator.ts` | Create new |
| `apps/api/src/routes/themes.ts` | Create new |
| `apps/api/src/index.ts` | Register themes routes |
| `apps/web/src/components/theme/ThemeGenerator.tsx` | Create new |

## Verification Checklist

- [ ] `/api/v1/themes/generate` returns valid ThemeSpec
- [ ] `/api/v1/themes/compile` produces valid CSS
- [ ] Generated CSS applies correctly via themeManager
- [ ] Contrast warnings appear for poor color choices
- [ ] Invalid prompts return helpful errors
- [ ] Theme persists across refresh
- [ ] Reset returns to default theme

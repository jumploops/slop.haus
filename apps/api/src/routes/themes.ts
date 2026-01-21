import { Hono } from "hono";
import { generateTheme } from "../lib/theme-generator";
import { compileTheme } from "../lib/theme-compiler";
import {
  generateThemeRequestSchema,
  compileThemeRequestSchema,
} from "@slop/shared";

const themesRoutes = new Hono();

/**
 * Generate a short random ID for themes
 */
function generateThemeId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/**
 * POST /api/v1/themes/generate
 * Generate a theme from a natural language prompt
 */
themesRoutes.post("/generate", async (c) => {
  const body = await c.req.json();

  // Validate request
  const result = generateThemeRequestSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { success: false, error: "Invalid request", details: result.error.errors },
      400
    );
  }

  const { prompt } = result.data;

  try {
    // Generate theme spec via LLM
    const spec = await generateTheme(prompt);

    // Compile to CSS
    const themeId = generateThemeId();
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
});

/**
 * POST /api/v1/themes/compile
 * Compile a ThemeSpec to CSS (for testing/debugging)
 */
themesRoutes.post("/compile", async (c) => {
  const body = await c.req.json();

  // Validate request
  const result = compileThemeRequestSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { success: false, error: "Invalid request", details: result.error.errors },
      400
    );
  }

  const { spec } = result.data;
  const themeId = generateThemeId();
  const { cssText, warnings } = compileTheme(spec, { themeId });

  return c.json({
    success: true,
    data: { themeId, cssText, warnings },
  });
});

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
        { id: "slop-default", name: "Slop Default", description: "Current slop.haus styling" },
        { id: "retro-90s", name: "Retro 90s", description: "Early web vibes with chunky borders" },
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

import { z } from "zod";

// Hex color validation
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color");

/**
 * Request schema for generating a theme
 */
export const generateThemeRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
});

export type GenerateThemeRequest = z.infer<typeof generateThemeRequestSchema>;

/**
 * Request schema for compiling a theme
 */
export const compileThemeRequestSchema = z.object({
  spec: z.lazy(() => themeSpecSchema),
});

export type CompileThemeRequest = z.infer<typeof compileThemeRequestSchema>;

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

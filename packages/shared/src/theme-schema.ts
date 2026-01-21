import { z } from "zod";

// Color validation (hex, rgb/rgba, oklch)
const color = z.string().refine(isValidColor, "Must be a valid color");

const iconId = z.string().regex(/^[a-z0-9-]{1,32}$/);

const fontFamily = z.enum(["system", "comic-sans", "mono", "serif", "retro-pixel"]);
const spacingScale = z.enum(["compact", "normal", "spacious", "tight", "relaxed"]);
const spacingSize = z.enum(["sm", "md", "lg"]);
const radiusScale = z.enum(["none", "sm", "md", "lg", "full"]);
const borderStyle = z.enum(["solid", "outset", "inset", "double"]);
const shadowStyle = z.enum(["none", "soft", "hard", "glow"]);
const layoutVariant = z.enum(["feed", "grid", "split"]);
const sidebarVariant = z.enum(["none", "left", "right"]);
const buttonStyle = z.enum(["flat", "bevel", "outline"]);
const pressedEffect = z.enum(["none", "inset", "darken"]);
const cardStyle = z.enum(["flat", "inset", "outset"]);
const inputStyle = z.enum(["flat", "inset"]);
const linkUnderline = z.enum(["always", "hover", "none"]);
const linkHoverColor = z.enum(["accent", "warning", "danger"]);
const backgroundPattern = z.enum(["none", "dots", "grid", "checkerboard", "scanlines"]);

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
  author: z.string().max(100).optional(),
  icon: iconId.optional(),

  // Core colors (required)
  colors: z.object({
    bg: color,
    bgSecondary: color,
    fg: color,
    muted: color,
    border: color,
    accent: color,
    accentDim: color.optional(),
    accentForeground: color.optional(),
    danger: color.optional(),
    warning: color.optional(),
    success: color.optional(),
  }).strict(),

  // Typography
  typography: z.object({
    fontFamily: fontFamily.optional(),
    fontFamilyMono: fontFamily.optional(),
    baseFontSize: z.number().int().min(12).max(20).optional(),
    lineHeight: z.number().min(1.2).max(2).optional(),
  }).strict().optional(),

  // Spacing & density
  spacing: z.object({
    scale: spacingScale.optional(),
    cardPadding: spacingSize.optional(),
    pageGutter: spacingSize.optional(),
  }).strict().optional(),

  // Structural
  structure: z.object({
    borderWidth: z.number().int().min(1).max(3).optional(),
    borderStyle: borderStyle.optional(),
    radius: radiusScale.optional(),
    shadowStyle: shadowStyle.optional(),
  }).strict().optional(),

  // Layout
  layout: z.object({
    containerMax: z.enum(["960", "1120", "1200", "1360"]).optional(),
    gridCols: z.number().int().min(1).max(4).optional(),
    layoutVariant: layoutVariant.optional(),
    sidebar: sidebarVariant.optional(),
  }).strict().optional(),

  // Component-specific style variants
  components: z.object({
    button: z.object({
      style: buttonStyle.optional(),
      pressedEffect: pressedEffect.optional(),
    }).strict().optional(),
    card: z.object({
      style: cardStyle.optional(),
    }).strict().optional(),
    input: z.object({
      style: inputStyle.optional(),
    }).strict().optional(),
    link: z.object({
      underline: linkUnderline.optional(),
      hoverColor: linkHoverColor.optional(),
    }).strict().optional(),
  }).strict().optional(),

  // Background pattern (safe, enum)
  background: z.object({
    pattern: backgroundPattern.optional(),
    patternOpacity: z.number().min(0).max(0.2).optional(),
  }).strict().optional(),

  // Feature visibility toggles
  features: z.object({
    visitorCounter: z.boolean().optional(),
    webring: z.boolean().optional(),
    constructionBanner: z.boolean().optional(),
    retroBadges: z.boolean().optional(),
    marquee: z.boolean().optional(),
  }).strict().optional(),

  // Backwards-compat fields
  radius: z.enum(["sharp", "subtle", "rounded", "pill"]).optional(),
  density: z.enum(["compact", "normal", "spacious"]).optional(),
}).strict();

function isValidColor(value: string): boolean {
  return isHexColor(value) || isRgbColor(value) || isOklchColor(value);
}

function isHexColor(value: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value);
}

function isRgbColor(value: string): boolean {
  const match = value.match(/^rgba?\((.+)\)$/i);
  if (!match) return false;

  const [colorPart, alphaPart] = splitColorParts(match[1]);
  const comps = splitTokens(colorPart);
  if (comps.length < 3) return false;

  const [r, g, b] = comps.slice(0, 3);
  if (!isRgbToken(r) || !isRgbToken(g) || !isRgbToken(b)) return false;

  if (alphaPart !== null && !isAlphaComponent(alphaPart)) return false;

  return true;
}

function isOklchColor(value: string): boolean {
  const match = value.match(/^oklch\((.+)\)$/i);
  if (!match) return false;

  const [colorPart, alphaPart] = splitColorParts(match[1]);
  const comps = splitNumbers(colorPart);
  if (comps.length < 3) return false;

  const [l, c, h] = comps.slice(0, 3);
  if (!isFinite(l) || !isFinite(c) || !isFinite(h)) return false;
  if (l < 0 || l > 1) return false;
  if (c < 0 || c > 1) return false;
  if (h < 0 || h > 360) return false;

  if (alphaPart !== null && !isAlphaComponent(alphaPart)) return false;

  return true;
}

function splitColorParts(value: string): [string, number | null] {
  const parts = value.split("/");
  const colorPart = parts[0].trim();
  const alphaPart = parts[1]?.trim();
  if (!alphaPart) return [colorPart, null];

  const parsed = parseNumber(alphaPart);
  if (parsed === null) return [colorPart, null];
  const alpha = alphaPart.trim().endsWith("%") ? parsed / 100 : parsed;
  return [colorPart, alpha];
}

function splitNumbers(value: string): number[] {
  return value
    .replace(/,/g, " ")
    .split(/\s+/)
    .map((part) => parseNumber(part))
    .filter((part): part is number => part !== null);
}

function splitTokens(value: string): string[] {
  return value
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  const raw = trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isRgbComponent(value: number): boolean {
  return value >= 0 && value <= 255;
}

function isRgbToken(value: string): boolean {
  if (value.endsWith("%")) {
    const parsed = parseNumber(value);
    return parsed !== null && parsed >= 0 && parsed <= 100;
  }
  const parsed = parseNumber(value);
  return parsed !== null && parsed >= 0 && parsed <= 255;
}

function isAlphaComponent(value: number): boolean {
  return value >= 0 && value <= 1;
}

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

import type { ThemeSpec } from "@slop/shared";

interface RgbColor {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

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
    accentDim: colors.accentDim ?? darkenColor(colors.accent, 0.15),

    // Accent foreground - use bg or fg depending on accent luminance
    accentForeground:
      colors.accentForeground ?? (getLuminance(colors.accent) > 0.5 ? colors.bg : colors.fg),

    // Keep semantic colors visible
    danger: colors.danger ?? "#ff4444",
    warning: colors.warning ?? "#ffaa00",
    success: colors.success ?? colors.accent, // Use accent as success
  };
}

/**
 * Maps radius preset to actual values
 */
function getRadiusValue(radius: ThemeSpec["radius"] = "subtle"): string {
  const presets = {
    sharp: "2px",
    subtle: "0.5rem",
    rounded: "0.75rem",
    pill: "9999px",
  };
  return presets[radius];
}

type StructureRadius = NonNullable<ThemeSpec["structure"]>["radius"];
type SpacingScale = NonNullable<ThemeSpec["spacing"]>["scale"];
type SpacingSize = NonNullable<ThemeSpec["spacing"]>["cardPadding"];
type ShadowStyle = NonNullable<ThemeSpec["structure"]>["shadowStyle"];

function getStructureRadiusValue(radius: StructureRadius): string {
  const presets = {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    full: "9999px",
  };
  return presets[radius ?? "md"];
}

function getSpacingValue(scale: SpacingScale): string {
  const presets = {
    compact: "0.2rem",
    tight: "0.2rem",
    normal: "0.25rem",
    spacious: "0.3rem",
    relaxed: "0.3rem",
  };
  return presets[scale ?? "normal"];
}

function getSpacingSize(value: SpacingSize, fallback: string): string {
  const presets = {
    sm: "12px",
    md: "16px",
    lg: "20px",
  };
  if (!value) return fallback;
  return presets[value];
}

function getShadowValues(style: ShadowStyle) {
  const presets = {
    none: {
      xs: "none",
      sm: "none",
      md: "none",
      lg: "none",
    },
    soft: {
      xs: "0 1px 2px oklch(0 0 0 / 0.2)",
      sm: "0 1px 3px oklch(0 0 0 / 0.3)",
      md: "0 4px 6px oklch(0 0 0 / 0.35)",
      lg: "0 10px 15px oklch(0 0 0 / 0.4)",
    },
    hard: {
      xs: "1px 1px 0 oklch(0 0 0)",
      sm: "2px 2px 0 oklch(0 0 0)",
      md: "3px 3px 0 oklch(0 0 0)",
      lg: "4px 4px 0 oklch(0 0 0)",
    },
    glow: {
      xs: "0 0 4px currentColor",
      sm: "0 0 8px currentColor",
      md: "0 0 12px currentColor",
      lg: "0 0 16px currentColor",
    },
  };
  return presets[style ?? "soft"];
}

/**
 * Compiles a ThemeSpec into CSS variable overrides
 *
 * IMPORTANT: We override BASE variables (--background, --foreground, etc.)
 * NOT the @theme inline mapped variables (--color-bg, --color-fg).
 * The two-layer pattern means changing base variables automatically
 * updates all Tailwind utilities.
 */
const CUSTOM_THEME_PREFIX = "custom:";

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

  const accentContrast = getContrastRatio(spec.colors.accent, spec.colors.bg);
  if (accentContrast < 3) {
    warnings.push(`Low accent contrast: ${accentContrast.toFixed(1)}:1`);
  }

  // Normalize structural values
  const spacingScale = spec.spacing?.scale ?? spec.density ?? "normal";
  const spacing = getSpacingValue(spacingScale);
  const cardPad = getSpacingSize(spec.spacing?.cardPadding, "16px");
  const pageGutter = getSpacingSize(spec.spacing?.pageGutter, "16px");

  const radius = spec.structure?.radius
    ? getStructureRadiusValue(spec.structure.radius)
    : getRadiusValue(spec.radius);
  const borderWidth = spec.structure?.borderWidth ?? 1;
  const borderStyle = spec.structure?.borderStyle ?? "solid";
  const shadowValues = getShadowValues(spec.structure?.shadowStyle);

  const fontSans = spec.typography?.fontFamily ?? "system";
  const fontMono = spec.typography?.fontFamilyMono ?? "mono";
  const fontSize = spec.typography?.baseFontSize ?? 16;
  const lineHeight = spec.typography?.lineHeight ?? 1.6;

  const containerMax = spec.layout?.containerMax ?? "1200";
  const gridCols = spec.layout?.gridCols ?? 1;
  const layoutVariant = spec.layout?.layoutVariant ?? "feed";
  const sidebarVariant = spec.layout?.sidebar ?? "none";

  const cssText = `
:root[data-theme="${CUSTOM_THEME_PREFIX}${themeId}"],
.theme-scope[data-theme="${CUSTOM_THEME_PREFIX}${themeId}"] {
  /* Base colors */
  --background: ${spec.colors.bg};
  --background-secondary: ${spec.colors.bgSecondary};
  --foreground: ${spec.colors.fg};
  --muted: ${spec.colors.muted};
  --border: ${spec.colors.border};

  /* Accent colors */
  --accent: ${spec.colors.accent};
  --accent-dim: ${derived.accentDim};
  --accent-foreground: ${derived.accentForeground};

  /* Semantic colors */
  --danger: ${derived.danger};
  --warning: ${derived.warning};
  --success: ${derived.success};

  /* Border radius */
  --radius: ${radius};

  /* Typography */
  --font-sans: ${mapFontStack(fontSans)};
  --font-mono: ${mapFontStack(fontMono)};
  --font-size-base: ${fontSize}px;
  --line-height: ${lineHeight};

  /* Spacing */
  --spacing: ${spacing};
  --app-card-pad: ${cardPad};
  --app-page-gutter: ${pageGutter};

  /* Structure */
  --border-width: ${borderWidth}px;
  --border-style: ${borderStyle};
  --shadow-xs: ${shadowValues.xs};
  --shadow-sm: ${shadowValues.sm};
  --shadow-md: ${shadowValues.md};
  --shadow-lg: ${shadowValues.lg};

  /* Layout */
  --app-container-max: ${containerMax}px;
  --app-grid-cols: repeat(${gridCols}, minmax(0, 1fr));
  --app-layout-variant: ${layoutVariant};
  --app-sidebar-variant: ${sidebarVariant};
}
`.trim();

  return { cssText, warnings };
}

// Helper functions
function darkenColor(value: string, amount: number): string {
  const parsed = parseColor(value);
  if (!parsed) return value;
  const r = clamp(Math.round(parsed.r * (1 - amount)), 0, 255);
  const g = clamp(Math.round(parsed.g * (1 - amount)), 0, 255);
  const b = clamp(Math.round(parsed.b * (1 - amount)), 0, 255);
  return `rgb(${r} ${g} ${b})`;
}

function getLuminance(value: string): number {
  const parsed = parseColor(value);
  if (!parsed) return 0;
  const r = parsed.r / 255;
  const g = parsed.g / 255;
  const b = parsed.b / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(fg: string, bg: string): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function mapFontStack(id: string): string {
  const stacks: Record<string, string> = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    "comic-sans": '"Comic Sans MS", "Comic Sans", cursive',
    mono: 'ui-monospace, SFMono-Regular, "Courier New", monospace',
    serif: 'Georgia, "Times New Roman", serif',
    "retro-pixel": '"Press Start 2P", monospace',
  };
  return stacks[id] ?? stacks.system;
}

function parseColor(value: string): RgbColor | null {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    return parseHexColor(trimmed);
  }
  if (trimmed.toLowerCase().startsWith("rgb")) {
    return parseRgbColor(trimmed);
  }
  if (trimmed.toLowerCase().startsWith("oklch")) {
    return parseOklchColor(trimmed);
  }
  return null;
}

function parseHexColor(value: string): RgbColor | null {
  const match = value.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (!match) return null;
  const hex = match[1].slice(0, 6);
  const rgb = parseInt(hex, 16);
  return {
    r: (rgb >> 16) & 0xff,
    g: (rgb >> 8) & 0xff,
    b: rgb & 0xff,
  };
}

function parseRgbColor(value: string): RgbColor | null {
  const match = value.match(/^rgba?\((.+)\)$/i);
  if (!match) return null;

  const [colorPart, alphaPart] = splitColorParts(match[1]);
  const comps = splitNumbers(colorPart);
  if (comps.length < 3) return null;

  const r = parseRgbComponent(comps[0]);
  const g = parseRgbComponent(comps[1]);
  const b = parseRgbComponent(comps[2]);
  if (r === null || g === null || b === null) return null;

  const alpha = alphaPart !== null ? parseAlphaComponent(alphaPart) : undefined;
  if (alphaPart !== null && alpha === null) return null;

  return { r, g, b, alpha };
}

function parseOklchColor(value: string): RgbColor | null {
  const match = value.match(/^oklch\((.+)\)$/i);
  if (!match) return null;

  const [colorPart, alphaPart] = splitColorParts(match[1]);
  const comps = splitNumbers(colorPart);
  if (comps.length < 3) return null;

  const l = comps[0];
  const c = comps[1];
  const h = comps[2];
  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) return null;

  const alpha = alphaPart !== null ? parseAlphaComponent(alphaPart) : undefined;
  if (alphaPart !== null && alpha === null) return null;

  const { r, g, b } = oklchToRgb(l, c, h);
  return { r, g, b, alpha };
}

function oklchToRgb(l: number, c: number, h: number): RgbColor {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const x = 0.4122214708 * l3 + 0.5363325363 * m3 + 0.0514459929 * s3;
  const y = 0.2119034982 * l3 + 0.6806995451 * m3 + 0.1073969566 * s3;
  const z = 0.0883024619 * l3 + 0.2817188376 * m3 + 0.6299787005 * s3;

  let r = 4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z;
  let g = -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z;
  let b2 = -0.0041960863 * x - 0.7034186147 * y + 1.707614701 * z;

  r = linearToSrgb(r);
  g = linearToSrgb(g);
  b2 = linearToSrgb(b2);

  return {
    r: clamp(Math.round(r * 255), 0, 255),
    g: clamp(Math.round(g * 255), 0, 255),
    b: clamp(Math.round(b2 * 255), 0, 255),
  };
}

function linearToSrgb(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

function splitColorParts(value: string): [string, string | null] {
  const parts = value.split("/");
  const colorPart = parts[0].trim();
  const alphaPart = parts[1]?.trim() ?? null;
  return [colorPart, alphaPart];
}

function splitNumbers(value: string): Array<number | string> {
  return value
    .replace(/,/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (part.endsWith("%")) return part;
      const parsed = Number(part);
      return Number.isFinite(parsed) ? parsed : part;
    });
}

function parseRgbComponent(value: number | string): number | null {
  if (typeof value === "number") {
    return value >= 0 && value <= 255 ? value : null;
  }
  if (typeof value === "string" && value.endsWith("%")) {
    const parsed = Number(value.slice(0, -1));
    if (!Number.isFinite(parsed)) return null;
    return clamp(Math.round((parsed / 100) * 255), 0, 255);
  }
  return null;
}

function parseAlphaComponent(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const parsed = Number(trimmed.slice(0, -1));
    if (!Number.isFinite(parsed)) return null;
    const alpha = parsed / 100;
    return alpha >= 0 && alpha <= 1 ? alpha : null;
  }
  const parsed = Number(trimmed);
  return parsed >= 0 && parsed <= 1 ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

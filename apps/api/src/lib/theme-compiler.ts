import type { ThemeSpec } from "@slop/shared";

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

    // Accent foreground - use bg or fg depending on accent luminance
    accentForeground: getLuminance(colors.accent) > 0.5 ? colors.bg : colors.fg,

    // Keep semantic colors visible
    danger: "#ff4444",
    warning: "#ffaa00",
    success: colors.accent, // Use accent as success
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

/**
 * Compiles a ThemeSpec into CSS variable overrides
 *
 * IMPORTANT: We override BASE variables (--background, --foreground, etc.)
 * NOT the @theme inline mapped variables (--color-bg, --color-fg).
 * The two-layer pattern means changing base variables automatically
 * updates all Tailwind utilities.
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

  const accentContrast = getContrastRatio(spec.colors.accent, spec.colors.bg);
  if (accentContrast < 3) {
    warnings.push(`Low accent contrast: ${accentContrast.toFixed(1)}:1`);
  }

  // Build CSS - override BASE variables
  const radius = getRadiusValue(spec.radius);

  const cssText = `
:root[data-theme="user:${themeId}"],
.theme-scope[data-theme="user:${themeId}"] {
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

/**
 * Theme preset definitions.
 *
 * This file is intentionally NOT a client module so it can be
 * imported by both Server and Client Components.
 */

export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "The classic slop.haus look" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
  { id: "warm", name: "Warm", description: "Cozy orange tones" },
  { id: "light", name: "Light", description: "Clean light mode" },
  { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
  { id: "forest", name: "Forest", description: "Natural green tones" },
] as const;

export type PresetTheme = (typeof PRESET_THEMES)[number];
export type PresetThemeId = PresetTheme["id"];

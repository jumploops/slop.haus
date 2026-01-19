"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export const PRESET_THEMES = [
  { id: "default", name: "Default", description: "The classic slop.haus look" },
  { id: "cyberpunk", name: "Cyberpunk", description: "Neon cyan on dark blue" },
  { id: "warm", name: "Warm", description: "Cozy orange tones" },
  { id: "light", name: "Light", description: "Clean light mode" },
  { id: "midnight", name: "Midnight", description: "Elegant purple accent" },
  { id: "forest", name: "Forest", description: "Natural green tones" },
] as const;

export type PresetThemeId = (typeof PRESET_THEMES)[number]["id"];

const RUNTIME_STYLE_ID = "user-theme-styles";

export function useTheme() {
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Apply a preset theme
   */
  const setTheme = (id: PresetThemeId) => {
    clearUserStyles();
    setNextTheme(id);
  };

  /**
   * Apply a user-generated theme (CSS variable overrides)
   * For LLM-generated themes, we inject a style tag
   */
  const applyUserTheme = (id: string, cssText: string) => {
    // Inject runtime styles
    let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = RUNTIME_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = cssText;

    // Save CSS for persistence
    localStorage.setItem(`slop-user-theme:${id}`, cssText);

    // Set a user theme identifier
    setNextTheme(`user:${id}`);
  };

  /**
   * Reset to default theme
   */
  const reset = () => {
    clearUserStyles();
    setNextTheme("default");
  };

  const clearUserStyles = () => {
    const style = document.getElementById(RUNTIME_STYLE_ID);
    if (style) style.remove();
  };

  // Restore user theme CSS on mount if needed
  useEffect(() => {
    if (mounted && theme?.startsWith("user:")) {
      const id = theme.replace("user:", "");
      const cssText = localStorage.getItem(`slop-user-theme:${id}`);
      if (cssText) {
        let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = RUNTIME_STYLE_ID;
          document.head.appendChild(style);
        }
        style.textContent = cssText;
      }
    }
  }, [mounted, theme]);

  // Derive current state
  const currentTheme = mounted ? theme : "default";
  const isUserTheme = currentTheme?.startsWith("user:") ?? false;
  const currentPresetId = isUserTheme ? null : currentTheme;
  const currentPreset = PRESET_THEMES.find((t) => t.id === currentPresetId);

  return {
    // State
    theme: currentTheme as PresetThemeId | string | undefined,
    isUserTheme,
    currentPreset,
    presets: PRESET_THEMES,
    mounted,

    // Actions
    setTheme,
    applyUserTheme,
    reset,
  };
}

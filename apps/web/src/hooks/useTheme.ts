"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PRESET_THEMES, type PresetThemeId } from "@/lib/theme-constants";

// Re-export for backwards compatibility
export { PRESET_THEMES, type PresetThemeId } from "@/lib/theme-constants";

const RUNTIME_STYLE_ID = "user-theme-styles";
const CUSTOM_THEME_PREFIX = "custom:";
const THEME_CSS_PREFIX = "slop-theme-css:";
const THEME_META_PREFIX = "slop-theme-meta:";
const LEGACY_THEME_CSS_PREFIX = "slop-user-theme:";
const LEGACY_THEME_META_PREFIX = "slop-user-theme-meta:";

interface UserThemeMeta {
  name: string;
  author?: string;
  icon?: string;
}

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
  const applyUserTheme = (id: string, cssText: string, meta?: UserThemeMeta) => {
    // Inject runtime styles
    let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = RUNTIME_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = cssText;

    // Save CSS for persistence
    localStorage.setItem(`${THEME_CSS_PREFIX}${id}`, cssText);
    if (meta) {
      localStorage.setItem(`${THEME_META_PREFIX}${id}`, JSON.stringify(meta));
    }

    // Set a user theme identifier
    setNextTheme(`${CUSTOM_THEME_PREFIX}${id}`);
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
    if (mounted && theme?.startsWith(CUSTOM_THEME_PREFIX)) {
      const id = theme.replace(CUSTOM_THEME_PREFIX, "");
      const cssText =
        localStorage.getItem(`${THEME_CSS_PREFIX}${id}`) ??
        localStorage.getItem(`${LEGACY_THEME_CSS_PREFIX}${id}`);
      if (cssText) {
        let style = document.getElementById(RUNTIME_STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
          style = document.createElement("style");
          style.id = RUNTIME_STYLE_ID;
          document.head.appendChild(style);
        }
        style.textContent = cssText;
      }
      document.documentElement.removeAttribute("data-theme-loading");
    }
  }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    if (!theme?.startsWith(CUSTOM_THEME_PREFIX)) {
      document.documentElement.removeAttribute("data-theme-loading");
    }
  }, [mounted, theme]);

  // Derive current state
  const currentTheme = mounted ? theme : "default";
  const isCustomTheme = currentTheme?.startsWith(CUSTOM_THEME_PREFIX) ?? false;
  const currentPresetId = isCustomTheme ? null : currentTheme;
  const currentPreset = PRESET_THEMES.find((t) => t.id === currentPresetId);

  return {
    // State
    theme: currentTheme as PresetThemeId | string | undefined,
    isUserTheme: isCustomTheme,
    isCustomTheme,
    currentPreset,
    presets: PRESET_THEMES,
    mounted,

    // Actions
    setTheme,
    applyUserTheme,
    reset,
  };
}

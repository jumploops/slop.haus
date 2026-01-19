"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Available preset themes - re-exported from useTheme for consistency
export { PRESET_THEMES, type PresetThemeId } from "@/hooks/useTheme";
import { PRESET_THEMES } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="default"
      themes={PRESET_THEMES.map((t) => t.id)}
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="slop-theme"
    >
      {children}
    </NextThemesProvider>
  );
}

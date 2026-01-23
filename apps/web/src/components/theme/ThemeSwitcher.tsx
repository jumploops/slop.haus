"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-8 w-8 items-center justify-center border-2 border-dashed border-border">
        <span className="sr-only">Loading theme toggle</span>
      </div>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="group relative flex h-8 w-8 items-center justify-center border-2 border-dashed border-border bg-muted transition-all hover:border-primary hover:rotate-3"
      title={`Current: ${theme}. Click to cycle.`}
    >
      {theme === "light" && (
        <Sun className="h-4 w-4 text-slop-orange transition-transform group-hover:scale-110" />
      )}
      {theme === "dark" && (
        <Moon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" />
      )}
      {theme === "system" && (
        <Monitor className="h-4 w-4 text-muted-foreground transition-transform group-hover:scale-110" />
      )}
      <span className="sr-only">Toggle theme (current: {theme})</span>
    </button>
  );
}

export const ThemeSwitcher = ThemeToggle;

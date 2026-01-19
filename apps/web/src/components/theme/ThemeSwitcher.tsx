"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, isUserTheme, currentPreset, presets, setTheme, reset, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted">
        <PaletteIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Theme</span>
      </button>
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md",
          "text-sm text-muted hover:text-fg",
          "bg-transparent hover:bg-border",
          "border border-transparent hover:border-border",
          "transition-colors duration-200"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <PaletteIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {isUserTheme ? "Custom" : currentPreset?.name || "Theme"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 min-w-[200px] bg-bg-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2">
            <p className="text-xs text-muted px-2 py-1 uppercase tracking-wide">
              Presets
            </p>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setTheme(preset.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm",
                  "hover:bg-border transition-colors",
                  theme === preset.id && !isUserTheme
                    ? "text-accent"
                    : "text-fg"
                )}
              >
                <span className="font-medium">{preset.name}</span>
                <span className="block text-xs text-muted">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>

          {isUserTheme && (
            <>
              <div className="border-t border-border" />
              <div className="p-2">
                <button
                  onClick={() => {
                    reset();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-muted hover:text-fg hover:bg-border"
                >
                  Reset to Default
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

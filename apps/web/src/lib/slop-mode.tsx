"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "slop:mode";

interface SlopModeContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}

const SlopModeContext = createContext<SlopModeContextValue | null>(null);

export function SlopModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "off") {
      setEnabled(false);
    } else if (stored === "on") {
      setEnabled(true);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  }, [enabled, isInitialized]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggle: () => setEnabled((prev) => !prev),
    }),
    [enabled]
  );

  return <SlopModeContext.Provider value={value}>{children}</SlopModeContext.Provider>;
}

export function useSlopMode() {
  const context = useContext(SlopModeContext);
  if (!context) {
    throw new Error("useSlopMode must be used within SlopModeProvider");
  }
  return context;
}

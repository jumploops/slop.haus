"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "slop:mode";
const SLOP_MODE_CHANGE_EVENT = "slop:mode-change";

interface SlopModeContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
}

const SlopModeContext = createContext<SlopModeContextValue | null>(null);

function getServerSnapshot() {
  return true;
}

function getClientSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) !== "off";
}

function subscribe(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SLOP_MODE_CHANGE_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SLOP_MODE_CHANGE_EVENT, handleLocalChange);
  };
}

function writeSlopMode(enabled: boolean) {
  window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  window.dispatchEvent(new Event(SLOP_MODE_CHANGE_EVENT));
}

export function SlopModeProvider({ children }: { children: React.ReactNode }) {
  const enabled = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const setEnabled = useCallback((value: boolean) => {
    writeSlopMode(value);
  }, []);

  const toggle = useCallback(() => {
    writeSlopMode(!enabled);
  }, [enabled]);

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      toggle,
    }),
    [enabled, setEnabled, toggle]
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

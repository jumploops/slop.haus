"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface LoginModalContextValue {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return context;
}

export function useLoginModalState() {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsOpen(true), []);
  const closeLoginModal = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    openLoginModal,
    closeLoginModal,
  };
}

"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "border-2 border-[color:var(--foreground)] bg-bg-secondary text-fg p-0",
        "max-w-[500px] w-[90%] m-auto",
        "backdrop:bg-fg/75",
        className
      )}
      onClick={handleBackdropClick}
    >
      <div className="bg-bg border-2 border-[color:var(--border)] p-4">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slop-purple">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-fg text-xl leading-none p-0 bg-transparent border-none cursor-pointer hover:text-slop-coral"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        )}
        <div className="text-fg">{children}</div>
      </div>
    </dialog>
  );
}

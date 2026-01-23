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
        "border-2 border-border bg-card text-foreground p-0",
        "max-w-[500px] w-[90%] m-auto",
        "backdrop:bg-foreground/75",
        className
      )}
      onClick={handleBackdropClick}
    >
      <div className="bg-background border-2 border-border p-4">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-foreground text-xl leading-none p-0 bg-transparent border-none cursor-pointer hover:text-primary"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        )}
        <div className="text-foreground">{children}</div>
      </div>
    </dialog>
  );
}

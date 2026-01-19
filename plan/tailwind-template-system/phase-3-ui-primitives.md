# Phase 3: Migrate UI Primitives

**Status:** Complete

## Overview

Migrate the core UI components from CSS classes to Tailwind utilities with semantic tokens. Use **class-variance-authority (CVA)** for type-safe variant management.

## Key Concept: Class Variance Authority (CVA)

CVA provides a structured way to define component variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base classes (always applied)
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-foreground hover:bg-accent-dim",
        secondary: "bg-transparent border border-border hover:bg-border",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// TypeScript extracts variant types automatically
type ButtonProps = VariantProps<typeof buttonVariants>;
```

**Benefits:**
- Type-safe variants with autocomplete
- Cleaner component code
- Easy to add new variants
- Works perfectly with `cn()` for overrides

## Components to Migrate

| Component | File | Complexity |
|-----------|------|------------|
| Button | `components/ui/Button.tsx` | Medium |
| Input | `components/ui/Input.tsx` | Medium |
| Badge | `components/ui/Badge.tsx` | Low |
| Avatar | `components/ui/Avatar.tsx` | Low |
| Skeleton | `components/ui/Skeleton.tsx` | Low |
| Modal | `components/ui/Modal.tsx` | Medium |
| Toast | `components/ui/Toast.tsx` | Medium |
| Tabs | `components/ui/Tabs.tsx` | Low |

## Prerequisites

- Phase 1 complete (Tailwind + CVA installed, cn() updated)
- Phase 2 complete (Semantic tokens defined)

## Tasks

### 3.1 Button Component

**File:** `apps/web/src/components/ui/Button.tsx`

**Current implementation:**
```tsx
<button className={cn("btn", "btn-primary", className)}>
```

**Migrated implementation (with CVA):**
```tsx
"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-accent-foreground border border-accent",
          "hover:bg-accent-dim hover:border-accent-dim",
        ],
        secondary: [
          "bg-transparent text-fg border border-border",
          "hover:bg-border",
        ],
        ghost: [
          "bg-transparent text-muted border border-transparent",
          "hover:text-fg hover:bg-border",
        ],
        danger: [
          "bg-danger text-white border border-danger",
          "hover:opacity-90",
        ],
      },
      size: {
        sm: "px-2 py-1 text-xs rounded-sm",
        md: "px-4 py-2 text-sm rounded-md",
        lg: "px-6 py-3 text-base rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant, size, loading = false, disabled, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          loading && "relative text-transparent",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="h-4 w-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
          </span>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Export variants for composition (e.g., button-styled links)
export { buttonVariants };
```

### 3.2 Input Component

**File:** `apps/web/src/components/ui/Input.tsx`

```tsx
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "px-3 py-2.5 rounded-md",
            "bg-bg-secondary text-fg text-sm",
            "border border-border",
            "transition-colors duration-200",
            "placeholder:text-muted",
            "focus:outline-none focus:border-accent",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helper && !error && <p className="text-xs text-muted">{helper}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

### 3.3 Badge Component

**File:** `apps/web/src/components/ui/Badge.tsx`

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-border text-fg",
        secondary: "bg-bg-secondary text-muted",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        danger: "bg-danger/15 text-danger",
        dev: "bg-purple-500/15 text-purple-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}

export { badgeVariants };
```

### 3.4 Avatar Component

**File:** `apps/web/src/components/ui/Avatar.tsx`

```tsx
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-border overflow-hidden flex-shrink-0",
        size === "sm" && "w-6 h-6 text-[0.625rem]",
        size === "md" && "w-8 h-8 text-xs",
        size === "lg" && "w-12 h-12 text-base",
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span className="text-fg font-medium">{initials}</span>
      )}
    </div>
  );
}
```

### 3.5 Skeleton Component

**File:** `apps/web/src/components/ui/Skeleton.tsx`

```tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "avatar" | "image" | "title" | "tagline";
}

export function Skeleton({ className, variant }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-gradient-to-r from-border via-bg-secondary to-border bg-[length:200%_100%]",
        variant === "text" && "h-4 w-full",
        variant === "avatar" && "w-8 h-8 rounded-full",
        variant === "image" && "w-[120px] h-[80px]",
        variant === "title" && "h-6 w-3/5",
        variant === "tagline" && "h-4 w-4/5",
        className
      )}
      style={{
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
}
```

**Note:** Add shimmer keyframe to theme.css:
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 3.6 Modal Component

**File:** `apps/web/src/components/ui/Modal.tsx`

```tsx
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "border-none rounded-xl bg-bg text-fg p-0",
        "max-w-[500px] w-[90%] m-auto",
        "backdrop:bg-black/75",
        className
      )}
      onClick={handleBackdropClick}
      onClose={onClose}
    >
      <div className="p-6">
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-fg text-2xl leading-none p-0 bg-transparent border-none cursor-pointer"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="text-fg">{children}</div>
      </div>
    </dialog>
  );
}
```

### 3.7 Toast Component

**File:** `apps/web/src/components/ui/Toast.tsx`

```tsx
"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-[1000]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg",
              "bg-bg-secondary border text-fg text-sm",
              "animate-[slideIn_0.2s_ease]",
              toast.type === "success" && "border-accent",
              toast.type === "error" && "border-danger",
              toast.type === "info" && "border-border"
            )}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-muted hover:text-fg text-lg leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
```

### 3.8 Tabs Component

**File:** `apps/web/src/components/ui/Tabs.tsx`

```tsx
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex gap-2 border-b border-border mb-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "px-4 py-3 text-sm font-medium relative",
            "bg-transparent border-none cursor-pointer",
            "transition-colors duration-200",
            activeTab === tab.id
              ? "text-accent"
              : "text-muted hover:text-fg"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
```

## CSS Cleanup

After migrating each component, remove the corresponding CSS classes from `globals.css`:

| Component | CSS Classes to Remove |
|-----------|----------------------|
| Button | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-lg`, `.btn-loading`, `.btn-spinner` |
| Input | `.input-wrapper`, `.input-label`, `.input`, `.input-error`, `.input-error-text`, `.input-helper`, `.textarea` |
| Badge | `.badge`, `.badge-default`, `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-dev` |
| Avatar | `.avatar`, `.avatar-sm`, `.avatar-md`, `.avatar-lg`, `.avatar-image`, `.avatar-initials` |
| Skeleton | `.skeleton`, `.skeleton-text`, `.skeleton-avatar`, `.skeleton-image`, `.skeleton-title`, `.skeleton-tagline` |
| Modal | `.modal`, `.modal-content`, `.modal-header`, `.modal-title`, `.modal-close`, `.modal-body` |
| Toast | `.toast-container`, `.toast`, `.toast-success`, `.toast-error`, `.toast-info`, `.toast-dismiss` |
| Tabs | `.tabs`, `.tab`, `.tab.active` |

## Verification Checklist

For each component:
- [ ] Visual appearance matches original exactly
- [ ] Hover states work correctly
- [ ] Focus states work correctly
- [ ] Disabled states work correctly
- [ ] All size variants render correctly
- [ ] All color variants render correctly
- [ ] Theme switching changes component colors
- [ ] No TypeScript errors
- [ ] No console warnings

## Files Changed

| File | Action |
|------|--------|
| `apps/web/src/components/ui/Button.tsx` | Rewrite with CVA |
| `apps/web/src/components/ui/Input.tsx` | Rewrite with Tailwind |
| `apps/web/src/components/ui/Badge.tsx` | Rewrite with CVA |
| `apps/web/src/components/ui/Avatar.tsx` | Rewrite with CVA |
| `apps/web/src/components/ui/Skeleton.tsx` | Rewrite with Tailwind |
| `apps/web/src/components/ui/Modal.tsx` | Rewrite with Tailwind |
| `apps/web/src/components/ui/Toast.tsx` | Rewrite with Tailwind |
| `apps/web/src/components/ui/Tabs.tsx` | Rewrite with Tailwind |
| `apps/web/src/app/globals.css` | Remove migrated classes |

## Notes

### When to Use CVA

Use CVA for components with **multiple variant dimensions**:
- Button (variant + size)
- Badge (variant)
- Avatar (size)

Skip CVA for simpler components where inline conditionals are clearer:
- Input (mostly base styles with optional error state)
- Skeleton (single variant dimension)
- Modal (structural component, few variants)

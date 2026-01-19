"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantProps } from "./button-variants";

// Re-export for convenience
export { buttonVariants } from "./button-variants";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
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

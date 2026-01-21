"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
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
            "px-3 py-2 rounded-sm",
            "bg-bg-secondary text-fg text-sm",
            "border-2 border-[color:var(--border)]",
            "shadow-[inset_1px_1px_0_var(--background-secondary),inset_-1px_-1px_0_var(--border)]",
            "transition-colors duration-200",
            "placeholder:text-muted",
            "focus:outline-none focus:border-accent",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: React.ReactNode;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "px-3 py-2 rounded-sm min-h-[100px] resize-y",
            "bg-bg-secondary text-fg text-sm",
            "border-2 border-[color:var(--border)]",
            "shadow-[inset_1px_1px_0_var(--background-secondary),inset_-1px_-1px_0_var(--border)]",
            "transition-colors duration-200",
            "placeholder:text-muted",
            "focus:outline-none focus:border-accent",
            error && "border-danger",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {helperText && !error && <p className="text-xs text-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

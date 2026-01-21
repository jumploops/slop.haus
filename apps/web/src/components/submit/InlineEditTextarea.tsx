"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface InlineEditTextareaProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minRows?: number;
  className?: string;
}

export function InlineEditTextarea({
  value,
  onSave,
  placeholder = "Click to edit",
  maxLength,
  minRows = 3,
  className,
}: InlineEditTextareaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();

    // Only save if value changed
    if (trimmedValue !== value) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape cancels
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
      // Ctrl/Cmd + Enter saves
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave, handleCancel]
  );

  const handleDisplayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  // Focus textarea and adjust height when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
      adjustHeight();
    }
  }, [isEditing, adjustHeight]);

  // Adjust height when value changes
  useEffect(() => {
    if (isEditing) {
      adjustHeight();
    }
  }, [editValue, isEditing, adjustHeight]);

  if (isEditing) {
    return (
      <div className={className}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={minRows}
          aria-label={placeholder}
          className={cn(
            "w-full px-2 py-1 text-sm resize-none",
            "bg-bg-secondary text-fg",
            "border-2 border-[color:var(--border)]",
            "shadow-[inset_1px_1px_0_var(--background-secondary),inset_-1px_-1px_0_var(--border)]",
            "focus:outline-none focus:border-accent"
          )}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted">
            Press Escape to cancel, Cmd+Enter to save
          </span>
          {maxLength && (
            <span
              className={cn(
                "text-[10px]",
                editValue.length > maxLength * 0.9 ? "text-warning" : "text-muted"
              )}
            >
              {editValue.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }

  const isEmpty = !value || value.trim() === "";

  return (
    <div
      className={cn(
        "px-2 py-1 text-sm",
        "border-2 border-[color:var(--border)]",
        "bg-bg-secondary cursor-pointer transition-colors",
        "hover:bg-bg",
        isEmpty && "text-muted italic",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleDisplayKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${placeholder}: ${value || "empty"}. Click to edit.`}
    >
      {isEmpty ? placeholder : value}
    </div>
  );
}

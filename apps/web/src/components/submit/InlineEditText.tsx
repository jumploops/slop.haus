"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
}

export function InlineEditText({
  value,
  onSave,
  placeholder = "Click to edit",
  maxLength,
  required = false,
  className,
  as: Element = "span",
}: InlineEditTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editValue when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleClick = useCallback(() => {
    setIsEditing(true);
    setEditValue(value);
  }, [value]);

  const handleSave = useCallback(() => {
    const trimmedValue = editValue.trim();

    // Don't save empty required fields
    if (required && !trimmedValue) {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    // Only save if value changed
    if (trimmedValue !== value) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  }, [editValue, value, required, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
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

  // Focus and select input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className={cn("inline-edit-input", className)}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-required={required}
        />
      </div>
    );
  }

  const isEmpty = !value || value.trim() === "";

  return (
    <Element
      className={cn("editable-field", className, isEmpty && "empty")}
      onClick={handleClick}
      onKeyDown={handleDisplayKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${placeholder}: ${value || "empty"}. Click to edit.`}
    >
      {isEmpty ? placeholder : value}
    </Element>
  );
}

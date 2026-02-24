"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  value?: string;
  onChange?: (value: string) => void;
  showIntro?: boolean;
  showSupportedText?: boolean;
}

export function UrlInput({
  onAnalyze,
  isLoading,
  error,
  value,
  onChange,
  showIntro = true,
  showSupportedText = true,
}: UrlInputProps) {
  const [internalUrl, setInternalUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const isControlled = typeof value === "string";
  const url = isControlled ? value : internalUrl;

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setValidationError("Please enter a URL");
      return false;
    }

    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setValidationError("Only HTTP/HTTPS URLs are supported");
        return false;
      }
      setValidationError(null);
      return true;
    } catch {
      setValidationError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      onAnalyze(url);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    if (isControlled) {
      onChange?.(nextValue);
    } else {
      setInternalUrl(nextValue);
    }
    if (validationError) {
      setValidationError(null);
    }
  };

  const displayError = error || validationError;

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl text-center">
      {showIntro && (
        <div className="mb-6">
          <h1 className="mb-2 font-mono text-2xl font-black text-foreground">
            Share your vibecoded project
          </h1>
          <p className="text-xs text-muted-foreground">
            Enter a URL and we&apos;ll extract the details for you
          </p>
        </div>
      )}

      <div className="mb-4">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="https://github.com/user/project or any live URL"
          disabled={isLoading}
          className={cn(
            "w-full px-3 py-2 text-sm font-mono",
            "bg-background text-foreground",
            "border-2 border-border",
            "placeholder:text-muted-foreground focus:outline-none focus:border-primary",
            displayError && "border-destructive"
          )}
          autoFocus
        />
        {displayError && (
          <p className="text-xs text-destructive mt-2">{displayError}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading || !url.trim()}
        loading={isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? "Analyzing..." : "Analyze Project"}
      </Button>

      {showSupportedText && (
        <div className="mt-4">
          <p className="text-[10px] text-muted-foreground">
            Supported: GitHub, GitLab, npm, live websites, Chrome Web Store, Steam
          </p>
        </div>
      )}
    </form>
  );
}

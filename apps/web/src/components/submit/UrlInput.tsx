"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function UrlInput({ onAnalyze, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

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
    setUrl(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const displayError = error || validationError;

  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="url-input-header">
        <h1>Share your vibecoded project</h1>
        <p className="text-muted">
          Enter a URL and we'll extract the details for you
        </p>
      </div>

      <div className="url-input-field">
        <input
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="https://github.com/user/project or any live URL"
          disabled={isLoading}
          className={displayError ? "input-error" : ""}
          autoFocus
        />
        {displayError && (
          <span className="error-message">{displayError}</span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading || !url.trim()}
        className="btn-large"
      >
        {isLoading ? "Analyzing..." : "Analyze Project"}
      </Button>

      <div className="url-input-hints">
        <p className="text-muted text-small">
          Supported: GitHub, GitLab, npm, live websites, Chrome Web Store, Steam
        </p>
      </div>
    </form>
  );
}

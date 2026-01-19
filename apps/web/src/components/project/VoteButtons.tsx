"use client";

import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  score: number;
  currentVote: number | null;
  onVote: (value: 1 | -1 | 0) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function VoteButtons({
  score,
  currentVote,
  onVote,
  disabled = false,
  size = "md",
}: VoteButtonsProps) {
  const handleUpvote = () => {
    if (disabled) return;
    onVote(currentVote === 1 ? 0 : 1);
  };

  const handleDownvote = () => {
    if (disabled) return;
    onVote(currentVote === -1 ? 0 : -1);
  };

  const buttonSize = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleUpvote}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded transition-colors",
          buttonSize,
          "bg-transparent border-none cursor-pointer",
          "text-muted hover:bg-border hover:text-fg",
          currentVote === 1 && "text-accent",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Upvote"
      >
        <UpArrow />
      </button>

      <span
        className={cn(
          "min-w-[2rem] text-center text-sm font-medium",
          score > 0 && "text-accent",
          score < 0 && "text-danger"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        type="button"
        onClick={handleDownvote}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center rounded transition-colors",
          buttonSize,
          "bg-transparent border-none cursor-pointer",
          "text-muted hover:bg-border hover:text-fg",
          currentVote === -1 && "text-danger",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Downvote"
      >
        <DownArrow />
      </button>
    </div>
  );
}

function UpArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 4L3 9h10L8 4z" />
    </svg>
  );
}

function DownArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 12L3 7h10L8 12z" />
    </svg>
  );
}

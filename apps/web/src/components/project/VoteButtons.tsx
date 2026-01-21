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
          "flex items-center justify-center transition-colors",
          "border-2 border-[color:var(--foreground)]",
          "bg-bg-secondary shadow-[2px_2px_0_var(--foreground)]",
          buttonSize,
          "cursor-pointer",
          "text-fg hover:bg-bg",
          currentVote === 1 && "bg-slop-green text-accent-foreground translate-x-[1px] translate-y-[1px] shadow-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Upvote"
      >
        <UpArrow />
      </button>

      <span
        className={cn(
          "min-w-[2.25rem] text-center text-xs font-bold",
          "border-2 border-[color:var(--foreground)]",
          "bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] px-1 py-0.5",
          score > 0 && "text-slop-green",
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
          "flex items-center justify-center transition-colors",
          "border-2 border-[color:var(--foreground)]",
          "bg-bg-secondary shadow-[2px_2px_0_var(--foreground)]",
          buttonSize,
          "cursor-pointer",
          "text-fg hover:bg-bg",
          currentVote === -1 && "bg-slop-coral text-accent-foreground translate-x-[1px] translate-y-[1px] shadow-none",
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

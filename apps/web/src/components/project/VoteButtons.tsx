"use client";

import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  score: number;
  currentVote: 1 | -1 | 0 | null;
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

  return (
    <div className={cn("vote-buttons", size === "sm" && "vote-buttons-sm")}>
      <button
        type="button"
        className={cn("vote-btn upvote", currentVote === 1 && "active")}
        onClick={handleUpvote}
        disabled={disabled}
        aria-label="Upvote"
      >
        <UpArrow />
      </button>
      <span
        className={cn(
          "vote-score",
          score > 0 && "positive",
          score < 0 && "negative"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>
      <button
        type="button"
        className={cn("vote-btn downvote", currentVote === -1 && "active")}
        onClick={handleDownvote}
        disabled={disabled}
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

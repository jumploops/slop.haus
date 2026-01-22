"use client";

import { cn } from "@/lib/utils";

interface LikeButtonProps {
  count: number;
  liked: boolean;
  onToggle: (nextValue: 1 | 0) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function LikeButton({
  count,
  liked,
  onToggle,
  disabled = false,
  size = "md",
  showCount = true,
}: LikeButtonProps) {
  const handleToggle = () => {
    if (disabled) return;
    onToggle(liked ? 0 : 1);
  };

  const buttonSize =
    size === "sm" ? "w-9 h-9 sm:w-7 sm:h-7" : "w-10 h-10 sm:w-8 sm:h-8";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex items-center justify-center transition-colors",
          "border-2 border-[color:var(--border)]",
          "bg-bg-secondary shadow-[2px_2px_0_var(--foreground)]",
          buttonSize,
          "cursor-pointer",
          "text-fg hover:bg-bg",
          liked && "bg-accent text-accent-foreground translate-x-[1px] translate-y-[1px] shadow-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <HeartIcon filled={liked} />
      </button>

      {showCount && (
        <span
          className={cn(
            "min-w-[2.25rem] text-center text-sm sm:text-xs font-bold",
            "border-2 border-[color:var(--border)]",
            "bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] px-1 py-0.5",
            count > 0 && "text-accent"
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 14.25l-1.45-1.32C2.8 9.5.5 7.48.5 5.07.5 3.12 2.02 1.5 3.88 1.5c1.05 0 2.06.48 2.72 1.25h.8c.66-.77 1.67-1.25 2.72-1.25 1.86 0 3.38 1.62 3.38 3.57 0 2.41-2.3 4.43-5.05 7.86L8 14.25z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 13.5l-1.2-1.1C3.4 9.4 1.5 7.6 1.5 5.4 1.5 3.6 2.9 2 4.6 2c1 0 2 .5 2.6 1.2h.6C8.4 2.5 9.4 2 10.4 2c1.7 0 3.1 1.6 3.1 3.4 0 2.2-1.9 4-5.3 7L8 13.5z" />
    </svg>
  );
}

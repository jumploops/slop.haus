import { cn } from "@/lib/utils";

interface VibeMeterProps {
  percent: number;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function VibeMeter({
  percent,
  showLabel = false,
  size = "md",
  className,
}: VibeMeterProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className={className}>
      <div
        className={cn(
          "w-full bg-border rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-accent-dim to-accent rounded-full transition-[width] duration-300"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Vibe</span>
          <span>{clampedPercent}%</span>
        </div>
      )}
    </div>
  );
}

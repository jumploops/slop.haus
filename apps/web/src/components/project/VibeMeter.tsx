import { cn } from "@/lib/utils";
import { clampVibePercent, getVibeLabel } from "@/lib/vibe-taxonomy";

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
  const clampedPercent = clampVibePercent(percent);
  const vibeLabel = getVibeLabel(clampedPercent);

  return (
    <div className={className}>
      <div
        className={cn(
          "w-full bg-muted border-2 border-border overflow-hidden",
          size === "sm" ? "h-2" : "h-3"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-slop-pink to-slop-lime transition-[width] duration-300"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span className="font-mono font-bold text-foreground">{vibeLabel}</span>
          <span>{clampedPercent}%</span>
        </div>
      )}
    </div>
  );
}

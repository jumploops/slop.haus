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
          "w-full bg-bg-secondary border-2 border-[color:var(--border)] overflow-hidden",
          size === "sm" ? "h-2" : "h-3"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-slop-teal to-slop-green transition-[width] duration-300"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-[10px] text-muted mt-1">
          <span className="font-bold text-slop-purple">Vibe</span>
          <span>{clampedPercent}%</span>
        </div>
      )}
    </div>
  );
}

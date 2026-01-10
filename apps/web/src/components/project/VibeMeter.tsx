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
    <div className={cn("vibe-meter-wrapper", className)}>
      <div className={cn("vibe-meter", size === "sm" && "vibe-meter-sm")}>
        <div
          className="vibe-meter-fill"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="vibe-meter-label">
          <span>{clampedPercent}% vibe</span>
        </div>
      )}
    </div>
  );
}

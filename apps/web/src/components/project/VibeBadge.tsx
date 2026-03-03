"use client";

import { cn } from "@/lib/utils";
import { type VibeBucket, getVibeTaxonomy } from "@/lib/vibe-taxonomy";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/Tooltip";

interface VibeBadgeProps {
  percent: number;
  size?: "sm" | "md";
  className?: string;
}

const LEVEL_CONFIG: Record<
  VibeBucket,
  {
    label: string;
    color: string;
    glow: string;
    bg: string;
    ring: string;
  }
> = {
  0: {
    label: "Handcrafted",
    color: "text-rose-400",
    glow: "shadow-rose-500/20",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/25",
  },
  10: {
    label: "Mostly Human",
    color: "text-rose-400",
    glow: "shadow-rose-500/20",
    bg: "bg-rose-500/10",
    ring: "ring-rose-500/25",
  },
  20: {
    label: "Mostly Human",
    color: "text-orange-400",
    glow: "shadow-orange-500/20",
    bg: "bg-orange-500/10",
    ring: "ring-orange-500/25",
  },
  30: {
    label: "Mostly Human",
    color: "text-amber-400",
    glow: "shadow-amber-500/20",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/25",
  },
  40: {
    label: "AI-Assisted",
    color: "text-sky-400",
    glow: "shadow-sky-500/20",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/25",
  },
  50: {
    label: "AI-Assisted",
    color: "text-sky-400",
    glow: "shadow-sky-500/20",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/25",
  },
  60: {
    label: "AI-Assisted",
    color: "text-teal-400",
    glow: "shadow-teal-500/20",
    bg: "bg-teal-500/10",
    ring: "ring-teal-500/25",
  },
  70: {
    label: "Mostly AI",
    color: "text-teal-400",
    glow: "shadow-teal-500/20",
    bg: "bg-teal-500/10",
    ring: "ring-teal-500/25",
  },
  80: {
    label: "Mostly AI",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/25",
  },
  90: {
    label: "Vibecoded",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/25",
  },
  100: {
    label: "Pure Vibe",
    color: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/25",
  },
};

export function VibeBadge({ percent, size = "sm", className }: VibeBadgeProps) {
  const { clampedPercent, bucket } = getVibeTaxonomy(percent);
  const config = LEVEL_CONFIG[bucket];
  const progressClass = config.color.replace("text-", "bg-");
  const filledBars = Math.max(0, Math.min(5, Math.round(bucket / 20)));

  const sizeClasses = {
    sm: "gap-1 px-1.5 py-0.5 text-[10px]",
    md: "gap-1.5 px-2 py-1 text-xs",
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-card-interactive="true"
          className={cn(
            "pointer-events-auto inline-flex select-none items-center rounded-md font-mono font-medium tabular-nums leading-none ring-1 ring-inset transition-all duration-300",
            config.bg,
            config.color,
            config.ring,
            config.glow,
            sizeClasses[size],
            className
          )}
          aria-label={`${clampedPercent}% vibecoded (${config.label})`}
        >
          <VibeIcon filledBars={filledBars} className={iconSizeClasses[size]} />
          <span>{clampedPercent}%</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="w-44 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium text-popover-foreground">{config.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{clampedPercent}% AI</span>
          </div>
          <VibeProgress percent={clampedPercent} barClass={progressClass} />
          <p className="text-[10px] text-muted-foreground">{getVibeSummary(clampedPercent)}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function VibeIcon({ filledBars, className }: { filledBars: number; className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const barHeight = 4 + i * 2.5;
        const x = 1.5 + i * 3.8;
        const y = 16 - barHeight;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="2.8"
            height={barHeight}
            rx="1"
            className={cn("transition-opacity duration-200", i < filledBars ? "opacity-100" : "opacity-20")}
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}

function VibeProgress({ percent, barClass }: { percent: number; barClass: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden border border-border bg-muted">
      <div className={cn("h-full transition-[width] duration-300", barClass)} style={{ width: `${percent}%` }} />
    </div>
  );
}

function getVibeSummary(percent: number): string {
  if (percent === 0) return "Entirely human-written code";
  if (percent === 100) return "Entirely LLM-generated code";
  return `${percent}% AI-generated, ${100 - percent}% human-written`;
}

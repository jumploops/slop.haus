"use client";

import useSWR from "swr";
import { fetchVisitorCount } from "@/lib/api/visitor-count";

interface VisitorCounterProps {
  compact?: boolean;
}

const BASELINE_VISITOR_COUNT = 1;

export function VisitorCounter({ compact = false }: VisitorCounterProps) {
  const { data } = useSWR("visitor-count", fetchVisitorCount, {
    refreshInterval: 60_000,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const count =
    typeof data === "number" && Number.isFinite(data) && data > 0
      ? Math.floor(data)
      : BASELINE_VISITOR_COUNT;

  const digits = count.toString().padStart(6, "0").split("");

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">#</span>
        <div className="flex">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="flex h-5 w-4 items-center justify-center border border-border bg-card font-mono text-[10px] font-bold text-foreground shadow-inner"
            >
              {digit}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Visitors
      </span>
      <div className="flex gap-0.5">
        {digits.map((digit, i) => (
          <div
            key={i}
            className="flex h-6 w-5 items-center justify-center border border-border bg-card font-mono text-sm font-bold text-foreground shadow-inner"
          >
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}

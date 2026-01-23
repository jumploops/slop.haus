"use client";

import { useEffect, useState } from "react";

interface VisitorCounterProps {
  compact?: boolean;
}

export function VisitorCounter({ compact = false }: VisitorCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("slop-visitor-count");
    const baseCount = 13847;
    const currentCount = stored ? Number.parseInt(stored, 10) : baseCount;
    const newCount = currentCount + 1;
    localStorage.setItem("slop-visitor-count", newCount.toString());
    setCount(newCount);
  }, []);

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
      <div className="text-[10px] text-muted-foreground">Since Jan 1, 1999</div>
    </div>
  );
}

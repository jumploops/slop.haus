"use client";

import { useEffect, useState } from "react";

interface VisitorCounterProps {
  compact?: boolean;
}

const digitStyle = {
  backgroundColor: "#000",
  color: "#4ade80",
  borderColor: "#4b5563",
  textShadow: "0 0 5px #00ff00",
};

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
        <span className="text-[10px] text-accent-foreground/80">#</span>
        <div className="flex">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="w-4 h-5 flex items-center justify-center font-mono text-xs font-bold border-y first:border-l last:border-r first:rounded-l last:rounded-r"
              style={digitStyle}
            >
              {digit}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-bold text-center">
        <span className="text-slop-blue">YOU ARE VISITOR #</span>
      </div>
      <div className="flex gap-0.5">
        {digits.map((digit, i) => (
          <div
            key={i}
            className="w-6 h-8 flex items-center justify-center font-mono text-lg font-bold border"
            style={digitStyle}
          >
            {digit}
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted">Since Jan 1, 1999</div>
    </div>
  );
}

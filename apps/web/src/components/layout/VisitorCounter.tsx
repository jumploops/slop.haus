"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetchVisitorCount } from "@/lib/api/visitor-count";

interface VisitorCounterProps {
  compact?: boolean;
}

const BASELINE_VISITOR_COUNT = 1;

export function VisitorCounter({ compact = false }: VisitorCounterProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (shouldFetch || typeof window === "undefined") {
      return;
    }

    const element = rootRef.current;
    if (!element || typeof window.IntersectionObserver !== "function") {
      const timeoutId = window.setTimeout(() => {
        setShouldFetch(true);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        setShouldFetch(true);
        observer.disconnect();
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [shouldFetch]);

  const { data } = useSWR(shouldFetch ? "visitor-count" : null, fetchVisitorCount, {
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
      <div ref={rootRef} className="flex items-center gap-1">
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
    <div ref={rootRef} className="inline-flex flex-col items-center gap-1">
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { LikeButton } from "./LikeButton";
import { VibeMeter } from "./VibeMeter";
import { useLike } from "@/hooks/useLike";
import { useSlopMode } from "@/lib/slop-mode";
import { cn } from "@/lib/utils";

interface ScoreWidgetProps {
  projectSlug: string;
  likeCount: number;
  reviewCount: number;
  slopScore: number;
  vibePercent: number;
}

export function ScoreWidget({
  projectSlug,
  likeCount,
  reviewCount,
  slopScore,
  vibePercent,
}: ScoreWidgetProps) {
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const { likeState, submitLike, isLiking } = useLike(projectSlug, {
    onLikeSuccess: (result) => setLocalLikeCount(result.likeCount),
  });
  const { enabled: slopEnabled } = useSlopMode();

  useEffect(() => {
    setLocalLikeCount(likeCount);
  }, [likeCount]);

  const displayScore = useMemo(() => {
    if (reviewCount === 0) return "—";
    return slopScore.toFixed(1);
  }, [reviewCount, slopScore]);

  return (
    <div className="border-2 border-border bg-card p-4 space-y-6">
      {/* Slop Score Section */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            Slop Score
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "flex h-12 w-12 rotate-3 items-center justify-center rounded-sm font-mono text-lg font-black shadow-md",
              getSlopTone(slopScore, reviewCount),
              slopEnabled && "slop-sticky slop-sticky-outline"
            )}
          >
            {displayScore}
          </div>
        </div>
      </div>

      {/* Like Section */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Likes
        </p>
        <LikeButton
          count={localLikeCount}
          liked={likeState?.liked ?? false}
          onToggle={submitLike}
          disabled={isLiking}
          size="md"
        />
      </div>

      {/* Vibe Score Section */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          Vibe Percentile
        </p>
        <VibeMeter percent={vibePercent} showLabel />
      </div>
    </div>
  );
}

function getSlopTone(score: number, reviewCount: number) {
  if (reviewCount === 0) {
    return "bg-muted text-muted-foreground";
  }
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-slop-lime text-foreground";
  if (score >= 40) return "bg-slop-orange text-foreground";
  return "bg-destructive text-destructive-foreground";
}

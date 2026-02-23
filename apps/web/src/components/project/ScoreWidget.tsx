"use client";

import { useEffect, useMemo, useState } from "react";
import { LikeButton } from "./LikeButton";
import { VibeMeter } from "./VibeMeter";
import { useLike } from "@/hooks/useLike";
import { useSlopMode } from "@/lib/slop-mode";
import { cn } from "@/lib/utils";
import { getSlopBandForAggregateScore, getSlopBandTerm } from "@slop/shared";
import { formatSlopScore, getSlopBandBadgeClass } from "@/lib/slop-score-presentation";

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
    return formatSlopScore(slopScore);
  }, [reviewCount, slopScore]);
  const slopBand = useMemo(
    () => getSlopBandForAggregateScore(slopScore, reviewCount),
    [reviewCount, slopScore]
  );
  const slopTerm = getSlopBandTerm(slopBand);

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
              getSlopBandBadgeClass(slopBand),
              slopEnabled && "slop-sticky slop-sticky-outline"
            )}
          >
            {displayScore}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {slopTerm}
          </span>
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

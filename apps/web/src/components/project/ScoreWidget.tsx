"use client";

import { useEffect, useMemo, useState } from "react";
import { LikeButton } from "./LikeButton";
import { VibeMeter } from "./VibeMeter";
import { useLike } from "@/hooks/useLike";

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

  useEffect(() => {
    setLocalLikeCount(likeCount);
  }, [likeCount]);

  const displayScore = useMemo(() => {
    if (reviewCount === 0) return "—";
    return slopScore.toFixed(1);
  }, [reviewCount, slopScore]);

  return (
    <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
      <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-6">
        {/* Slop Score Section */}
        <div>
          <h4 className="text-xs font-bold text-slop-purple mb-2 text-center">~~ SLOP SCORE ~~</h4>
          <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-4 text-center">
            <div className="text-3xl font-bold text-fg">{displayScore}</div>
            <p className="text-[10px] text-muted mt-1">
              {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Like Section */}
        <div>
          <h4 className="text-xs font-bold text-slop-purple mb-2 text-center">~~ LIKES ~~</h4>
          <div className="flex justify-center">
            <LikeButton
              count={localLikeCount}
              liked={likeState?.liked ?? false}
              onToggle={submitLike}
              disabled={isLiking}
              size="md"
            />
          </div>
        </div>

        {/* Vibe Score Section */}
        <div>
          <h4 className="text-xs font-bold text-slop-purple mb-2 text-center">~~ VIBE PERCENTILE ~~</h4>
          <VibeMeter percent={vibePercent} showLabel />
        </div>
      </div>
    </div>
  );
}

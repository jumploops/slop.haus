"use client";

import { VoteButtons } from "./VoteButtons";
import { VibeMeter } from "./VibeMeter";
import { useVote } from "@/hooks/useVote";

interface ScoreWidgetProps {
  projectSlug: string;
  normalUp: number;
  normalDown: number;
  normalScore: number;
  devUp: number;
  devDown: number;
  devScore: number;
  vibePercent: number;
}

export function ScoreWidget({
  projectSlug,
  normalUp,
  normalDown,
  normalScore,
  devUp,
  devDown,
  devScore,
  vibePercent,
}: ScoreWidgetProps) {
  const { voteState, submitVote, isVoting } = useVote(projectSlug);

  return (
    <div className="border border-border rounded-lg p-4 bg-bg-secondary">
      {/* Vibe Score Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-2">Vibe Score</h4>
        <VibeMeter percent={vibePercent} showLabel />
      </div>

      {/* Community Votes Section */}
      <div>
        <h4 className="text-sm font-medium text-muted mb-3">Community Votes</h4>
        <div className="flex flex-col gap-3">
          {/* People channel */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg">People</span>
            <span className="text-xs text-muted">
              +{normalUp} / -{normalDown}
            </span>
            <VoteButtons
              score={normalScore}
              currentVote={voteState?.normal ?? null}
              onVote={(value) => submitVote("normal", value)}
              disabled={isVoting}
            />
          </div>
          {/* Dev channel */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-fg">Devs</span>
            <span className="text-xs text-muted">
              +{devUp} / -{devDown}
            </span>
            <VoteButtons
              score={devScore}
              currentVote={voteState?.dev ?? null}
              onVote={(value) => submitVote("dev", value)}
              disabled={isVoting || !voteState?.hasDevCredential}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

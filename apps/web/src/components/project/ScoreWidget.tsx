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
    <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
      <div className="bg-bg border-2 border-[color:var(--border)] p-4">
        {/* Vibe Score Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slop-purple mb-2 text-center">~~ VIBE SCORE ~~</h4>
          <VibeMeter percent={vibePercent} showLabel />
        </div>

        {/* Community Votes Section */}
        <div>
          <h4 className="text-xs font-bold text-slop-purple mb-3 text-center">~~ COMMUNITY VOTES ~~</h4>
          <div className="flex flex-col gap-3">
            {/* People channel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-fg">People</span>
              <span className="text-[10px] text-muted">
                +{normalUp} / -{normalDown}
              </span>
              <VoteButtons
                score={normalScore}
                currentVote={voteState?.normal ?? null}
                onVote={(value) => submitVote("normal", value)}
                disabled={isVoting}
                size="sm"
              />
            </div>
            {/* Dev channel */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs font-bold text-fg">Devs</span>
              <span className="text-[10px] text-muted">
                +{devUp} / -{devDown}
              </span>
              <VoteButtons
                score={devScore}
                currentVote={voteState?.dev ?? null}
                onVote={(value) => submitVote("dev", value)}
                disabled={isVoting || !voteState?.hasDevCredential}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

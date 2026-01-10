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
    <div className="score-widget">
      <div className="score-widget-section">
        <h4>Vibe Score</h4>
        <VibeMeter percent={vibePercent} showLabel />
      </div>

      <div className="score-widget-section">
        <h4>Community Votes</h4>
        <div className="score-channels">
          <div className="score-channel-row">
            <span className="score-channel-label">People</span>
            <span className="score-votes">+{normalUp} / -{normalDown}</span>
            <VoteButtons
              score={normalScore}
              currentVote={voteState?.normal ?? null}
              onVote={(value) => submitVote("normal", value)}
              disabled={isVoting}
            />
          </div>
          <div className="score-channel-row">
            <span className="score-channel-label">Devs</span>
            <span className="score-votes">+{devUp} / -{devDown}</span>
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

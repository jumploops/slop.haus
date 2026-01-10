"use client";

import Link from "next/link";
import { VibeMeter } from "./VibeMeter";
import { VoteButtons } from "./VoteButtons";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useVote } from "@/hooks/useVote";
import { useFavorite } from "@/hooks/useFavorite";
import { formatRelativeTime, getPlaceholderImage } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/api/projects";

interface ProjectCardProps {
  project: ProjectListItem;
  channel?: "normal" | "dev";
  showFavoriteButton?: boolean;
  onFavoriteChange?: () => void;
}

export function ProjectCard({
  project,
  channel = "normal",
  showFavoriteButton,
  onFavoriteChange,
}: ProjectCardProps) {
  const { voteState, submitVote, isVoting } = useVote(project.slug);
  const { isFavorited, toggleFavorite, isLoading: favoriteLoading } = useFavorite(
    project.slug,
    { onSuccess: onFavoriteChange }
  );

  const score = channel === "dev" ? project.devScore : project.normalScore;
  const currentVote = voteState?.[channel] ?? null;

  const thumbnailUrl = project.primaryMedia?.url || getPlaceholderImage(project.title);

  return (
    <article className="project-card">
      <div className="project-card-header">
        <Link href={`/p/${project.slug}`}>
          <img
            src={thumbnailUrl}
            alt={project.title}
            className="project-card-thumbnail"
          />
        </Link>
        <div className="project-card-content">
          <h3>
            <Link href={`/p/${project.slug}`}>{project.title}</Link>
          </h3>
          <p className="tagline">{project.tagline}</p>
          <VibeMeter percent={project.vibePercent} size="sm" />
        </div>
      </div>

      <div className="project-card-footer">
        <div className="meta">
          <span className="flex items-center gap-2">
            <Avatar
              src={project.author.image}
              alt={project.author.name}
              size="sm"
            />
            <span>{project.author.name}</span>
            {project.author.devVerified && <Badge variant="dev">Dev</Badge>}
          </span>
          <span>{formatRelativeTime(project.createdAt)}</span>
          <span>{project.commentCount} comments</span>
        </div>
        <div className="project-card-actions">
          {showFavoriteButton && (
            <Button
              variant={isFavorited ? "secondary" : "ghost"}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className="favorite-btn"
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <HeartIcon filled={isFavorited} />
            </Button>
          )}
          <VoteButtons
            score={score}
            currentVote={currentVote}
            onVote={(value) => submitVote(channel, value)}
            disabled={isVoting}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 14.25l-1.45-1.32C2.8 9.5.5 7.48.5 5.07.5 3.12 2.02 1.5 3.88 1.5c1.05 0 2.06.48 2.72 1.25h.8c.66-.77 1.67-1.25 2.72-1.25 1.86 0 3.38 1.62 3.38 3.57 0 2.41-2.3 4.43-5.05 7.86L8 14.25z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 13.5l-1.2-1.1C3.4 9.4 1.5 7.6 1.5 5.4 1.5 3.6 2.9 2 4.6 2c1 0 2 .5 2.6 1.2h.6C8.4 2.5 9.4 2 10.4 2c1.7 0 3.1 1.6 3.1 3.4 0 2.2-1.9 4-5.3 7L8 13.5z" />
    </svg>
  );
}

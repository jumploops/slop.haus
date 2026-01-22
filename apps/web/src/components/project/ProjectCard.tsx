"use client";

import Link from "next/link";
import { MessageCircle, ExternalLink } from "lucide-react";
import { LikeButton } from "./LikeButton";
import { Button } from "@/components/ui/Button";
import { useLike } from "@/hooks/useLike";
import { useFavorite } from "@/hooks/useFavorite";
import { useEffect, useState } from "react";
import { cn, formatRelativeTime, getPlaceholderImage } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/api/projects";

interface ProjectCardProps {
  project: ProjectListItem;
  showFavoriteButton?: boolean;
  onFavoriteChange?: () => void;
  rank?: number;
}

export function ProjectCard({
  project,
  showFavoriteButton,
  onFavoriteChange,
  rank,
}: ProjectCardProps) {
  const [localLikeCount, setLocalLikeCount] = useState(project.likeCount);
  const { likeState, submitLike, isLiking } = useLike(project.slug, {
    onLikeSuccess: (result) => setLocalLikeCount(result.likeCount),
  });

  useEffect(() => {
    setLocalLikeCount(project.likeCount);
  }, [project.likeCount]);
  const { isFavorited, toggleFavorite, isLoading: favoriteLoading } = useFavorite(
    project.slug,
    { onSuccess: onFavoriteChange }
  );


  const thumbnailUrl = project.primaryMedia?.url || getPlaceholderImage(project.title);
  const isNew = Date.now() - new Date(project.createdAt).getTime() < 2 * 24 * 60 * 60 * 1000;
  const slopScore = project.reviewCount === 0 ? "—" : project.slopScore.toFixed(1);
  const visitUrl = project.mainUrl || project.repoUrl;

  return (
    <article
      className={cn(
        "border-2 border-[color:var(--border)] bg-border p-0.5 group transition-transform",
        "shadow-[inset_1px_1px_0_var(--background-secondary),inset_-1px_-1px_0_var(--border)]",
        "hover:translate-x-1"
      )}
    >
      <div className="bg-bg-secondary border border-[color:var(--border)] flex flex-col sm:flex-row gap-3 p-3">
        {rank && (
          <div className="flex-shrink-0 sm:w-8 sm:text-center">
            <span className="text-2xl font-bold text-muted/70">{rank}</span>
          </div>
        )}

        <Link href={`/p/${project.slug}`} className="flex-shrink-0 w-full sm:w-auto no-underline">
          <div className="relative w-full h-32 sm:w-24 sm:h-16 overflow-hidden border-2 border-[color:var(--foreground)] bg-bg">
            <img src={thumbnailUrl} alt={project.title} className="w-full h-full object-cover" />
            {isNew && (
              <span className="absolute top-0 left-0">
                <span className="inline-block motion-safe:animate-[wobble_2.4s_ease-in-out_infinite]">
                  <span className="bg-danger text-bg text-[8px] font-bold px-1 animate-[blink_1s_step-end_infinite]">
                    NEW!
                  </span>
                </span>
              </span>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/p/${project.slug}`} className="no-underline hover:no-underline">
            <h3 className="font-bold text-slop-blue hover:text-slop-coral break-words sm:truncate">
              {project.title}
            </h3>
            <p className="text-xs text-muted line-clamp-2 mt-0.5">{project.tagline}</p>
          </Link>

          <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px] text-muted">
            <span className="text-muted">
              by <span className="font-bold text-slop-purple">{project.author.name}</span>
            </span>
            <span className="text-muted/70">•</span>
            <span>{formatRelativeTime(project.createdAt)}</span>
            <span className="text-muted/70">•</span>
            <span className="flex items-center gap-1 text-muted">
              <MessageCircle className="h-3 w-3" />
              {project.reviewCount}
            </span>
            {visitUrl && (
              <a
                href={visitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-slop-blue hover:text-slop-purple flex items-center gap-0.5 no-underline hover:no-underline"
              >
                <ExternalLink className="h-3 w-3" />
                visit
              </a>
            )}
          </div>
        </div>

        <div className="flex w-full sm:w-auto sm:flex-shrink-0 items-center gap-2 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-12 h-12 flex items-center justify-center",
                "border-2 border-[color:var(--foreground)] shadow-[2px_2px_0_var(--foreground)]",
                "text-accent-foreground font-bold text-lg",
                "bg-slop-green"
              )}
            >
              {slopScore}
            </div>
            <span className="text-[9px] font-bold text-slop-purple mt-0.5">SLOP</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center border-2 border-[color:var(--foreground)] shadow-[2px_2px_0_var(--foreground)] bg-slop-coral text-accent-foreground font-bold text-lg">
              {Math.round(project.vibePercent)}
            </div>
            <span className="text-[9px] font-bold text-slop-purple mt-0.5">VIBE</span>
          </div>
          <div className="flex flex-col gap-2 sm:ml-1">
            {showFavoriteButton && (
              <Button
                variant={isFavorited ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <HeartIcon filled={isFavorited} />
              </Button>
            )}
            <LikeButton
              count={localLikeCount}
              liked={likeState?.liked ?? false}
              onToggle={(value) => submitLike(value)}
              disabled={isLiking}
              size="sm"
            />
          </div>
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

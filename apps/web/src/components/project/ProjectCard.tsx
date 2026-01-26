"use client";

import Link from "next/link";
import { MessageCircle, ExternalLink, ChevronUp } from "lucide-react";
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
  variant?: "list-sm" | "list-lg" | "grid";
}

export function ProjectCard({
  project,
  showFavoriteButton,
  onFavoriteChange,
  rank,
  variant = "list-sm",
}: ProjectCardProps) {
  const isGrid = variant === "grid";
  const isLarge = variant === "list-lg";
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
  const scoreTone = getSlopTone(project.slopScore, project.reviewCount);
  const rotation = rank && rank % 2 === 0 ? "hover:rotate-0.5" : "hover:-rotate-0.5";
  const thumbnailSize = isLarge ? "sm:h-32 sm:w-48" : "sm:h-16 sm:w-24";
  const likeButtonSize = isGrid ? "h-12 w-12" : "h-16 w-14";
  const scoreSizeClass = isGrid ? "h-10 w-10 text-base" : "h-12 w-12 text-lg";

  if (isGrid) {
    return (
      <article
        className={cn(
          "group relative flex flex-col border-2 border-border bg-card transition-all duration-200",
          rotation,
          "hover:border-primary hover:shadow-lg"
        )}
      >
        <Link
          href={`/p/${project.slug}`}
          aria-label={`View ${project.title}`}
          className="absolute inset-0 z-0"
        />
        {rank && (
          <div className="absolute -left-2 -top-2 z-25 flex h-7 w-7 -rotate-6 items-center justify-center bg-foreground font-mono text-sm font-black text-background">
            {rank}
          </div>
        )}

        <div className="relative z-10 aspect-[5/3] overflow-hidden border-b-2 border-border">
          <img src={thumbnailUrl} alt={project.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          <div className="absolute inset-0 bg-foreground/5 mix-blend-multiply" />
        </div>

        <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => submitLike(likeState?.liked ? 0 : 1)}
              disabled={isLiking}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center gap-0.5 border-2 transition-colors pointer-events-auto",
                likeButtonSize,
                likeState?.liked
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground hover:border-primary hover:text-primary",
                isLiking && "opacity-50 cursor-not-allowed"
              )}
              aria-label={likeState?.liked ? "Remove upvote" : "Upvote"}
            >
              <ChevronUp className="h-5 w-5" />
              <span className="font-mono text-sm font-bold">{localLikeCount}</span>
            </button>

            <div className="min-w-0 flex-1 pointer-events-none">
              <Link
                href={`/p/${project.slug}`}
                className="no-underline hover:no-underline"
              >
                <h3 className="flex items-center gap-2 font-mono text-lg font-bold text-foreground">
                  <span className="truncate">{project.title}</span>
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </h3>
              </Link>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{project.tagline}</p>
            </div>

            <div className="flex-shrink-0 pointer-events-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex rotate-3 items-center justify-center rounded-sm font-mono font-black shadow-md",
                    scoreSizeClass,
                    scoreTone
                  )}
                >
                  {slopScore}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Slop
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pointer-events-none">
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="font-mono">{project.reviewCount} reviews</span>
            </div>
            <span className="font-mono">by {project.author.name}</span>
            <span className="font-mono">{formatRelativeTime(project.createdAt)}</span>
            {isNew && (
              <span className="bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary">
                new
              </span>
            )}
            {visitUrl && (
              <a
                href={visitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary no-underline hover:no-underline"
              >
                visit
              </a>
            )}
          </div>

          {showFavoriteButton && (
            <div className="flex items-center gap-2 pointer-events-auto">
              <Button
                variant={isFavorited ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleFavorite}
                disabled={favoriteLoading}
                aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
              >
                <HeartIcon filled={isFavorited} />
                <span className="sr-only">Favorite</span>
              </Button>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group relative flex gap-4 border-2 border-border bg-card p-4 transition-all duration-200",
        rotation,
        "hover:border-primary hover:shadow-lg"
      )}
    >
      <Link
        href={`/p/${project.slug}`}
        aria-label={`View ${project.title}`}
        className="absolute inset-0 z-0"
      />
      {rank && (
        <div className="absolute -left-2 -top-2 z-25 flex h-7 w-7 -rotate-6 items-center justify-center bg-foreground font-mono text-sm font-black text-background">
          {rank}
        </div>
      )}

      <button
        type="button"
        onClick={() => submitLike(likeState?.liked ? 0 : 1)}
        disabled={isLiking}
        className={cn(
          "relative z-10 flex flex-shrink-0 flex-col items-center justify-center gap-0.5 border-2 transition-colors",
          likeButtonSize,
          likeState?.liked
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground hover:border-primary hover:text-primary",
          isLiking && "opacity-50 cursor-not-allowed"
        )}
        aria-label={likeState?.liked ? "Remove upvote" : "Upvote"}
      >
        <ChevronUp className="h-5 w-5" />
        <span className="font-mono text-sm font-bold">{localLikeCount}</span>
      </button>

      <Link
        href={`/p/${project.slug}`}
        className={cn(
          "relative z-10 hidden flex-shrink-0 overflow-hidden border-2 border-border sm:block",
          thumbnailSize
        )}
      >
        <img src={thumbnailUrl} alt={project.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-foreground/5 mix-blend-multiply" />
      </Link>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-2 pointer-events-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              href={`/p/${project.slug}`}
              className="pointer-events-auto no-underline hover:no-underline"
            >
              <h3 className="flex items-center gap-2 font-mono text-lg font-bold text-foreground">
                <span className="truncate">{project.title}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </h3>
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{project.tagline}</p>
          </div>

          <div className="flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex rotate-3 items-center justify-center rounded-sm font-mono font-black shadow-md",
                  scoreSizeClass,
                  scoreTone
                )}
              >
                {slopScore}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Slop
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="font-mono">{project.reviewCount} reviews</span>
          </div>
          <span className="font-mono">by {project.author.name}</span>
          <span className="font-mono">{formatRelativeTime(project.createdAt)}</span>
          {isNew && (
            <span className="bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-primary">
              new
            </span>
          )}
          {visitUrl && (
            <a
              href={visitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto font-mono text-[10px] uppercase tracking-wide text-muted-foreground hover:text-primary no-underline hover:no-underline"
            >
              visit
            </a>
          )}
        </div>

        {showFavoriteButton && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              variant={isFavorited ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <HeartIcon filled={isFavorited} />
              <span className="sr-only">Favorite</span>
            </Button>
          </div>
        )}
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

function getSlopTone(score: number, reviewCount: number) {
  if (reviewCount === 0) {
    return "bg-muted text-muted-foreground";
  }
  if (score >= 80) return "bg-primary text-primary-foreground";
  if (score >= 60) return "bg-slop-lime text-foreground";
  if (score >= 40) return "bg-slop-orange text-foreground";
  return "bg-destructive text-destructive-foreground";
}

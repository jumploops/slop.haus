"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ScoreWidget } from "./ScoreWidget";
import { useFavorite } from "@/hooks/useFavorite";
import { useSession } from "@/lib/auth-client";
import { cn, formatRelativeTime, getPlaceholderImage } from "@/lib/utils";
import type { ProjectDetail } from "@/lib/api/projects";

interface ProjectDetailsProps {
  project: ProjectDetail;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const { data: session } = useSession();
  const { isFavorited, toggleFavorite, isLoading: favoriteLoading } = useFavorite(project.slug);

  const isAuthor = session?.user?.id === project.author.id;
  const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];
  const imageUrl = primaryMedia?.url || getPlaceholderImage(project.title);

  return (
    <div>
      {/* Header Section */}
      <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1 mb-8">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Media */}
            <div className="md:w-[420px] flex-shrink-0">
              <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary">
                <img
                  src={imageUrl}
                  alt={project.title}
                  className="w-full object-cover aspect-video"
                />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-slop-blue mb-2 break-words">
                ★ {project.title} ★
              </h1>
              <p className="text-sm text-muted mb-4">{project.tagline}</p>

              <div className="border-2 border-[color:var(--border)] bg-bg-secondary p-2 mb-4 text-xs flex flex-wrap gap-3">
                <span className="flex items-center gap-2 font-bold text-slop-purple">
                  <Avatar src={project.author.image} alt={project.author.name} size="sm" />
                  {project.author.name}
                </span>
                {project.author.devVerified && <Badge variant="dev">Dev</Badge>}
                <span className="text-muted">Submitted {formatRelativeTime(project.createdAt)}</span>
                {project.lastEditedAt && (
                  <span className="text-muted">Last edited {formatRelativeTime(project.lastEditedAt)}</span>
                )}
              </div>

              {/* Action Links */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                {project.mainUrl && (
                  <a
                    href={project.mainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "primary", size: "sm" }),
                      "no-underline hover:no-underline w-full sm:w-auto"
                    )}
                  >
                    <ExternalLinkIcon /> Visit Site
                  </a>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "no-underline hover:no-underline w-full sm:w-auto"
                    )}
                  >
                    <GithubIcon /> View Repo
                  </a>
                )}
                <Button
                  variant={isFavorited ? "secondary" : "ghost"}
                  size="sm"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className="w-full sm:w-auto"
                >
                  <HeartIcon filled={isFavorited} /> {isFavorited ? "Favorited" : "Favorite"}
                </Button>
                {isAuthor && (
                  <Link
                    href={`/p/${project.slug}/edit`}
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "sm" }),
                      "no-underline hover:no-underline w-full sm:w-auto"
                    )}
                  >
                    <PencilIcon /> Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div>
          {project.description && (
            <section className="mb-8">
              <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
                <div className="bg-bg border-2 border-[color:var(--border)] p-4">
                  <h3 className="text-sm font-bold text-slop-purple mb-3">~~ ABOUT THIS SLOP ~~</h3>
                  <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{project.description}</p>
                </div>
              </div>
            </section>
          )}

          {project.tools.length > 0 && (
            <section className="mb-8">
              <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
                <div className="bg-bg border-2 border-[color:var(--border)] p-4">
                  <h3 className="text-sm font-bold text-slop-purple mb-3">~~ BUILT WITH ~~</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <Badge key={tool.id} variant="default">
                        #{tool.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <ScoreWidget
            projectSlug={project.slug}
            likeCount={project.likeCount}
            reviewCount={project.reviewCount}
            slopScore={project.slopScore}
            vibePercent={project.vibePercent}
          />
        </aside>
      </div>
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.5 3.5v1h3.79L3.65 11.14l.71.71L11 5.21V9h1V3.5H6.5z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
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

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.85 2.15a.5.5 0 0 1 .7 0l1.3 1.3a.5.5 0 0 1 0 .7l-8.5 8.5a.5.5 0 0 1-.2.12l-2.5.75a.5.5 0 0 1-.62-.62l.75-2.5a.5.5 0 0 1 .12-.2l8.5-8.5zm.35 1.4L11 2.35 3.5 9.85l-.45 1.5 1.5-.45L12.2 3.55z" />
    </svg>
  );
}

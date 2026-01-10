"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScoreWidget } from "./ScoreWidget";
import { useFavorite } from "@/hooks/useFavorite";
import { formatRelativeTime, getPlaceholderImage } from "@/lib/utils";
import type { ProjectDetail } from "@/lib/api/projects";

interface ProjectDetailsProps {
  project: ProjectDetail;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const { isFavorited, toggleFavorite, isLoading: favoriteLoading } = useFavorite(project.slug);

  const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];
  const imageUrl = primaryMedia?.url || getPlaceholderImage(project.title);

  return (
    <div className="project-details">
      <div className="project-details-header">
        <div className="project-details-media">
          <img src={imageUrl} alt={project.title} className="project-details-image" />
        </div>

        <div className="project-details-info">
          <h1>{project.title}</h1>
          <p className="project-details-tagline">{project.tagline}</p>

          <div className="project-details-author">
            <Avatar src={project.author.image} alt={project.author.name} size="md" />
            <span>{project.author.name}</span>
            {project.author.devVerified && <Badge variant="dev">Dev</Badge>}
          </div>

          <div className="project-details-meta">
            <span>Submitted {formatRelativeTime(project.createdAt)}</span>
            {project.lastEditedAt && (
              <span>Last edited {formatRelativeTime(project.lastEditedAt)}</span>
            )}
          </div>

          <div className="project-details-links">
            {project.mainUrl && (
              <a
                href={project.mainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <ExternalLinkIcon /> Visit Site
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <GithubIcon /> View Repo
              </a>
            )}
            <Button
              variant={isFavorited ? "secondary" : "ghost"}
              onClick={toggleFavorite}
              disabled={favoriteLoading}
            >
              <HeartIcon filled={isFavorited} /> {isFavorited ? "Favorited" : "Favorite"}
            </Button>
          </div>
        </div>
      </div>

      <div className="project-details-body">
        <div className="project-details-main">
          {project.description && (
            <div className="project-details-description">
              <h3>About</h3>
              <p>{project.description}</p>
            </div>
          )}

          {project.tools.length > 0 && (
            <div className="project-details-tools">
              <h3>Built with</h3>
              <div className="tools-list">
                {project.tools.map((tool) => (
                  <Badge key={tool.id} variant="default">
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="project-details-sidebar">
          <ScoreWidget
            projectSlug={project.slug}
            normalUp={project.normalUp}
            normalDown={project.normalDown}
            normalScore={project.normalScore}
            devUp={project.devUp}
            devDown={project.devDown}
            devScore={project.devScore}
            vibePercent={project.vibePercent}
          />
        </div>
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

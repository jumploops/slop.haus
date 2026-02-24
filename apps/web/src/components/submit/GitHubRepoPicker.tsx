"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetchGitHubRepos } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface GitHubRepoPickerProps {
  onSelectRepo: (repoUrl: string) => void;
  selectedRepoUrl?: string;
  isLoading?: boolean;
  className?: string;
}

export function GitHubRepoPicker({
  onSelectRepo,
  selectedRepoUrl,
  isLoading = false,
  className,
}: GitHubRepoPickerProps) {
  const [search, setSearch] = useState("");
  const { data, error, isLoading: isRepoListLoading } = useSWR(
    "/auth/github/repos",
    fetchGitHubRepos
  );

  const repos = useMemo(() => {
    if (!data?.repos) return [];
    const query = search.trim().toLowerCase();
    if (!query) return data.repos;

    return data.repos.filter((repo) => {
      const haystacks = [repo.name, repo.fullName, repo.description || ""];
      return haystacks.some((value) => value.toLowerCase().includes(query));
    });
  }, [data?.repos, search]);

  if (isRepoListLoading) {
    return (
      <div className={cn("border-0 md:border-2 border-border bg-card p-0 md:p-4", className)}>
        <p className="text-xs text-muted-foreground">Loading public GitHub repositories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("border-0 md:border-2 border-border bg-card p-0 md:p-4 space-y-2", className)}>
        <p className="text-xs font-mono font-bold uppercase tracking-wide text-foreground">
          Public Repositories
        </p>
        <p className="text-xs text-destructive">
          Could not load GitHub repositories right now. You can still paste a repo URL manually.
        </p>
      </div>
    );
  }

  if (!data?.githubLinked) {
    return null;
  }

  return (
    <div className={cn("border-0 md:border-2 border-border bg-card p-0 md:p-4 space-y-3", className)}>
      <div className="space-y-1">
        <h3 className="font-mono text-sm font-bold text-foreground">Pick a GitHub Repo</h3>
        <p className="text-xs text-muted-foreground">
          Select a public repository to prefill the repo URL, or enter a URL manually.
        </p>
      </div>

      <Input
        name="github-repo-search"
        label="Search Repositories"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by repo name"
        disabled={isLoading}
      />

      {repos.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {data.repos.length === 0
            ? "No public repositories found on your GitHub account."
            : "No repositories match your search."}
        </p>
      ) : (
        <div className="max-h-72 overflow-y-auto border-2 border-border">
          {repos.map((repo) => {
            const isSelected = selectedRepoUrl === repo.htmlUrl;
            return (
              <div
                key={repo.id}
                className={cn(
                  "p-3 border-b border-border last:border-b-0",
                  isSelected && "bg-accent/10"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-bold text-foreground truncate">
                      {repo.fullName}
                    </p>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {repo.language || "Unknown"} · ★ {repo.stargazersCount}
                      {repo.isFork ? " · Fork" : ""}
                      {repo.isArchived ? " · Archived" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={isSelected ? "primary" : "secondary"}
                    size="sm"
                    className="shrink-0 self-start whitespace-nowrap"
                    disabled={isLoading}
                    onClick={() => onSelectRepo(repo.htmlUrl)}
                  >
                    {isSelected ? "Selected" : "Use Repo"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

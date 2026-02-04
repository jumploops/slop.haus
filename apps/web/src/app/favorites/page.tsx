"use client";

import useSWR from "swr";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { buttonVariants } from "@/components/ui/Button";
import { fetchFavorites } from "@/lib/api/favorites";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSlopMode } from "@/lib/slop-mode";

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesContent />
    </RequireAuth>
  );
}

function FavoritesContent() {
  const { enabled: slopEnabled } = useSlopMode();
  const { data: favorites, error, isLoading, mutate } = useSWR(
    "/users/me/favorites",
    fetchFavorites
  );

  return (
    <div className="space-y-6">
      <header className="border-2 border-dashed border-border bg-card p-4">
        <h1 className="font-mono text-xl font-black text-foreground">Favorites</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Projects you&apos;ve saved for later.
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-destructive bg-card p-4 text-center">
          <p className="text-destructive font-bold text-sm">Failed to load favorites</p>
        </div>
      )}

      {!isLoading && !error && favorites?.length === 0 && (
        <div className="border-2 border-dashed border-border p-6 text-center">
          <div className="flex justify-center text-muted-foreground">
            <EmptyHeartIcon />
          </div>
          <h3 className="text-base font-bold text-foreground mt-3">No favorites yet</h3>
          <p className="text-xs text-muted-foreground mt-2">
            Browse the feed and click the heart on projects you love.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "primary", size: "sm" }), "no-underline mt-4")}
          >
            Back to Feed
          </Link>
        </div>
      )}

      {!isLoading && !error && favorites && favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              rank={index + 1}
              showFavoriteButton
              onFavoriteChange={() => mutate()}
              sloppy={slopEnabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyHeartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M8 13.5l-1.2-1.1C3.4 9.4 1.5 7.6 1.5 5.4 1.5 3.6 2.9 2 4.6 2c1 0 2 .5 2.6 1.2h.6C8.4 2.5 9.4 2 10.4 2c1.7 0 3.1 1.6 3.1 3.4 0 2.2-1.9 4-5.3 7L8 13.5z" />
    </svg>
  );
}

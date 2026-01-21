"use client";

import useSWR from "swr";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { buttonVariants } from "@/components/ui/Button";
import { fetchFavorites } from "@/lib/api/favorites";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesContent />
    </RequireAuth>
  );
}

function FavoritesContent() {
  const { data: favorites, error, isLoading, mutate } = useSWR(
    "/users/me/favorites",
    fetchFavorites
  );

  return (
    <div className="space-y-6">
      <header className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <h1 className="text-xl font-bold text-slop-blue">★ FAVORITES ★</h1>
          <p className="text-xs text-muted mt-1">
            Projects you&apos;ve saved for later.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="border-2 border-danger bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3 text-center">
          <div className="bg-bg border-2 border-danger/70 p-4">
            <p className="text-danger font-bold text-sm">Failed to load favorites</p>
          </div>
        </div>
      )}

      {!isLoading && !error && favorites?.length === 0 && (
        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3 text-center">
          <div className="bg-bg border-2 border-[color:var(--border)] p-6">
            <div className="flex justify-center text-slop-coral">
              <EmptyHeartIcon />
            </div>
            <h3 className="text-base font-bold text-slop-purple mt-3">No favorites yet</h3>
            <p className="text-xs text-muted mt-2">
              Browse the feed and click the heart on projects you love.
            </p>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "primary", size: "sm" }), "no-underline mt-4")}
            >
              Back to Feed
            </Link>
          </div>
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

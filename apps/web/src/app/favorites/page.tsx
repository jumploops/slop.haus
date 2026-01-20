"use client";

import useSWR from "swr";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { fetchFavorites } from "@/lib/api/favorites";
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
    <div className="py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Favorites</h1>
        <p className="text-muted">
          Projects you&apos;ve saved for later
        </p>
      </header>

      {isLoading && (
        <div className="project-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-6 bg-bg">
              <Skeleton className="h-[120px] w-full rounded" />
              <div className="pt-4">
                <Skeleton className="h-4 w-[70%]" />
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-[50%] mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-muted">
          <p>Failed to load favorites</p>
        </div>
      )}

      {!isLoading && !error && favorites?.length === 0 && (
        <div className="text-center py-12 text-muted">
          <EmptyHeartIcon />
          <h3 className="text-fg mb-2 mt-4">No favorites yet</h3>
          <p>
            Browse the{" "}
            <Link href="/">feed</Link> and click the heart on projects you love.
          </p>
        </div>
      )}

      {!isLoading && !error && favorites && favorites.length > 0 && (
        <div className="project-grid">
          {favorites.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
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

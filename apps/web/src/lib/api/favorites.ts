import { apiGet, apiPost, apiDelete } from "../api";
import type { ProjectListItem } from "./projects";

export interface FavoriteStatus {
  isFavorited: boolean;
}

export async function addFavorite(slug: string): Promise<void> {
  await apiPost(`/projects/${slug}/favorite`);
}

export async function removeFavorite(slug: string): Promise<void> {
  await apiDelete(`/projects/${slug}/favorite`);
}

export async function checkFavorite(slug: string): Promise<boolean> {
  const response = await apiGet<FavoriteStatus>(`/projects/${slug}/favorite`);
  return response.isFavorited;
}

export async function fetchFavorites(): Promise<ProjectListItem[]> {
  const response = await apiGet<{ favorites: ProjectListItem[] }>("/users/me/favorites");
  return response.favorites;
}

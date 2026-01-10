import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://slop.haus";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ProjectSitemapItem {
  slug: string;
  updatedAt: string;
}

async function fetchProjectSlugs(): Promise<ProjectSitemapItem[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/sitemap/projects`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.projects || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await fetchProjectSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/submit`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/p/${project.slug}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes];
}

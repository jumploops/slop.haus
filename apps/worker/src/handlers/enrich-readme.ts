import { db } from "@slop/db";
import { projects, jobs } from "@slop/db/schema";
import { eq } from "drizzle-orm";
import { scrape } from "../lib/firecrawl";

export interface EnrichReadmePayload {
  projectId: string;
}

// Extract first meaningful paragraph from markdown
function extractExcerpt(markdown: string, maxLength: number = 500): string {
  // Remove images
  let text = markdown.replace(/!\[.*?\]\(.*?\)/g, "");

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove headers
  text = text.replace(/^#+\s+.*$/gm, "");

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/`[^`]+`/g, "");

  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Split into paragraphs
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 50); // Skip short lines like badges

  if (paragraphs.length === 0) {
    return "";
  }

  // Take first meaningful paragraph
  let excerpt = paragraphs[0];

  // Truncate if too long
  if (excerpt.length > maxLength) {
    excerpt = excerpt.substring(0, maxLength).replace(/\s+\S*$/, "..."); // Cut at word boundary
  }

  return excerpt;
}

export async function handleEnrichReadme(payload: unknown): Promise<void> {
  const { projectId } = payload as EnrichReadmePayload;

  // Get project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!project.repoUrl) {
    throw new Error(`Project ${projectId} has no repo URL`);
  }

  console.log(`Enriching README for project ${project.slug} (${project.repoUrl})`);

  // Call Firecrawl on the repo URL
  const result = await scrape({
    url: project.repoUrl,
    formats: ["markdown"],
  });

  if (!result.success || !result.data?.markdown) {
    throw new Error(`Failed to fetch README: ${result.error || "No markdown returned"}`);
  }

  // Extract excerpt
  const excerpt = extractExcerpt(result.data.markdown);

  if (excerpt && !project.description) {
    // Update project description if empty
    await db
      .update(projects)
      .set({
        description: excerpt,
        enrichmentStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    console.log(`Description updated for project ${project.slug}`);
  } else {
    // Just mark as completed
    await db
      .update(projects)
      .set({
        enrichmentStatus: "completed",
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    console.log(`README processed for project ${project.slug} (description unchanged)`);
  }

  // Queue async moderation job with README content
  await db.insert(jobs).values({
    type: "moderate_async",
    payload: { projectId, content: excerpt || result.data.markdown.substring(0, 2000) },
  });
}

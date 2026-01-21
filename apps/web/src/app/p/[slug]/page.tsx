import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ProjectDetails } from "@/components/project/ProjectDetails";
import { CommentThread } from "@/components/comment/CommentThread";
import { fetchProject } from "@/lib/api/projects";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const project = await fetchProject(slug);
    const primaryMedia = project.media.find((m) => m.isPrimary) || project.media[0];

    return {
      title: project.title,
      description: project.tagline,
      openGraph: {
        title: project.title,
        description: project.tagline,
        images: primaryMedia?.url ? [primaryMedia.url] : undefined,
      },
      twitter: {
        title: project.title,
        description: project.tagline,
        images: primaryMedia?.url ? [primaryMedia.url] : undefined,
      },
    };
  } catch {
    return {
      title: "Project Not Found",
    };
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  let project;
  try {
    project = await fetchProject(slug);
  } catch {
    notFound();
  }

  if (!project || project.status !== "published") {
    notFound();
  }

  return (
    <div className="space-y-8">
      <ProjectDetails project={project} />
      <CommentThread projectSlug={slug} />
    </div>
  );
}

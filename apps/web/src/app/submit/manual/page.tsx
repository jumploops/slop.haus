"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VibeInput } from "@/components/form/VibeInput";
import { ToolsSelector } from "@/components/form/ToolsSelector";
import { createProject } from "@/lib/api/projects";
import { useToast } from "@/components/ui/Toast";
import {
  createProjectSchema,
  DEFAULT_VIBE_DETAILS,
  type CreateProjectInput,
} from "@slop/shared";

export default function ManualSubmitPage() {
  return (
    <RequireAuth>
      <RequireGitHub>
        <SubmitForm />
      </RequireGitHub>
    </RequireAuth>
  );
}

function SubmitForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [mainUrl, setMainUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [vibeMode, setVibeMode] = useState<"overview" | "detailed">("overview");
  const [vibePercent, setVibePercent] = useState(50);
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>(
    { ...DEFAULT_VIBE_DETAILS }
  );
  const [tools, setTools] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const formData: CreateProjectInput = {
      title,
      tagline,
      description: description || undefined,
      mainUrl: mainUrl || undefined,
      repoUrl: repoUrl || undefined,
      vibeMode,
      vibePercent: vibeMode === "overview" ? vibePercent : undefined,
      vibeDetails: vibeMode === "detailed" ? vibeDetails : undefined,
      tools: tools.length > 0 ? tools : undefined,
    };

    // Validate with Zod
    const result = createProjectSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0]?.toString() || "form";
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const project = await createProject(result.data);
      showToast("Project submitted successfully!", "success");
      router.push(`/p/${project.slug}`);
    } catch (error) {
      if (error instanceof Error) {
        showToast(error.message, "error");
      } else {
        showToast("Failed to submit project", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
        <div className="bg-bg border-2 border-[color:var(--border)] p-4">
          <h1 className="text-2xl font-bold text-slop-blue mb-2">★ Submit a Project ★</h1>
          <p className="text-sm text-muted mb-3">
            Share your vibecoded creation with the community. Projects go through a
            brief moderation review before being published.
          </p>
          <Link href="/submit" className="text-xs text-slop-blue hover:text-slop-coral">
            Or let us extract details from a URL
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
            <h2 className="text-sm font-bold text-slop-purple">~~ BASIC INFO ~~</h2>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
              maxLength={255}
              placeholder="My Awesome Project"
            />

            <Input
              label="Tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              error={errors.tagline}
              required
              maxLength={500}
              placeholder="A brief description of what it does"
            />

            <Input
              label="Description"
              type="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              maxLength={10000}
              placeholder="Tell the story of your project. What problem does it solve? How did you build it? What AI tools did you use?"
            />
          </div>
        </div>

        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
            <h2 className="text-sm font-bold text-slop-purple">~~ LINKS ~~</h2>
            <p className="text-xs text-muted">
              At least one URL (live site or repository) is required
            </p>
            <Input
              label="Live URL"
              type="url"
              value={mainUrl}
              onChange={(e) => setMainUrl(e.target.value)}
              error={errors.mainUrl}
              placeholder="https://myproject.com"
            />

            <Input
              label="Repository URL"
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              error={errors.repoUrl}
              placeholder="https://github.com/username/project"
            />

            {errors.form && (
              <p className="text-xs text-danger">{errors.form}</p>
            )}
          </div>
        </div>

        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
            <h2 className="text-sm font-bold text-slop-purple">~~ VIBE SCORE ~~</h2>
            <VibeInput
              mode={vibeMode}
              onModeChange={setVibeMode}
              vibePercent={vibePercent}
              onVibePercentChange={setVibePercent}
              vibeDetails={vibeDetails}
              onVibeDetailsChange={setVibeDetails}
            />
          </div>
        </div>

        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-4">
            <h2 className="text-sm font-bold text-slop-purple">~~ TOOLS ~~</h2>
            <ToolsSelector selectedTools={tools} onToolsChange={setTools} />
          </div>
        </div>

        <div className="border-2 border-[color:var(--foreground)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-1">
          <div className="bg-bg border-2 border-[color:var(--border)] p-4 flex flex-col gap-3">
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </Button>
            <p className="text-[10px] text-muted">
              By submitting, you confirm that you have the rights to share this
              project and agree to our community guidelines.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}

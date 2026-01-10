"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireGitHub } from "@/components/auth/RequireGitHub";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VibeInput } from "@/components/form/VibeInput";
import { ToolsSelector } from "@/components/form/ToolsSelector";
import { createProject } from "@/lib/api/projects";
import { useToast } from "@/components/ui/Toast";
import { createProjectSchema, type CreateProjectInput } from "@slop/shared";

export default function SubmitPage() {
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
  const [vibeDetails, setVibeDetails] = useState<Record<string, number>>({
    idea: 50,
    design: 50,
    code: 50,
    prompts: 50,
    vibe: 50,
  });
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
    <div className="submit-page">
      <h1>Submit a Project</h1>
      <p className="submit-page-description">
        Share your vibecoded creation with the community. Projects go through a
        brief moderation review before being published.
      </p>

      <form onSubmit={handleSubmit} className="submit-form">
        <div className="form-section">
          <h2>Basic Info</h2>

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
            hint="One sentence that captures the essence of your project"
          />

          <Input
            label="Description"
            type="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            maxLength={10000}
            placeholder="Tell the story of your project. What problem does it solve? How did you build it? What AI tools did you use?"
            hint="Optional but recommended"
          />
        </div>

        <div className="form-section">
          <h2>Links</h2>
          <p className="form-section-hint">
            At least one URL (live site or repository) is required
          </p>

          <Input
            label="Live URL"
            type="url"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            error={errors.mainUrl}
            placeholder="https://myproject.com"
            hint="The deployed/live version of your project"
          />

          <Input
            label="Repository URL"
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            error={errors.repoUrl}
            placeholder="https://github.com/username/project"
            hint="GitHub, GitLab, or other code repository"
          />

          {errors.form && (
            <p className="form-error">{errors.form}</p>
          )}
        </div>

        <div className="form-section">
          <h2>Vibe Score</h2>
          <VibeInput
            mode={vibeMode}
            onModeChange={setVibeMode}
            vibePercent={vibePercent}
            onVibePercentChange={setVibePercent}
            vibeDetails={vibeDetails}
            onVibeDetailsChange={setVibeDetails}
          />
        </div>

        <div className="form-section">
          <h2>Tools</h2>
          <ToolsSelector
            selectedTools={tools}
            onToolsChange={setTools}
          />
        </div>

        <div className="submit-form-actions">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Project"}
          </Button>
          <p className="submit-form-notice">
            By submitting, you confirm that you have the rights to share this
            project and agree to our community guidelines.
          </p>
        </div>
      </form>
    </div>
  );
}

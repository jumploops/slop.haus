"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/components/ui/Toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface GenerateResponse {
  success: boolean;
  data?: {
    themeId: string;
    spec: {
      name: string;
      description?: string;
      colors: {
        bg: string;
        bgSecondary: string;
        fg: string;
        muted: string;
        border: string;
        accent: string;
      };
      radius?: "sharp" | "subtle" | "rounded" | "pill";
      density?: "compact" | "normal" | "spacious";
    };
    cssText: string;
    warnings: string[];
  };
  error?: string;
}

export function ThemeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { applyUserTheme } = useTheme();
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/themes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data: GenerateResponse = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Generation failed");
      }

      // Apply the generated theme
      applyUserTheme(data.data.themeId, data.data.cssText);

      // Show result
      if (data.data.warnings.length > 0) {
        showToast(
          `Theme "${data.data.spec.name}" applied (warnings: ${data.data.warnings.join(", ")})`,
          "info"
        );
      } else {
        showToast(`Theme "${data.data.spec.name}" applied!`, "success");
      }

      setPrompt("");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to generate theme",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-3">
      <div className="bg-bg border-2 border-[color:var(--border)] p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slop-purple">GENERATE CUSTOM THEME</h3>
          <p className="text-[10px] text-muted mt-1">
            Tip: Describe colors, mood, or reference existing styles.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your theme... (e.g., 'cyberpunk with neon pink')"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) {
                  handleGenerate();
                }
              }}
            />
          </div>
          <Button
            onClick={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim()}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}

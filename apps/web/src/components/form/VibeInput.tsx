"use client";

import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/utils";

interface VibeInputProps {
  mode: "overview" | "detailed";
  onModeChange: (mode: "overview" | "detailed") => void;
  vibePercent: number;
  onVibePercentChange: (value: number) => void;
  vibeDetails: Record<string, number>;
  onVibeDetailsChange: (details: Record<string, number>) => void;
}

const VIBE_CATEGORIES = [
  { key: "idea", label: "Idea/Concept", description: "How original or inspired is the core idea?" },
  { key: "design", label: "Design/UX", description: "Visual design and user experience quality" },
  { key: "code", label: "Code Quality", description: "Is the code well-structured and maintainable?" },
  { key: "prompts", label: "Prompt Engineering", description: "How effectively were AI prompts used?" },
  { key: "vibe", label: "Overall Vibe", description: "The general feeling and polish of the project" },
];

export function VibeInput({
  mode,
  onModeChange,
  vibePercent,
  onVibePercentChange,
  vibeDetails,
  onVibeDetailsChange,
}: VibeInputProps) {
  const handleDetailChange = (key: string, value: number) => {
    onVibeDetailsChange({ ...vibeDetails, [key]: value });
  };

  // Calculate average for detailed mode display
  const detailedAverage =
    mode === "detailed" && Object.keys(vibeDetails).length > 0
      ? Math.round(
          Object.values(vibeDetails).reduce((a, b) => a + b, 0) /
            Object.keys(vibeDetails).length
        )
      : 0;

  return (
    <div className="mb-6">
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <p className="flex-1 text-xs text-muted-foreground">
          How much of this project was "vibecoded" (AI-assisted)?
        </p>

        <Tabs
          tabs={[
            { id: "overview", label: "Simple" },
            { id: "detailed", label: "Detailed" },
          ]}
          activeTab={mode}
          onTabChange={(id) => onModeChange(id as "overview" | "detailed")}
          className="mb-0 ml-auto justify-end"
        />
      </div>

      <div className="mt-4">
        {mode === "overview" ? (
          <div>
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={vibePercent}
                onChange={(e) => onVibePercentChange(Number(e.target.value))}
                className="w-full h-3 bg-muted border-2 border-border appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
                <span>0% Human</span>
                <span className="font-bold text-foreground">{vibePercent}%</span>
                <span>100% AI</span>
              </div>
            </div>
            <VibeScale percent={vibePercent} />
          </div>
        ) : (
          <div className="space-y-6">
            {VIBE_CATEGORIES.map((category) => (
              <div key={category.key}>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-foreground">{category.label}</label>
                  <span className="text-xs text-muted-foreground">
                    {vibeDetails[category.key] ?? 50}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">{category.description}</p>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={vibeDetails[category.key] ?? 50}
                  onChange={(e) =>
                    handleDetailChange(category.key, Number(e.target.value))
                  }
                  className="w-full h-3 bg-muted border-2 border-border appearance-none cursor-pointer accent-primary"
                />
              </div>
            ))}
            <div className="pt-4 border-t-2 border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Average: {detailedAverage}%</span>
              <VibeScale percent={detailedAverage} size="sm" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VibeScale({ percent, size = "md" }: { percent: number; size?: "sm" | "md" }) {
  const getVibeLabel = (pct: number) => {
    if (pct < 20) return "Mostly Human";
    if (pct < 40) return "Human-Led";
    if (pct < 60) return "Balanced";
    if (pct < 80) return "AI-Assisted";
    return "Fully Vibed";
  };

  return (
    <div className={cn("flex flex-col gap-1", size === "sm" ? "w-36" : "w-full")}>
      <div
        className={cn(
          "w-full bg-muted border-2 border-border overflow-hidden",
          size === "sm" ? "h-2" : "h-3"
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-slop-pink to-slop-lime transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground text-center">{getVibeLabel(percent)}</span>
    </div>
  );
}

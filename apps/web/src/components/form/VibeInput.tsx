"use client";

import { useState } from "react";
import { Tabs } from "@/components/ui/Tabs";

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
    <div className="vibe-input">
      <div className="vibe-input-header">
        <label className="form-label">Vibe Score</label>
        <p className="form-hint">
          How much of this project was "vibecoded" (AI-assisted)?
        </p>
      </div>

      <Tabs
        tabs={[
          { id: "overview", label: "Simple" },
          { id: "detailed", label: "Detailed" },
        ]}
        activeTab={mode}
        onTabChange={(id) => onModeChange(id as "overview" | "detailed")}
      />

      {mode === "overview" ? (
        <div className="vibe-input-overview">
          <div className="vibe-slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={vibePercent}
              onChange={(e) => onVibePercentChange(Number(e.target.value))}
              className="vibe-slider"
            />
            <div className="vibe-slider-labels">
              <span>0% Human</span>
              <span className="vibe-slider-value">{vibePercent}%</span>
              <span>100% AI</span>
            </div>
          </div>
          <VibeScale percent={vibePercent} />
        </div>
      ) : (
        <div className="vibe-input-detailed">
          {VIBE_CATEGORIES.map((category) => (
            <div key={category.key} className="vibe-category">
              <div className="vibe-category-header">
                <label>{category.label}</label>
                <span className="vibe-category-value">
                  {vibeDetails[category.key] ?? 50}%
                </span>
              </div>
              <p className="vibe-category-description">{category.description}</p>
              <input
                type="range"
                min="0"
                max="100"
                value={vibeDetails[category.key] ?? 50}
                onChange={(e) =>
                  handleDetailChange(category.key, Number(e.target.value))
                }
                className="vibe-slider"
              />
            </div>
          ))}
          <div className="vibe-detailed-summary">
            <span>Average: {detailedAverage}%</span>
            <VibeScale percent={detailedAverage} size="sm" />
          </div>
        </div>
      )}
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
    <div className={`vibe-scale vibe-scale-${size}`}>
      <div className="vibe-scale-bar">
        <div
          className="vibe-scale-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="vibe-scale-label">{getVibeLabel(percent)}</span>
    </div>
  );
}

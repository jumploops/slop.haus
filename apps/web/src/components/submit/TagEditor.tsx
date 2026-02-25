"use client";

import { useState } from "react";
import useSWR from "swr";
import { getTools, type Tool } from "@/lib/api/tools";

interface TagEditorProps {
  selected: string[];
  onChange: (tools: string[]) => void;
  maxTags?: number;
}

export function TagEditor({ selected, onChange, maxTags = 10 }: TagEditorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: tools = [] } = useSWR<Tool[]>("tools", getTools);
  const selectedLower = new Set(selected.map((item) => item.toLowerCase()));

  const filteredTools = tools
    .filter(
      (tool) =>
        !selectedLower.has(tool.slug.toLowerCase()) &&
        !selectedLower.has(tool.name.toLowerCase())
    )
    .filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.slug.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  const resolveInputValue = (value: string): string => {
    const normalized = value.trim().replace(/\s+/g, " ");
    const existing = tools.find(
      (tool) =>
        tool.slug.toLowerCase() === normalized.toLowerCase() ||
        tool.name.toLowerCase() === normalized.toLowerCase()
    );
    return existing ? existing.slug : normalized;
  };

  const handleAdd = (value: string) => {
    const resolved = resolveInputValue(value);
    if (!resolved) return;
    if (
      selected.length < maxTags &&
      !selected.some((item) => item.toLowerCase() === resolved.toLowerCase())
    ) {
      onChange([...selected, resolved]);
    }
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (slug: string) => {
    onChange(selected.filter((s) => s !== slug));
  };

  const selectedTools = selected.map((value) => {
    const match = tools.find(
      (tool) =>
        tool.slug.toLowerCase() === value.toLowerCase() ||
        tool.name.toLowerCase() === value.toLowerCase()
    );
    return {
      value,
      displayName: match?.name || value,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTools.map((tool) => (
          <span
            key={tool.value}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-wide bg-secondary text-secondary-foreground border-2 border-border"
          >
            {tool.displayName}
            <button
              type="button"
              onClick={() => handleRemove(tool.value)}
              className="ml-1 text-xs font-bold text-muted-foreground hover:text-primary"
              aria-label={`Remove ${tool.displayName}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-muted-foreground">No technologies selected</span>
        )}
      </div>

      {selected.length < maxTags && (
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && search.trim()) {
                e.preventDefault();
                handleAdd(search);
              }
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay to allow click on option
              setTimeout(() => setIsOpen(false), 200);
            }}
            placeholder="Search to add..."
            className="w-full px-2 py-1 text-sm font-mono bg-background border-2 border-border focus:outline-none focus:border-primary"
          />

          {isOpen && search && filteredTools.length > 0 && (
            <div className="absolute z-10 mt-1 w-full border-2 border-border bg-card shadow-lg">
              {filteredTools.map((tool) => (
                <button
                  key={tool.slug}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(tool.slug)}
                  className="w-full text-left px-2 py-1 text-xs font-bold font-mono hover:bg-muted"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}

          {isOpen && search && filteredTools.length === 0 && (
            <div className="absolute z-10 mt-1 w-full border-2 border-border bg-card shadow-lg px-2 py-2">
              <span className="text-xs text-muted-foreground">No matching tools. Press Enter to add.</span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {selected.length}/{maxTags} technologies
      </p>
    </div>
  );
}

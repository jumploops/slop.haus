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

  const filteredTools = tools
    .filter((tool) => !selected.includes(tool.slug))
    .filter(
      (tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.slug.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  const handleAdd = (slug: string) => {
    if (selected.length < maxTags && !selected.includes(slug)) {
      onChange([...selected, slug]);
    }
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (slug: string) => {
    onChange(selected.filter((s) => s !== slug));
  };

  const selectedTools = tools.filter((t) => selected.includes(t.slug));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTools.map((tool) => (
          <span
            key={tool.slug}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-slop-yellow/40 border-2 border-[color:var(--foreground)]"
          >
            {tool.name}
            <button
              type="button"
              onClick={() => handleRemove(tool.slug)}
              className="ml-1 text-xs font-bold text-slop-coral"
              aria-label={`Remove ${tool.name}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-xs text-muted">No technologies selected</span>
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
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay to allow click on option
              setTimeout(() => setIsOpen(false), 200);
            }}
            placeholder="Search to add..."
            className="w-full px-2 py-1 text-sm bg-bg-secondary border-2 border-[color:var(--foreground)] shadow-[inset_1px_1px_0_var(--background-secondary),inset_-1px_-1px_0_var(--border)] focus:outline-none focus:border-accent"
          />

          {isOpen && search && filteredTools.length > 0 && (
            <div className="absolute z-10 mt-1 w-full border-2 border-[color:var(--foreground)] bg-bg shadow-[2px_2px_0_var(--foreground)]">
              {filteredTools.map((tool) => (
                <button
                  key={tool.slug}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(tool.slug)}
                  className="w-full text-left px-2 py-1 text-xs font-bold hover:bg-bg-secondary"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}

          {isOpen && search && filteredTools.length === 0 && (
            <div className="absolute z-10 mt-1 w-full border-2 border-[color:var(--foreground)] bg-bg shadow-[2px_2px_0_var(--foreground)] px-2 py-2">
              <span className="text-xs text-muted">No matching tools</span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted">
        {selected.length}/{maxTags} technologies
      </p>
    </div>
  );
}

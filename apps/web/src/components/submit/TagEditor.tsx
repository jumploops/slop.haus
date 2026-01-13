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
    <div className="tag-editor">
      <div className="tag-editor-selected">
        {selectedTools.map((tool) => (
          <span key={tool.slug} className="tag">
            {tool.name}
            <button
              type="button"
              onClick={() => handleRemove(tool.slug)}
              className="tag-remove"
              aria-label={`Remove ${tool.name}`}
            >
              &times;
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-muted">No technologies selected</span>
        )}
      </div>

      {selected.length < maxTags && (
        <div className="tag-editor-input">
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
          />

          {isOpen && search && filteredTools.length > 0 && (
            <div className="tag-editor-dropdown">
              {filteredTools.map((tool) => (
                <button
                  key={tool.slug}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(tool.slug)}
                  className="tag-editor-option"
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}

          {isOpen && search && filteredTools.length === 0 && (
            <div className="tag-editor-dropdown">
              <span className="text-muted tag-editor-empty">No matching tools</span>
            </div>
          )}
        </div>
      )}

      <p className="text-muted text-small">
        {selected.length}/{maxTags} technologies
      </p>
    </div>
  );
}

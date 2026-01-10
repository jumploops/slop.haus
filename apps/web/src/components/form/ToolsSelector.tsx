"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { fetchTools, Tool } from "@/lib/api/tools";
import { Badge } from "@/components/ui/Badge";

interface ToolsSelectorProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  maxTools?: number;
}

export function ToolsSelector({
  selectedTools,
  onToolsChange,
  maxTools = 10,
}: ToolsSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: tools, isLoading } = useSWR(
    search ? `/tools?q=${search}` : "/tools",
    () => fetchTools(search || undefined),
    { keepPreviousData: true }
  );

  // Filter out already selected tools
  const availableTools = tools?.filter(
    (tool) => !selectedTools.includes(tool.name)
  );

  const handleSelect = (tool: Tool) => {
    if (selectedTools.length >= maxTools) return;
    onToolsChange([...selectedTools, tool.name]);
    setSearch("");
    inputRef.current?.focus();
  };

  const handleRemove = (toolName: string) => {
    onToolsChange(selectedTools.filter((t) => t !== toolName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && search === "" && selectedTools.length > 0) {
      handleRemove(selectedTools[selectedTools.length - 1]);
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
    if (e.key === "Enter" && availableTools && availableTools.length > 0) {
      e.preventDefault();
      handleSelect(availableTools[0]);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="tools-selector" ref={containerRef}>
      <label className="form-label">Tools & Technologies</label>
      <p className="form-hint">What was used to build this project?</p>

      <div
        className={`tools-selector-input ${isOpen ? "tools-selector-input-focused" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTools.map((tool) => (
          <Badge key={tool} variant="default" className="tools-selector-tag">
            {tool}
            <button
              type="button"
              className="tools-selector-tag-remove"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tool);
              }}
            >
              <CloseIcon />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedTools.length === 0 ? "Search tools..." : ""
          }
          className="tools-selector-search"
          disabled={selectedTools.length >= maxTools}
        />
      </div>

      {selectedTools.length >= maxTools && (
        <p className="form-error">Maximum {maxTools} tools allowed</p>
      )}

      {isOpen && (search || availableTools?.length) && (
        <div className="tools-selector-dropdown">
          {isLoading && <div className="tools-selector-loading">Loading...</div>}
          {!isLoading && availableTools?.length === 0 && search && (
            <div className="tools-selector-empty">
              No tools found for "{search}"
            </div>
          )}
          {!isLoading &&
            availableTools?.slice(0, 10).map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="tools-selector-option"
                onClick={() => handleSelect(tool)}
              >
                {tool.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6 9.5 3.205z" />
    </svg>
  );
}

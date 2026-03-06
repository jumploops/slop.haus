"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { fetchTools, Tool } from "@/lib/api/tools";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

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

  const selectedLower = new Set(selectedTools.map((tool) => tool.toLowerCase()));

  // Filter out already selected tools (whether selected by slug or name)
  const availableTools = tools?.filter((tool) => {
    return (
      !selectedLower.has(tool.slug.toLowerCase()) &&
      !selectedLower.has(tool.name.toLowerCase())
    );
  });

  const findMatchingTool = (input: string): Tool | undefined => {
    const normalized = input.trim().toLowerCase();
    return tools?.find(
      (tool) =>
        tool.slug.toLowerCase() === normalized ||
        tool.name.toLowerCase() === normalized
    );
  };

  const handleSelect = (tool: Tool) => {
    if (selectedTools.length >= maxTools) return;
    if (selectedLower.has(tool.slug.toLowerCase())) return;
    onToolsChange([...selectedTools, tool.slug]);
    setSearch("");
    inputRef.current?.focus();
  };

  const handleCreateFromInput = () => {
    if (selectedTools.length >= maxTools) return;
    const normalized = search.trim().replace(/\s+/g, " ");
    if (!normalized) return;

    const existing = findMatchingTool(normalized);
    const value = existing ? existing.slug : normalized;

    if (selectedTools.some((tool) => tool.toLowerCase() === value.toLowerCase())) {
      setSearch("");
      return;
    }

    onToolsChange([...selectedTools, value]);
    setSearch("");
    setIsOpen(false);
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
    if ((e.key === "Enter" || e.key === ",") && search.trim()) {
      e.preventDefault();
      handleCreateFromInput();
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
    <div className="mb-6 relative" ref={containerRef}>
      <label className="block text-xs font-bold font-mono uppercase tracking-wide text-foreground mb-1">
        Tools & Technologies
      </label>
      <p className="text-xs text-muted-foreground mb-2">What was used to build this project?</p>

      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 min-h-[48px] border-2 border-dashed border-border bg-card cursor-text",
          "focus-within:border-primary",
          isOpen && "border-primary"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTools.map((tool) => (
          <Badge key={tool} variant="default" className="flex items-center gap-1 pr-1">
            {tools?.find((item) => item.slug === tool)?.name || tool}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(tool);
              }}
              className="ml-1 p-0.5 hover:text-primary transition-colors"
              aria-label={`Remove ${tool}`}
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
          placeholder={selectedTools.length === 0 ? "Search tools..." : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-sm"
          disabled={selectedTools.length >= maxTools}
        />
      </div>

      {selectedTools.length >= maxTools && (
        <p className="text-xs text-destructive mt-1">Maximum {maxTools} tools allowed</p>
      )}

      {isOpen && (search || availableTools?.length) && (
        <div className="absolute z-50 w-full mt-1 bg-card border-2 border-border shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-xs text-muted-foreground">Loading...</div>
          )}
          {!isLoading && availableTools?.length === 0 && search && (
            <div className="px-4 py-3 text-xs text-muted-foreground space-y-1">
              <div>No tools found for &quot;{search}&quot;</div>
              <div>Press Enter to add it as a new tag.</div>
            </div>
          )}
          {!isLoading &&
            availableTools?.slice(0, 10).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleSelect(tool)}
                className="w-full px-3 py-2 text-left text-xs font-mono text-foreground hover:bg-muted transition-colors"
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

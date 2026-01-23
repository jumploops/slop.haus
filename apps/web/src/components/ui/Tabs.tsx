"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex flex-wrap gap-1 mb-4", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "px-3 py-2 text-xs font-bold font-mono uppercase tracking-wide min-h-10 sm:min-h-0",
            "border-2 border-dashed border-border",
            "bg-card cursor-pointer",
            "transition-colors duration-200",
            activeTab === tab.id
              ? "bg-primary/10 text-primary border-primary"
              : "text-muted-foreground hover:text-primary"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

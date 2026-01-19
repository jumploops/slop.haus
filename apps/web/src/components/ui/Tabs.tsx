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
    <div className={cn("flex gap-2 border-b border-border mb-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "px-4 py-3 text-sm font-medium relative",
            "bg-transparent border-none cursor-pointer",
            "transition-colors duration-200",
            activeTab === tab.id
              ? "text-accent"
              : "text-muted hover:text-fg"
          )}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

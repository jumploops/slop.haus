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
    <div className={cn("tabs mb-6", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            "tab",
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
            <span className="tabs-indicator absolute bottom-[-1px]" />
          )}
        </button>
      ))}
    </div>
  );
}

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
  sloppy?: boolean;
}

const SLOP_TAB_OFFSETS = [
  "rotate-[-0.6deg] translate-y-[1px]",
  "rotate-[0.4deg] translate-y-[-1px]",
  "rotate-[-0.2deg] translate-y-[1px]",
];

export function Tabs({ tabs, activeTab, onTabChange, className, sloppy = false }: TabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 mb-4",
        sloppy && "rotate-[-0.3deg] translate-y-[1px]",
        className
      )}
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            sloppy && "shadow-[1px_1px_0_var(--border)]",
            "px-3 py-2 text-xs font-bold font-mono uppercase tracking-wide min-h-10 sm:min-h-0",
            "border-2 border-dashed border-border",
            "bg-card cursor-pointer",
            "transition-colors duration-200",
            sloppy && SLOP_TAB_OFFSETS[index % SLOP_TAB_OFFSETS.length],
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

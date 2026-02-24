"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type SubmitTab = "url" | "repo" | "manual";

interface SubmitTabsProps {
  activeTab: SubmitTab;
  className?: string;
}

const submitTabs: { key: SubmitTab; label: string; href: string }[] = [
  { key: "url", label: "Project URL", href: "/submit/url" },
  { key: "repo", label: "GitHub Repo", href: "/submit/repo" },
  { key: "manual", label: "Manual Details", href: "/submit/manual" },
];

export function SubmitTabs({ activeTab, className }: SubmitTabsProps) {
  return (
    <nav
      className={cn("grid grid-cols-3 border-y-2 border-border bg-bg md:border-2", className)}
      aria-label="Project submission tabs"
    >
      {submitTabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            "flex min-h-12 items-center justify-center px-2 py-3 text-center",
            "font-mono text-[11px] font-bold uppercase tracking-wide no-underline transition-colors hover:no-underline",
            "border-r border-border last:border-r-0",
            tab.key === activeTab
              ? "bg-primary/15 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-current={tab.key === activeTab ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

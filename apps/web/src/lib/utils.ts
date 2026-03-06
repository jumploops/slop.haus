import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind-aware merging.
 * Later classes override earlier conflicting classes.
 *
 * @example
 * cn("p-2 bg-red-500", "p-4") // → "bg-red-500 p-4"
 * cn("text-fg", condition && "text-accent") // → conditional class
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(seconds / 31536000);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function formatScore(score: number): string {
  if (score >= 0) return `+${score}`;
  return `${score}`;
}

export function formatVotes(up: number, down: number): string {
  return `+${up} / -${down}`;
}

export function isRecentDate(date: Date | string, durationMs: number): boolean {
  return Date.now() - new Date(date).getTime() < durationMs;
}

export function getPlaceholderImage(title: string): string {
  const placeholders = [
    "/colorful-email-app-interface-with-mood-indicators.jpg",
    "/minimalist-todo-app-with-philosophical-quotes-over.jpg",
    "/chaotic-colorful-css-code-editor.jpg",
    "/futuristic-calendar-with-glowing-quantum-particles.jpg",
    "/sticky-notes-app-with-sarcastic-handwriting.jpg",
    "/pitch-deck-generator-with-money-and-rocket-emojis.jpg",
  ];

  if (!title) {
    return "/placeholder.jpg";
  }

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) % placeholders.length;
  }

  return placeholders[Math.abs(hash) % placeholders.length] || "/placeholder.jpg";
}

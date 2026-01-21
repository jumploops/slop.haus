import type { Metadata } from "next";
import Script from "next/script";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import "./app.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    template: "%s | slop.haus",
    default: "slop.haus - Vibecoded App Showcase",
  },
  description: "Showcase and rate vibecoded apps built with AI",
  openGraph: {
    type: "website",
    siteName: "slop.haus",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const themeBootScript = `
(() => {
  try {
    const storageKey = "slop-theme";
    const runtimeStyleId = "user-theme-styles";
    const themePrefix = "custom:";
    const cssPrefix = "slop-theme-css:";
    const metaPrefix = "slop-theme-meta:";
    const legacyCssPrefix = "slop-user-theme:";
    const legacyMetaPrefix = "slop-user-theme-meta:";
    const theme = localStorage.getItem(storageKey);
    if (!theme) return;

    const root = document.documentElement;
    root.setAttribute("data-theme", theme);

    if (!theme.startsWith(themePrefix)) return;

    const id = theme.slice(themePrefix.length);
    const cssText =
      localStorage.getItem(cssPrefix + id) ||
      localStorage.getItem(legacyCssPrefix + id);
    if (cssText) {
      let style = document.getElementById(runtimeStyleId);
      if (!style) {
        style = document.createElement("style");
        style.id = runtimeStyleId;
        document.head.appendChild(style);
      }
      style.textContent = cssText;
    }

    root.setAttribute("data-theme-loading", "true");

    const metaText =
      localStorage.getItem(metaPrefix + id) ||
      localStorage.getItem(legacyMetaPrefix + id);
    if (!metaText) return;
    const meta = JSON.parse(metaText);

    const applyMeta = () => {
      const title = document.getElementById("theme-loading-title");
      const author = document.getElementById("theme-loading-author");
      const icon = document.getElementById("theme-loading-icon");
      if (!title || !author || !icon) return false;

      if (meta.name) {
        title.textContent = "Loading " + meta.name;
      }
      author.textContent = meta.author ? "by " + meta.author : "";
      icon.textContent = meta.icon || "★";
      return true;
    };

    if (!applyMeta()) {
      document.addEventListener("DOMContentLoaded", applyMeta, { once: true });
    }
  } catch (error) {
    // Swallow boot errors to avoid blocking render.
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
      </head>
      <body className="bg-bg text-fg font-sans leading-relaxed">
        <div className="theme-loading-screen" role="status" aria-live="polite">
          <div className="theme-loading-card">
            <div id="theme-loading-icon" className="theme-loading-icon" aria-hidden="true">
              ★
            </div>
            <div className="theme-loading-content">
              <div id="theme-loading-title" className="theme-loading-title">
                Loading theme...
              </div>
              <div id="theme-loading-author" className="theme-loading-meta" />
            </div>
          </div>
        </div>
        <Providers>
          <Header />
          <main className="py-8 min-h-[calc(100vh-var(--app-header-height))]">
            <div className="max-w-[var(--app-container-max)] mx-auto px-[var(--app-page-gutter)]">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}

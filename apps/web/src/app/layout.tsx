import type { Metadata } from "next";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { VisitorCounter } from "@/components/layout/VisitorCounter";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-fg font-sans leading-relaxed">
        <Providers>
          <div className="bg-warning border-y-4 border-[color:var(--foreground)] py-2 overflow-hidden">
            <div className="whitespace-nowrap animate-[marquee_15s_linear_infinite] text-sm font-bold text-fg">
              <span className="motion-safe:animate-[rainbow_6s_linear_infinite]">
                *** UNDER CONSTRUCTION *** PARDON OUR DUST! *** NEW FEATURES COMING SOON! ***
              </span>
            </div>
          </div>
          <Header />
          <main className="py-6 min-h-[calc(100vh-var(--app-header-height))]">
            <div className="max-w-[var(--app-container-max)] mx-auto px-4">
              {children}
            </div>
          </main>
          <footer className="border-t-4 border-[color:var(--foreground)] bg-gradient-to-r from-slop-teal via-slop-purple to-slop-pink py-4">
            <div className="max-w-[var(--app-container-max)] mx-auto px-4 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="border-2 border-[color:var(--border)] bg-bg-secondary shadow-[2px_2px_0_var(--foreground)] p-2">
                  <div className="bg-bg border-2 border-[color:var(--border)] p-3">
                    <div className="hidden sm:block">
                      <VisitorCounter />
                    </div>
                    <div className="sm:hidden">
                      <VisitorCounter compact />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="text-accent-foreground/80">webmaster@slop.haus</span>
                  <span className="text-accent-foreground/60">|</span>
                  <span className="text-slop-yellow">© 1999-2025 slop.haus</span>
                  <span className="text-accent-foreground/60">|</span>
                  <span className="text-accent-foreground/70 text-[10px]">Best viewed at 800x600</span>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

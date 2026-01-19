import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-fg font-sans leading-relaxed">
        <Providers>
          <Header />
          <main className="py-8 min-h-[calc(100vh-var(--app-header-height))]">
            <div className="max-w-[var(--app-container-max)] mx-auto px-4">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Alfa_Slab_One, Geist, Geist_Mono, Rubik_Wet_Paint } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "@/components/layout/Header";
import { VisitorCounter } from "@/components/layout/VisitorCounter";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const rubikWetPaint = Rubik_Wet_Paint({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-rubik-wet-paint",
});
const alfaSlabOne = Alfa_Slab_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-alfa-slab-one",
});

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
      <body className={`${geist.variable} ${geistMono.variable} ${rubikWetPaint.variable} ${alfaSlabOne.variable} font-sans antialiased`}>
        <Providers>
          <div className="bg-slop-orange overflow-hidden py-1.5 text-foreground">
            <div className="animate-[marquee_20s_linear_infinite] flex whitespace-nowrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="mx-4 font-mono text-sm font-bold tracking-wide">
                  UNDER CONSTRUCTION * PARDON OUR SLOP *
                </span>
              ))}
            </div>
          </div>
          <Header />
          <main className="py-6 min-h-[calc(100vh-var(--app-header-height))]">
            <div className="mx-auto max-w-5xl px-4">
              {children}
            </div>
          </main>
          <footer className="border-t-2 border-dashed border-border bg-card py-4">
            <div className="mx-auto max-w-5xl px-4 text-center">
              <div className="mb-4 flex justify-center">
                <VisitorCounter />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                <span>webmaster@slop.haus</span>
                <span>|</span>
                <span>© 1999-2025 slop.haus</span>
                <span>|</span>
                <span className="text-[10px]">Best viewed at 800x600</span>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}

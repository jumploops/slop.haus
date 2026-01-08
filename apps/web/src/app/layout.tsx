import type { Metadata } from "next";
import { AuthButtons } from "@/components/AuthButtons";
import "./globals.css";

export const metadata: Metadata = {
  title: "slop.haus - Vibecoded App Showcase",
  description: "Showcase and rate vibecoded apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container">
            <a href="/" className="logo">
              slop.haus
            </a>
            <nav className="nav">
              <a href="/">Feed</a>
              <a href="/submit">Submit</a>
            </nav>
            <AuthButtons />
          </div>
        </header>
        <main className="main">
          <div className="container">{children}</div>
        </main>
      </body>
    </html>
  );
}

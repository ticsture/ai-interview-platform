import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Interview Practice",
  description: "Practice coding & tech interviews with tracking and stats.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Top navbar */}
          <header className="border-b border-zinc-800 bg-black/60 backdrop-blur">
            <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">
                  AI Interview Practice
                </span>
              </Link>
              <div className="flex items-center gap-4 text-sm text-zinc-300">
                <Link
                  href="/stats"
                  className="hover:text-zinc-50 transition-colors cursor-pointer"
                >
                  Stats
                </Link>
              </div>
            </nav>
          </header>

          {/* Main content area */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-5xl px-4 py-10">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-zinc-800 bg-black/70">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 text-xs text-zinc-500">
              <span>Built by you · Full-stack practice project</span>
              <span>Next.js · Express · MongoDB Atlas</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

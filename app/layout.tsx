import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "katex/dist/katex.min.css";
import "uplot/dist/uPlot.min.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Physics Sim Lab", template: "%s · Physics Sim Lab" },
  description:
    "Free, open-source interactive physics simulations for Cambridge AS & A Level Physics (9702), with guided activities and virtual-lab data analysis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="screen-only border-b border-line bg-surface">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Physics Sim Lab
            </Link>
            <div className="flex gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-ink">
                Topics
              </Link>
              <Link href="/about/" className="hover:text-ink">
                About
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="screen-only border-t border-line py-6 text-center text-sm text-muted">
          Open source (MIT) · Built for Cambridge AS &amp; A Level Physics 9702
        </footer>
      </body>
    </html>
  );
}

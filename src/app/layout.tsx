import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import "./fonts.css";
import "./globals.css";
import { site } from "@/lib/config";
import { SiteFooter } from "@/components/SiteFooter";
import { Analytics } from "@/components/Analytics";
import { Tags } from "@/components/Tags";

/** Latin subsets of the self-hosted fonts in fonts.css, preloaded as next/font did. */
const PRELOAD_FONTS = [
  "597b6a5d799c44de-s.p.woff2", // Source Serif 4
  "8bf7b2ceda89477b-s.p.woff2", // Public Sans
  "3667c091265cf81b-s.p.woff2", "5fb5c05ff73c0616-s.p.woff2", "437e5f23c97e320c-s.p.woff2", "79f0f365efbf4f90-s.p.woff2", // Barlow Condensed 500-800
  "040e1cbd80d62d71-s.p.woff2", "29379020bca5f260-s.p.woff2", "14e12da985e5a1a3-s.p.woff2", "72207ecf667d99d7-s.p.woff2", // Barlow Condensed italic 500-800
];

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: NFL, NBA, WNBA, MLB, NHL and MLS Rankings`, template: `${site.name}: %s` },
  description: "The latest published top-selling jersey rankings for the NFL, NBA, WNBA, MLB, NHL and MLS, with player stats, sources and links to shop.",
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/apple-icon/" },
  verification: site.googleVerification ? { google: site.googleVerification } : undefined,
};

export const viewport: Viewport = { themeColor: "#0e1726", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  for (const f of PRELOAD_FONTS) preload(`/fonts/${f}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {children}
        <SiteFooter />
        <Analytics />
        <Tags />
      </body>
    </html>
  );
}

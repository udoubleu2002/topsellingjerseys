import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Public_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/config";
import { SiteFooter } from "@/components/SiteFooter";
import { Analytics } from "@/components/Analytics";
import { Tags } from "@/components/Tags";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-sans", display: "swap" });
const num = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700", "800"], style: ["normal", "italic"], variable: "--font-num", display: "swap" });

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
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${num.variable}`}>
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

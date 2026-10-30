import type { Metadata } from "next";
import { site } from "./config";

/**
 * Page titles lead with the page's keyword. The brand goes at the end, "... | Top Selling Jerseys", only when the whole
 * title still fits in a search result (about 60 characters); search engines show the site name separately anyway.
 */
export const TITLE_MAX = 60;
export function pageTitle(t: string): string {
  const clean = t.replace(new RegExp(`\\s*\\|\\s*${site.name}$`), "").replace(new RegExp(`^${site.name}:\\s*`), "");
  if (clean.toLowerCase().startsWith(site.name.toLowerCase())) return clean;
  const branded = `${clean} | ${site.name}`;
  return branded.length <= TITLE_MAX ? branded : clean;
}

/** Trims a description to search-snippet length at a word boundary. */
export function clip(s: string, max = 158): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "") + "…";
}

/** One place that builds title, description, canonical, Open Graph and Twitter tags for a page. */
/** shareTitle/shareText override what link previews show in texts and social posts, without changing the search title. */
export function pageMeta({ title, description, path, noindex = false, type = "website", shareTitle, shareText, image = "/opengraph-image/" }: { title: string; description: string; path: string; noindex?: boolean; type?: "website" | "profile" | "article"; shareTitle?: string; shareText?: string; image?: string }): Metadata {
  const t = pageTitle(title);
  const d = clip(description);
  const st = shareTitle ?? title;
  const sd = shareText ? clip(shareText) : d;
  return {
    title: { absolute: t },
    description: d,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: { title: st, description: sd, url: path, siteName: site.name, type, locale: "en_US", images: [{ url: image, width: 1200, height: 630, alt: st }] },
    twitter: { card: "summary_large_image", title: st, description: sd, images: [image] },
  };
}

import type { MetadataRoute } from "next";
import { getLeagues, getPlayers, getRankings, getCurrentRanking, isIndexable } from "@/lib/data";
import { abs, site } from "@/lib/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [{ url: abs("/"), lastModified: site.lastReviewed, changeFrequency: "weekly", priority: 1 }];
  for (const l of getLeagues()) {
    const r = getCurrentRanking(l.id);
    if (r) out.push({ url: abs(`/${l.slug}/`), lastModified: r.lastVerified, changeFrequency: "weekly", priority: 0.9 });
  }
  for (const p of getPlayers().filter(isIndexable)) out.push({ url: abs(`/players/${p.slug}/`), lastModified: p.lastVerified, changeFrequency: "weekly", priority: 0.7 });
  for (const g of ["best-selling-jerseys", "best-selling-jersey", "best-selling-sports-jerseys"]) out.push({ url: abs(`/${g}/`), lastModified: site.lastReviewed, changeFrequency: "weekly", priority: 0.85 });
  out.push({ url: abs("/my-jerseys/"), changeFrequency: "monthly", priority: 0.6 });
  out.push({ url: abs("/rankings/"), lastModified: site.lastReviewed, changeFrequency: "monthly", priority: 0.5 });
  for (const r of getRankings()) out.push({ url: abs(`/rankings/${r.league}/${r.id}/`), lastModified: r.lastVerified, changeFrequency: "yearly", priority: 0.4 });
  for (const p of ["about", "methodology", "sources", "affiliate-disclosure", "contact", "privacy", "terms"]) out.push({ url: abs(`/${p}/`), changeFrequency: "yearly", priority: 0.2 });
  return out;
}

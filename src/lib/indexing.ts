import fs from "node:fs";
import path from "node:path";
import { getAppearances, isIndexable } from "./data";
import { loadBuyerIntent } from "./buyerIntent";
import type { Player } from "./schema";

let demand: Set<string> | undefined;
/** Slugs of player pages that have earned Google impressions (data/search-demand.json, from Search Console exports). */
function searchDemand(): Set<string> {
  if (demand) return demand;
  const f = path.join(process.cwd(), "data", "search-demand.json");
  const d = fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as { players: { slug: string }[] }) : { players: [] };
  return (demand = new Set(d.players.map((p) => p.slug)));
}

/**
 * Whether a player page should be in Google's index and the sitemap.
 *
 * Nov. 25, 2026: Google impressions fell from about 200 a day to almost none on Nov. 3 while the indexed count held at
 * 296, and 911 more URLs sat in "Discovered - currently not indexed". A one-month-old domain asking Google to index
 * 1,000+ near-identical player templates reads as scaled content, so the index is now limited to pages with a reason
 * to exist in search, not merely a jersey to sell:
 *  - a place on a published sales list (the site's original data),
 *  - a spot on the buyer-intent list (data/buyer-intent.json), or
 *  - Google impressions already earned (data/search-demand.json; refresh with scripts/build-search-demand.mjs).
 * Every other page stays live, linked and shoppable with noindex, follow. Add a player to one of the lists above
 * to bring the page back.
 */
export function isSearchIndexable(p: Player): boolean {
  if (!isIndexable(p)) return false;
  if (getAppearances(p.id).length > 0) return true;
  if (searchDemand().has(p.slug)) return true;
  return !!loadBuyerIntent()?.players.some((r) => r.playerId === p.id);
}

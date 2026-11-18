/**
 * Buyer-intent priority: the players whose jersey searches are worth the most to the site (CPC x searches, weighted for
 * weak page-1 competition), from data/buyer-intent.json. It steers which players get extra links, the sidebar's popular
 * jerseys box and daily-story picks. It never changes the order of a sales ranking.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getPlayer, getProducts } from "./data";
import { promotableJerseys } from "./stories";
import type { Player } from "./schema";

const BuyerIntentSchema = z.object({
  note: z.string().optional(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  players: z.array(z.object({
    playerId: z.string(),
    /** close: the page already ranks near page 1; unseen: no search impressions yet; far: impressions beyond page 2. */
    tier: z.enum(["close", "unseen", "far"]),
    keyword: z.string(),
  })),
});
export type BuyerIntent = z.infer<typeof BuyerIntentSchema>;

let cache: BuyerIntent | null | undefined;
export function loadBuyerIntent(): BuyerIntent | null {
  if (cache !== undefined) return cache;
  const f = path.join(process.cwd(), "data", "buyer-intent.json");
  return (cache = fs.existsSync(f) ? BuyerIntentSchema.parse(JSON.parse(fs.readFileSync(f, "utf8"))) : null);
}

/**
 * Priority players with a jersey photo we can show, best first. "close" and "unseen" players alternate, so the pages
 * nearest page 1 get the push that pays off soonest and the big searches Google hasn't matched to us yet still get links.
 */
export function priorityPlayers({ league, exclude = [], n = 5 }: { league?: string; exclude?: string[]; n?: number } = {}): Player[] {
  const rows = (loadBuyerIntent()?.players ?? [])
    .map((r) => ({ ...r, player: getPlayer(r.playerId) }))
    .filter((r): r is typeof r & { player: Player } => !!r.player && !exclude.includes(r.playerId) && (!league || r.player.leagues.includes(league)))
    .filter((r) => promotableJerseys(getProducts(r.playerId), r.player).length > 0);
  const close = rows.filter((r) => r.tier === "close");
  const unseen = rows.filter((r) => r.tier === "unseen");
  const far = rows.filter((r) => r.tier === "far");
  const out: Player[] = [];
  for (let i = 0; out.length < n && (i < close.length || i < unseen.length); i++) {
    if (close[i]) out.push(close[i].player);
    if (unseen[i] && out.length < n) out.push(unseen[i].player);
  }
  for (const r of far) if (out.length < n) out.push(r.player);
  return out.slice(0, n);
}

import { getCurrentRanking, getLeagues, getPlayer, getProducts } from "@/lib/data";
import type { League, Product } from "@/lib/schema";

export const BLACK_FRIDAY_PATH = "/black-friday-jersey-deals/";
/** The homepage strip runs through Cyber Monday (Nov 30, 2026, Pacific). */
export const BLACK_FRIDAY_STRIP_ENDS = "2026-12-01T08:00:00Z";

export const pctOff = (x: Product) => Math.round((1 - x.price! / x.listPrice!) * 100);
export const onSale = (x: Product) => x.productType === "jersey" && !!x.image && x.price != null && x.listPrice != null && x.listPrice > x.price;

/** The league's ranked players whose jersey is marked down right now: best rank first, one jersey each (the biggest markdown). */
export function saleTopSellers(league: League, n = 6) {
  const ranking = getCurrentRanking(league.id);
  if (!ranking) return [];
  const out: { rank: number; product: Product }[] = [];
  for (const e of ranking.entries) {
    if (out.length >= n) break;
    const p = getPlayer(e.playerId);
    if (!p) continue;
    const best = getProducts(p.id).filter((x) => onSale(x) && (!p.teamId || x.teamId === p.teamId)).sort((a, b) => pctOff(b) - pctOff(a))[0];
    if (best) out.push({ rank: e.rank, product: best });
  }
  return out;
}


/** Biggest markdown on a ranked player's jersey across every league, for the homepage strip. */
export function topSellerMaxOff(): number {
  return Math.max(0, ...getLeagues().flatMap((l) => saleTopSellers(l, 50).map((x) => pctOff(x.product))));
}

import { getAppearances, getProducts, isIndexable } from "./data";
import { loadBuyerIntent } from "./buyerIntent";
import type { Player } from "./schema";

/**
 * Whether a player page should be in Google's index and the sitemap (Nov. 21, 2026).
 *
 * The page must pass isIndexable (verified highlights plus a ranking or write-up) and have a reason for a shopper to land
 * on it: a Lids jersey with a photo, a place on a published sales list, or a spot on the high-CPC buyer-intent list.
 * Pages with none of these are thin for a "<player> jersey" search, so they get noindex but stay live and linked. The
 * daily product sync adds jerseys, so a page comes back into the index on the next build after its jersey is found.
 */
export function isSearchIndexable(p: Player): boolean {
  if (!isIndexable(p)) return false;
  if (getProducts(p.id).some((x) => x.productType === "jersey" && x.image)) return true;
  if (getAppearances(p.id).length > 0) return true;
  return !!loadBuyerIntent()?.players.some((r) => r.playerId === p.id);
}

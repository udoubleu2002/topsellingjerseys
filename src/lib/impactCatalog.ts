import type { Player, Product, Team } from "./schema";

/** Marks products written by scripts/sync-impact-products.ts, so a refresh replaces only these and keeps hand-entered ones. */
export const CATALOG_SOURCE = "Lids product feed via Impact.com";
export const CATALOG_ID_PREFIX = "impact-lids-";

/** The fields we read from an Impact partner-API catalog item (GET /Mediapartners/{AccountSID}/Catalogs/ItemSearch). */
export interface ImpactItem {
  Id?: string | number;
  CatalogId?: string | number;
  CampaignId?: string | number;
  CatalogItemId?: string | number;
  Name?: string;
  Manufacturer?: string | null;
  /** Tracking URL for the product page, unique to the partner account. */
  Url?: string;
  ImageUrl?: string | null;
  CurrentPrice?: string | number | null;
  OriginalPrice?: string | number | null;
  Currency?: string | null;
  StockAvailability?: string | null;
  ItemGroupId?: string | null;
  ParentSku?: string | null;
  Gender?: string | null;
  AgeGroup?: string | null;
}

/** Lowercase, no accents or punctuation, single spaces: "Luka Dončić" -> "luka doncic". */
export const norm = (s: string | null | undefined) =>
  ` ${(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

const has = (hay: string, needle: string) => norm(hay).includes(norm(needle));
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : null; };
const https = (u: string | null | undefined) => { try { const x = new URL(u ?? ""); return x.protocol === "https:" ? x.toString() : null; } catch { return null; } };

/** Items that are a jersey (not a tee, hoodie, or a jersey-themed accessory). */
export function isJersey(name: string): boolean {
  const n = norm(name);
  if (!n.includes(" jersey ")) return false;
  return !/ (t shirt|tee|shirt|hoodie|pullover|sweatshirt|tank|shorts|ornament|frame|framed|card|pin|keychain|magnet|blanket|pillow|mug|figure|plush|dog|pet|onesie|bodysuit|creeper|costume|mini|replica helmet) /.test(n);
}

export function availability(s: string | null | undefined): Product["availability"] {
  const v = (s ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (v === "instock" || v === "limitedavailability") return "in-stock";
  if (v === "outofstock" || v === "discontinued" || v === "soldout") return "out-of-stock";
  if (v === "preorder" || v === "backorder") return "preorder";
  return "unknown";
}

/** Edition words that appear in Lids jersey names, longest first so "City Edition" wins over "City". */
const EDITIONS = ["City Edition", "Statement Edition", "Icon Edition", "Association Edition", "City Connect", "Classic Edition", "Rebel Edition", "Reverse Retro", "Stadium Series", "Winter Classic", "Throwback", "Alternate", "Home", "Away", "Road"];
export const edition = (name: string) => EDITIONS.find((e) => has(name, e)) ?? null;

/** The retailer page behind an Impact tracking link (its u= parameter), or null when the link does not carry one. */
export function landingUrl(tracking: string): string | null {
  try { return https(new URL(tracking).searchParams.get("u")); } catch { return null; }
}

/**
 * The price band we show first: mid-tier jerseys (NFL Game/Limited, NBA Swingman, MLB Limited, NHL Breakaway, MLS and
 * WNBA replicas), not $60 fan tees-as-jerseys or $400 authentics.
 */
export const MID_TIER = { min: 100, max: 250, ideal: 150 };

/** 0 at the ideal price, falling inside the band, and well below zero outside it; 0 when the feed has no price. */
export function priceFit(price: number | null): number {
  if (price === null) return 0;
  if (price < MID_TIER.min) return -40 - (MID_TIER.min - price) / 2;
  if (price > MID_TIER.max) return -40 - (price - MID_TIER.max) / 4;
  return 0 - Math.abs(price - MID_TIER.ideal) / 5;
}

/** Higher is better: current team, in stock, adult men's (the most common "player jersey" shoppers mean), a mid-tier price. */
function score(item: ImpactItem, team: Team | undefined): number {
  const name = item.Name ?? "";
  let s = 0;
  if (team && has(name, team.name)) s += 100;
  const a = availability(item.StockAvailability);
  if (a === "in-stock") s += 40; else if (a === "preorder") s += 20; else if (a === "out-of-stock") s -= 60;
  const n = norm(name);
  if (/ (youth|kids|toddler|infant|preschool|newborn|baby) /.test(n) || /kid|youth|infant|toddler/i.test(item.AgeGroup ?? "")) s -= 30;
  else if (/ women s | womens /.test(n) || /female/i.test(item.Gender ?? "")) s -= 10;
  if (/ men s | mens /.test(n)) s += 10;
  return s + priceFit(num(item.CurrentPrice));
}

/**
 * Picks up to `limit` jerseys for one player from catalog search results, best first; the first is the one shown
 * beside the player's name, so it should be a mid-tier adult jersey of the current team. An item counts only when its name holds the
 * player's full name and the word jersey, has an https image and a tracking link, and (when catalogId/campaignId are
 * given) comes from the Lids program: a field Impact leaves out is not held against the item, but one that names
 * another catalog or campaign, or a tracking link for another campaign, is. Size and color variants (same group) and repeated photos collapse to one listing.
 * When any item names the player's team, items naming other teams are dropped, so a traded player shows the current kit.
 */
export function pickJerseys(
  items: ImpactItem[],
  player: Player,
  team: Team | undefined,
  opts: { campaignId?: string | null; catalogId?: string | null; limit?: number } = {},
): ImpactItem[] {
  const limit = opts.limit ?? 3;
  let ok = items.filter((i) =>
    (!opts.campaignId || i.CampaignId == null || String(i.CampaignId) === String(opts.campaignId)) &&
    (!opts.catalogId || i.CatalogId == null || String(i.CatalogId) === String(opts.catalogId)) &&
    (!opts.campaignId || !i.Url || !/\/c\/\d+\/\d+\/\d+/.test(i.Url) || new RegExp(`/c/\\d+/\\d+/${opts.campaignId}(\\?|$)`).test(i.Url)) &&
    i.Name && has(i.Name, player.name) && isJersey(i.Name) && https(i.ImageUrl) && https(i.Url));
  if (team && ok.some((i) => has(i.Name!, team.name))) ok = ok.filter((i) => has(i.Name!, team.name));
  ok.sort((a, b) => score(b, team) - score(a, team));
  const groups = new Set<string>();
  const images = new Set<string>();
  const out: ImpactItem[] = [];
  for (const i of ok) {
    const g = String(i.ItemGroupId || i.ParentSku || i.CatalogItemId || i.Id);
    const img = https(i.ImageUrl)!;
    if (groups.has(g) || images.has(img)) continue;
    groups.add(g);
    images.add(img);
    out.push(i);
    if (out.length >= limit) break;
  }
  return out;
}

export function itemToProduct(item: ImpactItem, player: Player, teamId: string, today: string): Product {
  const tracking = https(item.Url)!;
  const price = num(item.CurrentPrice);
  const list = num(item.OriginalPrice);
  const currency = /^[A-Z]{3}$/.test(item.Currency ?? "") ? item.Currency! : price ? "USD" : null;
  const key = String(item.CatalogItemId ?? item.Id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `${CATALOG_ID_PREFIX}${key}`,
    playerId: player.id,
    teamId,
    league: player.leagues[0],
    title: item.Name!.trim(),
    image: { url: https(item.ImageUrl)!, source: CATALOG_SOURCE, alt: item.Name!.trim() },
    merchantId: "lids",
    productType: "jersey",
    edition: edition(item.Name!),
    price,
    listPrice: price && list && list > price ? list : null,
    currency: price ? currency : null,
    availability: availability(item.StockAvailability),
    productUrl: landingUrl(tracking) ?? tracking,
    affiliateUrl: tracking,
    numberOnProduct: null,
    lastVerified: today,
    flagged: null,
  };
}

/**
 * Replaces the previous feed products with fresh ones and keeps hand-entered products. A feed product that a reviewer
 * flagged keeps its flag on refresh, so a bad match stays hidden until someone clears it.
 */
export function mergeProducts(existing: Product[], fresh: Product[]): Product[] {
  const manual = existing.filter((p) => !p.id.startsWith(CATALOG_ID_PREFIX));
  const flags = new Map(existing.filter((p) => p.flagged).map((p) => [p.id, p.flagged]));
  const taken = new Set(manual.map((p) => p.id));
  return [...manual, ...fresh.filter((p) => !taken.has(p.id)).map((p) => (flags.has(p.id) ? { ...p, flagged: flags.get(p.id) } : p))];
}

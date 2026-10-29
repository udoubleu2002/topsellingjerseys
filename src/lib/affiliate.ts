import type { Player, Product, Promotion, Team } from "./schema";
import { getAnyTeam, getMerchant, getPlayer, getTeam, loadStore } from "./data";
import { getArticle, type Article } from "./articles";
import { getStory, type Story } from "./stories";
import { bannerLink, lidsBanner } from "./lidsAds";

export interface Offer {
  id: string;
  kind: "product" | "search" | "team" | "promo" | "ad";
  merchantId: string;
  merchantName: string;
  label: string;
  /** Destination with affiliate parameters applied (server-side only). */
  href: string;
  product?: Product;
}

/** The retailer every Shop button uses unless a product listing names another. */
export const DEFAULT_MERCHANT = "lids";

/**
 * Applies approved affiliate tracking from the environment. Never invents parameters.
 * AFFILIATE_DEEPLINK_<ID> is a network tracking link containing {url} (e.g. an Impact link ending ?u={url});
 * otherwise the merchant's affiliateEnv holds plain query parameters to append.
 */
export function withAffiliate(rawUrl: string, merchantId: string): string {
  const merchant = getMerchant(merchantId);
  if (!merchant) return rawUrl;
  const deep = process.env[`AFFILIATE_DEEPLINK_${merchant.id.toUpperCase()}`];
  if (deep && deep.includes("{url}")) return deep.replace("{url}", encodeURIComponent(rawUrl));
  const params = process.env[merchant.affiliateEnv];
  if (!params) return rawUrl;
  const u = new URL(rawUrl);
  new URLSearchParams(params).forEach((v, k) => u.searchParams.set(k, v));
  return u.toString();
}

/** A retailer search for the player's jerseys, used when no verified product listing exists. */
export function searchOffer(player: Player, team: Team | undefined, merchantId = DEFAULT_MERCHANT): Offer | null {
  const merchant = getMerchant(merchantId);
  if (!merchant) return null;
  const q = [player.name, team?.name, "jersey"].filter(Boolean).join(" ");
  const raw = merchant.searchUrlTemplate.replace("{query}", encodeURIComponent(q).replace(/%20/g, "+"));
  return {
    id: `search-${merchantId}-${player.id}`,
    kind: "search",
    merchantId,
    merchantName: merchant.name,
    label: `Search ${player.name} jerseys at ${merchant.name}`,
    href: withAffiliate(raw, merchantId),
  };
}

export function productOffer(p: Product): Offer | null {
  const merchant = getMerchant(p.merchantId);
  if (!merchant) return null;
  return {
    id: p.id,
    kind: "product",
    merchantId: p.merchantId,
    merchantName: merchant.name,
    label: p.title,
    href: p.affiliateUrl ?? withAffiliate(p.productUrl, p.merchantId),
    product: p,
  };
}

/** A retailer search for a team's jerseys and gear. */
export function teamOffer(team: Pick<Team, "id" | "name">, merchantId = DEFAULT_MERCHANT): Offer | null {
  const merchant = getMerchant(merchantId);
  if (!merchant) return null;
  const raw = merchant.searchUrlTemplate.replace("{query}", encodeURIComponent(`${team.name} jerseys`).replace(/%20/g, "+"));
  return { id: `team-${merchantId}-${team.id}`, kind: "team", merchantId, merchantName: merchant.name, label: `Shop ${team.name} jerseys`, href: withAffiliate(raw, merchantId) };
}

export function promoOffer(p: Promotion): Offer | null {
  const merchant = getMerchant(p.merchantId);
  if (!merchant) return null;
  return { id: `promo-${p.id}`, kind: "promo", merchantId: p.merchantId, merchantName: merchant.name, label: p.headline, href: withAffiliate(p.url, p.merchantId) };
}

/** A retailer search for the player an article covers (the player may not be in players.json). */
export function articleOffer(a: Pick<Article, "slug" | "shopQuery" | "player">, merchantId = DEFAULT_MERCHANT): Offer | null {
  const merchant = getMerchant(merchantId);
  if (!merchant) return null;
  const raw = merchant.searchUrlTemplate.replace("{query}", encodeURIComponent(a.shopQuery).replace(/%20/g, "+"));
  return { id: `article-${merchantId}-${a.slug}`, kind: "search", merchantId, merchantName: merchant.name, label: `Search ${a.player} jerseys at ${merchant.name}`, href: withAffiliate(raw, merchantId) };
}

/** A retailer search for the player or team a daily story covers. */
export function storyOffer(s: Pick<Story, "slug" | "shopQuery" | "subject">, merchantId = DEFAULT_MERCHANT): Offer | null {
  const merchant = getMerchant(merchantId);
  if (!merchant) return null;
  const raw = merchant.searchUrlTemplate.replace("{query}", encodeURIComponent(s.shopQuery).replace(/%20/g, "+"));
  return { id: `story-${merchantId}-${s.slug}`, kind: "search", merchantId, merchantName: merchant.name, label: `Search ${s.subject} jerseys at ${merchant.name}`, href: withAffiliate(raw, merchantId) };
}

/** Outbound links go through /out/ so destinations and tracking can change without rebuilding pages. */
export const outPath = (offerId: string) => `/out/${offerId}/`;

/** Resolves an offer id at request time, so affiliate parameters live only in server env and can change without a rebuild. */
export function resolveOffer(offerId: string): Offer | null {
  const product = loadStore().products.find((p) => p.id === offerId && !p.flagged);
  if (product) return productOffer(product);
  const promo = /^promo-([a-z0-9-]+)$/.exec(offerId);
  if (promo) {
    const p = loadStore().promotions.find((x) => x.id === promo[1]);
    return p ? promoOffer(p) : null;
  }
  const ad = /^ad-lids-(\d+)$/.exec(offerId);
  if (ad) {
    const b = lidsBanner(ad[1]);
    return b ? { id: offerId, kind: "ad", merchantId: "lids", merchantName: "Lids", label: b.alt, href: bannerLink(b) } : null;
  }
  const t = /^team-([a-z0-9]+)-([a-z0-9-]+)$/.exec(offerId);
  if (t) {
    const team = getAnyTeam(t[2]);
    return team ? teamOffer(team, t[1]) : null;
  }
  const art = /^article-([a-z0-9]+)-([a-z0-9-]+)$/.exec(offerId);
  if (art) {
    const a = getArticle(art[2]);
    return a ? articleOffer(a, art[1]) : null;
  }
  const story = /^story-([a-z0-9]+)-([a-z0-9-]+)$/.exec(offerId);
  if (story) {
    const s = getStory(story[2]);
    return s ? storyOffer(s, story[1]) : null;
  }
  const m = /^search-([a-z0-9]+)-([a-z0-9-]+)$/.exec(offerId);
  if (m) {
    const player = getPlayer(m[2]);
    if (player) return searchOffer(player, getTeam(player.teamId ?? player.lastTeamId), m[1]);
  }
  return null;
}


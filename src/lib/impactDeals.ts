import type { Promotion } from "./schema";

/** Marks promotions written by scripts/fetch-lids-deals.ts, so a refresh replaces only these and keeps hand-entered ones. */
export const IMPACT_SOURCE = "Impact.com partner API (Lids deals)";

/** The fields we read from an Impact partner-API Ad (GET /Mediapartners/{AccountSID}/Ads). */
export interface ImpactAd {
  Id: string | number;
  Name?: string;
  Description?: string;
  Type?: string;
  CampaignId?: string | number;
  LandingPageUrl?: string;
  TrackingLink?: string;
  StartDate?: string | null;
  EndDate?: string | null;
  DealId?: string | number | null;
  DealName?: string | null;
  DealDescription?: string | null;
  DealState?: string | null;
  DealType?: string | null;
  DealDefaultPromoCode?: string | null;
  DiscountType?: string | null;
  DiscountAmount?: string | number | null;
  DiscountPercent?: string | number | null;
}

const day = (s: string | null | undefined) => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null);
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
const clean = (s: string | null | undefined) => (s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** Bigger savings first: percent off, then dollars off, then free shipping, then everything else. */
export function dealScore(a: ImpactAd): number {
  const pct = Number(a.DiscountPercent) || 0;
  const amt = Number(a.DiscountAmount) || 0;
  if (pct) return 1000 + pct;
  if (amt) return 500 + amt;
  if (a.DealType === "FREE_SHIPPING") return 100;
  return a.DealDefaultPromoCode ? 50 : 0;
}

/**
 * Turns the Lids ads Impact returns into promotions. Keeps only ads tied to an active deal that is running today,
 * one per deal, best savings first. Deals with no end date are shown until tomorrow; the daily refresh extends them.
 */
export function adsToPromotions(ads: ImpactAd[], today: string, verifiedOn = today, limit = 8): Promotion[] {
  const seen = new Set<string>();
  const out: Promotion[] = [];
  const live = ads
    .filter((a) => a.DealId && (a.DealState ?? "ACTIVE").toUpperCase() === "ACTIVE" && a.LandingPageUrl)
    .filter((a) => (day(a.StartDate) ?? today) <= today && (day(a.EndDate) ?? today) >= today)
    .sort((a, b) => dealScore(b) - dealScore(a));
  for (const a of live) {
    const key = String(a.DealId);
    if (seen.has(key)) continue;
    let url: URL;
    try { url = new URL(a.LandingPageUrl!); } catch { continue; }
    if (!/(^|\.)lids\.com$/i.test(url.hostname)) continue;
    const headline = clean(a.DealName) || clean(a.Name);
    if (!headline) continue;
    seen.add(key);
    out.push({
      id: `lids-deal-${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      merchantId: "lids",
      headline: headline.slice(0, 90),
      details: clean(a.DealDescription) || clean(a.Description) || null,
      code: clean(a.DealDefaultPromoCode) || null,
      url: url.toString(),
      startDate: day(a.StartDate) ?? today,
      endDate: day(a.EndDate) ?? addDays(today, 1),
      leagues: [],
      source: IMPACT_SOURCE,
      lastVerified: verifiedOn,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Replaces the previous Impact deals with fresh ones and keeps hand-entered promotions that have not ended. */
export function mergePromotions(existing: Promotion[], fresh: Promotion[], today: string): Promotion[] {
  const manual = existing.filter((p) => p.source !== IMPACT_SOURCE && p.endDate >= today);
  return [...manual, ...fresh];
}

/** The campaign id is the third number in an Impact tracking link: https://x.7q8j.net/c/{partner}/{ad}/{campaign}?u=... */
export function campaignFromLink(link: string | undefined): string | null {
  return /\/c\/\d+\/\d+\/(\d+)/.exec(link ?? "")?.[1] ?? null;
}

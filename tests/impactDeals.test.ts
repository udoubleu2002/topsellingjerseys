import { describe, it, expect } from "vitest";
import { adsToPromotions, campaignFromLink, mergePromotions, IMPACT_SOURCE, type ImpactAd } from "@/lib/impactDeals";
import { resolveOffer } from "@/lib/affiliate";
import type { Promotion } from "@/lib/schema";

const ad = (o: Partial<ImpactAd>): ImpactAd => ({ Id: 1, DealId: 10, DealState: "ACTIVE", DealName: "Deal", LandingPageUrl: "https://www.lids.com/nfl", StartDate: "2026-10-01T00:00:00-04:00", EndDate: null, ...o });

describe("Impact Lids deals", () => {
  it("keeps active, running Lids deals once each, best savings first", () => {
    const out = adsToPromotions([
      ad({ Id: 1, DealId: 1, DealName: "Free shipping", DealType: "FREE_SHIPPING" }),
      ad({ Id: 2, DealId: 2, DealName: "25% off NFL", DiscountPercent: 25, DealDefaultPromoCode: "NFL25" }),
      ad({ Id: 3, DealId: 2, DealName: "25% off NFL (banner)", DiscountPercent: 25 }),
      ad({ Id: 4, DealId: 4, DealState: "EXPIRED" }),
      ad({ Id: 5, DealId: 5, EndDate: "2026-10-20T23:59:00-04:00" }),
      ad({ Id: 6, DealId: 6, StartDate: "2026-11-01T00:00:00-04:00" }),
      ad({ Id: 7, DealId: 7, LandingPageUrl: "https://evil.example.com/" }),
      ad({ Id: 8, DealId: null }),
    ], "2026-10-27");
    expect(out.map((p) => p.headline)).toEqual(["25% off NFL", "Free shipping"]);
    expect(out[0]).toMatchObject({ id: "lids-deal-2", code: "NFL25", merchantId: "lids", startDate: "2026-10-01", endDate: "2026-10-28", source: IMPACT_SOURCE });
  });
  it("replaces old Impact deals and keeps live hand-entered ones", () => {
    const base = { merchantId: "lids", headline: "x", details: null, code: null, url: "https://www.lids.com/", startDate: "2026-10-01", leagues: [], lastVerified: "2026-10-01" };
    const existing: Promotion[] = [
      { ...base, id: "manual", endDate: "2026-12-01", source: "manual" },
      { ...base, id: "manual-old", endDate: "2026-10-01", source: "manual" },
      { ...base, id: "lids-deal-9", endDate: "2026-12-01", source: IMPACT_SOURCE },
    ];
    const fresh = [{ ...base, id: "lids-deal-1", endDate: "2026-10-28", source: IMPACT_SOURCE }];
    expect(mergePromotions(existing, fresh, "2026-10-27").map((p) => p.id)).toEqual(["manual", "lids-deal-1"]);
  });
  it("reads the campaign id from an Impact tracking link", () => {
    expect(campaignFromLink("https://lids.7q8j.net/c/1234567/890123/14231?u={url}")).toBe("14231");
    expect(campaignFromLink(undefined)).toBeNull();
  });
  it("resolves Lids banner clicks to their Impact tracking links", () => {
    expect(resolveOffer("ad-lids-1907269")?.href).toBe("https://lids.7q8j.net/c/6755530/1907269/9679");
    expect(resolveOffer("ad-lids-1907274")).toBeNull();
    expect(resolveOffer("ad-lids-123")).toBeNull();
  });
});

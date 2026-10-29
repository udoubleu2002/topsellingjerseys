import { describe, it, expect } from "vitest";
import { pinnedRailBanner, PINNED_RAIL_TOP } from "@/lib/lidsAds";
import { resolveOffer } from "@/lib/affiliate";

describe("pinned sidebar banner", () => {
  it("shows the Brewers banner through Nov 28 and drops it after", () => {
    expect(PINNED_RAIL_TOP?.bannerId).toBe("4114444");
    expect(pinnedRailBanner(new Date("2026-10-29T12:00:00Z"))?.banner.id).toBe("4114444");
    expect(pinnedRailBanner(new Date("2026-11-28T23:59:00Z"))?.banner.id).toBe("4114444");
    expect(pinnedRailBanner(new Date("2026-11-29T00:00:00Z"))).toBeNull();
  });

  it("sends Brewers banner clicks to its Impact tracking link", () => {
    expect(resolveOffer("ad-lids-4114444")?.href).toBe("https://lids.7q8j.net/c/6755530/4114444/9679");
  });
});

import { describe, it, expect } from "vitest";
import { pinnedRailBanner, PINNED_RAIL_TOP, ROTATION_SHARE } from "@/lib/lidsAds";
import { resolveOffer } from "@/lib/affiliate";

describe("Brewers banners", () => {
  it("are no longer pinned or rotated anywhere", () => {
    expect(PINNED_RAIL_TOP).toBeNull();
    expect(pinnedRailBanner(new Date("2026-11-10T12:00:00Z"))).toBeNull();
    expect(ROTATION_SHARE).toBe(0);
  });

  it("still send old Brewers banner clicks to its Impact tracking link", () => {
    expect(resolveOffer("ad-lids-4114444")?.href).toBe("https://lids.7q8j.net/c/6755530/4114444/9679");
  });
});

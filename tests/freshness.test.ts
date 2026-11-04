import { describe, it, expect } from "vitest";
import { freshness } from "@/components/Freshness";
import { getCurrentRanking, getLeagues, getProducts } from "@/lib/data";
import { productColor } from "@/lib/productStyle";

describe("freshness labels", () => {
  it("labels each league's latest list from its own dates", () => {
    const kinds = Object.fromEntries(getLeagues().map((l) => [l.id, freshness(getCurrentRanking(l.id)!).kind]));
    expect(kinds.wnba).toBe("outdated"); // July 2024 list, no newer one
    expect(kinds.mls).toBe("current"); // sales through Oct 30, 2026
    expect(kinds.nfl).toBe("dated"); // sales ended Feb 2026
  });
});

describe("jersey photos on lists", () => {
  it("nearly every ranked player has a retailer photo; the rest get a drawn jersey", () => {
    const ids = new Set(getLeagues().flatMap((l) => getCurrentRanking(l.id)!.entries.map((e) => e.playerId)));
    const missing = [...ids].filter((id) => !getProducts(id).some((p) => p.productType === "jersey" && p.image));
    expect(missing.length).toBeLessThanOrEqual(5);
  });
  it("reads the jersey color from the retailer title only", () => {
    expect(productColor("Men's Nike Drake Maye Navy New England Patriots Player Game Jersey")).toBe("Navy");
    expect(productColor("Men's Nike Jersey")).toBeNull();
  });
});

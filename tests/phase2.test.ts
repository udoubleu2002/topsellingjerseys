import { describe, it, expect } from "vitest";
import { getCurrentRanking, getMovement, getRanking, reportStatus } from "@/lib/data";
import { productStyle } from "@/lib/productStyle";

describe("rank movement", () => {
  it("compares the NFLPA year-end lists within the same series", () => {
    const m = getMovement(getCurrentRanking("nfl")!)!;
    expect(m.previous.id).toBe("nfl-2025-06-11-nflpa-year-end");
    const maye = m.risers.find((x) => x.playerId === "drake-maye")!;
    expect([maye.previousRank, maye.rank]).toEqual([32, 2]);
    // Jaxon Smith-Njigba was not in the 2024-25 top 50.
    expect(m.newEntries.some((x) => x.playerId === "jaxon-smith-njigba")).toBe(true);
    // Travis Kelce was No. 11 and is not in the 2025-26 ranks shown.
    expect(m.left.find((x) => x.playerId === "travis-kelce")?.previousRank).toBe(11);
  });
  it("compares MLB 2025 and 2026 season lists", () => {
    const m = getMovement(getCurrentRanking("mlb")!)!;
    expect(m.previous.id).toBe("mlb-2025-09-26-season-most-popular");
    const pca = m.stayed.find((x) => x.playerId === "pete-crow-armstrong")!;
    expect([pca.previousRank, pca.rank]).toEqual([16, 3]);
  });
  it("never compares across series or without an earlier report", () => {
    expect(getMovement(getCurrentRanking("nba")!)).toBeNull();
    expect(getMovement(getCurrentRanking("wnba")!)).toBeNull();
  });
  it("labels the replaced reports superseded", () => {
    expect(reportStatus(getRanking("nfl-2025-06-11-nflpa-year-end")!).kind).toBe("superseded");
    expect(reportStatus(getRanking("mlb-2025-09-26-season-most-popular")!).kind).toBe("superseded");
  });
});

describe("product style", () => {
  it("reads tier, edition and fit from the retailer title", () => {
    expect(productStyle({ title: "Women's Nike Adley Rutschman White Boston Red Sox Home Replica Jersey", edition: "Home" })).toEqual({ fit: "Women's", tier: "Replica", edition: "Home" });
    expect(productStyle({ title: "Men's Nike Aaron Judge Gray New York Yankees Road Replica Jersey", edition: "Road" }).edition).toBe("Away");
    expect(productStyle({ title: "Youth Nike Stephen Curry Golden State Warriors Swingman Jersey", edition: null })).toEqual({ fit: "Youth", tier: "Swingman", edition: null });
  });
  it("leaves unknown attributes empty instead of guessing", () => {
    expect(productStyle({ title: "Josh Allen Jersey", edition: null })).toEqual({ fit: null, tier: null, edition: null });
  });
});

describe("phase 3 archive", () => {
  it("keeps the MLBShop.com-only 2024 list historical and out of rank comparisons", () => {
    const r = getRanking("mlb-2024-09-30-season-most-popular")!;
    expect(reportStatus(r).kind).toBe("historical");
    expect(getMovement(r)).toBeNull();
    // The 2026 list still compares with 2025, not 2024.
    expect(getMovement(getCurrentRanking("mlb")!)!.previous.id).toBe("mlb-2025-09-26-season-most-popular");
  });
  it("points the MLS 2025 report at the season announcement", () => {
    const r = getCurrentRanking("mls")!;
    expect(r.sourceUrl).toContain("30th-regular-season");
    expect(r.publishedDate).toBe("2025-10-23");
  });
});

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

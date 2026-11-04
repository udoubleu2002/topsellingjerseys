import { describe, it, expect } from "vitest";
import { getTrends, topRisers, newEntries, repeatLeaders } from "@/lib/trending";
import { getRankings, getPlayer } from "@/lib/data";
import { checkRanking } from "@/lib/validate";
import { getHero } from "@/lib/featured";

describe("trending", () => {
  it("compares only leagues with an earlier report in the same series", () => {
    const { compared, uncompared } = getTrends();
    expect(compared.map((c) => c.league.id).sort()).toEqual(["mlb", "nfl"]);
    // MLS 2026 is a different series (MLS Store calendar year) from the 2025 season list, so it is not compared.
    expect(uncompared.map((u) => u.league.id)).toContain("mls");
  });
  it("ranks risers by real rank gains", () => {
    const r = topRisers(3);
    expect(r[0].playerId).toBe("drake-maye");
    expect(r.every((x) => x.delta! > 0 && x.previousRank! - x.rank === x.delta)).toBe(true);
  });
  it("lists new entries that were not in the previous report", () => {
    for (const n of newEntries(10)) expect(n.previous.entries.some((e) => e.playerId === n.playerId)).toBe(false);
  });
  it("finds Ohtani as MLB's repeat No. 1", () => {
    expect(repeatLeaders().map((r) => r.playerId)).toContain("shohei-ohtani");
  });
});

describe("report dates", () => {
  it("no report's sales period ends after it was published", () => {
    for (const r of getRankings()) if (r.periodEnd) expect(r.periodEnd <= r.publishedDate, r.id).toBe(true);
  });
  it("the validator flags a period that ends after publication", () => {
    const r = { ...getRankings("mlb")[0], periodEnd: "2099-01-01" };
    const ids = new Set(r.entries.map((e) => e.playerId));
    expect(checkRanking(r, ids).some((e) => e.includes("after the report was published"))).toBe(true);
  });
});

describe("homepage hero", () => {
  it("uses a real ranked player and an internal link", () => {
    const h = getHero()!;
    expect(h.cta.href.startsWith("/")).toBe(true);
    expect(h.player && getPlayer(h.player.id)).toBeTruthy();
    expect(h.appearance?.rank).toBe(1);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadStore, getCurrentRanking, rankMovement, getStatLine, isIndexable, getPlayer, getLeagues } from "@/lib/data";
import { checkStore, checkRanking } from "@/lib/validate";
import { withAffiliate, searchOffer, resolveOffer } from "@/lib/affiliate";
import { age, fmtDate, period } from "@/lib/format";
import type { Ranking } from "@/lib/schema";

describe("data store", () => {
  it("loads and passes validation with no errors", () => {
    const { errors } = checkStore(loadStore());
    expect(errors).toEqual([]);
  });
  it("has a published ranking for every league, in contiguous order", () => {
    for (const l of getLeagues()) {
      const r = getCurrentRanking(l.id)!;
      expect(r).toBeDefined();
      expect(r.entries.map((e) => e.rank)).toEqual(r.entries.map((_, i) => i + 1));
    }
  });
  it("gives every player exactly three distinct highlights", () => {
    for (const p of loadStore().players) {
      expect(p.highlights).toHaveLength(3);
      expect(new Set(p.highlights.map((h) => h.text)).size).toBe(3);
    }
  });
  it("never serves demo stats", () => {
    expect(loadStore().stats.some((s) => s.isDemo)).toBe(false);
    for (const p of loadStore().players) expect(getStatLine(p.id)?.isDemo ?? false).toBe(false);
  });
  it("marks ranked players indexable", () => {
    expect(isIndexable(getPlayer("josh-allen")!)).toBe(true);
  });
});

describe("validation catches bad rankings", () => {
  const base: Ranking = {
    id: "t", league: "nfl", series: "s", title: "t", publisher: "p", sourceUrl: "https://example.com", publishedDate: "2026-01-01",
    periodStart: null, periodEnd: null, periodLabel: "x", scope: "x", methodology: null, retrievedDate: "2026-01-01", lastVerified: "2026-01-01",
    limitations: [], status: "published", entries: [],
  };
  const ids = new Set(["a", "b"]);
  it("flags gaps, duplicates and unknown players", () => {
    const errs = checkRanking({ ...base, entries: [{ rank: 1, playerId: "a", teamIdAtReport: null }, { rank: 3, playerId: "a", teamIdAtReport: null }, { rank: 3, playerId: "zz", teamIdAtReport: null }] }, ids);
    expect(errs.some((e) => e.includes("has rank 3"))).toBe(true);
    expect(errs.some((e) => e.includes("duplicate player"))).toBe(true);
    expect(errs.some((e) => e.includes("unknown player"))).toBe(true);
  });
  it("accepts a clean list", () => {
    expect(checkRanking({ ...base, entries: [{ rank: 1, playerId: "a", teamIdAtReport: null }, { rank: 2, playerId: "b", teamIdAtReport: null }] }, ids)).toEqual([]);
  });
});

describe("rank movement", () => {
  it("is null when no earlier report exists in the same series", () => {
    const r = getCurrentRanking("nfl")!;
    expect(rankMovement(r, r.entries[0].playerId)).toBeNull();
  });
});

describe("affiliate links", () => {
  const prev = process.env.AFFILIATE_PARAMS_FANATICS;
  beforeEach(() => { delete process.env.AFFILIATE_PARAMS_FANATICS; });
  afterEach(() => { if (prev === undefined) delete process.env.AFFILIATE_PARAMS_FANATICS; else process.env.AFFILIATE_PARAMS_FANATICS = prev; });

  it("leaves URLs untouched when no parameters are configured", () => {
    expect(withAffiliate("https://www.fanatics.com/?query=x", "fanatics")).toBe("https://www.fanatics.com/?query=x");
  });
  it("appends configured parameters from the environment", () => {
    process.env.AFFILIATE_PARAMS_FANATICS = "utm_source=test&id=123";
    const u = new URL(withAffiliate("https://www.fanatics.com/?query=x", "fanatics"));
    expect(u.searchParams.get("id")).toBe("123");
    expect(u.searchParams.get("query")).toBe("x");
  });
  it("wraps the destination in a configured tracking link", () => {
    process.env.AFFILIATE_DEEPLINK_LIDS = "https://track.example/c/1/2/3?u={url}";
    try {
      expect(withAffiliate("https://www.lids.com/?query=a+b", "lids")).toBe("https://track.example/c/1/2/3?u=" + encodeURIComponent("https://www.lids.com/?query=a+b"));
    } finally { delete process.env.AFFILIATE_DEEPLINK_LIDS; }
  });
  it("builds a labeled search offer and resolves it by id", () => {
    const p = getPlayer("josh-allen")!;
    const o = searchOffer(p, undefined)!;
    expect(o.kind).toBe("search");
    expect(o.label).toMatch(/^Search Josh Allen jerseys/);
    expect(o.merchantName).toBe("Lids");
    expect(resolveOffer(o.id)?.href).toContain("lids.com");
    expect(resolveOffer(`search-fanatics-${p.id}`)?.href).toContain("fanatics.com");
    expect(resolveOffer("search-lids-nobody")).toBeNull();
    expect(resolveOffer("../../etc")).toBeNull();
  });
});

describe("formatting", () => {
  it("formats dates without timezone drift", () => {
    expect(fmtDate("2026-01-01")).toBe("January 1, 2026");
  });
  it("computes age on a given date", () => {
    expect(age("1996-05-21", "2026-05-20")).toBe(29);
    expect(age("1996-05-21", "2026-05-21")).toBe(30);
  });
  it("prefers explicit dates for periods", () => {
    expect(period("2026-03-01", "2026-08-31", "x")).toBe("Mar 1, 2026 – Aug 31, 2026");
    expect(period(null, null, "2025 season")).toBe("2025 season");
  });
});

describe("sidebar news", () => {
  it("loads, passes validation, and lists the newest five first", async () => {
    const { loadNews, getLatestNews } = await import("@/lib/news");
    const { checkNews } = await import("@/lib/validate");
    expect(checkNews(loadNews(), loadStore()).errors).toEqual([]);
    const latest = getLatestNews(5);
    expect(latest).toHaveLength(5);
    expect(latest.map((n) => n.date)).toEqual(latest.map((n) => n.date).slice().sort().reverse());
  });
});

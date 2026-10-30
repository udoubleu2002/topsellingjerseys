import { describe, it, expect } from "vitest";
import { pageTitle, TITLE_MAX } from "@/lib/seo";
import { leagueCopy, seasonLabel } from "@/lib/content";
import { playerTitle, playerDescription } from "@/lib/playerSeo";
import { getLeagues, getCurrentRanking, getPlayers, getLeague, getTeam, getAppearances } from "@/lib/data";

describe("page titles", () => {
  it("adds the brand at the end only when it fits", () => {
    expect(pageTitle("Privacy Policy")).toBe("Privacy Policy | Top Selling Jerseys");
    const long = "Best Selling NFL Jerseys 2026: NFLPA Top 25 Player Sales";
    expect(pageTitle(long)).toBe(long);
    expect(pageTitle("Top Selling Jerseys: About")).toBe("About | Top Selling Jerseys");
  });

  it("gives every league a distinct keyword and a title with the report's own year", () => {
    const keywords = new Set<string>();
    for (const l of getLeagues()) {
      const r = getCurrentRanking(l.id)!;
      const copy = leagueCopy[l.id];
      expect(keywords.has(copy.keyword)).toBe(false);
      keywords.add(copy.keyword);
      const t = copy.title(r);
      expect(t.toLowerCase()).toContain(copy.keyword.toLowerCase());
      expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
      for (const y of t.match(/20\d\d/g) ?? []) expect([r.publishedDate.slice(0, 4), seasonLabel(r).slice(0, 4)]).toContain(y);
    }
  });

  it("labels two-year seasons", () => {
    expect(seasonLabel({ periodStart: "2025-10-01", periodEnd: "2026-04-12", publishedDate: "2026-04-13" })).toBe("2025-26");
    expect(seasonLabel({ periodStart: null, periodEnd: null, publishedDate: "2024-07-23" })).toBe("2024");
  });
});

describe("player titles and descriptions", () => {
  const ctx = (slug: string) => {
    const player = getPlayers().find((p) => p.slug === slug)!;
    return { player, league: getLeague(player.leagues[0])!, team: getTeam(player.teamId ?? player.lastTeamId), latest: getAppearances(player.id)[0] };
  };

  it("names the current team for players not on a sales list", () => {
    const unranked = getPlayers().find((p) => p.teamId && p.number && !getAppearances(p.id).length)!;
    const t = playerTitle(ctx(unranked.slug));
    expect(t).toContain(getTeam(unranked.teamId)!.name);
    expect(t.endsWith(" Jersey")).toBe(true);
  });

  it("never repeats the league name in the sales-list line", () => {
    for (const p of getPlayers().filter((p) => getAppearances(p.id).length)) {
      const d = playerDescription(ctx(p.slug));
      expect(d).not.toMatch(/\b(NFL|NBA|WNBA|MLB|NHL|MLS) \1\b/);
      expect(d).not.toContain("as reported by");
    }
  });
});

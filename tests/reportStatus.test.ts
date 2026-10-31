import { describe, it, expect } from "vitest";
import { loadStore, getCurrentRanking, reportStatus, entryTeams, getPlayer, getLeagues, getAppearances } from "@/lib/data";
import { playerIntro, playerFaq } from "@/lib/playerSeo";
import type { Ranking } from "@/lib/schema";

describe("report status", () => {
  it("labels each league's newest report Latest Published Report, never Current", () => {
    for (const l of getLeagues()) {
      const r = getCurrentRanking(l.id)!;
      const s = reportStatus(r);
      expect(s.kind).toBe("latest");
      expect(s.label).toBe("Latest Published Report");
    }
  });
  it("flags old latest reports (WNBA 2024, MLS 2025) as dated", () => {
    expect(reportStatus(getCurrentRanking("wnba")!).dated).toBe(true);
    expect(reportStatus(getCurrentRanking("mls")!).dated).toBe(true);
  });
  it("marks an older report in the same series as superseded and other series as historical", () => {
    const latest = getCurrentRanking("nba")!;
    const store = loadStore();
    const older: Ranking = { ...latest, id: "nba-old", publishedDate: "2025-04-15", periodEnd: "2025-04-13" };
    const other: Ranking = { ...latest, id: "nba-other", series: "nba-other", publishedDate: "2025-01-15", periodEnd: "2025-01-10" };
    store.rankings.push(older, other);
    try {
      const a = reportStatus(older);
      expect(a.kind).toBe("superseded");
      expect(a.newer?.id).toBe(latest.id);
      expect(reportStatus(other).kind).toBe("historical");
      expect(reportStatus(latest).kind).toBe("latest");
    } finally {
      store.rankings.splice(store.rankings.indexOf(older), 1);
      store.rankings.splice(store.rankings.indexOf(other), 1);
    }
  });
});

describe("historical team attribution", () => {
  const nba = () => getCurrentRanking("nba")!;
  const entry = (id: string) => nba().entries.find((e) => e.playerId === id)!;

  it("keeps the report's team for players who moved, with a 'now with' note", () => {
    const lebron = entryTeams(entry("lebron-james"), getPlayer("lebron-james")!);
    expect(lebron.reportTeam?.id).toBe("los-angeles-lakers");
    expect(lebron.now).toBe("Now with Philadelphia 76ers");
    const melo = entryTeams(entry("lamelo-ball"), getPlayer("lamelo-ball")!);
    expect(melo.reportTeam?.id).toBe("charlotte-hornets");
    expect(melo.now).toBe("Now with Minnesota Timberwolves");
  });
  it("adds no note for players still on the report's team", () => {
    expect(entryTeams(entry("stephen-curry"), getPlayer("stephen-curry")!).now).toBeNull();
  });
  it("describes retired players without inventing a team", () => {
    const mls = getCurrentRanking("mls")!;
    const e = mls.entries.find((x) => x.playerId === "darlington-nagbe")!;
    expect(entryTeams(e, getPlayer("darlington-nagbe")!).now).toBe("Now retired");
  });
  it("never pairs a pre-trade rank with the new team in the player intro", () => {
    const p = getPlayer("lebron-james")!;
    const league = getLeagues().find((l) => l.id === "nba")!;
    const latest = getAppearances(p.id)[0];
    const team = loadStore().teams.find((t) => t.id === p.teamId);
    const intro = playerIntro({ player: p, league, team, latest });
    expect(intro).toContain("with the Los Angeles Lakers");
    expect(intro).toContain("now plays for the Philadelphia 76ers");
    expect(intro).not.toMatch(/Philadelphia 76ers jersey is No\. 5/);
    const faq = playerFaq({ player: p, league, team, latest });
    expect(faq.find((f) => f.q.includes("top seller"))?.a).toContain("while with the Los Angeles Lakers");
  });
  it("records a team at report for every ranking entry", () => {
    for (const r of loadStore().rankings) for (const e of r.entries) expect(e.teamIdAtReport, `${r.id} ${e.playerId}`).toBeTruthy();
  });
});

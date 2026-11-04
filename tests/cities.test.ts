import { describe, expect, it } from "vitest";
import { getCities, cityRanked, cityStories, cityBanners, cityTeams } from "../src/lib/cities";

describe("cities", () => {
  it("has 30-40 cities, every team known and in one city only", () => {
    const cities = getCities();
    expect(cities.length).toBeGreaterThanOrEqual(30);
    expect(cities.length).toBeLessThanOrEqual(40);
    for (const c of cities) expect(cityTeams(c).length).toBe(c.teams.length);
  });

  it("orders the overall list by league rank and keeps only the city's teams", () => {
    for (const c of getCities()) {
      const rows = cityRanked(c);
      for (let i = 1; i < rows.length; i++) expect(rows[i].rank).toBeGreaterThanOrEqual(rows[i - 1].rank);
      for (const r of rows) expect(c.teams).toContain(r.teamId);
    }
  });

  it("shows only the city's own stories", () => {
    for (const c of getCities()) for (const s of cityStories(c)) expect(s.local).toBe(true);
  });

  it("always has at least one Lids banner", () => {
    for (const c of getCities()) expect(cityBanners(c).length).toBeGreaterThan(0);
  });
});

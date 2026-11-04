import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getCities, cityRanked, cityStories, cityTeams, cityFeatured, cityArt, featuredCities, teamNickname } from "../src/lib/cities";

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

  it("lists cities A to Z", () => {
    const names = getCities().map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("gives every city a jersey with a photo", () => {
    for (const c of getCities()) expect(cityFeatured(c)?.product.image, c.name).toBeTruthy();
  });

  it("gives every city its own illustration with a description", () => {
    for (const c of getCities()) {
      const art = cityArt(c);
      expect(fs.existsSync(path.join(process.cwd(), "public", art.src)), c.slug).toBe(true);
      expect(art.alt).not.toBe(`Illustration of ${c.name}`);
    }
  });

  it("features a lead city and up to four more, all real cities", () => {
    const f = featuredCities();
    expect(f).not.toBeNull();
    expect(f!.more.length).toBeLessThanOrEqual(4);
    for (const c of [f!.lead, ...f!.more]) expect(c).toBeTruthy();
  });

  it("shortens team names for cards", () => {
    expect(teamNickname({ name: "Boston Red Sox", league: "mlb" })).toBe("Red Sox");
    expect(teamNickname({ name: "New York Yankees", league: "mlb" })).toBe("Yankees");
    expect(teamNickname({ name: "Inter Miami CF", league: "mls" })).toBe("Inter Miami CF");
  });
});

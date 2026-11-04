/**
 * Cities: the top sports cities in the US and Canada (data/cities.json), each with its teams across every league we cover.
 * A city page lists the city's players from the latest published sales lists, Lids jerseys for every team, and Lids ads.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Player, Product, Ranking, Team } from "./schema";
import { getAnyTeam, getCurrentRanking, getLeagues, getPlayer, getPlayers, getProducts, getTeam } from "./data";
import { getStories, storyJersey, storyPath, storyPlayer } from "./stories";
import { articlePath, getArticles } from "./articles";

const CitySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  region: z.string().min(2),
  country: z.enum(["US", "CA"]),
  area: z.string().optional(),
  teams: z.array(z.string()).min(1),
});
export type City = z.infer<typeof CitySchema>;

let cache: City[] | null = null;

/** Every city, in alphabetical order. Throws on an unknown team or a team listed in two cities, so the build fails. */
export function getCities(): City[] {
  if (cache) return cache;
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "cities.json"), "utf8"));
  const cities = z.object({ cities: z.array(CitySchema) }).parse(raw).cities;
  const seen = new Map<string, string>();
  for (const c of cities) {
    for (const t of c.teams) {
      if (!getAnyTeam(t)) throw new Error(`data/cities.json: ${c.slug} lists unknown team ${t}`);
      if (seen.has(t)) throw new Error(`data/cities.json: ${t} is in both ${seen.get(t)} and ${c.slug}`);
      seen.set(t, c.slug);
    }
  }
  if (new Set(cities.map((c) => c.slug)).size !== cities.length) throw new Error("data/cities.json: duplicate city slug");
  cache = [...cities].sort((a, b) => a.name.localeCompare(b.name));
  const f = z.object({ featured: z.object({ city: z.string(), more: z.array(z.string()).max(4) }).optional() }).parse(raw).featured;
  for (const slug of f ? [f.city, ...f.more] : []) if (!cache.some((c) => c.slug === slug)) throw new Error(`data/cities.json: featured city ${slug} is not a city`);
  featuredCfg = f ?? null;
  return cache;
}

let featuredCfg: { city: string; more: string[] } | null = null;

/** The hand-picked feature for the Cities page (data/cities.json "featured"): a lead city and up to four more. */
export function featuredCities(): { lead: City; more: City[] } | null {
  getCities();
  if (!featuredCfg) return null;
  return { lead: getCity(featuredCfg.city)!, more: featuredCfg.more.map((s) => getCity(s)!) };
}

const ART_ALT: Record<string, string> = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", "cities", "art", "alt.json"), "utf8"));
  } catch {
    return {};
  }
})();

/** The city's illustration (public/cities/art, drawn by scripts/city-art.py) and its description. */
export function cityArt(c: Pick<City, "slug" | "name">): { src: string; alt: string } {
  return { src: `/cities/art/${c.slug}.svg`, alt: ART_ALT[c.slug] ? `Illustration of ${ART_ALT[c.slug]}` : `Illustration of ${c.name}` };
}

const MULTI = ["Red Sox", "White Sox", "Blue Jays", "Maple Leafs", "Red Wings", "Golden Knights", "Trail Blazers", "Blue Jackets", "Red Bulls"];

/** A team's short name for compact lists: "Yankees", "Red Sox"; MLS clubs keep their full name. */
export function teamNickname(t: Pick<CityTeam, "name" | "league">): string {
  if (t.league === "mls") return t.name;
  const multi = MULTI.find((m) => t.name.endsWith(` ${m}`));
  return multi ?? t.name.split(" ").pop()!;
}

export const getCity = (slug: string) => getCities().find((c) => c.slug === slug);
export const cityPath = (c: Pick<City, "slug">) => `/cities/${c.slug}/`;
export const cityOfTeam = (teamId: string | null | undefined) => (teamId ? getCities().find((c) => c.teams.includes(teamId)) : undefined);

export type CityTeam = { id: string; name: string; league: string; team?: Team };

/** The city's teams in league order (NFL, NBA, WNBA, MLB, NHL, MLS), with colors where the site has them. */
export function cityTeams(c: City): CityTeam[] {
  const order = getLeagues().map((l) => l.id);
  return c.teams
    .map((id) => ({ ...getAnyTeam(id)!, team: getTeam(id) }))
    .sort((a, b) => order.indexOf(a.league) - order.indexOf(b.league));
}

/** Leagues the city has a team in, in site order. */
export function cityLeagues(c: City) {
  const ids = new Set(cityTeams(c).map((t) => t.league));
  return getLeagues().filter((l) => ids.has(l.id));
}

const jerseyOf = (playerId: string): Product | undefined => {
  const all = getProducts(playerId).filter((p) => p.productType === "jersey");
  return all.find((p) => p.image) ?? all[0];
};

export type CityRow = { player: Player; teamId: string; rank: number; ranking: Ranking; product?: Product };

/**
 * The city's players on each league's latest published sales list, by rank (a No. 1 in any league comes before any No. 2).
 * A player counts for the city of their current team, or the team the report credited when they have no team now.
 */
export function cityRanked(c: City): CityRow[] {
  const teams = new Set(c.teams);
  const order = getLeagues().map((l) => l.id);
  const rows: CityRow[] = [];
  for (const l of getLeagues()) {
    const r = getCurrentRanking(l.id);
    if (!r) continue;
    for (const e of r.entries) {
      const p = getPlayer(e.playerId);
      const teamId = p ? (p.teamId ?? e.teamIdAtReport ?? p.lastTeamId) : null;
      if (!p || !teamId || !teams.has(teamId)) continue;
      rows.push({ player: p, teamId, rank: e.rank, ranking: r, product: jerseyOf(p.id) });
    }
  }
  return rows.sort((a, b) => a.rank - b.rank || order.indexOf(a.ranking.league) - order.indexOf(b.ranking.league));
}

export type CityPick = { player: Player; teamId: string; product: Product };

/**
 * More jerseys from the Lids feed for the city's other players (one per player, with a photo), taking one team at a time
 * so every team shows up before any team gets a second.
 */
export function cityPicks(c: City, exclude: Set<string>, max = 12, league?: string): CityPick[] {
  const byTeam = cityTeams(c).filter((t) => !league || t.league === league).map((t) =>
    getPlayers()
      .filter((p) => p.teamId === t.id && !exclude.has(p.id))
      .map((p) => ({ player: p, teamId: t.id, product: jerseyOf(p.id) }))
      .filter((x): x is CityPick => !!x.product?.image),
  );
  const out: CityPick[] = [];
  for (let i = 0; out.length < max && byTeam.some((list) => list.length > i); i++) {
    for (const list of byTeam) if (list[i] && out.length < max) out.push(list[i]);
  }
  return out;
}

/** Players on a team, best-known first (players with a Lids jersey photo, then by name). */
export function teamStars(teamId: string, max = 3): Player[] {
  return getPlayers()
    .filter((p) => p.teamId === teamId)
    .map((p) => ({ p, photo: jerseyOf(p.id)?.image ? 1 : 0, ranked: getLeagues().some((l) => getCurrentRanking(l.id)?.entries.some((e) => e.playerId === p.id)) ? 1 : 0 }))
    .sort((a, b) => b.ranked - a.ranked || b.photo - a.photo || a.p.name.localeCompare(b.p.name))
    .slice(0, max)
    .map((x) => x.p);
}


export type CityStory = { href: string; headline: string; league: string; date: string; image?: string; local: boolean };

/**
 * Stories and "jerseys to watch" articles about the city's teams and players, newest first, for the city page sidebar.
 * Stories about other cities are never shown.
 */
export function cityStories(c: City): CityStory[] {
  const teams = new Set(c.teams);
  const local = (teamId: string | null | undefined) => !!teamId && teams.has(teamId);
  const stories: CityStory[] = getStories().map((s) => {
    const p = storyPlayer(s);
    return {
      href: storyPath(s),
      headline: s.headline,
      league: s.league,
      date: s.publishedDate,
      image: storyJersey(s)?.product.image?.url,
      local: local(s.teamId) || local(p?.teamId),
    };
  });
  const articles: CityStory[] = getArticles()
    .filter((a) => local(a.teamId))
    .map((a) => {
      const p = getPlayers().find((x) => x.name === a.player);
      return { href: articlePath(a), headline: a.headline, league: a.league, date: a.publishedDate, image: p ? jerseyOf(p.id)?.image?.url : undefined, local: true };
    });
  const byDate = (a: CityStory, b: CityStory) => b.date.localeCompare(a.date);
  return [...stories, ...articles].filter((s) => s.local).sort(byDate);
}

/**
 * The jersey a city leads with (hero photo and index card): the best-ranked local player with a Lids jersey photo, or when
 * no local player is ranked, a Lids jersey from the city's first team that has one. Every city has at least one.
 */
export function cityFeatured(c: City): { player: Player; product: Product; ranked: boolean } | undefined {
  const r = cityRanked(c).find((x) => x.product?.image);
  if (r) return { player: r.player, product: r.product!, ranked: true };
  const p = cityPicks(c, new Set(), 1)[0];
  return p ? { player: p.player, product: p.product, ranked: false } : undefined;
}

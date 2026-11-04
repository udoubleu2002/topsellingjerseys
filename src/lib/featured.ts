/**
 * The homepage "Player of the week": an editor's pick read from data/featured.json. It is never presented as a sales
 * ranking. The jersey rank comes from the league's latest published report and the stats from stats.json, each with
 * its own date, so the module cannot drift from the data shown elsewhere on the site.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getLatestAppearance, getPlayer, getStatLine, getTeam, getProducts, getLeague } from "./data";

const HeroSchema = z.object({
  note: z.string().optional(),
  kicker: z.string().min(5),
  headline: z.string().min(10),
  dek: z.string().min(20),
  /** An internal link into a ranking or story. */
  cta: z.object({ label: z.string().min(3), href: z.string().regex(/^\/[a-z0-9/#?=&-]*$/) }),
  /** Whose retailer jersey photo the hero shows. It must be a ranked player with a photo, or the hero shows no photo. */
  photoPlayerId: z.string().optional(),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const FeaturedSchema = z.object({
  note: z.string().optional(),
  hero: HeroSchema.optional(),
  playerId: z.string(),
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: z.string().min(10),
  dek: z.string().min(20),
  why: z.array(z.object({ text: z.string().min(10), source: z.string().url() })).min(1).max(4),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Featured = z.infer<typeof FeaturedSchema>;

export function loadFeatured(): Featured | null {
  const f = path.join(process.cwd(), "data", "featured.json");
  if (!fs.existsSync(f)) return null;
  return FeaturedSchema.parse(JSON.parse(fs.readFileSync(f, "utf8")));
}

/** Everything the module shows, or null when the file is missing or names an unknown player. */
export function getFeatured() {
  const f = loadFeatured();
  const player = f && getPlayer(f.playerId);
  if (!f || !player) return null;
  const appearance = getLatestAppearance(player.id) ?? null;
  const team = getTeam(player.teamId ?? player.lastTeamId);
  const league = getLeague(appearance?.ranking.league ?? player.leagues[0]);
  const jerseys = getProducts(player.id).filter((p) => p.productType === "jersey");
  const product = jerseys.find((p) => p.teamId === player.teamId && p.image) ?? jerseys.find((p) => p.image) ?? jerseys[0];
  return { ...f, player, team, league, appearance, stats: getStatLine(player.id), product };
}

/** The homepage hero story: configurable copy and link, plus a real retailer photo of the named player's jersey. */
export function getHero() {
  const h = loadFeatured()?.hero;
  if (!h) return null;
  const player = h.photoPlayerId ? getPlayer(h.photoPlayerId) : undefined;
  const appearance = player ? getLatestAppearance(player.id) ?? null : null;
  const jerseys = player ? getProducts(player.id).filter((p) => p.productType === "jersey" && p.image) : [];
  const credited = appearance?.ranking.entries.find((e) => e.playerId === player?.id)?.teamIdAtReport;
  const product = jerseys.find((p) => p.teamId === credited) ?? jerseys.find((p) => p.teamId === player?.teamId) ?? jerseys[0];
  const team = getTeam(product?.teamId ?? player?.teamId ?? player?.lastTeamId);
  const league = appearance ? getLeague(appearance.ranking.league) : undefined;
  return { ...h, player, product, team, league, appearance };
}

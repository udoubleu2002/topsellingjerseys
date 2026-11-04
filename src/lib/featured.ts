/**
 * The homepage "Player of the week": an editor's pick read from data/featured.json. It is never presented as a sales
 * ranking. The jersey rank comes from the league's latest published report and the stats from stats.json, each with
 * its own date, so the module cannot drift from the data shown elsewhere on the site.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getLatestAppearance, getPlayer, getStatLine, getTeam, getProducts, getLeague } from "./data";

const FeaturedSchema = z.object({
  note: z.string().optional(),
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

import { renderOg, ogSize } from "@/lib/og";
import { getPlayers, getPlayerBySlug, getLeague, getTeam, getLatestAppearance, teamLabel } from "@/lib/data";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Player jersey ranking";
export const dynamicParams = false;
export function generateStaticParams() {
  return getPlayers().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPlayerBySlug((await params).slug)!;
  const league = getLeague(p.leagues[0])!;
  const team = getTeam(p.teamId ?? p.lastTeamId);
  const top = getLatestAppearance(p.id);
  const c = team?.colors ?? { primary: "#334155", secondary: "#ffffff", accent: "#94a3b8" };
  return renderOg({
    kicker: `Top Selling ${league.name} Jerseys`,
    title: p.name,
    sub: `${teamLabel(p)} · ${p.position}`,
    rank: top?.rank,
    tile: { bg: c.primary, fg: c.secondary, stripe: c.accent, num: p.number ?? "" },
  });
}

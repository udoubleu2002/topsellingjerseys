import { renderOg, ogSize } from "@/lib/og";
import { fmtShortDate } from "@/lib/format";
import { getLeagues, getLeagueBySlug, getCurrentRanking, getPlayer } from "@/lib/data";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Top selling jerseys ranking";
export const dynamicParams = false;
export function generateStaticParams() {
  return getLeagues().map((l) => ({ league: l.slug }));
}

export default async function Image({ params }: { params: Promise<{ league: string }> }) {
  const league = getLeagueBySlug((await params).league)!;
  const r = getCurrentRanking(league.id);
  const top = r ? r.entries.slice(0, 3).map((e) => getPlayer(e.playerId)!.name).join(" · ") : undefined;
  return renderOg({ kicker: r ? `Top ${r.entries.length} · Published ${fmtShortDate(r.publishedDate)}` : league.fullName, title: `Top Selling ${league.name} Jerseys`, sub: top });
}

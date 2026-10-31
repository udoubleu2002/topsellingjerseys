import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Freshness } from "@/components/RankingHeader";
import { getRankings, getRanking, getLeague, getPlayer, getTeam, getCurrentRanking, rankMovement, getPreviousInSeries, reportStatus, entryTeams } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return getRankings().map((r) => ({ league: r.league, id: r.id }));
}

type Props = { params: Promise<{ league: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { league: lid, id } = await params;
  const r = getRanking(id);
  const league = getLeague(lid);
  if (!r || !league) return {};
  // The current report is the same list the league page shows, so it points search engines to the league page.
  const isCurrent = getCurrentRanking(lid)?.id === r.id;
  return pageMeta({
    title: r.title,
    description: `${r.publisher} published this ${league.name} jersey sales list on ${fmtDate(r.publishedDate)}. See the source, sales period, method and all ${r.entries.length} ranked players.`,
    path: isCurrent ? `/${league.slug}/` : `/rankings/${lid}/${id}/`,
  });
}

export default async function ReportPage({ params }: Props) {
  const { league: lid, id } = await params;
  const r = getRanking(id);
  const league = getLeague(lid);
  if (!r || !league || r.league !== lid) notFound();
  const isCurrent = getCurrentRanking(lid)?.id === r.id;
  const prev = getPreviousInSeries(r);
  const status = reportStatus(r);
  return (
    <>
      <SiteHeader active={lid} />
      <main id="main" data-page-type="report" data-league={lid}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Reports", href: "/rankings/" }, { name: r.title, href: `/rankings/${lid}/${id}/` }]} />
        <header className="wrap page-head">
          <p className="eyebrow">{league.name} report · {status.label}</p>
          <h1>{r.title}</h1>
          <Freshness ranking={r} />
          {isCurrent && <p>This is the latest report, shown on <Link href={`/${league.slug}/`}>Top Selling {league.name} Jerseys</Link>.</p>}
        </header>
        <div className="wrap cols" style={{ paddingTop: 0 }}>
          <section className="block" aria-labelledby="list-h">
            <h2 id="list-h">Ranked players ({r.entries.length})</h2>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Rank</th><th>Player</th><th>Team at time of report</th>{prev && <th>Previous</th>}</tr></thead>
                <tbody>
                  {r.entries.map((e) => {
                    const p = getPlayer(e.playerId)!;
                    const m = rankMovement(r, p.id);
                    const { now } = entryTeams(e, p);
                    return (
                      <tr key={e.playerId}>
                        <td className="num" style={{ fontSize: 18, fontWeight: 700 }}>{e.rank}</td>
                        <td><Link href={`/players/${p.slug}/`}>{p.name}</Link></td>
                        <td>{getTeam(e.teamIdAtReport)?.name ?? "—"}{now && <span className="rank-now"> ({now.charAt(0).toLowerCase() + now.slice(1)})</span>}</td>
                        {prev && <td>{m?.previousRank ?? "New"}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <aside className="side">
            <section className="side-box">
              <h2>Source</h2>
              <p><a href={r.sourceUrl} target="_blank" rel="noopener">{r.publisher}</a></p>
              <p className="shop-note">Retrieved {fmtDate(r.retrievedDate)}. Last verified {fmtDate(r.lastVerified)}.</p>
            </section>
            <section className="side-box">
              <h2>Scope</h2>
              <p className="shop-note" style={{ fontSize: 14 }}>{r.scope}</p>
              {r.methodology && <p className="shop-note" style={{ fontSize: 14 }}>{r.methodology}</p>}
            </section>
            {r.limitations.length > 0 && (
              <section className="side-box">
                <h2>Limitations</h2>
                <ul className="shop-note" style={{ fontSize: 14, margin: 0, paddingLeft: 18 }}>{r.limitations.map((l) => <li key={l}>{l}</li>)}</ul>
              </section>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}

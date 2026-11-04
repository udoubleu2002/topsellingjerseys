import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { getLeagues, getRankings, getCurrentRanking, loadStore, reportStatus } from "@/lib/data";
import { fmtShortDate, period } from "@/lib/format";

export const metadata: Metadata = pageMeta({ title: "Jersey Sales Sources and Data Coverage", description: "Every jersey sales report behind Top Selling Jerseys, with publishers and dates, plus how current the player stats are for each league.", path: "/sources/" });

export default function Sources() {
  const { stats, players } = loadStore();
  return (
    <InfoPage title="Sources and Data Coverage" path="/sources/" lede="The reports behind each ranking and how current the player data is.">
      <p className="src-intro">Every ranking on this site comes from a report someone else published. This page lists each one: who published it, when, the sales period it covers, when we last checked our copy against it, and whether a newer report has replaced it.</p>
      <h2>Latest report for each league</h2>
      <div className="src-cards">
        {getLeagues().map((l) => {
          const r = getCurrentRanking(l.id);
          if (!r) return null;
          const st = reportStatus(r);
          return (
            <article key={l.id} className="src-card" style={{ "--lg": l.accent } as React.CSSProperties}>
              <p className="src-lg">{l.name}</p>
              <p className="src-status"><span className="pill is-latest">Latest published report</span>{st.dated && <span className="pill is-historical">No newer published report available</span>}</p>
              <h3><Link href={`/${l.slug}/`}>{r.title}</Link></h3>
              <dl>
                <div><dt>Publisher</dt><dd>{r.publisher}</dd></div>
                <div><dt>Published</dt><dd>{fmtShortDate(r.publishedDate)}</dd></div>
                <div><dt>Sales period</dt><dd>{period(r.periodStart, r.periodEnd, r.periodLabel)}</dd></div>
                <div><dt>Players listed</dt><dd>{r.entries.length}</dd></div>
                <div><dt>Last verified</dt><dd>{fmtShortDate(r.lastVerified)}</dd></div>
              </dl>
              <p className="src-links"><a href={r.sourceUrl} target="_blank" rel="noopener">Original report</a><Link href={`/rankings/${r.league}/${r.id}/`}>Report details</Link></p>
            </article>
          );
        })}
      </div>
      <h2>Every report on the site</h2>
      <p>Older reports stay online exactly as published. A <strong>Superseded report</strong> was replaced by a newer report in the same series; a <strong>Historical report</strong> came from a different series or method and is not compared rank by rank.</p>
      <div className="table-wrap">
        <table className="table src-table">
          <thead><tr><th>League</th><th>Report</th><th>Published</th><th>Sales period</th><th>Listed</th><th>Verified</th><th>Status</th></tr></thead>
          <tbody>
            {getRankings().map((r) => {
              const st = reportStatus(r);
              return (
                <tr key={r.id}>
                  <td>{r.league.toUpperCase()}</td>
                  <td><Link href={`/rankings/${r.league}/${r.id}/`}>{r.title}</Link><br /><span className="shop-note">{r.publisher} · <a href={r.sourceUrl} target="_blank" rel="noopener">original</a></span></td>
                  <td>{fmtShortDate(r.publishedDate)}</td>
                  <td>{period(r.periodStart, r.periodEnd, r.periodLabel)}</td>
                  <td>{r.entries.length}</td>
                  <td>{fmtShortDate(r.lastVerified)}</td>
                  <td><span className={`pill is-${st.kind}`}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <h2>Searched for and not used</h2>
      <ul>
        <li><strong>WNBA:</strong> as of November 4, 2026 we found no ranked WNBA list newer than Fanatics&apos; July 2024 report from the WNBA, the WNBPA or a named retail partner. Lists that copy the WNBA Store&apos;s &quot;best selling&quot; sort order are not published sales reports, so they are not used.</li>
        <li><strong>NHL:</strong> the league shared its 2025-26 list on social media. We cite published coverage of it and cross-checked the order against a second outlet.</li>
        <li><strong>MLS:</strong> the 2026 list (MLS Store, January 1 to October 30, 2026) replaced the 2025 season list as the latest MLS report on November 3, 2026. The 2025 list stays online as a historical report.</li>
      </ul>
      <h2>Player statistics coverage</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>League</th><th>Players</th><th>With stats</th><th>Latest through-date</th></tr></thead>
          <tbody>
            {getLeagues().map((l) => {
              const ps = players.filter((p) => p.leagues[0] === l.id);
              const withStats = ps.filter((p) => stats.some((s) => s.playerId === p.id && s.statistics.length && !s.isDemo));
              const latest = stats.filter((s) => s.league === l.id).map((s) => s.throughDate ?? "").sort().pop();
              return (
                <tr key={l.id}><td>{l.name}</td><td>{ps.length}</td><td>{withStats.length}</td><td>{fmtShortDate(latest)}</td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>Statistics are collected from league sites, team sites and established stats publishers, and each player page links its stat source. They are updated by hand, not by a live feed, so they can trail the latest game. See the <Link href="/methodology/">methodology</Link>.</p>
    </InfoPage>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLeagues, getRankings, getCurrentRanking } from "@/lib/data";
import { fmtShortDate, period } from "@/lib/format";

export const metadata: Metadata = pageMeta({ title: "Jersey Sales Report Archive", description: "Every jersey sales report on Top Selling Jerseys for the NFL, NBA, WNBA, MLB, NHL and MLS, current and archived, with publication dates and sales periods.", path: "/rankings/" });

export default function Archive() {
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="archive">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Reports", href: "/rankings/" }]} />
        <header className="wrap page-head">
          <h1>Top Selling Jerseys Report Archive</h1>
          <p className="lede">Every report we have imported, kept as a dated snapshot. Current reports power the league pages; older reports stay here so rankings can be compared over time.</p>
        </header>
        <div className="wrap">
          {getLeagues().map((l) => {
            const current = getCurrentRanking(l.id);
            return (
              <section className="block" key={l.id} aria-labelledby={`a-${l.id}`}>
                <h2 id={`a-${l.id}`}>{l.name}</h2>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Report</th><th>Published</th><th>Sales period</th><th>Players</th><th>Status</th></tr></thead>
                    <tbody>
                      {getRankings(l.id).map((r) => (
                        <tr key={r.id}>
                          <td><Link href={`/rankings/${l.id}/${r.id}/`}>{r.title}</Link><br /><span className="shop-note">{r.publisher}</span></td>
                          <td>{fmtShortDate(r.publishedDate)}</td>
                          <td>{period(r.periodStart, r.periodEnd, r.periodLabel)}</td>
                          <td>{r.entries.length}</td>
                          <td>{r.id === current?.id ? <Link href={`/${l.slug}/`}>Current</Link> : "Archived"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}

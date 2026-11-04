import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Movement } from "@/components/Movement";
import { getTrends, topRisers, newEntries } from "@/lib/trending";
import { getPlayer } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Trending Jerseys: Biggest Risers and New Entries",
  description: "Which players' jerseys climbed the most, and which are new, between each league's two most recent comparable sales lists. Only real rank changes from published reports.",
  path: "/trending/",
});

export default function TrendingPage() {
  const { compared, uncompared } = getTrends();
  const risers = topRisers(10);
  const fresh = newEntries(10);
  return (
    <>
      <SiteHeader active="trending" />
      <main id="main" data-page-type="trending">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Trending", href: "/trending/" }]} />
        <header className="gd-band">
          <div className="wrap">
            <p className="gd-kicker">Who&apos;s trending</p>
            <h1 className="gd-band-h">Trending jerseys: biggest risers and new entries</h1>
            <p className="gd-band-dek">Rank changes between two lists from the same publisher, using the same method, so the comparison is fair. We don&apos;t estimate movement for leagues that have only one comparable list.</p>
          </div>
        </header>
        <section className="wrap section" aria-labelledby="all-h">
          <div className="sec-head"><h2 id="all-h" className="sec-h">Across every league</h2></div>
          <div className="trend-grid is-light">
            <div className="trend-box is-hot">
              <h3>Biggest risers</h3>
              <ol>{risers.map((r) => { const p = getPlayer(r.playerId)!; return <li key={r.league.id + p.id}><span className="tr-lg" style={{ "--lg": r.league.accent } as React.CSSProperties}>{r.league.name}</span><Link href={`/players/${p.slug}/`}>{p.name}</Link><span className="tr-mv"><s>{r.previousRank}</s> → <b>{r.rank}</b> <em className="up">▲{r.delta}</em></span></li>; })}</ol>
            </div>
            <div className="trend-box">
              <h3>New to the lists</h3>
              <ol>{fresh.map((r) => { const p = getPlayer(r.playerId)!; return <li key={r.league.id + p.id}><span className="tr-lg" style={{ "--lg": r.league.accent } as React.CSSProperties}>{r.league.name}</span><Link href={`/players/${p.slug}/`}>{p.name}</Link><span className="tr-mv"><b>No. {r.rank}</b> <em className="new">New</em></span></li>; })}</ol>
            </div>
          </div>
        </section>
        {compared.map(({ league, ranking }) => <Movement key={league.id} ranking={ranking} leagueName={league.name} id={`mv-${league.id}`} />)}
        {uncompared.length > 0 && (
          <section className="wrap section" aria-labelledby="nc-h">
            <div className="sec-head"><h2 id="nc-h" className="sec-h">No comparison yet</h2></div>
            <ul className="nocomp">
              {uncompared.map(({ league, ranking }) => (
                <li key={league.id}>
                  <b>{league.name}</b>: the latest list is <Link href={`/${league.slug}/`}>{ranking.title}</Link> ({fmtShortDate(ranking.publishedDate)}). There is no earlier list from the same publisher using the same method, so we show no rank changes.
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

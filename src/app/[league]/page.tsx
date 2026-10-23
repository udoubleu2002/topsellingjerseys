import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RankingCard } from "@/components/RankingCard";
import { Freshness, SourceLine, ReportNotes, AffiliateNote } from "@/components/RankingHeader";
import { Faq } from "@/components/Faq";
import { DealsBar } from "@/components/Deals";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getLeagueBySlug, getCurrentRanking, getRankings, getPlayer, commonStatsThrough } from "@/lib/data";
import { leagueCopy } from "@/lib/content";
import { abs } from "@/lib/config";
import { fmtDate, period } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return getLeagues().map((l) => ({ league: l.slug }));
}

type Props = { params: Promise<{ league: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = getLeagueBySlug((await params).league);
  if (!league) return {};
  const ranking = getCurrentRanking(league.id);
  const year = ranking ? (ranking.periodEnd ?? ranking.publishedDate).slice(0, 4) : "";
  const title = ranking ? `Top Selling ${league.name} Jerseys ${year}: Top ${ranking.entries.length} Best-Sellers` : `Top Selling ${league.name} Jerseys`;
  return pageMeta({ title, description: leagueCopy[league.id]?.meta ?? title, path: `/${league.slug}/`, image: `/${league.slug}/opengraph-image/` });
}

export default async function LeaguePage({ params }: Props) {
  const league = getLeagueBySlug((await params).league);
  if (!league) notFound();
  const ranking = getCurrentRanking(league.id);
  const copy = leagueCopy[league.id];
  const pageId = `league_${league.id}`;
  const archive = getRankings(league.id).filter((r) => r.id !== ranking?.id);
  const others = getLeagues().filter((l) => l.id !== league.id);

  const leader = ranking ? getPlayer(ranking.entries[0].playerId) : undefined;
  const faq = [
    ...(ranking && leader
      ? [{ q: `Who has the top-selling ${league.name} jersey?`, a: `${leader.name} ranked No. 1 in "${ranking.title}," published by ${ranking.publisher} on ${fmtDate(ranking.publishedDate)}, covering ${period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel)}.` }]
      : []),
    ...(copy?.faq ?? []),
    { q: "Do you earn money from the shopping links?", a: "Some links are affiliate links, so we may earn a commission when you buy. Commissions never affect the order of a ranking, which always matches the published report." },
  ];

  const itemList = ranking && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top Selling ${league.name} Jerseys`,
    numberOfItems: ranking.entries.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: ranking.entries.map((e) => {
      const p = getPlayer(e.playerId)!;
      return { "@type": "ListItem", position: e.rank, name: p.name, url: abs(`/players/${p.slug}/`) };
    }),
  };

  return (
    <>
      <SiteHeader active={league.id} />
      <main id="main" data-page-type="league" data-league={league.id}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: `Top Selling ${league.name} Jerseys`, href: `/${league.slug}/` }]} />
        <DealsBar league={league.id} page={pageId} />
        <header className="wrap page-head">
          <h1>Top Selling {league.name} Jerseys</h1>
          {copy && <p className="lede">{copy.intro}</p>}
          {ranking ? (
            <>
              <Freshness ranking={ranking} statsThrough={commonStatsThrough(ranking)} />
              <SourceLine ranking={ranking} />
              <ReportNotes ranking={ranking} />
              <AffiliateNote />
            </>
          ) : (
            <p className="notice">No verified {league.name} report is published yet.</p>
          )}
        </header>

        {ranking && (
          <section className="wrap" aria-label={`Ranked players, ${ranking.periodLabel}`}>
            <ol className="ranking">
              {ranking.entries.map((e) => (
                <RankingCard key={e.playerId} ranking={ranking} rank={e.rank} playerId={e.playerId} leagueName={league.name} page={pageId} />
              ))}
            </ol>
          </section>
        )}

        <section className="wrap section" aria-labelledby="about-h">
          <div className="section-head"><h2 id="about-h">About this ranking</h2></div>
          {ranking && (
            <div className="prose">
              <p><strong>Scope.</strong> {ranking.scope}</p>
              {ranking.methodology && <p><strong>Method.</strong> {ranking.methodology}</p>}
              <p>
                Players appear in the exact order of the published report. Stats come from separate sources, each with its own date, and are
                shown under every player. Read our <Link href="/methodology/">ranking methodology</Link> and{" "}
                <Link href="/sources/">sources and data coverage</Link>.
              </p>
              {archive.length > 0 && (
                <p>Earlier {league.name} reports: {archive.map((r, i) => <span key={r.id}>{i > 0 && ", "}<Link href={`/rankings/${league.id}/${r.id}/`}>{r.periodLabel}</Link></span>)}.</p>
              )}
            </div>
          )}
        </section>

        <section className="wrap section" aria-labelledby="faq-h">
          <div className="section-head"><h2 id="faq-h">{league.name} jersey sales FAQ</h2></div>
          <Faq items={faq} />
        </section>

        <section className="wrap section" aria-labelledby="rel-h">
          <div className="section-head"><h2 id="rel-h">More jersey rankings</h2></div>
          <nav className="related" aria-labelledby="rel-h">
            {others.map((l) => <Link key={l.id} href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link>)}
            <Link href="/rankings/">Report archive</Link>
          </nav>
          <div style={{ marginTop: 20 }}><AffiliateNote /></div>
        </section>
        {itemList && <JsonLd data={itemList} />}
      </main>
    </>
  );
}

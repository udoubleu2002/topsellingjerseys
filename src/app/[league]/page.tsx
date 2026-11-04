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
import { SideRail } from "@/components/SideRail";
import { TeamRosters } from "@/components/TeamRosters";
import { Movement } from "@/components/Movement";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getLeagueBySlug, getCurrentRanking, getRankings, getPlayer, getTeam, getAnyTeam, getProducts, entryTeams, commonStatsThrough } from "@/lib/data";
import { JerseyArt, rankedJersey } from "@/components/HomeBits";
import { ShopButton } from "@/components/ShopButton";
import { RankFilter } from "@/components/RankFilter";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { getCities, cityPath } from "@/lib/cities";
import { leagueCopy } from "@/lib/content";
import { abs } from "@/lib/config";
import { fmtDate, fmtShortDate, period } from "@/lib/format";

export const dynamicParams = false;
export function generateStaticParams() {
  return getLeagues().map((l) => ({ league: l.slug }));
}

type Props = { params: Promise<{ league: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const league = getLeagueBySlug((await params).league);
  if (!league) return {};
  const ranking = getCurrentRanking(league.id);
  const copy = leagueCopy[league.id];
  const title = ranking && copy ? copy.title(ranking) : `Top Selling ${league.name} Jerseys`;
  return pageMeta({ title, description: copy?.meta ?? title, path: `/${league.slug}/`, image: `/${league.slug}/opengraph-image/` });
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
  const lead = ranking && leader ? entryTeams(ranking.entries[0], leader) : undefined;
  const leadTeam = lead?.reportTeam;
  const leadNumber = lead?.number;
  const leadNow = lead?.now;
  const leadProduct = leader ? rankedJersey(leader, ranking!.entries[0].teamIdAtReport) : undefined;
  const leadJersey = leader ? getProducts(leader.id).find((x) => x.productType === "jersey") : undefined;
  const leadOffer = leader ? (leadJersey ? productOffer(leadJersey) : searchOffer(leader, getTeam(leader.teamId ?? leader.lastTeamId))) : null;
  const filterTeams = ranking
    ? [...new Map(ranking.entries.map((e) => [e.teamIdAtReport, getTeam(e.teamIdAtReport)?.name])).entries()]
        .filter((x): x is [string, string] => !!x[0] && !!x[1])
        .map(([id, name]) => ({ id, name, count: ranking.entries.filter((e) => e.teamIdAtReport === id).length }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const cities = getCities().filter((c) => c.teams.some((t) => getAnyTeam(t)?.league === league.id));
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
        <header className="lg-hero" style={{ "--lg": league.accent, "--tc": leadTeam?.colors.primary ?? league.accent } as React.CSSProperties}>
          <div className="wrap lg-hero-in">
            <div className="lg-hero-copy">
              <p className="gd-kicker">{league.fullName} · {league.sport}</p>
              <h1>Top Selling {league.name} Jerseys</h1>
              {copy && <p className="lede">{copy.intro}</p>}
              {ranking && (
                <p className="lg-hero-meta">
                  <span>{ranking.publisher}</span>
                  <span>Published {fmtShortDate(ranking.publishedDate)}</span>
                  <span>Updated {fmtShortDate(ranking.lastVerified)}</span>
                </p>
              )}
            </div>
            {ranking && leader && (
              <div className="lg-lead">
                <span className="lg-lead-no" aria-hidden="true">1</span>
                <JerseyArt player={leader} team={leadTeam} product={leadProduct} number={leadNumber} w={320} priority />
                <div className="lg-lead-body">
                  <p className="lg-lead-k">No. 1 {league.name} jersey</p>
                  <p className="lg-lead-name"><Link href={`/players/${leader.slug}/`}>{leader.name}</Link></p>
                  <p className="lg-lead-team">{leadTeam?.name ?? leader.status}{leadNow && <span> · {leadNow}</span>}</p>
                  {leadOffer && (
                    <ShopButton offer={leadOffer} variant="small" ctx={{ league: league.id, playerId: leader.id, rank: 1, placement: "league_hero", page: pageId }}>
                      Shop this jersey
                    </ShopButton>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="wrap page-head league-head lg-facts">
          {ranking ? (
            <>
              <Freshness ranking={ranking} statsThrough={commonStatsThrough(ranking)} />
              <div className="head-meta">
                <SourceLine ranking={ranking} />
                <ReportNotes ranking={ranking} />
                <AffiliateNote />
              </div>
            </>
          ) : (
            <p className="notice">No verified {league.name} report is published yet.</p>
          )}
        </div>
        <DealsBar league={league.id} page={pageId} />

        <div className="wrap with-rail">
        <div className="rail-main">
        {ranking && (
          <section className="wrap" aria-labelledby="list-h">
            <h2 id="list-h" className="list-h">{copy ? `${copy.keyword[0].toUpperCase()}${copy.keyword.slice(1)}: the top ${ranking.entries.length}` : `${league.name} jersey sales rankings: top ${ranking.entries.length}`}</h2>
            <RankFilter listId="league-list" teams={filterTeams} />
            <ol className="ranking" id="league-list">
              {ranking.entries.map((e) => (
                <RankingCard key={e.playerId} ranking={ranking} rank={e.rank} playerId={e.playerId} leagueName={league.name} page={pageId} />
              ))}
            </ol>
          </section>
        )}

        {ranking && <Movement ranking={ranking} leagueName={league.name} />}

        <TeamRosters league={league} />

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
            <Link href="/trending/">Trending jerseys</Link>
            <Link href="/shop/">Shop the top sellers</Link>
          </nav>
          {cities.length > 0 && (
            <>
              <h3 className="rel-sub">{league.name} cities</h3>
              <nav className="related" aria-label={`Cities with ${league.name} teams`}>
                {cities.map((c) => <Link key={c.slug} href={cityPath(c)}>{c.name}</Link>)}
              </nav>
            </>
          )}
          <div style={{ marginTop: 20 }}><AffiliateNote /></div>
        </section>
        </div>
        <SideRail active={league.id} />
        </div>
        {itemList && <JsonLd data={itemList} />}
      </main>
    </>
  );
}

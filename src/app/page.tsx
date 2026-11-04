import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { LeaderCard, FeaturedPlayer, LeagueTopFive, HeroStory, TrendingNow } from "@/components/HomeBits";
import { AffiliateNote } from "@/components/RankingHeader";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getCurrentRanking, getRankings, reportStatus } from "@/lib/data";
import { getCity, cityPath, cityRanked, cityLeagues, getCities, cityArt } from "@/lib/cities";
import { getStories, storyPath } from "@/lib/stories";
import { fmtShortDate } from "@/lib/format";
import { TeamShopDirectory } from "@/components/ShopBits";
import { DealsBar } from "@/components/Deals";
import { SideRail } from "@/components/SideRail";
import { site, abs } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Top Selling Sports Jerseys: NFL, NBA, MLB, NHL, WNBA & MLS", description: "The top selling sports jerseys in the NFL, NBA, WNBA, MLB, NHL and MLS: the best sellers on each league's latest published sales list, with sources and dates.", path: "/", shareTitle: "Best-Selling Jerseys Across Six Leagues", shareText: "See the best-selling jerseys in the NFL, NBA, WNBA, MLB, NHL and MLS, ranked from the published sales lists, with stats and links to shop." });

export default function Home() {
  const leagues = getLeagues().map((l) => ({ league: l, ranking: getCurrentRanking(l.id) })).filter((x) => x.ranking);
  const reports = getRankings();
  const newest = reports[0];
  const newestLeague = getLeagues().find((l) => l.id === newest?.league);
  const ranked = new Set(leagues.flatMap(({ ranking }) => ranking!.entries.map((e) => e.playerId))).size;
  const verified = leagues.map(({ ranking }) => ranking!.lastVerified).sort().pop();
  const cities = ["new-york", "los-angeles", "chicago", "dallas", "boston", "bay-area", "philadelphia", "washington-dc"].map(getCity).filter((c) => !!c);
  const stories = getStories().slice(0, 5);
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: abs("/"),
    potentialAction: { "@type": "SearchAction", target: `${abs("/search/")}?q={query}`, "query-input": "required name=query" },
  };

  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="home">
        <HeroStory leagues={leagues.map(({ league, ranking }) => ({ league, ranking: ranking! }))} />
        <div className="gd-trust">
          <div className="wrap gd-trust-in">
            <span><b>{leagues.length}</b> leagues</span>
            <span><b>{ranked}</b> ranked players</span>
            <span><b>{reports.length}</b> published reports</span>
            <span>Lists verified <b>{fmtShortDate(verified)}</b></span>
            {newest && newestLeague && <span className="gd-trust-new">Newest: <Link href={`/${newestLeague.slug}/`}>{newest.title}</Link>, {fmtShortDate(newest.publishedDate)}</span>}
          </div>
        </div>

        <section className="wrap leaders-sec" aria-labelledby="leaders-h">
          <div className="sec-head">
            <p className="sec-k">The No. 1 jersey in each league</p>
            <h2 id="leaders-h" className="sec-h">League leaders</h2>
          </div>
          <div className="leaders">
            {leagues.map(({ league, ranking }, i) => <LeaderCard key={league.id} league={league} ranking={ranking!} priority={i < 3} />)}
          </div>
        </section>

        <section className="cities-sec" aria-labelledby="cities-h">
          <div className="wrap">
            <div className="sec-head on-dark">
              <p className="sec-k">Which cities are represented</p>
              <h2 id="cities-h" className="sec-h">Explore jerseys by city</h2>
              <Link className="sec-more" href="/cities/">All {getCities().length} cities →</Link>
            </div>
            <div className="citycards">
              {cities.map((c) => {
                const rows = cityRanked(c);
                return (
                  <Link key={c.slug} className="citycard has-art" href={cityPath(c)}>
                    <img className="citycard-art" src={cityArt(c).src} alt={cityArt(c).alt} width={1600} height={1000} loading="lazy" decoding="async" />
                    <span className="citycard-name">{c.name}</span>
                    <span className="citycard-meta">{c.teams.length} teams · {rows.length} ranked {rows.length === 1 ? "player" : "players"}</span>
                    <span className="citycard-lgs">{cityLeagues(c).map((l) => <span key={l.id} style={{ "--lg": l.accent } as React.CSSProperties}>{l.name}</span>)}</span>
                    {rows[0] && <span className="citycard-top">Top seller: {rows[0].player.name}, No. {rows[0].rank} {rows[0].ranking.league.toUpperCase()}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <TrendingNow />

        <FeaturedPlayer />

        <DealsBar page="home" />
        <div className="wrap with-rail home-main">
          <div className="lists">
            <div className="sec-head">
              <p className="sec-k">Top five in every league, in published order</p>
              <h2 className="sec-h">Player rankings</h2>
            </div>
            {leagues.map(({ league, ranking }) => <LeagueTopFive key={league.id} league={league} ranking={ranking!} />)}
          </div>
          <SideRail hideStories />
        </div>

        <section className="wrap section" aria-labelledby="news-h">
          <div className="sec-head">
            <p className="sec-k">What&apos;s trending in sports merchandise</p>
            <h2 id="news-h" className="sec-h">Latest jersey news and reports</h2>
            <Link className="sec-more" href="/news/">All jersey news →</Link>
          </div>
          <div className="newsgrid">
            <div className="news-stories">
              {stories.map((st, i) => (
                <article key={st.slug} className={`nstory${i === 0 ? " is-lead" : ""}`}>
                  <p className="nstory-k">{st.league.toUpperCase()} · {fmtShortDate(st.publishedDate)}</p>
                  <h3><Link href={storyPath(st)}>{st.headline}</Link></h3>
                  {i === 0 && <p className="nstory-d">{st.description}</p>}
                </article>
              ))}
            </div>
            <div className="news-reports">
              <h3 className="news-reports-h">Report timeline</h3>
              <ol>
                {reports.slice(0, 7).map((r) => {
                  const st = reportStatus(r);
                  return (
                    <li key={r.id}>
                      <span className="nr-date">{fmtShortDate(r.publishedDate)}</span>
                      <Link href={`/rankings/${r.league}/${r.id}/`}>{r.title}</Link>
                      <span className={`pill is-${st.kind}`}>{st.label}</span>
                    </li>
                  );
                })}
              </ol>
              <Link className="sec-more" href="/rankings/">Full report archive →</Link>
            </div>
          </div>
        </section>

        <section className="wrap section" id="shop" aria-labelledby="teams-h">
          <div className="sec-head">
            <p className="sec-k">Where to buy these jerseys</p>
            <h2 id="teams-h" className="sec-h">Shop by team</h2>
          </div>
          <p className="teams-note">Every team in every league. Each link opens that team&apos;s jersey shop at the retailer.</p>
          <TeamShopDirectory placement="home_team_directory" page="home" />
          <div style={{ marginTop: 18 }}><AffiliateNote /></div>
        </section>

        <section className="wrap section" aria-labelledby="how-h">
          <div className="sec-head">
            <p className="sec-k">Why you can trust these lists</p>
            <h2 id="how-h" className="sec-h">How these rankings work</h2>
            <Link className="sec-more" href="/methodology/">Full methodology →</Link>
          </div>
          <div className="explainer">
            <div>
              <h3>Published lists only</h3>
              <p>Each ranking comes from a report released by a league, a players association or a named retail partner. We never build our own order or fill gaps.</p>
            </div>
            <div>
              <h3>Dated and sourced</h3>
              <p>Every list shows when it was published, which sales period it covers and when we last checked it. Player stats carry their own through-date. See every report on the <Link href="/sources/">sources page</Link>.</p>
            </div>
            <div>
              <h3>Shopping stays separate</h3>
              <p>Each player has a shopping link to an official retailer. Some links earn us a commission, which never changes the order of a ranking.</p>
            </div>
          </div>
          <div style={{ marginTop: 24 }}><AffiliateNote /></div>
        </section>
        <JsonLd data={ld} />
      </main>
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { LeagueList } from "@/components/LeagueList";
import { AffiliateNote } from "@/components/RankingHeader";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getCurrentRanking, getTeamDirectory, getPlayer, getTeam } from "@/lib/data";
import { teamOffer, outPath } from "@/lib/affiliate";
import { DealsBar } from "@/components/Deals";
import { site, abs } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Top Selling Jerseys: NFL, NBA, WNBA, MLB, NHL & MLS Rankings", description: "The latest published top-selling jersey lists for the NFL, NBA, WNBA, MLB, NHL and MLS, in published order, with player stats, sources and links to shop each jersey.", path: "/", shareTitle: "Top Selling Jerseys: Updated lists for NFL, NBA, WNBA, MLB, NHL and MLS", shareText: "See the best-selling jerseys in the NFL, NBA, WNBA, MLB, NHL and MLS, ranked from the published sales lists, with stats and links to shop." });

export default function Home() {
  const leagues = getLeagues().map((l) => ({ league: l, ranking: getCurrentRanking(l.id) })).filter((x) => x.ranking);
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
        <section className="hero hero-top">
          <div className="wrap hero-in">
            <div className="hero-head">
              <h1>Top selling jerseys in every league</h1>
              <p>The No. 1 seller on each league&apos;s latest published list. Tap a league to see its full ranking.</p>
            </div>
            <nav className="top1" aria-label="No. 1 jersey in each league">
              {leagues.map(({ league, ranking }) => {
                const first = ranking!.entries[0];
                const p = getPlayer(first.playerId)!;
                const team = getTeam(p.teamId ?? p.lastTeamId);
                return (
                  <a key={league.id} href={`#${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
                    <span className="top1-lg">{league.name} · No. 1</span>
                    <span className="top1-name">{p.name}</span>
                    <span className="top1-team">{team?.name ?? p.status}</span>
                    <span className="top1-more">See top {ranking!.entries.length} →</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </section>

        <DealsBar page="home" />
        <div className="wrap lists">
          {leagues.map(({ league, ranking }) => <LeagueList key={league.id} league={league} ranking={ranking!} />)}
        </div>

        <section className="wrap section" aria-labelledby="teams-h">
          <div className="section-head">
            <h2 id="teams-h">Shop by team</h2>
          </div>
          <p className="teams-note">Every team in every league. Each link opens that team&apos;s jersey shop at the retailer.</p>
          <div className="team-dir">
            {getLeagues().map((league) => {
              const teams = getTeamDirectory(league.id);
              return teams.length > 0 && (
                <details className="team-league" key={league.id} style={{ ["--lg" as string]: league.accent }}>
                  <summary><span>{league.name}</span><span className="team-count">{teams.length} teams</span></summary>
                  <ul>
                    {teams.map((t) => {
                      const o = teamOffer(t);
                      return o && (
                        <li key={t.id}>
                          <a href={outPath(o.id)} target="_blank" rel="sponsored nofollow noopener" data-track="affiliate_click" data-offer={o.id} data-offer-kind="team" data-merchant={o.merchantId} data-league={league.id} data-placement="home_team_directory" data-page="home">
                            {t.name}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
          </div>
          <div style={{ marginTop: 18 }}><AffiliateNote /></div>
        </section>

        <section className="wrap section" aria-labelledby="how-h">
          <div className="section-head">
            <h2 id="how-h">How these rankings work</h2>
            <Link href="/methodology/">Full methodology</Link>
          </div>
          <div className="explainer">
            <div>
              <h3>Published lists only</h3>
              <p>Each ranking comes from a report released by a league, a players association or a named retail partner. We never build our own order or fill gaps.</p>
            </div>
            <div>
              <h3>Dated and sourced</h3>
              <p>Every list shows when it was published, which sales period it covers and when we last checked it. Player stats carry their own through-date.</p>
            </div>
            <div>
              <h3>Easy to shop</h3>
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

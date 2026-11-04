import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateNote } from "@/components/RankingHeader";
import { ShopCard, TeamShopDirectory } from "@/components/ShopBits";
import { DealsBar } from "@/components/Deals";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getCurrentRanking } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";
import { abs } from "@/lib/config";

export const metadata: Metadata = pageMeta({
  title: "Shop the Top Selling Jerseys in Every League",
  description: "Shop the best-selling NFL, NBA, WNBA, MLB, NHL and MLS jerseys from each league's latest published sales list, plus every team's jersey shop at an official retailer.",
  path: "/shop/",
});

export default function ShopPage() {
  const leagues = getLeagues().map((league) => ({ league, ranking: getCurrentRanking(league.id) })).filter((x) => x.ranking);
  const crumbs = [{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }];
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Shop the top selling jerseys", url: abs("/shop/") };
  return (
    <>
      <SiteHeader active="shop" />
      <main id="main" data-page-type="shop">
        <Breadcrumbs items={crumbs} />
        <header className="gd-band">
          <div className="wrap">
            <p className="gd-kicker">Where to buy</p>
            <h1 className="gd-band-h">Shop the top selling jerseys</h1>
            <p className="gd-band-dek">The best sellers from each league&apos;s latest published list, with the retailer&apos;s own product photos. Prices show only when we have checked them, and nothing here claims a jersey is in stock.</p>
            <nav className="gd-chips" aria-label="Jump to a league">
              {leagues.map(({ league }) => <a key={league.id} href={`#shop-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>{league.name}</a>)}
              <a href="#by-team">By team</a>
            </nav>
          </div>
        </header>
        <DealsBar page="shop" />
        <div className="wrap" style={{ marginTop: 18 }}><AffiliateNote /></div>
        {leagues.map(({ league, ranking }) => (
          <section key={league.id} id={`shop-${league.id}`} className="wrap section shop-sec" aria-labelledby={`sh-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
            <div className="sec-head">
              <p className="sec-k">{ranking!.title} · published {fmtShortDate(ranking!.publishedDate)}</p>
              <h2 id={`sh-${league.id}`} className="sec-h">Top {league.name} jerseys</h2>
              <Link className="sec-more" href={`/${league.slug}/`}>Full {league.name} ranking →</Link>
            </div>
            <ol className="shopcards">
              {ranking!.entries.slice(0, 5).map((e) => <ShopCard key={e.playerId} league={league} ranking={ranking!} rank={e.rank} page="shop" placement="shop_card" />)}
            </ol>
          </section>
        ))}
        <section className="wrap section" id="by-team" aria-labelledby="bt-h">
          <div className="sec-head">
            <p className="sec-k">Every team in every league</p>
            <h2 id="bt-h" className="sec-h">Explore the team collections</h2>
          </div>
          <TeamShopDirectory placement="shop_team_directory" page="shop" />
          <div style={{ marginTop: 18 }}><AffiliateNote /></div>
        </section>
        <JsonLd data={ld} />
      </main>
    </>
  );
}

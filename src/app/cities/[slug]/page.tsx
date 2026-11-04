import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SideRail } from "@/components/SideRail";
import { ShopButton } from "@/components/ShopButton";
import { AffiliateNote } from "@/components/RankingHeader";
import { JsonLd } from "@/components/JsonLd";
import { CityList, CityPicks, CityStories, PlayerBanner } from "@/components/CityBits";
import { getCities, getCity, cityLeagues, cityPath, cityPicks, cityRanked, cityStories, cityTeams, cityFeatured } from "@/lib/cities";
import { teamOffer } from "@/lib/affiliate";
import { leagueList } from "@/lib/bestSelling";
import { abs } from "@/lib/config";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCities().map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const OVERALL = 10;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).slug);
  if (!city) return {};
  const ranked = cityRanked(city);
  const leagues = cityLeagues(city).map((l) => l.name);
  const lead = ranked.slice(0, 3).map((r) => r.player.name);
  return pageMeta({
    title: `Top Selling ${city.name} Jerseys`,
    description: `The best-selling ${city.name} jerseys across the ${leagueList(leagues)}${lead.length ? `, led by ${leagueList(lead)}` : ""}. Lists by sport from the latest sales reports, with where to buy at Lids.`,
    path: cityPath(city),
  });
}

export default async function CityPage({ params }: Props) {
  const city = getCity((await params).slug);
  if (!city) notFound();
  const page = `city_${city.slug}`;
  const teams = cityTeams(city);
  const leagues = cityLeagues(city);
  const ranked = cityRanked(city);
  const overall = ranked.slice(0, OVERALL);
  const lead = cityFeatured(city);
  const rankedIds = new Set(ranked.map((r) => r.player.id));
  const others = getCities().filter((c) => c.slug !== city.slug);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top Selling ${city.name} Jerseys`,
    numberOfItems: overall.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: overall.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.player.name, url: abs(`/players/${r.player.slug}/`) })),
  };

  return (
    <>
      <SiteHeader active="cities" />
      <main id="main" data-page-type="city" data-city={city.slug}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cities", href: "/cities/" }, { name: city.name, href: cityPath(city) }]} />
        <header className="city-hero">
          <div className="wrap city-hero-in">
            <div className="city-hero-text">
              <p className="eyebrow">{city.area ?? `${city.name}, ${city.region}`}{city.country === "CA" ? " · Canada" : ""}</p>
              <h1>Top Selling <span>{city.name}</span> Jerseys</h1>
              <p className="lede">
                The most popular jerseys in {city.name}, from the latest published jersey sales lists for the {leagueList(leagues.map((l) => l.name))}.
                First the city&apos;s top {overall.length > 1 ? overall.length : ""} overall, then a list for each sport.
              </p>
              <dl className="city-stats">
                <div><dt>Teams</dt><dd>{teams.length}</dd></div>
                <div><dt>Leagues</dt><dd>{leagues.length}</dd></div>
                {ranked.length > 0 && <div><dt>On the sales lists</dt><dd>{ranked.length}</dd></div>}
              </dl>
              <nav className="city-jump" aria-label="Jump to a sport">
                <a href="#overall">Overall</a>
                {leagues.map((l) => <a key={l.id} href={`#${l.id}`}>{l.name}</a>)}
              </nav>
            </div>
            {lead?.product.image && (
              <Link href={`/players/${lead.player.slug}/`} className="city-hero-lead">
                <img src={lead.product.image.url} alt={lead.product.image.alt} width={320} height={320} />
                <span><small>{lead.ranked && lead.player.id === ranked[0]?.player.id ? `No. 1 in ${city.name}` : `${city.name} favorite`}</small>{lead.player.name}</span>
              </Link>
            )}
          </div>
        </header>
        <div className="wrap city-note"><AffiliateNote /></div>

        <div className="wrap with-rail">
          <div className="rail-main">

            <section className="section city-sec" id="overall" aria-labelledby="overall-h">
              <div className="section-head"><h2 id="overall-h">Top {city.name} jerseys overall</h2></div>
              {overall.length > 0 ? (
                <>
                  <p className="shop-note">Ordered by each player&apos;s place on his or her league&apos;s latest sales list, so a No. 1 in any league comes first.</p>
                  <CityList rows={overall} page={page} at="city_overall" showLeague />
                </>
              ) : (
                <>
                  <p className="shop-note">No {city.name} players are on the latest published sales lists yet, so here is a Lids jersey for each team.</p>
                  <CityPicks picks={cityPicks(city, new Set(), 8)} page={page} at="city_overall_picks" />
                </>
              )}
            </section>

            {leagues.map((l, i) => {
              const rows = ranked.filter((r) => r.ranking.league === l.id);
              const lTeams = teams.filter((t) => t.league === l.id);
              const more = cityPicks(city, rankedIds, rows.length ? 4 : 9, l.id);
              const star = rows[0] ?? more[0];
              return (
                <div key={l.id}>
                  <section className="section city-sec" id={l.id} aria-labelledby={`${l.id}-h`}>
                    <div className="section-head">
                      <h2 id={`${l.id}-h`}>{city.name} {l.name} jerseys</h2>
                      <Link href={`/${l.slug}/`}>Full {l.name} list →</Link>
                    </div>
                    {star && <PlayerBanner row={star} league={l} cityName={city.name} page={page} />}
                    {rows.length > 0 ? (
                      <CityList rows={rows} page={page} at={`city_${l.id}`} />
                    ) : (
                      <p className="shop-note">No {lTeams.map((t) => t.name).join(" or ")} players are on the latest {l.name} sales list, so here are their jerseys at Lids.</p>
                    )}
                    {(rows.length ? more : more.filter((m) => m !== star)).length > 0 && (
                      <>
                        {rows.length > 0 && <h3 className="city-more-h">More {city.name} {l.name} jerseys at Lids</h3>}
                        <CityPicks picks={rows.length ? more : more.filter((m) => m !== star)} page={page} at={`city_picks_${l.id}`} />
                      </>
                    )}
                    <div className="city-teams">
                      {lTeams.map((t) => {
                        const o = teamOffer(t);
                        return o ? <ShopButton key={t.id} offer={o} variant="ghost" ctx={{ league: l.id, playerId: "", placement: `city_team_${l.id}`, page }}>Shop all {t.name} at Lids</ShopButton> : null;
                      })}
                    </div>
                  </section>
                </div>
              );
            })}


            <section className="section" aria-labelledby="more-h">
              <div className="section-head"><h2 id="more-h">More sports cities</h2><Link href="/cities/">All cities →</Link></div>
              <nav className="related" aria-labelledby="more-h">
                {others.map((c) => <Link key={c.slug} href={cityPath(c)}>{c.name}</Link>)}
              </nav>
            </section>
          </div>
          <SideRail lead={<CityStories cityName={city.name} stories={cityStories(city)} />} hideStories hideNews cityAds />
        </div>
        {overall.length > 0 && <JsonLd data={ld} />}
      </main>
    </>
  );
}

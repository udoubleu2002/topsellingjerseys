import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SideRail } from "@/components/SideRail";
import { AffiliateNote } from "@/components/RankingHeader";
import { JsonLd } from "@/components/JsonLd";
import { CityList, CityPicks, CityPodium, CityStories, PlayerBanner } from "@/components/CityBits";
import { CityArt, CityCard } from "@/components/CityCards";
import { getCurrentRanking } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";
import { getCities, getCity, cityLeagues, cityPath, cityPicks, cityRanked, cityStories, cityTeams, cityFeatured, cityIntro, nearbyCities, teamNickname } from "@/lib/cities";
import { teamOffer, outPath } from "@/lib/affiliate";
import { leagueList } from "@/lib/bestSelling";
import { abs } from "@/lib/config";
import { jerseyImg } from "@/lib/img";
import "../../cities.css";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCities().map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

const OVERALL = 10;
const VIBE: Record<string, string> = { nfl: "On the gridiron", nba: "On the hardwood", wnba: "On the hardwood", mlb: "On the diamond", nhl: "On the ice", mls: "On the pitch" };

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
      <main id="main" className="cx" data-page-type="city" data-city={city.slug}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cities", href: "/cities/" }, { name: city.name, href: cityPath(city) }]} />
        <header className="city-hero">
          <span className="city-hero-art" aria-hidden="true"><CityArt city={city} eager /></span>
          <div className="wrap city-hero-in">
            <div className="city-hero-text">
              <Link href="/cities/" className="city-back"><span aria-hidden="true">←</span> All {getCities().length} cities</Link>
              <p className="eyebrow">{city.area ?? `${city.name}, ${city.region}`}{city.country === "CA" ? " · Canada" : ""}</p>
              <h1>Top Selling <span>{city.name}</span> Jerseys</h1>
              <p className="lede">The most popular {city.name} jerseys from the latest sales lists, overall and by sport.</p>
              <p className="city-intro">{city.blurb ? <>{city.blurb} {cityIntro(city, { teams: false })}</> : cityIntro(city)}</p>
              <ul className="city-roster" aria-label={`${city.name} teams, jump to a sport`}>
                {teams.map((t) => <li key={t.id}><a href={`#${t.league}`} title={t.name}><span>{t.league.toUpperCase()}</span>{teamNickname(t)}</a></li>)}
              </ul>
            </div>
            {lead?.product.image && (
              <Link href={`/players/${lead.player.slug}/`} className="city-hero-lead">
                <img {...jerseyImg(lead.product.image.url, 200)} alt={lead.product.image.alt} width={200} height={200} fetchPriority="high" />
                <span className="city-hero-cap"><small>{lead.ranked && lead.player.id === ranked[0]?.player.id ? `No. 1 in ${city.name}` : `${city.name} favorite`}</small>{lead.player.name}</span>
              </Link>
            )}
          </div>
        </header>
        <div className="wrap city-note"><AffiliateNote /></div>

        <div className="wrap with-rail">
          <div className="rail-main">

            <section className="section city-sec" id="overall" aria-labelledby="overall-h">
              <p className="cx-kicker">Hometown heroes · every sport</p>
              <div className="section-head"><h2 id="overall-h">Top {city.name} jerseys overall</h2></div>
              {overall.length > 0 ? (
                <>
                  <p className="city-sub">Ranked by each player&apos;s place on their league&apos;s latest national sales list. <a href="#how">How city lists work</a></p>
                  <CityPodium rows={overall} page={page} at="city_overall" />
                  {overall.length > 3 && <CityList rows={overall.slice(3)} page={page} at="city_overall" showLeague start={4} />}
                </>
              ) : (
                <>
                  <p className="city-sub">No {city.name} players are on the latest sales lists yet. Here is a jersey for each team.</p>
                  <CityPicks picks={cityPicks(city, new Set(), 4)} page={page} at="city_overall_picks" />
                </>
              )}
            </section>

            {leagues.map((l, i) => {
              const rows = ranked.filter((r) => r.ranking.league === l.id);
              const lTeams = teams.filter((t) => t.league === l.id);
              const more = cityPicks(city, rankedIds, rows.length ? 4 : 5, l.id);
              const star = rows[0] ?? more[0];
              const rk = getCurrentRanking(l.id);
              return (
                <div key={l.id}>
                  <section className="section city-sec city-sec-lg" id={l.id} aria-labelledby={`${l.id}-h`}>
                    <p className="cx-kicker">{VIBE[l.id] ?? "By sport"} · {l.name}</p>
                    <div className="section-head">
                      <h2 id={`${l.id}-h`}>{city.name} {l.name} jerseys</h2>
                      <Link href={`/${l.slug}/`}>Full {l.name} list →</Link>
                    </div>
                    {rk && (
                      <p className="city-src">
                        From <a href={rk.sourceUrl} target="_blank" rel="noopener">{rk.title}</a> ({rk.publisher}) · {rk.periodLabel} · published {fmtShortDate(rk.publishedDate)}
                      </p>
                    )}
                    {star && <PlayerBanner row={star} league={l} cityName={city.name} page={page} />}
                    {rows.length > 1 ? (
                      <CityList rows={rows.slice(1)} page={page} at={`city_${l.id}`} start={2} />
                    ) : rows.length === 1 ? null : (
                      <p className="city-sub">No {city.name} players are on the latest {l.name} sales list.</p>
                    )}
                    {(rows.length ? more : more.filter((m) => m !== star)).length > 0 && (
                      <CityPicks picks={(rows.length ? more : more.filter((m) => m !== star)).slice(0, 4)} page={page} at={`city_picks_${l.id}`} />
                    )}
                    <p className="city-teams">
                      Shop all at Lids:{" "}
                      {lTeams.map((t, j) => {
                        const o = teamOffer(t);
                        return o ? (
                          <span key={t.id}>
                            {j > 0 && " · "}
                            <a href={`${outPath(o.id)}?at=city_team_${l.id}`} target="_blank" rel="sponsored nofollow noopener" data-track="affiliate_click" data-offer={o.id} data-offer-kind={o.kind} data-merchant={o.merchantId} data-league={l.id} data-placement={`city_team_${l.id}`} data-page={page}>{t.name}</a>
                          </span>
                        ) : null;
                      })}
                    </p>
                  </section>
                </div>
              );
            })}


            <section className="section city-sec city-near" aria-labelledby="near-h">
              <p className="cx-kicker">Road trip</p>
              <div className="section-head"><h2 id="near-h">Cities near {city.name}</h2><Link href="/cities/">All cities →</Link></div>
              <div className="city-near-grid">
                {nearbyCities(city, 4).map((c) => <CityCard key={c.slug} city={c} size="sm" />)}
              </div>
            </section>

            <aside className="city-how" id="how" aria-labelledby="how-h">
              <h2 id="how-h">How city lists work</h2>
              <p>
                The jersey sales lists we use are national; none of them break sales down by city. Each city list takes the latest list for
                every league and groups the players by the city of their current team, or the team the report credited when they have no team
                now. &quot;No. 3 on the NBA list&quot; is the player&apos;s national rank, not a local sales figure. Jerseys shown for
                players who aren&apos;t on a list come from the Lids catalog and aren&apos;t ranked.
              </p>
              <p><Link href="/methodology/">Methodology</Link> · <Link href="/sources/">Sources</Link> · <Link href="/affiliate-disclosure/">Affiliate disclosure</Link></p>
            </aside>

            <nav className="city-others" aria-label="Other cities">
              <Link href="/cities/" className="city-others-all">All cities →</Link>
              <p>{others.map((c, j) => <span key={c.slug}>{j > 0 && " · "}<Link href={cityPath(c)}>{c.name}</Link></span>)}</p>
            </nav>
          </div>
          <SideRail lead={<CityStories cityName={city.name} stories={cityStories(city)} />} hideStories hideNews cityAds minimal />
        </div>
        {overall.length > 0 && <JsonLd data={ld} />}
      </main>
    </>
  );
}

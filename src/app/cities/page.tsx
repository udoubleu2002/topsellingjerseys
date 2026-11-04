import { Fragment } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LidsAd } from "@/components/LidsAd";
import { SideRail, RotatingSlot } from "@/components/SideRail";
import { AffiliateNote } from "@/components/RankingHeader";
import { getCities, cityLeagues, cityPath, cityRanked, cityTeams } from "@/lib/cities";
import { lidsBanner } from "@/lib/lidsAds";

export const metadata: Metadata = pageMeta({
  title: "Top Selling Jerseys by City",
  description: "The best-selling jerseys in the top 40 sports cities in the US and Canada, from New York and Los Angeles to Toronto and Green Bay. Lists by sport for every city, with where to buy at Lids.",
  path: "/cities/",
});

/** After this many city cards, a Lids banner runs across the grid. */
const AD_EVERY = 12;
const AD_IDS = ["4114443", "1907269", "2159657"];

export default function CitiesPage() {
  const cities = getCities().map((c) => ({ city: c, teams: cityTeams(c), leagues: cityLeagues(c), ranked: cityRanked(c) }));
  return (
    <>
      <SiteHeader active="cities" />
      <main id="main" data-page-type="cities">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cities", href: "/cities/" }]} />
        <header className="wrap page-head">
          <h1>Top Selling Jerseys by City</h1>
          <p className="lede">The {cities.length} biggest sports cities in the US and Canada, each with its top jerseys overall and a list for every sport, taken from the latest published jersey sales lists.</p>
          <AffiliateNote />
        </header>
        <div className="wrap with-rail">
          <div className="rail-main">
            <div className="city-grid">
              {cities.map(({ city, teams, leagues, ranked }, i) => {
                const lead = ranked[0];
                const photo = ranked.find((r) => r.product?.image)?.product?.image;
                const ad = (i + 1) % AD_EVERY === 0 && i < cities.length - 1 ? lidsBanner(AD_IDS[Math.floor(i / AD_EVERY) % AD_IDS.length]) : undefined;
                return (
                  <Fragment key={city.slug}>
                    <Link href={cityPath(city)} className="city-card">
                      <span className="city-card-stripes" aria-hidden="true">
                        {teams.map((t) => <span key={t.id} style={{ background: t.team?.colors.primary ?? "#334155" }} />)}
                      </span>
                      <span className="city-card-body">
                        <span className="city-card-name">{city.name}</span>
                        <span className="city-card-meta">{city.region}{city.country === "CA" ? ", Canada" : ""} · {teams.length} {teams.length === 1 ? "team" : "teams"}</span>
                        <span className="city-card-lgs">{leagues.map((l) => <span key={l.id} style={{ "--lg": l.accent } as React.CSSProperties}>{l.name}</span>)}</span>
                        {lead && <span className="city-card-lead">Top jersey: <strong>{lead.player.name}</strong></span>}
                      </span>
                      {photo && <span className="city-card-img"><img src={photo.url} alt="" loading={i < 6 ? "eager" : "lazy"} decoding="async" width={120} height={120} /></span>}
                    </Link>
                    {ad && (
                      <div className="city-grid-ad">
                        <RotatingSlot at={`cities_grid_${i + 1}`}><LidsAd banner={ad} at={`cities_grid_${i + 1}`} /></RotatingSlot>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
          <SideRail />
        </div>
      </main>
    </>
  );
}

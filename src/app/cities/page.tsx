import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateNote } from "@/components/RankingHeader";
import { CityCard, FeaturedCity } from "@/components/CityCards";
import { getCities, featuredCities } from "@/lib/cities";
import { getLeagues } from "@/lib/data";
import "../cities.css";

export const metadata: Metadata = pageMeta({
  title: "Top Selling Jerseys by City",
  description: "The best-selling jerseys in the top 40 sports cities in the US and Canada, from New York and Los Angeles to Toronto and Green Bay. Lists by sport for every city, with where to buy at Lids.",
  path: "/cities/",
});

export default function CitiesPage() {
  const cities = getCities();
  const feat = featuredCities();
  return (
    <>
      <SiteHeader active="cities" />
      <main id="main" className="cx" data-page-type="cities">
        <section className="cx-top">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cities", href: "/cities/" }]} />
          <div className="wrap">
            <header className="cx-head">
              <h1 className="cx-eyebrow">Top Selling Jerseys by City</h1>
              <p className="cx-display">America&apos;s Best-Selling Jerseys, City by City</p>
              <p className="cx-lede">Explore the teams, athletes and jerseys capturing the attention of sports fans across America&apos;s biggest cities.</p>
              <AffiliateNote />
            </header>
            {feat && (
              <>
                <FeaturedCity city={feat.lead} />
                {feat.more.length > 0 && (
                  <div className="cfeat-more">
                    {feat.more.map((c) => <CityCard key={c.slug} city={c} size="sm" />)}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="wrap cx-dir" aria-labelledby="all-cities-h">
          <div className="cx-dir-head">
            <h2 id="all-cities-h">All {cities.length} cities, A to Z</h2>
            <p>The top sports cities in the US and Canada, each with its top jerseys overall and a list for every sport, taken from the latest published jersey sales lists.</p>
          </div>
          <div className="cgrid">
            {cities.map((c, i) => <CityCard key={c.slug} city={c} eager={i < 3 && !feat} />)}
          </div>
          <div className="cx-foot">
            <nav className="cx-leagues" aria-label="League lists">
              <span>Full league lists:</span>
              {getLeagues().map((l) => <Link key={l.id} href={`/${l.slug}/`}>{l.name}</Link>)}
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = pageMeta({ title: "Related Sites", description: "Sister sites to Top Selling Jerseys: guides to ballparks, football stadiums, basketball arenas, hockey rinks and horse racing tracks, lost stadiums and sports history.", path: "/related-sites/" });

type Site = { kind: string; name: string; url: string; desc: string; accent: string; mark: string };

const SITES: Site[] = [
  { kind: "Baseball", name: "InsideThePark.com", url: "https://insidethepark.com/", desc: "A guide to MLB, minor league, spring training and college ballparks in the United States.", accent: "#2f8f5b", mark: "⚾" },
  { kind: "Football", name: "AllFootballStadiums.com", url: "https://allfootballstadiums.com/", desc: "A guide to NFL and college football stadiums across the United States.", accent: "#3b6fd8", mark: "🏈" },
  { kind: "Basketball", name: "HoopsArenas.com", url: "https://hoopsarenas.com/", desc: "A guide to NBA, WNBA and men’s and women’s college basketball arenas across the United States and Canada.", accent: "#e0663a", mark: "🏀" },
  { kind: "Hockey", name: "RinkGuide.com", url: "https://rinkguide.com/", desc: "A guide to NHL, minor league and college hockey rinks across the United States and Canada.", accent: "#5aa9d6", mark: "🏒" },
  { kind: "Horse racing", name: "HorseTrackAtlas.com", url: "https://horsetrackatlas.com/", desc: "A guide to horse racing tracks across the United States and internationally.", accent: "#b0884f", mark: "🏇" },
  { kind: "Lost venues", name: "LostStadiums.com", url: "https://loststadiums.com/", desc: "A map of demolished and repurposed ballparks, stadiums, arenas and racetracks, and what stands on the land now.", accent: "#8b93a1", mark: "🏟️" },
  { kind: "Sports history", name: "SportsOnThisDay.com", url: "https://sportsonthisday.com/", desc: "The biggest moments in sports history, day by day, from championships to records.", accent: "#c0443a", mark: "📅" },
];

export default function RelatedSites() {
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="info">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Related sites", href: "/related-sites/" }]} />
        <header className="wrap page-head">
          <p className="rs-kicker">The Top Selling Jerseys family</p>
          <h1>Related sites</h1>
          <p className="lede">Top Selling Jerseys tracks the players fans are buying. Our sister sites cover the places they go to watch them play, and the moments they remember.</p>
        </header>
        <section className="wrap rs-sec" aria-labelledby="rs-h">
          <h2 id="rs-h" className="rs-h">Our sister sites</h2>
          <ul className="rs-grid">
            {SITES.map((s) => (
              <li key={s.url}>
                <a className="rs-card" href={s.url} target="_blank" rel="noopener" style={{ "--rs": s.accent } as React.CSSProperties}>
                  <span className="rs-top">
                    <span className="rs-mark" aria-hidden="true">{s.mark}</span>
                    <span className="rs-kind">{s.kind}</span>
                  </span>
                  <span className="rs-name">{s.name}</span>
                  <span className="rs-desc">{s.desc}</span>
                  <span className="rs-go">Visit {s.name} <span aria-hidden="true">↗</span></span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

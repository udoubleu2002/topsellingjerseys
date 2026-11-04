import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchClient, type SearchItem } from "@/components/SearchClient";
import { getPlayers, getLeague, getLeagues, getLatestAppearance, loadStore, teamPlayers, teamLabel, getCurrentRanking } from "@/lib/data";
import { getCities, cityTeams, cityPath } from "@/lib/cities";
import { fmtShortDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({ title: "Search Players and Teams", description: "Search every ranked player, team, city and league across the NFL, NBA, WNBA, MLB, NHL and MLS top-selling jersey lists, and jump to their profiles and shop links.", path: "/search/", noindex: true });

export default function SearchPage() {
  const items: SearchItem[] = getPlayers().map((p) => {
    const a = getLatestAppearance(p.id);
    const l = getLeague(p.leagues[0])!;
    return { name: p.name, sub: `${teamLabel(p)} · ${l.name} · ${p.position}`, href: `/players/${p.slug}/`, rank: a ? `No. ${a.rank} ${l.name}` : "", terms: `${p.name} ${teamLabel(p)} ${l.name} ${p.position}`.toLowerCase() };
  });
  const teams = loadStore().teams.filter((t) => teamPlayers(t.id).length > 0);
  for (const t of teams) {
    const ps = teamPlayers(t.id);
    const l = getLeague(t.league)!;
    items.push({ name: t.name, sub: `${l.name} team · ${ps.map((p) => p.name).join(", ")}`, href: `/players/${ps[0].slug}/`, rank: `${ps.length} ranked`, terms: `${t.name} ${l.name}`.toLowerCase() });
  }
  for (const l of getLeagues()) {
    const r = getCurrentRanking(l.id);
    items.push({ name: `Top Selling ${l.name} Jerseys`, sub: `${l.fullName} · ${r ? `${r.entries.length} players, published ${fmtShortDate(r.publishedDate)}` : "league page"}`, href: `/${l.slug}/`, rank: "League", terms: `${l.name} ${l.fullName} ${l.sport} league`.toLowerCase() });
  }
  for (const c of getCities()) {
    const teams = cityTeams(c);
    items.push({ name: `${c.name} jerseys`, sub: `City · ${teams.map((t) => t.name).slice(0, 4).join(", ")}${teams.length > 4 ? ` and ${teams.length - 4} more` : ""}`, href: cityPath(c), rank: "City", terms: `${c.name} ${teams.map((t) => t.name).join(" ")} city`.toLowerCase() });
  }
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="search">
        <header className="wrap page-head" style={{ paddingTop: 28 }}>
          <h1>Search players and teams</h1>
          <p className="lede">Find any ranked player, team, city or league.</p>
          <SearchClient items={items} />
          <script type="application/json" id="search-index" dangerouslySetInnerHTML={{ __html: JSON.stringify(items).replace(/</g, "\\u003c") }} />
          <noscript>
            <ul className="results">
              {items.slice(0, getPlayers().length).map((i) => <li key={i.href}><Link href={i.href}><span>{i.name}</span><span className="shop-note">{i.rank}</span></Link></li>)}
            </ul>
          </noscript>
        </header>
        <section className="wrap section" aria-labelledby="browse-h">
          <div className="section-head"><h2 id="browse-h">Browse the rankings</h2></div>
          <nav className="related" aria-labelledby="browse-h">
            {getLeagues().map((l) => <Link key={l.id} href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link>)}
            <Link href="/rankings/">Report archive</Link>
          </nav>
        </section>
      </main>
    </>
  );
}

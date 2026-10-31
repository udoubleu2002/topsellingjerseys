import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { SearchClient, type SearchItem } from "@/components/SearchClient";
import { getPlayers, getLeague, getLeagues, getLatestAppearance, loadStore, teamPlayers, teamLabel } from "@/lib/data";

export const metadata: Metadata = pageMeta({ title: "Search Players and Teams", description: "Search every ranked player and team across the NFL, NBA, WNBA, MLB, NHL and MLS top-selling jersey lists, and jump to their profiles and shop links.", path: "/search/", noindex: true });

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
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="search">
        <header className="wrap page-head" style={{ paddingTop: 28 }}>
          <h1>Search players and teams</h1>
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

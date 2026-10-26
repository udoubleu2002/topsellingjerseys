import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLeagues, getPlayers, getTeam, isIndexable } from "@/lib/data";

export const metadata: Metadata = pageMeta({ title: "All Player Jersey Pages", description: "Every player on Top Selling Jerseys, grouped by league and team, for the NFL, NBA, WNBA, MLB, NHL and MLS. Each page has the player's jersey sales rank, stats and where to buy.", path: "/players/" });

// One crawlable link to every player page, so no player page is reachable only through the sitemap.
export default function PlayerDirectory() {
  const players = getPlayers().filter(isIndexable);
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="directory">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Players", href: "/players/" }]} />
        <header className="wrap page-head">
          <h1>All Player Jersey Pages</h1>
          <p className="lede">Every player we cover, by league and team. Each page shows the player&apos;s place on the latest published sales list, current stats and where to buy the jersey.</p>
        </header>
        <div className="wrap">
          {getLeagues().map((l) => {
            const inLeague = players.filter((p) => p.leagues[0] === l.id);
            if (!inLeague.length) return null;
            const groups = new Map<string, typeof inLeague>();
            for (const p of inLeague) {
              const name = (p.teamId && getTeam(p.teamId)?.name) || "Free agents and retired";
              groups.set(name, [...(groups.get(name) ?? []), p]);
            }
            const teams = [...groups.keys()].sort((a, b) => (a.startsWith("Free agents") ? 1 : b.startsWith("Free agents") ? -1 : a.localeCompare(b)));
            return (
              <section className="block" key={l.id} aria-labelledby={`d-${l.id}`}>
                <h2 id={`d-${l.id}`}>{l.name} players ({inLeague.length})</h2>
                <p><Link href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link></p>
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Team</th><th>Players</th></tr></thead>
                    <tbody>
                      {teams.map((t) => (
                        <tr key={t}>
                          <td>{t}</td>
                          <td>{groups.get(t)!.sort((a, b) => a.name.localeCompare(b.name)).map((p, i) => <span key={p.id}>{i > 0 && ", "}<Link href={`/players/${p.slug}/`}>{p.name}</Link></span>)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}

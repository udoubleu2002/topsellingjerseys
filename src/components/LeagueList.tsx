import Link from "next/link";
import type { League, Ranking } from "@/lib/schema";
import { getPlayer, getTeam, getProducts, getStatLine, teamLabel } from "@/lib/data";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { HaveJersey } from "./HaveJersey";
import { ShopButton } from "./ShopButton";
import { fmtShortDate, period } from "@/lib/format";

/** Compact full ranking for the homepage: every published entry, in order, with a shop link on each row. */
export function LeagueList({ league, ranking }: { league: League; ranking: Ranking }) {
  const half = Math.ceil(ranking.entries.length / 2);
  return (
    <section className="llist" id={league.id} aria-labelledby={`h-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
      <header className="llist-head">
        <div>
          <h2 id={`h-${league.id}`}><Link href={`/${league.slug}/`}>Top Selling {league.name} Jerseys</Link></h2>
          <p className="llist-meta">
            {ranking.publisher} · <a href={ranking.sourceUrl} target="_blank" rel="noopener">published {fmtShortDate(ranking.publishedDate)}</a> · sales {period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel)}
          </p>
        </div>
        <Link className="llist-more" href={`/${league.slug}/`}>Full {league.name} rankings →</Link>
      </header>
      <ol className="lrows" style={{ "--rows": half } as React.CSSProperties}>
        {ranking.entries.map((e) => {
          const p = getPlayer(e.playerId)!;
          const team = getTeam(p.teamId ?? p.lastTeamId);
          const product = getProducts(p.id).find((x) => x.productType === "jersey");
          const offer = product ? productOffer(product) : searchOffer(p, team);
          // "G" is games played in the NFL, NBA and MLB but goals in the NHL and MLS.
          const skip = league.id === "nhl" || league.id === "mls" ? ["GP", "GS", "MIN"] : ["GP", "G", "GS", "MIN"];
          const stats = getStatLine(p.id)?.statistics.filter((s) => !skip.includes(s.label)).slice(0, 3) ?? [];
          const c = team?.colors ?? { primary: "#e5e7eb", secondary: "#334155", accent: "#94a3b8" };
          return (
            <li key={p.id} className={`lrow${e.rank === 1 ? " is-first" : ""}`} data-impression="home_list" data-league={league.id} data-player={p.id} data-rank={e.rank}>
              <span className="lrow-rank">{e.rank}</span>
              <span className="lrow-tile" style={{ backgroundColor: c.primary, color: c.secondary, borderBottomColor: c.accent }} aria-hidden="true">{p.number ?? ""}</span>
              <span className="lrow-who">
                <Link className="lrow-name" href={`/players/${p.slug}/`}>{p.name}</Link>
                <span className="lrow-team">{teamLabel(p)} · {p.position}</span>
                {stats.length > 0 && <span className="lrow-stats" title={stats.map((s) => `${s.value} ${s.label}`).join(" · ")}>{stats.map((s) => `${s.value} ${s.label}`).join(" · ")}</span>}
              </span>
              <span className="lrow-acts">
              {offer && (
                <ShopButton offer={offer} variant="small" ctx={{ league: league.id, playerId: p.id, rank: e.rank, placement: "home_list", page: "home" }}>
                  <span className="sr-only">Shop {p.name} Jerseys</span><span aria-hidden="true">Shop</span>
                </ShopButton>
              )}
              <HaveJersey name={p.name} league={league.id} className="have-sm" />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

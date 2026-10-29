import Link from "next/link";
import { getLeagues, getCurrentRanking, getPlayer, getTeam } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";
import { adsFor } from "@/lib/houseAds";
import { getLatestNews } from "@/lib/news";
import { getStories, storyPath } from "@/lib/stories";
import { HouseAd } from "./HouseAd";
import { LidsAd } from "./LidsAd";
import { rectFor, lidsBanner, ROTATION_BANNER_ID, ROTATION_SHARE } from "@/lib/lidsAds";
import { AdRotation } from "./AdRotation";
import { SportJersey } from "./SportJersey";

/** Labeled placeholder for a display ad. Sizes follow standard IAB units so a real ad tag can drop in later. */
export function AdSlot({ size, id, className = "" }: { size: "300x250" | "300x600" | "320x100"; id: string; className?: string }) {
  const [w, h] = size.split("x");
  return (
    <div className={`ad-slot ad-${size} ${className}`} data-ad-slot={id} style={{ "--ad-w": `${w}px`, "--ad-r": `${w} / ${h}` } as React.CSSProperties}>
      <span className="ad-label">Advertisement</span>
      <span className="ad-size">{w} × {h}</span>
    </div>
  );
}

/** A slot's own ad, swapped for the rotating Lids banner on about a quarter of page views. */
export function RotatingSlot({ at, className, children }: { at: string; className?: string; children: React.ReactNode }) {
  return <AdRotation share={ROTATION_SHARE} alt={<LidsAd banner={lidsBanner(ROTATION_BANNER_ID)!} at={`${at}_rot`} className={className} />}>{children}</AdRotation>;
}

/** Sidebar: jersey sales news first, then a second way into the lists (top 5 of every league at a glance), plus ad space. */
export function SideRail({ active }: { active?: string }) {
  const [adA, adB] = adsFor(active);
  const news = getLatestNews(7);
  const stories = getStories(active).slice(0, active ? 3 : 6);
  const leagues = getLeagues().map((l) => ({ league: l, ranking: getCurrentRanking(l.id) })).filter((x) => x.ranking);
  return (
    <aside className="rail" aria-label="Browse the lists">
      {stories.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-h">Latest stories</h2>
          <ul className="rail-stories">
            {stories.map((s) => (
              <li key={s.slug}>
                <Link href={storyPath(s)}>{s.headline}</Link>
                <span className="rail-news-meta">{s.league.toUpperCase()} · {fmtShortDate(s.publishedDate)}</span>
              </li>
            ))}
          </ul>
          <Link className="rail-more" href="/news/">All jersey news →</Link>
        </section>
      )}

      {news.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-h">Jersey sales news</h2>
          <ul className="rail-news">
            {news.map((n) => {
              const player = n.playerId ? getPlayer(n.playerId) : undefined;
              return (
                <li key={n.id}>
                  <SportJersey sport={n.sport} />
                  <span className="rail-news-who">
                    {player ? <Link href={`/players/${player.slug}/`}>{n.players.join(", ")}</Link> : n.players.join(", ")}
                  </span>
                  <a className="rail-news-hl" href={n.url} target="_blank" rel="noopener nofollow">{n.headline}</a>
                  <span className="rail-news-meta">{n.outlet} · {fmtShortDate(n.date)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <RotatingSlot at="rail_lids"><LidsAd banner={rectFor(active)} at="rail_lids" /></RotatingSlot>

      <section className="rail-box">
        <h2 className="rail-h">Latest reports</h2>
        <ul className="rail-updates">
          {leagues
            .slice()
            .sort((a, b) => b.ranking!.publishedDate.localeCompare(a.ranking!.publishedDate))
            .map(({ league, ranking }) => (
              <li key={league.id} style={{ "--lg": league.accent } as React.CSSProperties}>
                <Link href={`/${league.slug}/`}>{league.name}</Link>
                <span>{ranking!.publisher} · {fmtShortDate(ranking!.publishedDate)}</span>
              </li>
            ))}
        </ul>
        <Link className="rail-more" href="/rankings/">Report archive →</Link>
      </section>

      <RotatingSlot at="rail_top"><HouseAd ad={adA} at="rail_top" /></RotatingSlot>

      <section className="rail-box">
        <h2 className="rail-h">Browse the lists</h2>
        <div className="rail-lists">
          {leagues.map(({ league, ranking }) => (
            <details key={league.id} className="rail-league" open={active ? active === league.id : league.id === leagues[0].league.id} style={{ "--lg": league.accent } as React.CSSProperties}>
              <summary>
                <span className="rail-lg">{league.name}</span>
                <span className="rail-lead">{getPlayer(ranking!.entries[0].playerId)?.name}</span>
              </summary>
              <ol>
                {ranking!.entries.slice(0, 5).map((e) => {
                  const p = getPlayer(e.playerId)!;
                  return (
                    <li key={p.id}>
                      <span className="rail-rank">{e.rank}</span>
                      <Link href={`/players/${p.slug}/`}>{p.name}</Link>
                      <span className="rail-team">{getTeam(p.teamId ?? p.lastTeamId)?.name.split(" ").pop() ?? ""}</span>
                    </li>
                  );
                })}
              </ol>
              <Link className="rail-more" href={`/${league.slug}/`}>All {ranking!.entries.length} {league.name} jerseys →</Link>
            </details>
          ))}
        </div>
      </section>

      <RotatingSlot at="rail_bottom" className="rail-sticky"><HouseAd ad={adB} at="rail_bottom" className="rail-sticky" /></RotatingSlot>
    </aside>
  );
}

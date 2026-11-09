import Link from "next/link";
import type { League, Ranking } from "@/lib/schema";
import { getLeagues, getCurrentRanking, getPlayer, getTeam, getProducts, entryTeams, reportStatus } from "@/lib/data";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { jerseyImg } from "@/lib/img";
import { topRisers } from "@/lib/trending";
import { ShopButton } from "./ShopButton";
import { JerseyThumb } from "./HomeBits";
import { fmtShortDate } from "@/lib/format";
import { adsFor } from "@/lib/houseAds";
import { getLatestNews } from "@/lib/news";
import { getStories, storyPath } from "@/lib/stories";
import { HouseAd } from "./HouseAd";
import { LidsAd } from "./LidsAd";
import { rectFor, lidsBanner, pinnedRailBanner, ROTATION_BANNER_ID, ROTATION_SHARE } from "@/lib/lidsAds";
import { AdRotation } from "./AdRotation";
import { ShowUntil } from "./ShowUntil";
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
  if (ROTATION_SHARE <= 0) return <>{children}</>;
  return <AdRotation share={ROTATION_SHARE} alt={<LidsAd banner={lidsBanner(ROTATION_BANNER_ID)!} at={`${at}_rot`} className={className} />}>{children}</AdRotation>;
}

/**
 * Sidebar, alternating content and ads: a pinned Lids banner while one is running, then the top 5 of every league (the most
 * colorful box and a second way into the lists), jersey sales news, our own stories in the middle, and the report dates last.
 */
export function SideRail({ active, lead, hideStories = false, hideNews = false, cityAds = false, minimal = false, hideLists = false }: { active?: string; lead?: React.ReactNode; hideStories?: boolean; hideNews?: boolean; cityAds?: boolean; minimal?: boolean; hideLists?: boolean }) {
  // Cities pages run no Lids display banners; their Lids ads are the player banners and jersey tiles.
  const [adA] = adsFor(active);
  const news = getLatestNews(7);
  const stories = getStories(active).slice(0, active ? 3 : 6);
  const leagues = getLeagues().map((l) => ({ league: l, ranking: getCurrentRanking(l.id) })).filter((x) => x.ranking);
  const pinned = cityAds ? null : pinnedRailBanner();
  // Risers come only from leagues with a comparable earlier report; on a league page, that league's risers first.
  const allRisers = minimal ? [] : topRisers(20);
  const risers = [...allRisers.filter((r) => r.league.id === active), ...allRisers.filter((r) => r.league.id !== active)].slice(0, 4);
  const riserNote = [...new Set(risers.map((r) => `${r.league.name} list of ${fmtShortDate(r.previous.publishedDate)}`))].join(" and the ");
  // "Shop the No. 1": the active league's leader, or on the homepage the leader of the newest list.
  const shopLeague = leagues.find((x) => x.league.id === active) ?? leagues.slice().sort((a, b) => b.ranking!.publishedDate.localeCompare(a.ranking!.publishedDate))[0];
  const shop = shopLeague ? { league: shopLeague.league, ranking: shopLeague.ranking!, page: active ? `league_${active}` : "home" } : null;
  return (
    <aside className="rail" aria-label="Browse the lists">
      {pinned && <ShowUntil until={pinned.until}><LidsAd banner={pinned.banner} at="rail_pinned" /></ShowUntil>}

      {lead}

      {!minimal && (
        <form className="rail-find" action="/search/" role="search">
          <label htmlFor="q-rail" className="sr-only">Find a player, team or city</label>
          <input id="q-rail" name="q" type="search" placeholder="Find a player, team or city" autoComplete="off" />
          <button type="submit" aria-label="Search">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </form>
      )}

      {!minimal && !hideLists && <section className="rail-box">
        <h2 className="rail-h">Browse the lists</h2>
        <div className="rail-lists">
          {leagues.map(({ league, ranking }) => (
            <details key={league.id} className="rail-league" open={active ? active === league.id : league.id === leagues[0].league.id} style={{ "--lg": league.accent } as React.CSSProperties}>
              <summary>
                <RailThumb ranking={ranking!} />
                <span className="rail-sum">
                  <span className="rail-lg">{league.name}</span>
                  <span className="rail-lead">No. 1 {getPlayer(ranking!.entries[0].playerId)?.name}</span>
                </span>
              </summary>
              <ol>
                {ranking!.entries.slice(0, 5).map((e) => {
                  const p = getPlayer(e.playerId)!;
                  return (
                    <li key={p.id}>
                      <span className="rail-rank">{e.rank}</span>
                      <JerseyThumb player={p} teamId={e.teamIdAtReport} number={e.numberAtReport} size={30} className="rail-ji" />
                      <Link href={`/players/${p.slug}/`}>{p.name}</Link>
                      <span className="rail-team">{getTeam(e.teamIdAtReport ?? p.teamId ?? p.lastTeamId)?.name.split(" ").pop() ?? ""}</span>
                    </li>
                  );
                })}
              </ol>
              <p className="rail-asof">{reportStatus(ranking!).dated ? "Latest available list" : "Latest list"} · published {fmtShortDate(ranking!.publishedDate)}</p>
              <Link className="rail-more" href={`/${league.slug}/`}>All {ranking!.entries.length} {league.name} jerseys →</Link>
            </details>
          ))}
        </div>
      </section>}

      {!cityAds && <RotatingSlot at="rail_lids"><LidsAd banner={rectFor(active)} at="rail_lids" /></RotatingSlot>}

      {!minimal && risers.length > 0 && (
        <section className="rail-box">
          <h2 className="rail-h">Trending: biggest risers</h2>
          <ol className="rail-trend">
            {risers.map((r) => {
              const p = getPlayer(r.playerId)!;
              return (
                <li key={r.league.id + p.id} style={{ "--lg": r.league.accent } as React.CSSProperties}>
                  <span className="rail-trend-up">▲{r.delta}</span>
                  <JerseyThumb player={p} teamId={p.teamId} size={34} className="rail-ti" />
                  <Link href={`/players/${p.slug}/`}>{p.name}</Link>
                  <span className="rail-team">{r.league.name} · {r.previousRank} → {r.rank}</span>
                </li>
              );
            })}
          </ol>
          <p className="rail-asof">Change since the {riserNote}.</p>
          <Link className="rail-more" href="/trending/">All risers and new entries →</Link>
        </section>
      )}

      {!minimal && shop && <RailShop {...shop} />}

      {!hideNews && news.length > 0 && (
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

      {!hideStories && stories.length > 0 && (
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

      {cityAds ? <HouseAd ad={adA} at="rail_top" /> : <RotatingSlot at="rail_top"><HouseAd ad={adA} at="rail_top" /></RotatingSlot>}

    </aside>
  );
}

/** The No. 1 player's jersey photo for the league summary, or the number tile in team colors when no photo is on file. */
function RailThumb({ ranking }: { ranking: Ranking }) {
  const e = ranking.entries[0];
  const p = getPlayer(e.playerId)!;
  const { reportTeam, number } = entryTeams(e, p);
  const photo = getProducts(p.id).find((x) => x.productType === "jersey" && x.image && x.teamId === e.teamIdAtReport) ?? getProducts(p.id).find((x) => x.productType === "jersey" && x.image);
  if (photo?.image) return <span className="rail-thumb"><img {...jerseyImg(photo.image.url, 80)} alt="" width={40} height={40} loading="lazy" decoding="async" /></span>;
  const c = reportTeam?.colors ?? { primary: "#dfe3e8", secondary: "#20252b", accent: "#9aa3ad" };
  return <span className="rail-thumb is-tile" style={{ backgroundColor: c.primary, color: c.secondary }} aria-hidden="true">{number ?? ""}</span>;
}

/** One shopping card in the rail: the No. 1 jersey with the retailer's photo, verified price only, and a tracked link. */
function RailShop({ league, ranking, page }: { league: League; ranking: Ranking; page: string }) {
  const e = ranking.entries[0];
  const p = getPlayer(e.playerId)!;
  const jerseys = getProducts(p.id).filter((x) => x.productType === "jersey");
  const product = jerseys.find((x) => x.image && x.teamId === (p.teamId ?? e.teamIdAtReport)) ?? jerseys.find((x) => x.image) ?? jerseys[0];
  const offer = product ? productOffer(product) : searchOffer(p, getTeam(p.teamId ?? p.lastTeamId));
  if (!offer) return null;
  const team = getTeam(product?.teamId ?? p.teamId ?? p.lastTeamId);
  const price = product?.price && product.currency ? new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(product.price) : null;
  return (
    <section className="rail-box rail-shop" style={{ "--tc": team?.colors.primary ?? league.accent } as React.CSSProperties}>
      <h2 className="rail-h">Shop the No. 1 {league.name} jersey</h2>
      <div className="rail-shop-in">
        {product?.image && <img {...jerseyImg(product.image.url, 200)} alt={product.image.alt} width={100} height={100} loading="lazy" decoding="async" />}
        <div>
          <Link className="rail-shop-name" href={`/players/${p.slug}/`}>{p.name}</Link>
          <span className="rail-team">{team?.name}</span>
          {price && <span className="rail-shop-price">{price} <small>checked {fmtShortDate(product!.lastVerified)}</small></span>}
        </div>
      </div>
      <ShopButton offer={offer} variant="small" ctx={{ league: league.id, playerId: p.id, rank: 1, placement: "rail_shop", page }}>
        {product ? "Shop this jersey" : "Find this jersey"}
      </ShopButton>
      <Link className="rail-more" href="/shop/">Shop every league&apos;s top sellers →</Link>
    </section>
  );
}

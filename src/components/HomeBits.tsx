import Link from "next/link";
import type { League, Player, Product, Ranking, Team } from "@/lib/schema";
import { getPlayer, getTeam, getProducts, getStatLine, entryTeams, reportStatus } from "@/lib/data";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { jerseyImg } from "@/lib/img";
import { fmtShortDate, fmtDate } from "@/lib/format";
import { getFeatured, getHero } from "@/lib/featured";
import { topRisers, newEntries, repeatLeaders, getTrends } from "@/lib/trending";
import { ShopButton } from "./ShopButton";
import { HaveJersey } from "./HaveJersey";

/** A jersey photo for the player, preferring one in the team the report credited (so the image matches the ranking). */
export function rankedJersey(player: Player, teamId: string | null | undefined): Product | undefined {
  const jerseys = getProducts(player.id).filter((p) => p.productType === "jersey" && p.image);
  return jerseys.find((p) => p.teamId === teamId) ?? jerseys.find((p) => p.teamId === player.teamId) ?? jerseys[0];
}

/** Product photo, or a number tile in team colors. Never a photo of another player. */
export function JerseyArt({ player, team, product, number, w, priority = false }: { player: Player; team?: Team; product?: Product; number?: string | null; w: number; priority?: boolean }) {
  if (product?.image) {
    return (
      <span className="jart is-photo">
        <img {...jerseyImg(product.image.url, w)} alt={product.image.alt} width={w} height={w} loading={priority ? "eager" : "lazy"} decoding="async" />
      </span>
    );
  }
  const c = team?.colors ?? { primary: "#dfe3e8", secondary: "#20252b", accent: "#9aa3ad" };
  return (
    <span className="jart is-tile" style={{ backgroundColor: c.primary, color: c.secondary, borderBottomColor: c.accent }} role="img" aria-label={`${player.name}${number ? `, No. ${number}` : ""}`}>
      <span>{number ?? ""}</span>
    </span>
  );
}

const statSkip = (league: string) => (league === "nhl" || league === "mls" ? ["GP", "GS", "MIN"] : ["GP", "G", "GS", "MIN"]);

/** One of the six league-leader cards: the No. 1 on each league's latest published report. */
export function LeaderCard({ league, ranking, priority }: { league: League; ranking: Ranking; priority?: boolean }) {
  const first = ranking.entries[0];
  const p = getPlayer(first.playerId)!;
  const { reportTeam, number, now } = entryTeams(first, p);
  const product = rankedJersey(p, first.teamIdAtReport);
  const status = reportStatus(ranking);
  return (
    <article className="leader" style={{ "--lg": league.accent, "--tc": reportTeam?.colors.primary ?? league.accent } as React.CSSProperties}>
      <Link className="leader-link" href={`/${league.slug}/`} aria-label={`${league.name}: ${p.name} is No. 1. See the full ${league.name} ranking`} />
      <header className="leader-top">
        <span className="leader-lg">{league.name}</span>
        <span className="leader-no">No. 1</span>
      </header>
      <JerseyArt player={p} team={reportTeam} product={product} number={number} w={200} priority={priority} />
      <div className="leader-body">
        <h3 className="leader-name"><Link href={`/players/${p.slug}/`}>{p.name}</Link></h3>
        <p className="leader-team">{reportTeam?.name ?? p.status}{now && <span className="leader-now">{now}</span>}</p>
        <p className="leader-date">
          <span>Published {fmtShortDate(ranking.publishedDate)}</span>
          {status.dated && <span className="leader-flag">Latest available</span>}
        </p>
        <span className="leader-more">Full top {ranking.entries.length} →</span>
      </div>
    </article>
  );
}

/** Editor's pick module. Labeled as a pick; the jersey rank shown is the published one. */
export function FeaturedPlayer() {
  const f = getFeatured();
  if (!f) return null;
  const { player, team, league, appearance, stats, product } = f;
  const quick = stats?.statistics.filter((s) => !statSkip(stats.league).includes(s.label)).slice(0, 4) ?? [];
  const offer = product ? productOffer(product) : searchOffer(player, team);
  const leagueSlug = league?.slug;
  return (
    <section className="feature" aria-labelledby="feature-h">
      <div className="wrap feature-in">
        <div className="feature-art">
          <JerseyArt player={player} team={team} product={product} number={player.number} w={420} />
          {appearance && (
            <span className="feature-badge">
              <b>No. {appearance.rank}</b>
              <span>{league?.name} jersey list</span>
            </span>
          )}
        </div>
        <div className="feature-copy">
          <p className="kicker">Player of the week · Week of {fmtShortDate(f.weekOf)}</p>
          <h2 id="feature-h" className="feature-h">{f.headline}</h2>
          <p className="feature-dek">{f.dek}</p>
          <p className="feature-who">
            <Link href={`/players/${player.slug}/`}>{player.name}</Link>
            <span>{team?.name ?? player.status}{player.position ? ` · ${player.position}` : ""}{player.number ? ` · No. ${player.number}` : ""}</span>
          </p>
          <ul className="feature-why">
            {f.why.map((w) => (
              <li key={w.text}>{w.text} <a href={w.source} target="_blank" rel="noopener nofollow">Source</a></li>
            ))}
          </ul>
          {quick.length > 0 && stats && (
            <div className="feature-stats">
              <dl>
                {quick.map((s) => (
                  <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                ))}
              </dl>
              <p className="feature-note">{stats.season} {stats.competition === "regular-season" ? "regular season" : "postseason"}, through {fmtDate(stats.throughDate)}{stats.source && <> · <a href={stats.source} target="_blank" rel="noopener nofollow">stats source</a></>}</p>
            </div>
          )}
          <div className="feature-acts">
            <Link className="btn-light" href={`/players/${player.slug}/`}>Player profile</Link>
            {leagueSlug && appearance && <Link className="btn-line" href={`/${leagueSlug}/`}>Full {league?.name} ranking</Link>}
            {offer && (
              <ShopButton offer={offer} variant="ghost" ctx={{ league: league?.id ?? player.leagues[0], playerId: player.id, rank: appearance?.rank, placement: "home_feature", page: "home" }}>
                Shop {player.name} jerseys
              </ShopButton>
            )}
          </div>
          <p className="feature-disc">An editor&apos;s pick, not a sales ranking. The jersey rank is from the league&apos;s latest published list.</p>
        </div>
      </div>
    </section>
  );
}

/** Top five of a league as editorial cards, then the rest of the published list as compact, crawlable rows. */
export function LeagueTopFive({ league, ranking }: { league: League; ranking: Ranking }) {
  const top = ranking.entries.slice(0, 5);
  const rest = ranking.entries.slice(5);
  const status = reportStatus(ranking);
  return (
    <section className="lt5" id={league.id} aria-labelledby={`h-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
      <header className="lt5-head">
        <div>
          <p className="lt5-lg">{league.name} · {league.sport}</p>
          <h2 id={`h-${league.id}`}><Link href={`/${league.slug}/`}>Top Selling {league.name} Jerseys</Link></h2>
          <p className="lt5-meta">
            <span className={`pill is-${status.kind}`}>{status.dated ? "Latest available report" : status.label}</span>
            <span>{ranking.publisher}</span>
            <span><a href={ranking.sourceUrl} target="_blank" rel="noopener">Published {fmtShortDate(ranking.publishedDate)}</a></span>
            <span>Sales: {ranking.periodStart && ranking.periodEnd ? `${fmtShortDate(ranking.periodStart)} – ${fmtShortDate(ranking.periodEnd)}` : ranking.periodLabel}</span>
          </p>
        </div>
        <Link className="lt5-more" href={`/${league.slug}/`}>Full {league.name} ranking →</Link>
      </header>
      <ol className="rkcs">
        {top.map((e) => <PlayerRankCard key={e.playerId} league={league} ranking={ranking} rank={e.rank} />)}
      </ol>
      {rest.length > 0 && (
        <div className="lt5-rest is-open">
          <p className="lt5-rest-h">Ranks 6 to {ranking.entries.length}</p>
          <ol className={`lt5-rows${rest.length > 12 ? " is-cols" : ""}`} start={6}>
            {rest.map((e) => {
              const p = getPlayer(e.playerId)!;
              const { reportTeam, now } = entryTeams(e, p);
              const product = getProducts(p.id).find((x) => x.productType === "jersey");
              const offer = product ? productOffer(product) : searchOffer(p, getTeam(p.teamId ?? p.lastTeamId));
              return (
                <li key={p.id} data-impression="home_list" data-league={league.id} data-player={p.id} data-rank={e.rank}>
                  <span className="lt5-r">{e.rank}</span>
                  <Link className="lt5-n" href={`/players/${p.slug}/`}>{p.name}</Link>
                  <span className="lt5-t">{reportTeam?.name ?? p.status}{now && <em> · {now}</em>}</span>
                  {offer && (
                    <ShopButton offer={offer} variant="ghost" ctx={{ league: league.id, playerId: p.id, rank: e.rank, placement: "home_list", page: "home" }}>
                      <span className="sr-only">Shop {p.name} jerseys</span><span aria-hidden="true">Shop</span>
                    </ShopButton>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

/** Editorial ranking card: big rank, jersey photo, name, team and league, stats with their date, report context, quiet shop link. */
export function PlayerRankCard({ league, ranking, rank }: { league: League; ranking: Ranking; rank: number }) {
  const e = ranking.entries[rank - 1];
  const p = getPlayer(e.playerId)!;
  const { reportTeam, number, now } = entryTeams(e, p);
  const product = rankedJersey(p, e.teamIdAtReport);
  const offerProduct = getProducts(p.id).find((x) => x.productType === "jersey");
  const offer = offerProduct ? productOffer(offerProduct) : searchOffer(p, getTeam(p.teamId ?? p.lastTeamId));
  const line = getStatLine(p.id);
  const stats = line?.statistics.filter((s) => !statSkip(league.id).includes(s.label)).slice(0, 3) ?? [];
  const tier = rank <= 3 ? ` is-top is-${["gold", "silver", "bronze"][rank - 1]}` : "";
  return (
    <li className={`rkc${tier}`} data-impression="home_list" data-league={league.id} data-player={p.id} data-rank={rank} style={{ "--tc": reportTeam?.colors.primary ?? league.accent } as React.CSSProperties}>
      <span className="rkc-rank" aria-label={`Rank ${rank}`}>{rank}</span>
      <JerseyArt player={p} team={reportTeam} product={product} number={number} w={160} />
      <div className="rkc-body">
        <h3 className="rkc-name"><Link href={`/players/${p.slug}/`}>{p.name}</Link></h3>
        <p className="rkc-team">{reportTeam?.name ?? p.status} · {league.name}{p.position ? ` · ${p.position}` : ""}</p>
        {now && <p className="rkc-now">{now}</p>}
        {stats.length > 0 && line && (
          <p className="rkc-stats" title={`${line.season} stats through ${fmtDate(line.throughDate)}`}>
            {stats.map((s) => <span key={s.label}><b>{s.value}</b> {s.label}</span>)}
          </p>
        )}
        <p className="rkc-ctx">No. {rank} of {ranking.entries.length} · {fmtShortDate(ranking.publishedDate)} list{line?.throughDate ? ` · stats thru ${fmtShortDate(line.throughDate)}` : ""}</p>
      </div>
      <div className="rkc-acts">
        {offer && (
          <ShopButton offer={offer} variant="ghost" ctx={{ league: league.id, playerId: p.id, rank, placement: "home_card", page: "home" }}>
            <span className="sr-only">Shop {p.name} jerseys</span><span aria-hidden="true">Shop jersey</span>
          </ShopButton>
        )}
        <HaveJersey name={p.name} league={league.id} className="have-sm" />
      </div>
    </li>
  );
}

/**
 * Homepage hero: the configurable story from data/featured.json (headline, dek, link), a real retailer photo of the named
 * player's jersey with the rank from the latest report, and quick routes to what's selling, who's trending and where to buy.
 * The H1 stays the site's long-standing title.
 */
export function HeroStory({ leagues }: { leagues: { league: League; ranking: Ranking }[] }) {
  const h = getHero();
  if (!h) return null;
  const { player, product, team, league, appearance } = h;
  const tc = team?.colors ?? { primary: "#d7a849", secondary: "#20252b", accent: "#ffffff" };
  return (
    <section className="gd-hero" aria-labelledby="home-h1" style={{ "--tc": tc.primary, "--tc2": tc.secondary } as React.CSSProperties}>
      <div className="wrap gd-hero-in">
        <div className="gd-hero-copy">
          <p className="gd-kicker">{h.kicker}</p>
          <p className="gd-display">{h.headline}</p>
          <h1 id="home-h1" className="gd-h1">Top selling sports jerseys in every league</h1>
          <p className="gd-dek">{h.dek}</p>
          <div className="gd-ctas">
            <Link className="gd-btn" href={h.cta.href}>{h.cta.label} <span aria-hidden="true">→</span></Link>
            <Link className="gd-btn is-line" href="/trending/">Who&apos;s trending</Link>
            <Link className="gd-btn is-line" href="/shop/">Where to buy</Link>
          </div>
          <nav className="gd-chips" aria-label="Jump to a league">
            {leagues.map(({ league: l }) => <Link key={l.id} href={`/${l.slug}/`} style={{ "--lg": l.accent } as React.CSSProperties}>{l.name}</Link>)}
            <Link href="/cities/" className="is-city">Jerseys by city</Link>
          </nav>
          <p className="gd-updated"><span className="gd-dot" aria-hidden="true" />Updated {fmtShortDate(h.updated)}</p>
        </div>
        {player && product?.image && (
          <figure className="gd-photo">
            <span className="gd-bignum" aria-hidden="true">{appearance?.rank ?? ""}</span>
            <img {...jerseyImg(product.image.url, 560)} alt={product.image.alt} width={560} height={560} loading="eager" fetchPriority="high" decoding="async" />
            <figcaption>
              {appearance && league && <span className="gd-rank">No. {appearance.rank} · {league.name}</span>}
              <Link href={`/players/${player.slug}/`} className="gd-who">{player.name}</Link>
              <span className="gd-team">{team?.name} jersey{appearance ? ` · ${appearance.ranking.title}` : ""}</span>
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

/** Rank changes between two comparable published reports. Leagues without an earlier comparable report are named, not guessed. */
export function TrendingNow() {
  const risers = topRisers(5);
  const fresh = newEntries(5);
  const repeat = repeatLeaders();
  const { compared, uncompared } = getTrends();
  if (!compared.length) return null;
  const row = (league: League, playerId: string, right: React.ReactNode, key: string) => {
    const p = getPlayer(playerId)!;
    return (
      <li key={key}>
        <span className="tr-lg" style={{ "--lg": league.accent } as React.CSSProperties}>{league.name}</span>
        <Link href={`/players/${p.slug}/`}>{p.name}</Link>
        {right}
      </li>
    );
  };
  return (
    <section className="wrap section trend-light" id="trending" aria-labelledby="trend-h">
      <div>
        <div className="sec-head">
          <p className="sec-k">Who&apos;s moving up</p>
          <h2 id="trend-h" className="sec-h">Trending now</h2>
          <Link className="sec-more" href="/trending/">All movers →</Link>
        </div>
        <div className="trend-grid is-light is-3">
          <div className="trend-box is-hot">
            <h3>Biggest risers</h3>
            <ol>{risers.map((r) => row(r.league, r.playerId, <span className="tr-mv"><s>{r.previousRank}</s> → <b>{r.rank}</b> <em className="up">▲{r.delta}</em></span>, r.league.id + r.playerId))}</ol>
          </div>
          <div className="trend-box">
            <h3>New to the lists</h3>
            <ol>{fresh.map((r) => row(r.league, r.playerId, <span className="tr-mv"><b>No. {r.rank}</b> <em className="new">New</em></span>, r.league.id + r.playerId))}</ol>
          </div>
          <div className="trend-box">
            <h3>Still No. 1</h3>
            {repeat.length ? (
              <ol>{repeat.map((r) => row(r.league, r.playerId, <span className="tr-mv"><b>No. 1</b> again</span>, r.league.id))}</ol>
            ) : <p className="trend-empty">No league has the same No. 1 on its last two comparable lists.</p>}
            <p className="trend-note">
              Compared: {compared.map((c) => `${c.league.name}, the ${fmtShortDate(c.ranking.publishedDate)} list against the ${fmtShortDate(c.movement.previous.publishedDate)} list`).join("; ")}.
              {" "}{uncompared.map((u) => u.league.name).join(", ")} {uncompared.length === 1 ? "has" : "have"} no comparable earlier list yet, so no movement is shown.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductImage } from "@/components/ProductImage";
import { ShopButton } from "@/components/ShopButton";
import { StatsPanel } from "@/components/PlayerBits";
import { AffiliateNote } from "@/components/RankingHeader";
import { PriceTag } from "@/components/PriceTag";
import { TrustNote } from "@/components/TrustNote";
import { TeamLink } from "@/components/TeamLink";
import { HaveJersey } from "@/components/HaveJersey";
import { FanForms } from "@/components/FanForms";
import { PriceAlert } from "@/components/PriceAlert";
import { StickyShop } from "@/components/StickyShop";
import { DealsBar } from "@/components/Deals";
import { JsonLd } from "@/components/JsonLd";
import { HouseAd } from "@/components/HouseAd";
import { adsFor } from "@/lib/houseAds";
import {
  getPlayers, getPlayerBySlug, getLeague, getTeam, getAppearances, getStatLine, getProducts, getPlayer,
  isIndexable, teamLabel, teamPlayers, loadStore,
} from "@/lib/data";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { abs, site } from "@/lib/config";
import { age, fmtDate, fmtShortDate, period } from "@/lib/format";
import { getProfile } from "@/lib/profiles";
import { playerTitle, playerDescription, playerIntro, playerFaq } from "@/lib/playerSeo";

export const dynamicParams = false;
export function generateStaticParams() {
  return getPlayers().map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPlayerBySlug((await params).slug);
  if (!p) return {};
  const league = getLeague(p.leagues[0])!;
  const top = getAppearances(p.id)[0];
  const team = getTeam(p.teamId ?? p.lastTeamId);
  const ctx = { player: p, league, team, latest: top, line: getStatLine(p.id) };
  const title = playerTitle(ctx);
  const description = playerDescription(ctx);
  return pageMeta({ title, description, path: `/players/${p.slug}/`, noindex: !isIndexable(p), type: "profile", image: `/players/${p.slug}/opengraph-image/` });
}

export default async function PlayerPage({ params }: Props) {
  const player = getPlayerBySlug((await params).slug);
  if (!player) notFound();
  const league = getLeague(player.leagues[0])!;
  const team = getTeam(player.teamId ?? player.lastTeamId);
  const appearances = getAppearances(player.id);
  const latest = appearances[0];
  const line = getStatLine(player.id);
  const allLines = loadStore().stats.filter((s) => s.playerId === player.id && !s.isDemo).sort((a, b) => (b.throughDate ?? "").localeCompare(a.throughDate ?? ""));
  const products = getProducts(player.id);
  const jersey = products.find((p) => p.productType === "jersey");
  const primary = jersey ? productOffer(jersey) : searchOffer(player, team);
  const search = searchOffer(player, team);
  const page = `player_${player.id}`;
  const profile = getProfile(player.id);

  // Related players: same current or last team first, then neighbors in the same ranking. Both are stated relationships.
  const teammates = team ? teamPlayers(team.id).filter((p) => p.id !== player.id) : [];
  const neighbors = latest
    ? latest.ranking.entries.filter((e) => Math.abs(e.rank - latest.rank) <= 3 && e.playerId !== player.id).map((e) => ({ p: getPlayer(e.playerId)!, rank: e.rank }))
    : [];

  const rankOf = (id: string) => latest?.ranking.entries.find((e) => e.playerId === id)?.rank;
  const seo = { player, league, team, latest, line };
  const intro = playerIntro(seo);
  // The hero shows the season stats in full just below, so its intro leaves out the one-line stat summary.
  const heroIntro = playerIntro({ ...seo, line: undefined });
  const faq = playerFaq(seo);
  const url = abs(`/players/${player.slug}/`);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        name: `${player.name} Jersey`,
        description: intro,
        dateModified: player.lastVerified,
        inLanguage: "en-US",
        primaryImageOfPage: abs(`/players/${player.slug}/opengraph-image/`),
        mainEntity: { "@id": `${url}#person` },
      },
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: player.name,
        url,
        image: abs(`/players/${player.slug}/opengraph-image/`),
        jobTitle: `${league.sport} player (${player.position})`,
        ...(player.birthday ? { birthDate: player.birthday } : {}),
        ...(team ? { [player.teamId ? "memberOf" : "alumniOf"]: { "@type": "SportsTeam", name: team.name, sport: league.sport, memberOf: { "@type": "SportsOrganization", name: league.fullName } } } : {}),
        ...(player.sources.length ? { sameAs: player.sources.filter((s) => s.includes("wikipedia.org")).slice(0, 1) } : {}),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <SiteHeader active={league.id} />
      <main id="main" className="has-sticky" data-page-type="player" data-league={league.id} data-player={player.id}>
        <DealsBar league={league.id} page={page} />
        <section className="phero">
          <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: `Top Selling ${league.name} Jerseys`, href: `/${league.slug}/` }, { name: player.name, href: `/players/${player.slug}/` }]} />
          <div className={`wrap phero-in${jersey?.image ? "" : " no-img"}`} style={{ marginTop: 14 }}>
            {jersey?.image && <ProductImage player={player} team={team} product={jersey} priority />}
            <div>
              {latest && <p className="eyebrow">No. {latest.rank} on the Top Selling {league.name} Jerseys list</p>}
              <h1 className="p-h1" style={{ marginTop: 8 }}>{player.name} <span className="h1-tag">Jersey</span></h1>
              <p className="p-meta" style={{ marginTop: 8 }}>
                <span><strong>{teamLabel(player)}</strong></span>
                <span>{league.name}</span>
                <span>{player.position}</span>
                {player.number && <span>No. {player.number}</span>}
              </p>
              {heroIntro && <p className="p-intro">{heroIntro}</p>}
              {player.overview && <p className="lede p-overview">{player.overview}</p>}
              <dl className="facts">
                <div><dt>Team</dt><dd>{team?.name ?? "—"}</dd></div>
                <div><dt>Position</dt><dd>{player.position}</dd></div>
                <div><dt>Number</dt><dd>{player.number ?? "—"}</dd></div>
                <div><dt>Born</dt><dd>{player.birthday ? fmtDate(player.birthday) : "Not verified"}</dd></div>
                <div><dt>Age</dt><dd>{player.birthday ? age(player.birthday, site.lastReviewed) : "—"}</dd></div>
                <div><dt>Status</dt><dd>{player.status}</dd></div>
              </dl>
            </div>
            <aside className="buybox" aria-labelledby="buy-h">
              <h2 id="buy-h">Shop {player.name} Jerseys</h2>
              {jersey && <PriceTag product={jersey} />}
              {primary ? (
                <>
                  <ShopButton offer={primary} ctx={{ league: league.id, playerId: player.id, rank: latest?.rank, placement: "player_hero", page }}>
                    Shop {player.name} Jerseys
                  </ShopButton>
                  <TrustNote merchant={primary.merchantName} />
                  {primary.kind === "search" && <p className="shop-note">Opens {primary.merchantName} with every {player.name} jersey style, size and price.</p>}
                </>
              ) : (
                <p className="shop-note">No retailer link is available yet.</p>
              )}
              <HaveJersey name={player.name} league={league.id} />
              {team && player.teamId && <TeamLink team={team} ctx={{ league: league.id, playerId: player.id, rank: latest?.rank, placement: "player_hero_team", page }} />}
              <PriceAlert playerId={player.id} playerName={player.name} />
              <AffiliateNote />
            </aside>
            <div className="phero-extra">
              <section aria-labelledby="st-h1">
                <h2 id="st-h1" className="phero-h">{line ? `${line.season}${line.competition === "postseason" ? " postseason" : ""} stats` : "Stats"}</h2>
                <StatsPanel line={line} />
                {line?.source && <p className="shop-note">Source: <a href={line.source} target="_blank" rel="noopener nofollow">{new URL(line.source).hostname.replace(/^www\./, "")}</a>, checked {fmtShortDate(line.updatedAt)}</p>}
              </section>
              <section aria-labelledby="hl-h">
                <h2 id="hl-h" className="phero-h">Highlights</h2>
                <ul className="highlights">
                  {player.highlights.map((h, i) => (
                    <li key={i}>
                      {h.text}
                      {h.source && <> <a className="shop-note" href={h.source} target="_blank" rel="noopener nofollow">Source</a></>}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </section>

        <div className="wrap cols">
          <div>
            {profile && (
              <section className="block profile" aria-labelledby="ab-h">
                <h2 id="ab-h">About {player.name}</h2>
                <div className="prose">
                  {profile.intro.map((p, i) => <p key={i}>{p}</p>)}
                  <h3>Why the {player.name} jersey stands out</h3>
                  <ul className="jersey-points">
                    {profile.jerseyPoints.map((j) => <li key={j.label}><strong>{j.label}.</strong> {j.text}</li>)}
                  </ul>
                  <p>{profile.closing}</p>
                </div>
              </section>
            )}

            {allLines.length > 1 && (
              <section className="block" aria-labelledby="st-h">
                <h2 id="st-h">Stat history</h2>
                <div className="table-wrap">
                  <table className="table">
                    <caption className="sr-only">All stat lines on file</caption>
                    <thead><tr><th>Season</th><th>Team</th><th>Numbers</th><th>Through</th></tr></thead>
                    <tbody>
                      {allLines.map((s) => (
                        <tr key={`${s.season}-${s.competition}`}>
                          <td>{s.season}{s.competition === "postseason" ? " postseason" : ""}</td>
                          <td>{getTeam(s.teamId)?.name}</td>
                          <td>{s.statistics.map((x) => `${x.label} ${x.value}`).join(" · ")}</td>
                          <td>{fmtShortDate(s.throughDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="block" aria-labelledby="shop-h">
              <h2 id="shop-h">Where to buy {player.name} jerseys</h2>
              {products.length > 0 ? (
                <div className="products">
                  {products.map((p) => {
                    const o = productOffer(p);
                    return (
                      <article className="product" key={p.id}>
                        <ProductImage player={player} team={team} product={p} />
                        <div className="product-body">
                          <strong>{p.title}</strong>
                          {p.price !== null && p.currency && <span>{new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(p.price)}</span>}
                          <span className="shop-note">
                            {p.availability === "in-stock" ? "In stock" : p.availability === "out-of-stock" ? "Out of stock" : p.availability === "preorder" ? "Preorder" : "Availability not confirmed"}
                            {" · "}checked {fmtShortDate(p.lastVerified)}
                          </span>
                          {o && <ShopButton offer={o} ctx={{ league: league.id, playerId: player.id, rank: latest?.rank, placement: "player_products", page }}>View at {o.merchantName}</ShopButton>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <p>We have not verified individual product listings for {player.name} yet, so we do not show prices or stock.</p>
                  {search && (
                    <ShopButton offer={search} ctx={{ league: league.id, playerId: player.id, rank: latest?.rank, placement: "player_empty_state", page }} variant="ghost">
                      {search.label}
                    </ShopButton>
                  )}
                </div>
              )}
              <AffiliateNote />
            </section>

            <section className="block" aria-labelledby="rh-h">
              <h2 id="rh-h">Ranking history</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Rank</th><th>Report</th><th>Published</th><th>Sales period</th><th>Source</th></tr></thead>
                  <tbody>
                    {appearances.map(({ ranking, rank }) => (
                      <tr key={ranking.id}>
                        <td className="num" style={{ fontSize: 18, fontWeight: 700 }}>{rank}</td>
                        <td><Link href={`/rankings/${ranking.league}/${ranking.id}/`}>{ranking.title}</Link></td>
                        <td>{fmtShortDate(ranking.publishedDate)}</td>
                        <td>{period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel)}</td>
                        <td><a href={ranking.sourceUrl} target="_blank" rel="noopener">{ranking.publisher}</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="block" aria-labelledby="faq-h">
              <h2 id="faq-h">{player.name} jersey FAQ</h2>
              <div className="faq">
                {faq.map((f) => (
                  <details key={f.q} open>
                    <summary><h3 className="faq-q">{f.q}</h3></summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>

            <FanForms player={player.name} page={`/players/${player.slug}/`} league={league.id} />
          </div>

          <aside className="side">
            {neighbors.length > 0 && (
              <section className="side-box" aria-labelledby="nb-h">
                <h2 id="nb-h">Near {player.name} on the {league.name} list</h2>
                <ul className="linklist">
                  {neighbors.map(({ p, rank }) => (
                    <li key={p.id}><Link href={`/players/${p.slug}/`}><span>{p.name}</span><span className="r">No. {rank}</span></Link></li>
                  ))}
                </ul>
              </section>
            )}
            {teammates.length > 0 && team && (
              <section className="side-box" aria-labelledby="tm-h">
                <h2 id="tm-h">Also ranked from the {team.name}</h2>
                <ul className="linklist">
                  {teammates.map((p) => (
                    <li key={p.id}><Link href={`/players/${p.slug}/`}><span>{p.name}</span><span className="r">{rankOf(p.id) ? `No. ${rankOf(p.id)}` : p.position}</span></Link></li>
                  ))}
                </ul>
              </section>
            )}
            {latest && (
              <section className="side-box" aria-labelledby="all-h">
                <h2 id="all-h">All Top Selling {league.name} Jerseys</h2>
                <ol className="linklist all-list">
                  {latest.ranking.entries.map((e) => {
                    const p = getPlayer(e.playerId)!;
                    return <li key={e.playerId}>{p.id === player.id ? <span className="here"><span>{p.name} Jersey</span><span className="r">No. {e.rank}</span></span> : <Link href={`/players/${p.slug}/`}><span>{p.name} Jersey</span><span className="r">No. {e.rank}</span></Link>}</li>;
                  })}
                </ol>
              </section>
            )}
            <HouseAd ad={adsFor(league.id)[0]} at="player_side" />
            <section className="side-box">
              <h2>Full ranking</h2>
              <Link className="btn-ghost" href={`/${league.slug}/#rank-${latest?.rank ?? 1}`}>Top Selling {league.name} Jerseys</Link>
              <p className="shop-note">Player details last verified {fmtDate(player.lastVerified)}.</p>
            </section>
          </aside>
        </div>
        <JsonLd data={ld} />
        {primary && <StickyShop offer={primary} name={player.name} sub={`${latest ? `No. ${latest.rank} ` : ""}${league.name} · ${team?.name ?? player.status}`} ctx={{ league: league.id, playerId: player.id, rank: latest?.rank, placement: "sticky_mobile", page }} />}
      </main>
    </>
  );
}

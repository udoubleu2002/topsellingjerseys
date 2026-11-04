import Link from "next/link";
import type { League } from "@/lib/schema";
import { getAnyTeam, getTeam } from "@/lib/data";
import { productOffer, searchOffer, outPath, type Offer } from "@/lib/affiliate";
import type { CityPick, CityRow, CityStory } from "@/lib/cities";
import { fmtShortDate } from "@/lib/format";
import { jerseyImg } from "@/lib/img";

const money = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c, maximumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const FALLBACK = { primary: "#334155", secondary: "#ffffff", accent: "#94a3b8" };

function offerFor(row: Pick<CityRow, "player" | "teamId" | "product">): Offer | null {
  return row.product ? productOffer(row.product) : searchOffer(row.player, getTeam(row.teamId));
}

/** Outbound Lids link with the same tracking attributes as ShopButton. */
function OutLink({ offer, at, page, league, playerId, className, children, label }: { offer: Offer; at: string; page: string; league: string; playerId?: string; className?: string; children: React.ReactNode; label?: string }) {
  return (
    <a
      className={className}
      href={`${outPath(offer.id)}?at=${encodeURIComponent(at)}`}
      target="_blank"
      rel="sponsored nofollow noopener"
      aria-label={label}
      data-track="affiliate_click"
      data-offer={offer.id}
      data-offer-kind={offer.kind}
      data-merchant={offer.merchantId}
      data-league={league}
      data-player={playerId}
      data-placement={at}
      data-page={page}
    >
      {children}
    </a>
  );
}

/**
 * Banner ad for the most famous player on a city's sport list: their Lids jersey photo in team colors, linking to that jersey
 * at Lids (or a Lids search for them when the feed has no jersey yet).
 */
export function PlayerBanner({ row, league, cityName, page }: { row: Pick<CityRow, "player" | "teamId" | "product"> & { rank?: number }; league: League; cityName: string; page: string }) {
  const offer = offerFor(row);
  if (!offer) return null;
  const team = getAnyTeam(row.teamId);
  const c = getTeam(row.teamId)?.colors ?? FALLBACK;
  const img = row.product?.image;
  const price = row.product?.price != null && row.product.currency ? money(row.product.price, row.product.currency) : null;
  return (
    <div className="pbanner-wrap">
      <span className="lids-ad-label">Advertisement</span>
      <OutLink
        offer={offer}
        at={`city_banner_${league.id}`}
        page={page}
        league={league.id}
        playerId={row.player.id}
        className="pbanner"
        label={`Shop ${row.player.name} jerseys at Lids`}
      >
        <span className="pbanner-bg" style={{ "--c1": c.primary, "--c2": c.accent } as React.CSSProperties} aria-hidden="true" />
        <span className="pbanner-img">
          {img ? <img {...jerseyImg(img.url, 120)} alt="" loading="lazy" decoding="async" width={120} height={120} /> : <span className="pbanner-num" style={{ color: c.secondary }}>{row.player.number ?? ""}</span>}
        </span>
        <span className="pbanner-copy">
          <span className="pbanner-kicker">{row.rank ? `${cityName}'s No. 1 ${league.name} jersey` : `${cityName} ${league.name} spotlight`}</span>
          <span className="pbanner-name">{row.player.name}</span>
          <span className="pbanner-meta">{team?.name} · {row.rank ? `No. ${row.rank} on the ${league.name} sales list` : row.player.position}</span>
        </span>
        <span className="pbanner-cta">
          {price && <span className="pbanner-price">{price}</span>}
          <span className="pbanner-btn">Shop at Lids</span>
        </span>
      </OutLink>
    </div>
  );
}

/** One row of a city list: position in this list, jersey photo, player, team and league rank, price and a Lids button. */
export function CityList({ rows, page, at, showLeague, start = 1 }: { rows: CityRow[]; page: string; at: string; showLeague?: boolean; start?: number }) {
  return (
    <ol className="clist" start={start}>
      {rows.map((r, i) => {
        const offer = offerFor(r);
        const team = getAnyTeam(r.teamId);
        const c = getTeam(r.teamId)?.colors ?? FALLBACK;
        const img = r.product?.image;
        const price = r.product?.price != null && r.product.currency ? money(r.product.price, r.product.currency) : null;
        const pos = start + i;
        return (
          <li key={r.player.id} className={`crow${pos === 1 ? " is-first" : ""}`}>
            <span className="crow-rank">{pos}</span>
            <Link href={`/players/${r.player.slug}/`} className="crow-img" tabIndex={-1} aria-hidden="true" style={img ? undefined : { backgroundColor: c.primary, color: c.secondary, borderBottomColor: c.accent }}>
              {img ? <img {...jerseyImg(img.url, 64)} alt="" loading="lazy" decoding="async" width={64} height={64} /> : <span>{r.player.number ?? ""}</span>}
            </Link>
            <span className="crow-who">
              <Link href={`/players/${r.player.slug}/`} className="crow-name">{r.player.name}</Link>
              <span className="crow-meta">
                {team?.name} · No. {r.rank} on the {showLeague ? `${r.ranking.league.toUpperCase()} ` : ""}list
              </span>
            </span>
            <span className="crow-end">
              {price && <span className="crow-price">{price}</span>}
              {offer && (
                <OutLink offer={offer} at={at} page={page} league={r.ranking.league} playerId={r.player.id} className="btn-shop btn-sm" label={`Shop ${r.player.name} jerseys at Lids`}>
                  <span className="cta-text">Shop</span>
                </OutLink>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Lids jersey tiles for the city's other players. */
export function CityPicks({ picks, page, at = "city_picks" }: { picks: CityPick[]; page: string; at?: string }) {
  return (
    <div className="cpicks">
      {picks.map((p) => {
        const o = productOffer(p.product);
        if (!o) return null;
        return (
          <OutLink key={p.product.id} offer={o} at={at} page={page} league={p.product.league} playerId={p.player.id} className="cpick" label={`${p.product.title} at Lids`}>
            <span className="cpick-img"><img {...jerseyImg(p.product.image!.url, 240)} alt="" loading="lazy" decoding="async" width={240} height={240} /></span>
            <span className="cpick-body">
              <span className="cpick-name">{p.player.name}</span>
              <span className="cpick-team">{getAnyTeam(p.teamId)?.name}</span>
              <span className="cpick-foot">
                {p.product.price != null && p.product.currency && <strong>{money(p.product.price, p.product.currency)}</strong>}
                <span>Lids →</span>
              </span>
            </span>
          </OutLink>
        );
      })}
    </div>
  );
}

/** Sidebar box with the city's own stories, each with its jersey photo. Nothing when the city has none. */
export function CityStories({ cityName, stories }: { cityName: string; stories: CityStory[] }) {
  if (!stories.length) return null;
  return (
    <section className="rail-box cstories is-local">
      <h2 className="rail-h">{cityName} stories</h2>
      <ul>
        {stories.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="cstory">
              <span className="cstory-img">{s.image ? <img {...jerseyImg(s.image, 64)} alt="" loading="lazy" decoding="async" width={64} height={64} /> : <span>{s.league.toUpperCase()}</span>}</span>
              <span className="cstory-text">
                <span className="cstory-hl">{s.headline}</span>
                <span className="rail-news-meta">{s.league.toUpperCase()} · {fmtShortDate(s.date)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The top three of a city list as editorial cards: a large position number, the jersey photo, the player, team and
 * league rank from the latest sales list, and a quiet Lids link. No. 1 is the largest card.
 */
export function CityPodium({ rows, page, at }: { rows: CityRow[]; page: string; at: string }) {
  return (
    <ol className="cpod">
      {rows.slice(0, 3).map((r, i) => {
        const offer = offerFor(r);
        const team = getAnyTeam(r.teamId);
        const c = getTeam(r.teamId)?.colors ?? FALLBACK;
        const img = r.product?.image;
        const price = r.product?.price != null && r.product.currency ? money(r.product.price, r.product.currency) : null;
        const w = i === 0 ? 260 : 160;
        return (
          <li key={r.player.id} className={`cpod-item${i === 0 ? " is-first" : ""}`}>
            <span className="cpod-num" aria-hidden="true">{i + 1}</span>
            <Link href={`/players/${r.player.slug}/`} className="cpod-img" tabIndex={-1} aria-hidden="true" style={img ? undefined : { backgroundColor: c.primary, color: c.secondary }}>
              {img ? <img {...jerseyImg(img.url, w)} alt="" loading="lazy" decoding="async" width={w} height={w} /> : <span>{r.player.number ?? ""}</span>}
            </Link>
            <span className="cpod-body">
              <span className="cpod-pos">No. {i + 1} in the city</span>
              <Link href={`/players/${r.player.slug}/`} className="cpod-name">{r.player.name}</Link>
              <span className="cpod-meta">{team?.name}</span>
              <span className="cpod-rank">No. {r.rank} on the {r.ranking.league.toUpperCase()} sales list</span>
              <span className="cpod-foot">
                {price && <span className="cpod-price">{price}</span>}
                {offer && (
                  <OutLink offer={offer} at={at} page={page} league={r.ranking.league} playerId={r.player.id} className="cpod-shop" label={`Shop ${r.player.name} jerseys at Lids`}>
                    Shop at Lids <span aria-hidden="true">→</span>
                  </OutLink>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

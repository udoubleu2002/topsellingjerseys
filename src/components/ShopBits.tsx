import Link from "next/link";
import type { League, Product, Ranking } from "@/lib/schema";
import { getLeagues, getTeamDirectory, getPlayer, getProducts, getTeam, entryTeams, getMerchant } from "@/lib/data";
import { teamOffer, outPath, productOffer, searchOffer } from "@/lib/affiliate";
import { productStyle, styleTags } from "@/lib/productStyle";
import { jerseyImg } from "@/lib/img";
import { ShopButton } from "./ShopButton";
import { PriceTag } from "./PriceTag";

/** Every team in every league, each linking to that team's jersey shop at the retailer. */
export function TeamShopDirectory({ placement, page, open }: { placement: string; page: string; open?: string }) {
  return (
    <div className="team-dir">
      {getLeagues().map((league) => {
        const teams = getTeamDirectory(league.id);
        return teams.length > 0 && (
          <details className="team-league" key={league.id} open={open === league.id} style={{ ["--lg" as string]: league.accent }}>
            <summary><span>{league.name}</span><span className="team-count">{teams.length} teams</span></summary>
            <ul>
              {teams.map((t) => {
                const o = teamOffer(t);
                return o && (
                  <li key={t.id}>
                    <a href={`${outPath(o.id)}?at=${placement}`} target="_blank" rel="sponsored nofollow noopener" data-track="affiliate_click" data-offer={o.id} data-offer-kind="team" data-merchant={o.merchantId} data-league={league.id} data-placement={placement} data-page={page}>
                      {t.name}
                    </a>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

/**
 * A shopping card for one ranked player: the retailer's own photo, player, team, style read from the listing title,
 * retailer, verified price only, and a tracked link. Falls back to a retailer search when no listing is on file.
 */
export function ShopCard({ league, ranking, rank, page, placement }: { league: League; ranking: Ranking; rank: number; page: string; placement: string }) {
  const e = ranking.entries[rank - 1];
  const p = getPlayer(e.playerId)!;
  const { reportTeam } = entryTeams(e, p);
  const jerseys = getProducts(p.id).filter((x) => x.productType === "jersey");
  const product: Product | undefined = jerseys.find((x) => x.image && x.teamId === (p.teamId ?? e.teamIdAtReport)) ?? jerseys.find((x) => x.image) ?? jerseys[0];
  const offer = product ? productOffer(product) : searchOffer(p, getTeam(p.teamId ?? p.lastTeamId));
  if (!offer) return null;
  const tags = product ? styleTags(productStyle(product)) : [];
  const team = getTeam(product?.teamId ?? p.teamId ?? p.lastTeamId) ?? reportTeam;
  const merchant = getMerchant(offer.merchantId);
  return (
    <li className="shopcard" style={{ "--tc": team?.colors.primary ?? league.accent } as React.CSSProperties}>
      <span className="shopcard-rank">No. {rank} <small>{league.name}</small></span>
      <span className="shopcard-art">
        {product?.image
          ? <img {...jerseyImg(product.image.url, 280)} alt={product.image.alt} width={280} height={280} loading="lazy" decoding="async" />
          : <span className="shopcard-noimg">Photo at retailer</span>}
      </span>
      <span className="shopcard-body">
        <Link className="shopcard-name" href={`/players/${p.slug}/`}>{p.name}</Link>
        <span className="shopcard-team">{team?.name ?? p.status}</span>
        {tags.length > 0 && <span className="shopcard-tags">{tags.map((t) => <span key={t}>{t}</span>)}</span>}
        {product && <PriceTag product={product} />}
        <span className="shopcard-ret">{product ? `Sold by ${merchant?.name ?? offer.merchantName}` : `Search results at ${merchant?.name ?? offer.merchantName}`}</span>
      </span>
      <ShopButton offer={offer} variant="small" ctx={{ league: league.id, playerId: p.id, rank, placement, page }}>
        {product ? "Shop this jersey" : "Find this jersey"}
      </ShopButton>
    </li>
  );
}

import Link from "next/link";
import type { Ranking } from "@/lib/schema";
import { getPlayer, getTeam, getStatLine, getProducts, rankMovement, teamLabel as labelFor } from "@/lib/data";
import { productOffer, searchOffer } from "@/lib/affiliate";
import { ProductImage } from "./ProductImage";
import { ShopButton } from "./ShopButton";
import { HaveJersey } from "./HaveJersey";
import { PriceTag } from "./PriceTag";
import { TrustNote } from "./TrustNote";
import { TeamLink } from "./TeamLink";
import { Highlights, StatsPanel } from "./PlayerBits";
import { fmtShortDate } from "@/lib/format";

export function RankingCard({ ranking, rank, playerId, leagueName, page }: { ranking: Ranking; rank: number; playerId: string; leagueName: string; page: string }) {
  const player = getPlayer(playerId)!;
  const team = getTeam(player.teamId ?? player.lastTeamId);
  const products = getProducts(player.id).filter((p) => p.productType === "jersey");
  const offer = products.length ? productOffer(products[0]) : searchOffer(player, team);
  const move = rankMovement(ranking, player.id);
  const href = `/players/${player.slug}/`;
  const teamLabel = labelFor(player);
  return (
    <li className={`rcard${rank === 1 ? " is-first" : ""}`} id={`rank-${rank}`} data-impression="player_card" data-league={ranking.league} data-player={player.id} data-rank={rank}>
      <article className="rcard-in" aria-labelledby={`p-${player.id}`}>
        <div className="rank-col">
          <span className="rank-num" aria-label={`Rank ${rank}`}>{rank}</span>
          {move && move.delta !== null && move.delta !== 0 && (
            <span className={`rank-move ${move.delta > 0 ? "up" : "down"}`}>{move.delta > 0 ? `▲ ${move.delta}` : `▼ ${-move.delta}`}</span>
          )}
          {move && move.previousRank === null && <span className="rank-move">New</span>}
        </div>
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <ProductImage player={player} team={team} product={products[0]} priority={rank <= 2} />
        </Link>
        <div className="body-col">
          <div className="p-ident">
            <h2 className="p-name" id={`p-${player.id}`}><Link href={href}>{player.name}</Link></h2>
            <p className="p-meta">
              <span><strong>{teamLabel}</strong></span>
              <span>{leagueName}</span>
              <span>{player.position}</span>
              {player.number && <span>No. {player.number}</span>}
              {player.birthday && <span>Born {fmtShortDate(player.birthday)}</span>}
            </p>
          </div>
          <Highlights player={player} />
          <StatsPanel line={getStatLine(player.id)} compact />
        </div>
        <div className="shop-col">
          <span className="shop-label">Shop</span>
          {offer ? (
            <ShopButton offer={offer} ctx={{ league: ranking.league, playerId: player.id, rank, placement: "ranking_card", page }}>
              Shop {player.name} Jerseys
            </ShopButton>
          ) : (
            <p className="shop-note">No verified retailer listing yet.</p>
          )}
          {products[0] && <PriceTag product={products[0]} />}
          <TrustNote merchant={offer?.merchantName} />
          <HaveJersey name={player.name} league={ranking.league} />
          <Link className="btn-ghost" href={href}>Player profile</Link>
          {team && player.teamId && <TeamLink team={team} ctx={{ league: ranking.league, playerId: player.id, rank, placement: "ranking_card_team", page }} />}
        </div>
      </article>
    </li>
  );
}

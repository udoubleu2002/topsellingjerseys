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
  // Same stats as the homepage list: "G" is games played in the NFL, NBA and MLB but goals in the NHL and MLS.
  const skip = ranking.league === "nhl" || ranking.league === "mls" ? ["GP", "GS", "MIN"] : ["GP", "G", "GS", "MIN"];
  const quick = getStatLine(player.id)?.statistics.filter((s) => !skip.includes(s.label)).slice(0, 4) ?? [];
  const c = team?.colors ?? { primary: "#e5e7eb", secondary: "#334155", accent: "#94a3b8" };
  const photo = products[0]?.image ? products[0] : undefined;
  // A compact row that opens to the full card; the name goes straight to the player page.
  return (
    <li className={`rrow${rank === 1 ? " is-first" : ""}`} id={`rank-${rank}`} data-impression="player_card" data-league={ranking.league} data-player={player.id} data-rank={rank}>
      <details className="rdet">
        <summary className="lrow">
          <span className="lrow-rank" aria-label={`Rank ${rank}`}>{rank}</span>
          <span className="lrow-tile" style={{ backgroundColor: c.primary, color: c.secondary, borderBottomColor: c.accent }} aria-hidden="true">{player.number ?? ""}</span>
          <span className="lrow-who">
            <span><span className="lrow-name" id={`p-${player.id}`}>{player.name}</span>
              {move && move.delta !== null && move.delta !== 0 && <span className={`rank-move ${move.delta > 0 ? "up" : "down"}`}>{move.delta > 0 ? ` ▲ ${move.delta}` : ` ▼ ${-move.delta}`}</span>}
              {move && move.previousRank === null && <span className="rank-move"> New</span>}</span>
            <span className="lrow-team">{teamLabel} · {player.position}{player.number ? ` · No. ${player.number}` : ""}</span>
            {quick.length > 0 && <span className="lrow-stats">{quick.map((s) => `${s.value} ${s.label}`).join(" · ")}</span>}
          </span>
          <span className="rrow-end">
            <HaveJersey name={player.name} league={ranking.league} className="have-sm" />
            {offer && (
              <ShopButton offer={offer} variant="small" ctx={{ league: ranking.league, playerId: player.id, rank, placement: "ranking_row", page }}>
                <span className="sr-only">Shop {player.name} Jerseys</span><span aria-hidden="true">Shop</span>
              </ShopButton>
            )}
            <span className="rchev" aria-hidden="true" />
            <span className="sr-only">Show details</span>
          </span>
        </summary>
        <article className={`rcard-in rexp${photo ? "" : " no-img"}`} aria-labelledby={`p-${player.id}`}>
          {photo && <Link href={href} tabIndex={-1} aria-hidden="true"><ProductImage player={player} team={team} product={photo} priority={rank <= 2} /></Link>}
          <div className="body-col">
            <p className="p-meta">
              <span><strong>{teamLabel}</strong></span>
              <span>{leagueName}</span>
              <span>{player.position}</span>
              {player.number && <span>No. {player.number}</span>}
              {player.birthday && <span>Born {fmtShortDate(player.birthday)}</span>}
            </p>
            <Highlights player={player} />
            <StatsPanel line={getStatLine(player.id)} compact />
          </div>
          <div className="shop-col">
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
      </details>
    </li>
  );
}

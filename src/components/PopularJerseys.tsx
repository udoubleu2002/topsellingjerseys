import Link from "next/link";
import { getProducts, getTeam } from "@/lib/data";
import { productOffer } from "@/lib/affiliate";
import { priorityPlayers } from "@/lib/buyerIntent";
import { promotableJerseys } from "@/lib/stories";
import { ShopButton } from "./ShopButton";
import { JerseyThumb } from "./HomeBits";

/**
 * "Popular jerseys right now": players fans search for when they are ready to buy (data/buyer-intent.json), each linked
 * as "<Player> jersey" to their page, with a tracked shop link to the jersey shown. Not a sales ranking, and it says so.
 */
export function PopularJerseys({ league, exclude = [], page, boxClass = "rail-box", n = 5 }: { league?: string; exclude?: string[]; page: string; boxClass?: string; n?: number }) {
  const inLeague = league ? priorityPlayers({ league, exclude, n }) : [];
  const players = inLeague.length >= 3 ? inLeague : priorityPlayers({ exclude, n });
  if (players.length < 3) return null;
  return (
    <section className={`${boxClass} pop-jerseys`} aria-labelledby={`pop-h-${page}`}>
      <h2 id={`pop-h-${page}`} className={boxClass === "rail-box" ? "rail-h" : undefined}>Popular jerseys right now</h2>
      <ul className="pop-list">
        {players.map((p) => {
          const product = promotableJerseys(getProducts(p.id), p)[0];
          const offer = product ? productOffer(product) : null;
          return (
            <li key={p.id}>
              <JerseyThumb player={p} teamId={p.teamId} size={40} className="pop-thumb" />
              <span className="pop-body">
                <Link href={`/players/${p.slug}/`}>{p.name} jersey</Link>
                <span className="pop-team">{getTeam(p.teamId ?? p.lastTeamId)?.name}</span>
              </span>
              {offer && <ShopButton offer={offer} variant="small" ctx={{ league: p.leagues[0], playerId: p.id, placement: "popular_jerseys", page }}>Shop</ShopButton>}
            </li>
          );
        })}
      </ul>
      <p className="rail-asof">Jerseys fans are shopping for, by search demand. Not a sales ranking.</p>
    </section>
  );
}

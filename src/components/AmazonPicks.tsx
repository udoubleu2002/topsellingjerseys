import { withAffiliate } from "@/lib/affiliate";
import { AMAZON_PICKS, amazonOffer } from "@/lib/amazonPicks";
import { ShopButton } from "./ShopButton";

/** Display, storage and care gear for a jersey, linking to Amazon searches. See src/lib/amazonPicks.ts. */
export function AmazonPicks({ id, kicker, title, dek, page, picks }: { id: string; kicker: string; title: string; dek: string; page: string; picks?: string[] }) {
  const list = picks ? AMAZON_PICKS.filter((p) => picks.includes(p.id)) : AMAZON_PICKS;
  return (
    <section id={id} className="wrap section amz-picks" aria-labelledby={`${id}-h`}>
      <div className="sec-head">
        <p className="sec-k">{kicker}</p>
        <h2 id={`${id}-h`} className="sec-h">{title}</h2>
      </div>
      <p className="amz-dek">{dek}</p>
      <ul className="amz-grid">
        {list.map((pick) => {
          const offer = amazonOffer(pick, withAffiliate);
          if (!offer) return null;
          return (
            <li key={pick.id} className="amz-card">
              <strong>{pick.name}</strong>
              <p>{pick.blurb}</p>
              <ShopButton offer={offer} variant="small" ctx={{ league: "all", playerId: "", placement: `amazon_${pick.id.replace(/-/g, "_")}`, page }}>See options on Amazon</ShopButton>
            </li>
          );
        })}
      </ul>
      <p className="disclosure">As an Amazon Associate we earn from qualifying purchases.</p>
    </section>
  );
}

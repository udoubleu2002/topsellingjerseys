import { getActivePromotions, getMerchant } from "@/lib/data";
import { promoOffer } from "@/lib/affiliate";
import { fmtShortDate } from "@/lib/format";
import { CopyCode } from "./CopyCode";
import { ShopButton } from "./ShopButton";

/**
 * Current retailer promotions from data/promotions.json. Renders nothing when no promotion is running,
 * and each bar hides itself in the browser once its end date passes.
 */
export function DealsBar({ league, page }: { league?: string; page: string }) {
  const promos = getActivePromotions(league);
  if (!promos.length) return null;
  return (
    <aside className="deals wrap" aria-label="Current deals">
      {promos.map((p) => {
        const offer = promoOffer(p);
        return (
          <div className="deal" key={p.id} data-ends={p.endDate}>
            <span className="deal-tag">Deal</span>
            <div className="deal-body">
              <strong>{p.headline}</strong>
              <span>
                {p.details ? `${p.details} ` : ""}Ends {fmtShortDate(p.endDate)} at {getMerchant(p.merchantId)?.name}.
              </span>
            </div>
            {p.code && <CopyCode code={p.code} />}
            {offer && <ShopButton offer={offer} variant="small" ctx={{ league: league ?? "all", playerId: "", placement: "deals_bar", page }}>Shop the deal</ShopButton>}
          </div>
        );
      })}
      <p className="disclosure">We may earn a commission on purchases through these deals, at no cost to you.</p>
    </aside>
  );
}

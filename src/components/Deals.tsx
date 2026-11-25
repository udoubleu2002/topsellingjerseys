import { getScheduledPromotions, getMerchant } from "@/lib/data";
import { promoDay } from "@/lib/promoDay";
import { promoOffer } from "@/lib/affiliate";
import { fmtShortDate } from "@/lib/format";
import { CopyCode } from "./CopyCode";
import { ShopButton } from "./ShopButton";

/**
 * Retailer promotions from data/promotions.json. Pages are static, so this renders today's deals plus the ones starting
 * in the next few days (hidden), and the browser shows each only between its dates in US Eastern time.
 */
export function DealsBar({ league, page }: { league?: string; page: string }) {
  const today = promoDay();
  const promos = getScheduledPromotions(league, today);
  if (!promos.length) return null;
  const live = (p: (typeof promos)[number]) => p.startDate <= today && p.endDate >= today;
  return (
    <aside className="deals wrap" aria-label="Current deals" data-deals hidden={!promos.some(live)}>
      {promos.map((p) => {
        const offer = promoOffer(p);
        return (
          <div className="deal" key={p.id} data-starts={p.startDate} data-ends={p.endDate} hidden={!live(p)}>
            <span className="deal-tag">Deal</span>
            <div className="deal-body">
              <strong>{p.headline}</strong>
              <span>
                {p.details ?? ""}{/\bends\b/i.test(p.details ?? "") ? "" : `${p.details ? " " : ""}Ends ${fmtShortDate(p.endDate)} at ${getMerchant(p.merchantId)?.name}.`}
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

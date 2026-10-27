import { getActivePromotions } from "@/lib/data";
import { DEFAULT_MERCHANT, outPath, promoOffer, type Offer } from "@/lib/affiliate";
import type { Promotion } from "@/lib/schema";

function DealLink({ offer, promo, hidden }: { offer: Offer; promo: Promotion; hidden?: boolean }) {
  return (
    <a
      className="dt-item"
      href={`${outPath(offer.id)}?at=top_bar`}
      target="_blank"
      rel="sponsored nofollow noopener"
      data-track="affiliate_click"
      data-offer={offer.id}
      data-offer-kind={offer.kind}
      data-merchant={offer.merchantId}
      data-league="all"
      data-player=""
      data-placement="top_bar"
      data-ends={promo.endDate}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <span className="dt-head">{promo.headline}</span>
      {promo.code && <span className="dt-code">Code <b>{promo.code}</b></span>}
      <span className="dt-go" aria-hidden="true">→</span>
    </a>
  );
}

/**
 * Today's Lids deals above the masthead (data/promotions.json, refreshed daily from Impact by scripts/fetch-lids-deals.ts).
 * Every link is an affiliate link through /out/. Renders nothing when no deal is running.
 */
export function DealTicker() {
  const promos = getActivePromotions().filter((p) => p.merchantId === DEFAULT_MERCHANT);
  const items = promos.map((p) => ({ p, o: promoOffer(p) })).filter((x): x is { p: Promotion; o: Offer } => Boolean(x.o));
  if (!items.length) return null;
  const scroll = items.length >= 3;
  return (
    <aside className="dealtick" aria-label="Today's Lids deals">
      <div className="wrap dt-in">
        <span className="dt-label">
          <span className="dt-tag">Lids deals</span>
          <span className="dt-ad" title="We may earn a commission on purchases through these links, at no cost to you.">Ad</span>
        </span>
        <div className={`dt-track${scroll ? " dt-scroll" : ""}`}>
          <div className="dt-list" style={scroll ? ({ "--dt-dur": `${items.length * 7}s` } as React.CSSProperties) : undefined}>
            {items.map(({ p, o }) => <DealLink key={p.id} offer={o} promo={p} />)}
            {scroll && items.map(({ p, o }) => <DealLink key={`dup-${p.id}`} offer={o} promo={p} hidden />)}
          </div>
        </div>
      </div>
    </aside>
  );
}

import type { Offer } from "@/lib/affiliate";
import { outPath } from "@/lib/affiliate";

export interface TrackContext { league: string; playerId: string; rank?: number; placement: string; page: string }

/** Outbound shopping link. Tracked by the analytics listener through data attributes; no client JS needed here. */
export function ShopButton({ offer, ctx, children, variant = "primary" }: { offer: Offer; ctx: TrackContext; children: React.ReactNode; variant?: "primary" | "ghost" | "small" }) {
  return (
    <a
      className={variant === "primary" ? "btn-shop" : variant === "small" ? "btn-shop btn-sm" : "btn-ghost"}
      href={outPath(offer.id)}
      target="_blank"
      rel="sponsored nofollow noopener"
      data-track="affiliate_click"
      data-offer={offer.id}
      data-offer-kind={offer.kind}
      data-merchant={offer.merchantId}
      data-league={ctx.league}
      data-player={ctx.playerId}
      data-rank={ctx.rank}
      data-placement={ctx.placement}
      data-page={ctx.page}
      data-cta-experiment="cta_wording"
    >
      <span className="cta-text">{children}</span>
      {variant !== "ghost" && (
        <svg className="cta-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4h9v9M16 4 5 15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </a>
  );
}

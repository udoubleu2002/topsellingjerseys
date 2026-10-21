import type { Offer } from "@/lib/affiliate";
import { ShopButton, type TrackContext } from "./ShopButton";

/** Bottom shop bar on phones so the buy button is always one tap away while reading a profile. */
export function StickyShop({ offer, name, sub, ctx }: { offer: Offer; name: string; sub: string; ctx: TrackContext }) {
  return (
    <div className="sticky-shop" aria-label={`Shop ${name} jerseys`}>
      <div className="sticky-who">
        <strong>{name}</strong>
        <span>{sub}</span>
      </div>
      <ShopButton offer={offer} variant="small" ctx={{ ...ctx, placement: "sticky_mobile" }}>Shop Jerseys</ShopButton>
    </div>
  );
}

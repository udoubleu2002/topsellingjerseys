import type { Product } from "@/lib/schema";
import { fmtShortDate } from "@/lib/format";

const money = (n: number, c: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(n);

/** Verified price only. Sale styling appears only when a verified regular price is higher. */
export function PriceTag({ product }: { product: Product }) {
  if (product.price === null || !product.currency) return null;
  const onSale = product.listPrice != null && product.listPrice > product.price;
  return (
    <p className="price">
      {onSale && <span className="sale-badge">Sale</span>}
      <strong>{money(product.price, product.currency)}</strong>
      {onSale && <s>{money(product.listPrice!, product.currency)}</s>}
      <small>Checked {fmtShortDate(product.lastVerified)}</small>
    </p>
  );
}

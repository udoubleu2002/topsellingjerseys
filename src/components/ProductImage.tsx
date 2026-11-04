import type { Player, Product, Team } from "@/lib/schema";
import { jerseyImg } from "@/lib/img";

/**
 * Shows a verified product photo when one exists. Otherwise a labeled placeholder in team colors:
 * it never shows a random jersey or a drawing presented as a product.
 */
export function ProductImage({ player, team, product, priority = false }: { player: Player; team?: Team; product?: Product; priority?: boolean }) {
  if (product?.image) {
    return (
      <div className="pframe photo">
        <img {...jerseyImg(product.image.url, 360)} alt={product.image.alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" width={360} height={360} />
      </div>
    );
  }
  const c = team?.colors ?? { primary: "#e5e7eb", secondary: "#334155", accent: "#94a3b8" };
  const style = { backgroundColor: c.primary, "--ph-fg": c.secondary, "--ph-accent": c.accent } as React.CSSProperties;
  return (
    <div className="pframe" role="img" aria-label={`${player.name} jersey photo not yet available${player.number ? `; wears No. ${player.number}` : ""}`}>
      <div className="ph">
        <div className="ph-swatch" style={style}>
          <span className="ph-num" aria-hidden="true">{player.number ?? ""}</span>
        </div>
        <div className="ph-cap">Product photo coming soon</div>
      </div>
    </div>
  );
}

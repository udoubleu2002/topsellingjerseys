import type { Player, Product, Team } from "@/lib/schema";

/**
 * Shows a verified product photo when one exists. Otherwise a labeled placeholder in team colors:
 * it never shows a random jersey or a drawing presented as a product.
 */
export function ProductImage({ player, team, product, priority = false }: { player: Player; team?: Team; product?: Product; priority?: boolean }) {
  if (product?.image) {
    return (
      <div className="pframe">
        <img src={product.image.url} alt={product.image.alt} loading={priority ? "eager" : "lazy"} width={400} height={500} />
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

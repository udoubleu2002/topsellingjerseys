/**
 * "+ I have this jersey" and "+ Add to wishlist": add the player to the visitor's My Jerseys list or wishlist
 * (public/my-jerseys.js handles the clicks, so they also work on the static export). The script updates the
 * labels and pressed states after load.
 */
export function HaveJersey({ name, league, className = "" }: { name: string; league: string; className?: string }) {
  return (
    <span className={`have-row ${className}`.trim()}>
      <button type="button" className="have-btn" data-mj-have="" data-name={name} data-league={league} aria-pressed="false" suppressHydrationWarning>
        <span className="have-text" suppressHydrationWarning>+ I have this jersey</span>
      </button>
      <button type="button" className="have-btn wish-btn" data-mj-wish="" data-name={name} data-league={league} aria-pressed="false" suppressHydrationWarning>
        <span className="have-text" suppressHydrationWarning>+ Add to wishlist</span>
      </button>
    </span>
  );
}

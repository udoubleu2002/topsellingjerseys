/**
 * "+ I have this jersey": adds the player to the visitor's My Jerseys list (public/my-jerseys.js handles the click,
 * so it also works on the static export). The script updates the label and pressed state after load.
 */
export function HaveJersey({ name, league, className = "" }: { name: string; league: string; className?: string }) {
  return (
    <button type="button" className={`have-btn ${className}`.trim()} data-mj-have="" data-name={name} data-league={league} aria-pressed="false" suppressHydrationWarning>
      <span className="have-text" suppressHydrationWarning>+ I have this jersey</span>
    </button>
  );
}

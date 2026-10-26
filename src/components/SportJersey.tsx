import type { Sport } from "@/lib/news";

/** Each sport's jersey cut, colored with its league's accent: football pads, basketball tank, baseball button-front, hockey long sleeves, soccer V-neck. */
const CUTS: Record<Sport, { label: string; color: string; body: string; detail: string }> = {
  football: { label: "Football", color: "#2f62d0", body: "M21 8 9 12 2 27l10 5 4-4v28h32V28l4 4 10-5-7-15-12-4c-2 4-6 6-10 6s-8-2-10-6z", detail: "M7 21l9 4M57 21l-9 4" },
  basketball: { label: "Basketball", color: "#d6203a", body: "M20 7h-5c0 9-3 12-3 18v31h40V25c0-6-3-9-3-18h-5c-1 8-5 12-12 12s-11-4-12-12z", detail: "M18 30h28" },
  baseball: { label: "Baseball", color: "#16804f", body: "M23 8 12 12 3 26l9 5 5-4v29h30V27l5 4 9-5-9-14-11-4-9 12z", detail: "M32 21v33M28 27h0M28 34h0M28 41h0M28 48h0" },
  hockey: { label: "Hockey", color: "#5d84b8", body: "M22 8 10 12 2 42l9 3 5-17v28h32V28l5 17 9-3-8-30-12-4c-2 4-6 6-10 6s-8-2-10-6z", detail: "M16 44h32M6 34l7 2M58 34l-7 2" },
  soccer: { label: "Soccer", color: "#7a52d6", body: "M24 8 14 12 5 23l7 7 5-3v29h30V27l5 3 7-7-9-11-10-4c-2 3-5 5-8 5s-6-2-8-5z", detail: "M26 9l6 7 6-7" },
};

export function SportJersey({ sport, className = "sport-jersey" }: { sport: Sport; className?: string }) {
  const c = CUTS[sport];
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={c.label}>
      <title>{c.label}</title>
      <path d={c.body} fill={c.color} />
      <path d={c.detail} fill="none" stroke="var(--surface)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

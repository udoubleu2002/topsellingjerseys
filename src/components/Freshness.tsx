import type { Ranking } from "@/lib/schema";
import { reportStatus, STALE_AFTER_DAYS } from "@/lib/data";
import { daysBetween } from "@/lib/format";
import { site } from "@/lib/config";

/** How fresh a league's latest list is, in one of three plain states. Computed from the report's own dates. */
export function freshness(r: Ranking) {
  const s = reportStatus(r);
  const end = r.periodEnd ?? r.publishedDate;
  const days = daysBetween(end, site.lastReviewed);
  const months = Math.max(1, Math.round(days / 30.4));
  const ended = new Date(`${end}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  if (s.kind !== "latest") return { kind: "old" as const, short: s.label, long: s.label };
  if (days < STALE_AFTER_DAYS) return { kind: "current" as const, short: "Current list", long: `Current list · sales through ${ended}` };
  if (days < 365) return { kind: "dated" as const, short: "Latest available", long: `Latest available · sales ended ${ended}, ${months} months ago` };
  return { kind: "outdated" as const, short: "Outdated: no newer list", long: `Outdated · sales ended ${ended}, over a year ago. No newer list has been published.` };
}

/** A colored freshness badge: green for current, amber for latest-available, red for over a year old. */
export function FreshBadge({ ranking, long = false, className = "" }: { ranking: Ranking; long?: boolean; className?: string }) {
  const f = freshness(ranking);
  return <span className={`fresh-badge is-${f.kind} ${className}`} title={f.long}><span className="fresh-dot" aria-hidden="true" />{long ? f.long : f.short}</span>;
}

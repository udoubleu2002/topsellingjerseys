import Link from "next/link";
import type { Ranking } from "@/lib/schema";
import { fmtDate, fmtShortDate, period, daysBetween } from "@/lib/format";
import { site } from "@/lib/config";

export function Freshness({ ranking, statsThrough }: { ranking: Ranking; statsThrough?: string | null }) {
  return (
    <dl className="fresh">
      <div><dt>Report published</dt><dd><a href={ranking.sourceUrl} target="_blank" rel="noopener">{fmtDate(ranking.publishedDate)}</a></dd></div>
      <div><dt>Sales period</dt><dd>{period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel)}</dd></div>
      <div><dt>Ranking last verified</dt><dd>{fmtDate(ranking.lastVerified)}</dd></div>
      <div><dt>Player stats through</dt><dd>{statsThrough ? fmtShortDate(statsThrough) : "Varies by player"}</dd></div>
    </dl>
  );
}

export function SourceLine({ ranking }: { ranking: Ranking }) {
  return (
    <p className="source-line">
      <span>Source: <a href={ranking.sourceUrl} target="_blank" rel="noopener">{ranking.title}</a>, {ranking.publisher}</span>
      <Link href="/methodology/">How we verify rankings</Link>
      <Link href={`/rankings/${ranking.league}/${ranking.id}/`}>Report details</Link>
    </p>
  );
}

/** Flags reports whose sales period ended long ago, so an old list is never presented as current sales. */
export function StaleNotice({ ranking }: { ranking: Ranking }) {
  const end = ranking.periodEnd ?? ranking.publishedDate;
  const age = daysBetween(end, site.lastReviewed);
  if (age < 120) return null;
  return (
    <p className="notice">
      This is the latest available report. Its sales period ended {fmtDate(end)}, so it reflects that period rather than sales right now.
      We will update this page when a newer report is published.
    </p>
  );
}

/** The report's caveats, folded behind one small link so they do not crowd the top of the list. */
export function ReportNotes({ ranking }: { ranking: Ranking }) {
  const end = ranking.periodEnd ?? ranking.publishedDate;
  const stale = daysBetween(end, site.lastReviewed) >= 120;
  const n = ranking.limitations.length + (stale ? 1 : 0);
  if (!n) return null;
  return (
    <details className="report-notes">
      <summary>About this list ({n} {n === 1 ? "note" : "notes"})</summary>
      <StaleNotice ranking={ranking} />
      {ranking.limitations.map((l) => <p className="notice" key={l}>{l}</p>)}
    </details>
  );
}

export function AffiliateNote() {
  return (
    <p className="disclosure">
      Shopping links go to retailers, and we may earn a commission on qualifying purchases at no cost to you.{" "}
      <Link href="/affiliate-disclosure/">Affiliate disclosure</Link>.
    </p>
  );
}

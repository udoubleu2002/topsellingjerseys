import Link from "next/link";
import type { Ranking } from "@/lib/schema";
import { fmtDate, fmtShortDate, period, daysBetween } from "@/lib/format";
import { site } from "@/lib/config";
import { getLeague, reportStatus, STALE_AFTER_DAYS } from "@/lib/data";

/**
 * The report's status in plain words, shown above its dates: latest published, superseded or historical, whether a
 * newer report exists, and (for an old latest report) that it reflects its own sales period rather than sales right now.
 */
export function ReportStatusLine({ ranking, linkLeague = true }: { ranking: Ranking; linkLeague?: boolean }) {
  const s = reportStatus(ranking);
  const league = getLeague(ranking.league);
  const name = league?.name ?? ranking.league.toUpperCase();
  let detail: React.ReactNode;
  if (s.kind === "latest") {
    detail = s.dated
      ? <>Sales period ended {fmtDate(s.periodEnd)}. No newer {name} report has been published as of {fmtDate(ranking.lastVerified)}, so this list reflects that period, not sales right now.</>
      : <>No newer {name} report has been published as of {fmtDate(ranking.lastVerified)}.</>;
  } else if (s.newer) {
    const href = linkLeague && league && reportStatus(s.newer).kind === "latest" ? `/${league.slug}/` : `/rankings/${s.newer.league}/${s.newer.id}/`;
    detail = <>{s.kind === "superseded" ? "Replaced by" : "Newer report available:"} <Link href={href}>{s.newer.title}</Link> (published {fmtDate(s.newer.publishedDate)}). Rankings here are kept exactly as published.</>;
  } else {
    detail = <>Rankings here are kept exactly as published.</>;
  }
  return (
    <p className={`report-status is-${s.kind}${s.dated ? " is-dated" : ""}`} data-report-status={s.kind}>
      <strong className="report-status-label">{s.label}</strong> <span>{detail}</span>
    </p>
  );
}

export function Freshness({ ranking, statsThrough }: { ranking: Ranking; statsThrough?: string | null }) {
  return (
    <>
    <ReportStatusLine ranking={ranking} />
    <dl className="fresh">
      <div><dt>Report published</dt><dd><a href={ranking.sourceUrl} target="_blank" rel="noopener">{fmtDate(ranking.publishedDate)}</a></dd></div>
      <div><dt>Sales period</dt><dd>{period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel)}</dd></div>
      <div><dt>Ranking last verified</dt><dd>{fmtDate(ranking.lastVerified)}</dd></div>
      <div><dt>Player stats through</dt><dd>{statsThrough ? fmtShortDate(statsThrough) : "Varies by player"}</dd></div>
    </dl>
    </>
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
  if (age < STALE_AFTER_DAYS) return null;
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
  const stale = daysBetween(end, site.lastReviewed) >= STALE_AFTER_DAYS;
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

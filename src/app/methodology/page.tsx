import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = pageMeta({ title: "Jersey Ranking Methodology", description: "How Top Selling Jerseys picks sources, keeps every list in its published order, dates each ranking and keeps player stats separate from sales data.", path: "/methodology/" });

export default function Methodology() {
  return (
    <InfoPage title="Ranking Methodology" path="/methodology/" lede="We publish rankings other organizations release. We never create, reorder or estimate a ranking ourselves.">
      <h2>Which reports qualify</h2>
      <ul>
        <li>Lists released by a league, a players association, or a league&apos;s official retail partner.</li>
        <li>Coverage by a reputable outlet is accepted only when the original announcement cannot be retrieved, and the report page says so.</li>
        <li>Each report records its publisher, source link, publication date, sales period, scope and known limitations.</li>
      </ul>
      <h2>How lists are shown</h2>
      <ul>
        <li>Players appear in the exact published order. Lists are as long as the source makes them; we never pad a list.</li>
        <li>If we have verified only part of a list, the page says which ranks are shown.</li>
        <li>Rank movement (▲ ▼) appears only when an earlier report from the same series exists, so different periods or methods are never compared.</li>
        <li>When a report&apos;s sales period ended more than four months ago, the page says it is the latest available rather than current sales.</li>
      </ul>
      <h2>Report status</h2>
      <p>Every report carries one of three labels. We never call a report &quot;current&quot; just because it is the newest one on the site.</p>
      <ul>
        <li><strong>Latest Published Report:</strong> the newest report for a league, shown on its league page. If its sales period ended long ago, the page says that no newer report has been published and that the list reflects that period, not sales right now.</li>
        <li><strong>Superseded Report:</strong> an older report replaced by a newer report from the same publisher and method. It stays online, unchanged, with a link to its replacement.</li>
        <li><strong>Historical Report:</strong> an older report from a different series or method. It stays online for reference but is never compared rank by rank with other series.</li>
      </ul>
      <h2>Teams in historical rankings</h2>
      <p>A ranking always shows the team the report credited the sale to. When a player has moved since, the list keeps that original team and adds a &quot;now with&quot; note, while the player page shows the player&apos;s current, verified team. Rankings are never rewritten after a trade or signing.</p>
      <h2>Dates we track</h2>
      <ul>
        <li><strong>Report published:</strong> when the source released the list.</li>
        <li><strong>Sales period:</strong> the dates the sales cover.</li>
        <li><strong>Last verified:</strong> when we last checked our copy against the source.</li>
        <li><strong>Stats through:</strong> the last game included in a player&apos;s numbers, shown separately for each player.</li>
      </ul>
      <h2>Player details and stats</h2>
      <p>Player details, highlights and statistics are stored separately from rankings and carry their own sources and dates. A stat we cannot confirm is left out rather than estimated. Where a season total adds a verified game line to a verified earlier total, the stat note says so.</p>
      <h2>Shopping links</h2>
      <p>Shopping links never influence ranking order. Prices and stock are shown only for listings we have verified, with the date we checked. See the <Link href="/affiliate-disclosure/">affiliate disclosure</Link>.</p>
    </InfoPage>
  );
}

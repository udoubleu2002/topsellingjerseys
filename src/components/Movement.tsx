import Link from "next/link";
import type { Ranking } from "@/lib/schema";
import { getMovement, getPlayer, getTeam } from "@/lib/data";
import { fmtShortDate, period } from "@/lib/format";

const name = (id: string) => getPlayer(id);

function PlayerLink({ id }: { id: string }) {
  const p = name(id);
  return p ? <Link href={`/players/${p.slug}/`} data-track="movement_player_click" data-placement="movement" data-player={p.id} data-league={p.leagues[0]}>{p.name}</Link> : <>{id}</>;
}

/**
 * How a list changed since the previous report in the same series: risers, fallers, new and returning players, players who
 * left the ranks shown, and team representation. Rendered only when a comparable earlier report exists.
 */
export function Movement({ ranking, leagueName, id = "moves-h" }: { ranking: Ranking; leagueName: string; id?: string }) {
  const m = getMovement(ranking);
  if (!m) return null;
  const prev = m.previous;
  const prevPeriod = period(prev.periodStart, prev.periodEnd, prev.periodLabel);
  const top = (n: number) => `top ${n}`;
  const lead = m.risers[0];
  const summary = [
    `${m.stayed.length} of the ${m.depth} players listed here were also in the previous report's ${top(m.previousDepth)}.`,
    lead ? `${name(lead.playerId)?.name} made the biggest jump, from No. ${lead.previousRank} to No. ${lead.rank}.` : "",
    m.newEntries.length ? `${m.newEntries.length} ${m.newEntries.length === 1 ? "player is" : "players are"} new to the list.` : "",
  ].filter(Boolean).join(" ");

  return (
    <section className="wrap section moves" aria-labelledby={id} data-section="movement" data-impression="movement" data-league={ranking.league} data-report={ranking.id}>
      <div className="section-head"><h2 id={id}>How the {leagueName} list changed</h2></div>
      <p className="moves-lede">
        Compared with <Link href={`/rankings/${prev.league}/${prev.id}/`} data-track="report_link_click" data-placement="movement" data-league={prev.league} data-report={prev.id}>{prev.title}</Link> ({prevPeriod}, published {fmtShortDate(prev.publishedDate)}).
        Both come from {prev.publisher} and use the same method and length of sales period, so ranks can be compared directly. {summary}
      </p>
      <div className="moves-grid">
        {m.risers.length > 0 && (
          <div className="moves-box">
            <h3>Biggest risers</h3>
            <ol>{m.risers.slice(0, 5).map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">No. {x.previousRank} → No. {x.rank}</span> <span className="rank-move up">▲ {x.delta}</span></li>)}</ol>
          </div>
        )}
        {m.fallers.length > 0 && (
          <div className="moves-box">
            <h3>Biggest fallers</h3>
            <ol>{m.fallers.slice(0, 5).map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">No. {x.previousRank} → No. {x.rank}</span> <span className="rank-move down">▼ {-x.delta!}</span></li>)}</ol>
          </div>
        )}
        {m.newEntries.length > 0 && (
          <div className="moves-box">
            <h3>New to the list</h3>
            <p className="moves-note">Not in the previous {top(m.previousDepth)}.</p>
            <ol>{m.newEntries.map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">No. {x.rank}</span></li>)}</ol>
          </div>
        )}
        {m.returning.length > 0 && (
          <div className="moves-box">
            <h3>Back on the list</h3>
            <p className="moves-note">Missed the previous report but appeared in an earlier one.</p>
            <ol>{m.returning.map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">No. {x.rank}</span></li>)}</ol>
          </div>
        )}
        {m.left.length > 0 && (
          <div className="moves-box">
            <h3>Out of the {top(m.depth)}</h3>
            <p className="moves-note">In the previous {top(m.depth)} but not in this one{m.depth < m.previousDepth || ranking.limitations.some((l) => /ranks? \d/.test(l)) ? " (they may still appear further down the full report)" : ""}.</p>
            <ol>{m.left.map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">was No. {x.previousRank}</span></li>)}</ol>
          </div>
        )}
        {m.held.length > 0 && (
          <div className="moves-box">
            <h3>Held their spot</h3>
            <ol>{m.held.map((x) => <li key={x.playerId}><PlayerLink id={x.playerId} /> <span className="mv">No. {x.rank}</span></li>)}</ol>
          </div>
        )}
        {m.teams.length > 0 && (
          <div className="moves-box">
            <h3>Teams with two or more players</h3>
            <p className="moves-note">Players in each report&apos;s {top(m.teamDepth)}, by the team credited at the time.</p>
            <ul>{m.teams.slice(0, 8).map((t) => <li key={t.teamId}>{getTeam(t.teamId)?.name ?? t.teamId} <span className="mv">{t.before} → {t.now}</span></li>)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}

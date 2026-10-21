import type { Player, StatLine } from "@/lib/schema";
import { fmtDate, fmtShortDate } from "@/lib/format";

export function Highlights({ player }: { player: Player }) {
  return (
    <ul className="highlights">
      {player.highlights.map((h, i) => (
        <li key={i}>{h.text}</li>
      ))}
    </ul>
  );
}

export function StatsPanel({ line, compact = false }: { line?: StatLine; compact?: boolean }) {
  if (!line || line.statistics.length === 0) {
    return <p className="stat-meta">{line?.note ?? "Current-season statistics are not available yet."}</p>;
  }
  const comp = line.competition === "postseason" ? "postseason" : "regular season";
  return (
    <div>
      <dl className="stats" aria-label={`${line.season} ${comp} statistics`}>
        {line.statistics.map((s) => (
          <div className="stat" key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className="stat-meta">
        {line.season} {comp}
        {line.throughDate ? `, through ${compact ? fmtShortDate(line.throughDate) : fmtDate(line.throughDate)}` : ""}
        {line.note ? `. ${line.note}` : ""}
      </p>
    </div>
  );
}

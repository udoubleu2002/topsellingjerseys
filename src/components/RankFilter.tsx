"use client";
import { useEffect, useState } from "react";

/**
 * Filters the ranking list in place by player name or by the team the report credited. The full list is always in the
 * HTML, so crawlers and no-JS visitors see every rank; the filter only hides rows.
 */
export function RankFilter({ listId, teams }: { listId: string; teams: { id: string; name: string; count: number }[] }) {
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("");
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    const rows = Array.from(document.querySelectorAll<HTMLLIElement>(`#${listId} > li`));
    const words = q.toLowerCase().trim();
    let n = 0;
    for (const r of rows) {
      const ok = (!team || r.dataset.team === team) && (!words || (r.dataset.name ?? "").includes(words));
      r.hidden = !ok;
      if (ok) n++;
    }
    setShown(q || team ? n : null);
  }, [q, team, listId]);
  if (teams.length < 2) return null;
  return (
    <div className="rfilter" role="search" aria-label="Filter this ranking">
      <label>
        <span className="sr-only">Find a player in this list</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a player" />
      </label>
      <label>
        <span className="sr-only">Show one team</span>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">All teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.count})</option>)}
        </select>
      </label>
      {shown !== null && (
        <p className="rfilter-n" aria-live="polite">
          {shown ? `Showing ${shown}` : "No players match."}{" "}
          <button type="button" onClick={() => { setQ(""); setTeam(""); }}>Clear</button>
        </p>
      )}
    </div>
  );
}

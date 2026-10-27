import Link from "next/link";
import type { League } from "@/lib/schema";
import { getPlayers, getTeam } from "@/lib/data";

/** League page: every team with a player page, A to Z, so unranked team players are one tap from the list. */
export function TeamRosters({ league }: { league: League }) {
  const byTeam = new Map<string, ReturnType<typeof getPlayers>>();
  for (const p of getPlayers()) {
    const teamId = p.teamId ?? p.lastTeamId;
    if (!p.leagues.includes(league.id) || !teamId || getTeam(teamId)?.league !== league.id) continue;
    byTeam.set(teamId, [...(byTeam.get(teamId) ?? []), p]);
  }
  const teams = [...byTeam.keys()].map((id) => getTeam(id)!).sort((a, b) => a.name.localeCompare(b.name));
  if (!teams.length) return null;
  return (
    <section className="wrap section" aria-labelledby="teams-h">
      <div className="section-head"><h2 id="teams-h">{league.name} jerseys by team</h2></div>
      <div className="troster-grid">
        {teams.map((t) => (
          <section key={t.id} className="troster" aria-labelledby={`t-${t.id}`}>
            <h3 id={`t-${t.id}`} style={{ borderLeftColor: t.colors?.primary }}>{t.name}</h3>
            <ul>
              {byTeam.get(t.id)!.map((p) => (
                <li key={p.id}>
                  <Link href={`/players/${p.slug}/`}>{p.name}</Link>
                  <span>{[p.number && `No. ${p.number}`, p.position].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

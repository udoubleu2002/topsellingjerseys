import type { League, Player, StatLine, Team } from "./schema";
import { fmtDate, age } from "./format";
import { site } from "./config";

type Appearance = { ranking: { title: string; publisher: string; publishedDate: string; periodStart: string | null; periodEnd: string | null; periodLabel: string }; rank: number; reportTeam?: Team };
type Ctx = { player: Player; league: League; team?: Team; latest?: Appearance; line?: StatLine };

/** "GP 3, G 1, A 2, PTS 3": the first few numbers of a stat line, in the order the source lists them. */
export function statSummary(line: StatLine | undefined, n = 4): string {
  return line ? line.statistics.slice(0, n).map((s) => `${s.label} ${s.value}`).join(", ") : "";
}

/** Search title: puts the jersey number in when it still fits on one search-result line. */
export function playerTitle({ player, league, team, latest }: Ctx): string {
  if (!latest) {
    // Not on a sales list: target the player's team jersey search, e.g. "Leo Carlsson #91 Anaheim Ducks Jersey".
    // Only a current team is used; a retired player's last team is often not the jersey fans look for.
    if (!team || !player.teamId) return `${player.name} Jersey`;
    const withNum = player.number ? `${player.name} #${player.number} ${team.name} Jersey` : "";
    const withTeam = `${player.name} ${team.name} Jersey`;
    return withNum && withNum.length <= 60 ? withNum : withTeam.length <= 60 ? withTeam : `${player.name} Jersey`;
  }
  const base = `${player.name} Jersey: No. ${latest.rank} Top Selling ${league.name} Jersey`;
  const withNum = player.number ? `${player.name} #${player.number} Jersey: No. ${latest.rank} Top Selling ${league.name} Jersey` : base;
  return withNum.length <= 65 ? withNum : base;
}

export function playerDescription({ player, league, team, latest, line }: Ctx): string {
  const who = [player.number && `No. ${player.number}`, team && player.teamId ? team.name : null, player.position].filter(Boolean).join(" ");
  // "NHL (Shop.NHL.com / Fanatics), as reported by HockeyFeed" -> "NHL"; the league name is added only when missing.
  const pub = latest?.ranking.publisher.split(/ \(|, /)[0] ?? "";
  const list = pub.includes(league.name) ? pub : `${pub} ${league.name}`;
  const rank = latest ? ` Ranked No. ${latest.rank} on the ${list} sales list.` : "";
  const stats = line?.statistics.length ? ` ${line.season}: ${statSummary(line, 3)}.` : "";
  return `Shop ${player.name} jerseys${who ? ` (${who})` : ""}.${rank}${stats} Where to buy, sizes and styles.`;
}

/** A short factual opening paragraph built only from data already shown on the page. */
export function playerIntro({ player, league, team, latest }: Ctx): string {
  const parts: string[] = [];
  const jersey = [player.number && `No. ${player.number}`, team?.name].filter(Boolean).join(" ");
  // The ranking credits the team named in the report. After a move, say so instead of pairing the old rank with the new team.
  const movedSince = !!latest?.reportTeam && latest.reportTeam.id !== player.teamId;
  if (latest && movedSince) {
    parts.push(`${player.name} ranked No. ${latest.rank} on the latest ${league.name} sales list from ${latest.ranking.publisher}, published ${fmtDate(latest.ranking.publishedDate)}, with the ${latest.reportTeam!.name}.`);
    if (team && player.teamId) parts.push(`${player.name} now plays for the ${team.name}${player.number ? ` and wears No. ${player.number}` : ""}.`);
    else parts.push(`${player.name} is now ${player.status.toLowerCase()}.`);
  } else if (latest) parts.push(`${player.name}${jersey ? `'s ${jersey}` : ""} jersey is No. ${latest.rank} on the latest ${league.name} sales list from ${latest.ranking.publisher}, published ${fmtDate(latest.ranking.publishedDate)}.`);
  else if (team && !player.teamId) parts.push(`${player.name} is ${player.status.toLowerCase()}; last team: ${team.name}.`);
  return parts.join(" ");
}

/** Questions people search for, answered only with facts the page already shows. */
export function playerFaq({ player, league, team, latest, line }: Ctx): { q: string; a: string }[] {
  const faq: { q: string; a: string }[] = [];
  if (player.number) faq.push({ q: `What number does ${player.name} wear?`, a: `${player.name} wears No. ${player.number}${team && player.teamId ? ` for the ${team.name}` : ""}.` });
  if (team) faq.push({ q: `What team is ${player.name} on?`, a: player.teamId ? `${player.name} plays for the ${team.name} (${league.name}).` : `${player.name} is listed as ${player.status.toLowerCase()}. The last team on file is the ${team.name}.` });
  if (latest) {
    const moved = latest.reportTeam && latest.reportTeam.id !== player.teamId ? ` while with the ${latest.reportTeam.name}` : "";
    faq.push({ q: `Is ${player.name}'s jersey a top seller?`, a: `Yes. ${player.name} ranked No. ${latest.rank} on ${latest.ranking.title}, published by ${latest.ranking.publisher} on ${fmtDate(latest.ranking.publishedDate)}${moved}.` });
  }
  faq.push({ q: `Where can I buy a ${player.name} jersey?`, a: `Use the Shop ${player.name} Jerseys button on this page to see every ${player.name} jersey style, size and price at the retailer. ${site.name} may earn a commission on purchases.` });
  if (line?.statistics.length) faq.push({ q: `What are ${player.name}'s ${line.season} stats?`, a: `Through ${fmtDate(line.throughDate)}, ${player.name} has ${statSummary(line, 6)}.` });
  if (player.birthday) faq.push({ q: `How old is ${player.name}?`, a: `${player.name} was born on ${fmtDate(player.birthday)} and is ${age(player.birthday, site.lastReviewed)}.` });
  return faq;
}

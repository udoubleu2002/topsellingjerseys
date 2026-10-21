import type { Store } from "./data";
import type { Ranking } from "./schema";

/** Checks a single ranking: contiguous ranks from 1, no duplicate players, every player known. */
export function checkRanking(r: Ranking, playerIds: Set<string>): string[] {
  const errs: string[] = [];
  r.entries.forEach((e, i) => {
    if (e.rank !== i + 1) errs.push(`${r.id}: entry ${i + 1} has rank ${e.rank}; ranks must run 1..n in published order`);
    if (!playerIds.has(e.playerId)) errs.push(`${r.id}: unknown player "${e.playerId}" at rank ${e.rank}`);
  });
  const seen = new Set<string>();
  for (const e of r.entries) {
    if (seen.has(e.playerId)) errs.push(`${r.id}: duplicate player "${e.playerId}"`);
    seen.add(e.playerId);
  }
  if (r.periodStart && r.periodEnd && r.periodStart > r.periodEnd) errs.push(`${r.id}: sales period starts after it ends`);
  return errs;
}

export function checkStore(s: Store, opts: { allowDemo?: boolean } = {}) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const playerIds = new Set(s.players.map((p) => p.id));
  const teamIds = new Set(s.teams.map((t) => t.id));
  const leagueIds = new Set(s.leagues.map((l) => l.id));
  const merchantIds = new Set(s.merchants.map((m) => m.id));

  const ids = new Set<string>();
  for (const r of s.rankings) {
    if (ids.has(r.id)) errors.push(`duplicate ranking id ${r.id}`);
    ids.add(r.id);
    if (!leagueIds.has(r.league)) errors.push(`${r.id}: unknown league ${r.league}`);
    errors.push(...checkRanking(r, playerIds));
    for (const e of r.entries) if (e.teamIdAtReport && !teamIds.has(e.teamIdAtReport)) errors.push(`${r.id}: unknown team ${e.teamIdAtReport}`);
    if (r.status === "draft") warnings.push(`${r.id}: draft ranking, not published until a reviewer sets status to "published"`);
  }
  for (const l of s.leagues) if (!s.rankings.some((r) => r.league === l.id && r.status === "published")) warnings.push(`${l.id}: no published ranking`);

  const slugs = new Set<string>();
  for (const p of s.players) {
    if (slugs.has(p.slug)) errors.push(`duplicate player slug ${p.slug}`);
    slugs.add(p.slug);
    if (p.teamId && !teamIds.has(p.teamId)) errors.push(`${p.id}: unknown team ${p.teamId}`);
    if (p.lastTeamId && !teamIds.has(p.lastTeamId)) errors.push(`${p.id}: unknown last team ${p.lastTeamId}`);
    const texts = p.highlights.map((h) => h.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) errors.push(`${p.id}: highlights must be distinct`);
    if (p.highlights.some((h) => !h.source)) warnings.push(`${p.id}: a highlight has no source`);
    if (!p.birthday) warnings.push(`${p.id}: birthday not verified`);
    if (!s.rankings.some((r) => r.entries.some((e) => e.playerId === p.id))) warnings.push(`${p.id}: not in any ranking (page will be noindex)`);
  }
  for (const st of s.stats) {
    if (!playerIds.has(st.playerId)) errors.push(`stats: unknown player ${st.playerId}`);
    if (st.isDemo && !opts.allowDemo) errors.push(`stats: demo row for ${st.playerId} must not ship`);
    if (!st.throughDate && st.statistics.length) errors.push(`stats: ${st.playerId} ${st.season} has numbers but no through-date`);
  }
  const productIds = new Set<string>();
  for (const pr of s.products) {
    if (productIds.has(pr.id)) errors.push(`duplicate product id ${pr.id}`);
    productIds.add(pr.id);
    if (!playerIds.has(pr.playerId)) errors.push(`product ${pr.id}: unknown player`);
    if (!merchantIds.has(pr.merchantId)) errors.push(`product ${pr.id}: unknown merchant`);
    if (pr.price !== null && !pr.currency) errors.push(`product ${pr.id}: price without currency`);
    if (pr.flagged) warnings.push(`product ${pr.id}: flagged for review (${pr.flagged}); hidden`);
  }
  for (const pr of s.promotions) {
    if (!merchantIds.has(pr.merchantId)) errors.push(`promotion ${pr.id}: unknown merchant`);
    if (pr.startDate > pr.endDate) errors.push(`promotion ${pr.id}: starts after it ends`);
    for (const l of pr.leagues) if (!leagueIds.has(l)) errors.push(`promotion ${pr.id}: unknown league ${l}`);
  }
  return { errors, warnings };
}

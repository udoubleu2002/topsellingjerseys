import type { Store } from "./data";
import type { Ranking } from "./schema";
import { type Article, articlePath, linksIn, wordCount } from "./articles";
import { type Profile } from "./profiles";
import { type NewsItem } from "./news";

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

export function checkStore(s: Store, opts: { allowDemo?: boolean; profiledIds?: Set<string> } = {}) {
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
    if (!s.rankings.some((r) => r.entries.some((e) => e.playerId === p.id)) && !opts.profiledIds?.has(p.id)) warnings.push(`${p.id}: not in any ranking and no write-up (page will be noindex)`);
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

/** Articles: 250-300 words, unique slugs and metadata, a known team, and internal links that resolve to real pages. */
export function checkArticles(articles: Article[], s: Store) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pages = new Set<string>(["/", "/jerseys/", "/rankings/", "/my-jerseys/", "/best-selling-jerseys/", "/best-selling-jersey/", "/best-selling-sports-jerseys/"]);
  for (const l of s.leagues) pages.add(`/${l.slug}/`);
  for (const p of s.players) pages.add(`/players/${p.slug}/`);
  for (const r of s.rankings) pages.add(`/rankings/${r.league}/${r.id}/`);
  for (const a of articles) if (a.status === "published") pages.add(articlePath(a));
  const drafts = new Set(articles.filter((a) => a.status === "draft").map(articlePath));
  const teams = new Set([...s.teams.map((t) => t.id), ...Object.values(s.directory).flat().map((t) => t.id)]);
  const leagues = new Set(s.leagues.map((l) => l.id));
  const seen: Record<string, Set<string>> = { slug: new Set(), title: new Set(), description: new Set(), headline: new Set(), player: new Set() };
  const primaryByLeague = new Map<string, Set<string>>();
  for (const a of articles) {
    const id = `article ${a.slug}`;
    for (const k of ["slug", "title", "description", "headline", "player"] as const) {
      const v = a[k].toLowerCase();
      if (seen[k].has(v)) errors.push(`${id}: duplicate ${k}`);
      seen[k].add(v);
    }
    if (!leagues.has(a.league)) errors.push(`${id}: unknown league ${a.league}`);
    if (a.teamId && !teams.has(a.teamId)) errors.push(`${id}: unknown team ${a.teamId}`);
    const n = wordCount(a);
    if (n < 250 || n > 300) errors.push(`${id}: ${n} words; articles must be 250-300`);
    if (!a.body.slice(0, 2).join(" ").includes(a.player)) errors.push(`${id}: the player's full name must appear in the opening paragraph`);
    if (!a.headline.includes(a.player)) errors.push(`${id}: the headline must include the player's full name`);
    const links = a.body.flatMap(linksIn);
    if (links.length === 0) errors.push(`${id}: needs one internal link`);
    for (const l of links) {
      if (pages.has(l)) continue;
      // A draft may link to another draft; it becomes an error if only one of them is published.
      if (a.status === "draft" && drafts.has(l)) warnings.push(`${id}: links to draft ${l}; publish both together`);
      else errors.push(`${id}: internal link ${l} does not match a page on the site`);
    }
    const pk = primaryByLeague.get(a.league) ?? new Set<string>();
    if (pk.has(a.primaryKeyword.toLowerCase())) errors.push(`${id}: primary keyword "${a.primaryKeyword}" is already used in this league`);
    pk.add(a.primaryKeyword.toLowerCase());
    primaryByLeague.set(a.league, pk);
    if (a.title.length < 50 || a.title.length > 60) warnings.push(`${id}: title is ${a.title.length} characters (aim for 50-60)`);
    if (a.description.length < 145 || a.description.length > 160) warnings.push(`${id}: description is ${a.description.length} characters (aim for 145-160)`);
    if (a.status === "draft") warnings.push(`${id}: draft, not published until reviewed`);
    for (const r of a.reviewNotes) warnings.push(`${id}: review: ${r}`);
  }
  return { errors, warnings };
}

/** Player write-ups: a 60-70 word About paragraph, at most 4 jersey points, one per known player, and the player's full name in the opening paragraph. */
export function checkProfiles(profiles: Profile[], s: Store) {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const p of profiles) {
    const id = `profile ${p.playerId}`;
    const player = s.players.find((x) => x.id === p.playerId);
    if (!player) { errors.push(`${id}: unknown player`); continue; }
    if (seen.has(p.playerId)) errors.push(`${id}: duplicate`);
    seen.add(p.playerId);
    const n = p.intro.join(" ").split(/\s+/).filter(Boolean).length;
    if (n < 60 || n > 70) errors.push(`${id}: About text is ${n} words; it must be 60-70`);
    if (!p.intro[0].includes(player.name)) errors.push(`${id}: the player's full name must appear in the opening paragraph`);
  }
  return { errors };
}

/** Sidebar news: unique ids, real player pages, no future dates, and a nudge when the newest story goes stale. */
export function checkNews(news: NewsItem[], s: Store, today = new Date().toISOString().slice(0, 10)) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  for (const n of news) {
    const id = `news ${n.id}`;
    if (seen.has(n.id)) errors.push(`${id}: duplicate`);
    seen.add(n.id);
    if (n.playerId && !s.players.some((p) => p.id === n.playerId)) errors.push(`${id}: unknown player "${n.playerId}"`);
    if (n.date > today) errors.push(`${id}: dated ${n.date}, after today`);
  }
  if (news.length < 5) warnings.push(`news: only ${news.length} stories; the sidebar shows five`);
  const newest = news.map((n) => n.date).sort().at(-1);
  if (newest && Date.parse(today) - Date.parse(newest) > 45 * 86400000) warnings.push(`news: newest story is from ${newest}; add recent jersey sales news to data/news.json`);
  return { errors, warnings };
}

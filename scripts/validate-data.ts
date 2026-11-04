/**
 * Validates every data store before a build. Fails the build on errors; prints warnings for items that need human review.
 * Run: npm run validate
 */
import { loadStore } from "../src/lib/data";
import { checkStore, checkArticles, checkProfiles, checkNews, checkStories } from "../src/lib/validate";
import { loadArticles } from "../src/lib/articles";
import { loadProfiles } from "../src/lib/profiles";
import { loadNews } from "../src/lib/news";
import { loadStories } from "../src/lib/stories";
import { loadFeatured } from "../src/lib/featured";
import { site } from "../src/lib/config";
import { daysBetween } from "../src/lib/format";

try {
  const store = loadStore();
  const profiles = loadProfiles();
  const { errors, warnings } = checkStore(store, { profiledIds: new Set(profiles.map((p) => p.playerId)) });
  const art = checkArticles(loadArticles(), store);
  errors.push(...art.errors);
  warnings.push(...art.warnings);
  errors.push(...checkProfiles(profiles, store).errors);
  const stories = checkStories(loadStories(), store, loadArticles());
  errors.push(...stories.errors);
  warnings.push(...stories.warnings);
  const news = checkNews(loadNews(), store);
  errors.push(...news.errors);
  warnings.push(...news.warnings);
  // Homepage player of the week: must name a known player; flag it once it is more than two weeks old.
  const featured = loadFeatured();
  if (featured && !store.players.some((p) => p.id === featured.playerId)) errors.push(`data/featured.json: unknown player ${featured.playerId}`);
  const hero = featured?.hero;
  if (hero?.photoPlayerId && !store.players.some((p) => p.id === hero.photoPlayerId)) errors.push(`data/featured.json: hero photo player ${hero.photoPlayerId} is unknown`);
  if (hero && daysBetween(hero.updated, site.lastReviewed) > 21) warnings.push(`data/featured.json: the homepage hero was last updated ${hero.updated}; refresh it`);
  if (featured && daysBetween(featured.weekOf, site.lastReviewed) > 14) warnings.push(`data/featured.json: player of the week is from ${featured.weekOf}; pick a new one`);
  // Rankings whose copy has not been checked against the source in 45 days.
  for (const r of store.rankings) if (r.status === "published" && daysBetween(r.lastVerified, site.lastReviewed) > 45) warnings.push(`${r.id}: last verified ${r.lastVerified}; re-check it against ${r.sourceUrl}`);
  for (const w of warnings) console.warn(`warn  ${w}`);
  // In GitHub Actions, errors also show as annotations on the run, so they can be read without the full log.
  for (const e of errors) console.error(process.env.GITHUB_ACTIONS ? `::error::${e}` : `error ${e}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s). Fix the data before building.`);
    process.exit(1);
  }
  console.log(`Data OK (${warnings.length} warning(s) for review).`);
} catch (e) {
  console.error(process.env.GITHUB_ACTIONS ? `::error::${(e as Error).message.slice(0, 2000).replace(/\n/g, "%0A")}` : (e as Error).message);
  process.exit(1);
}

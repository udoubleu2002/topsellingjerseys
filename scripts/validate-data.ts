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

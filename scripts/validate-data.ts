/**
 * Validates every data store before a build. Fails the build on errors; prints warnings for items that need human review.
 * Run: npm run validate
 */
import { loadStore } from "../src/lib/data";
import { checkStore, checkArticles } from "../src/lib/validate";
import { loadArticles } from "../src/lib/articles";

try {
  const store = loadStore();
  const { errors, warnings } = checkStore(store);
  const art = checkArticles(loadArticles(), store);
  errors.push(...art.errors);
  warnings.push(...art.warnings);
  for (const w of warnings) console.warn(`warn  ${w}`);
  for (const e of errors) console.error(`error ${e}`);
  if (errors.length) {
    console.error(`\n${errors.length} error(s). Fix the data before building.`);
    process.exit(1);
  }
  console.log(`Data OK (${warnings.length} warning(s) for review).`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

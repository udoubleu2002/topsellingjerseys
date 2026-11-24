/**
 * Builds this week's newsletter from the site's data and hands it to the newsletter service (beehiiv or Kit) to send.
 * The weekly-newsletter workflow runs it every Thursday morning. See docs/newsletter.md.
 *
 *   npm run newsletter:send -- --preview          write newsletter-preview.html only (no service needed)
 *   npm run newsletter:send -- --draft            save the issue as a draft in the service, to review and send by hand
 *   npm run newsletter:send                       schedule the issue to go out in 5 minutes
 *   --date=YYYY-MM-DD                             build as of another day (default today, UTC)
 */
import fs from "node:fs";
import { buildIssue } from "../src/lib/newsletter/issue";
import { getProvider } from "../src/lib/newsletter/provider";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const date = args.find((a) => a.startsWith("--date="))?.slice(7) ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Bad --date: ${date}`);

const issue = buildIssue(date);
console.log(`Subject: ${issue.subject}`);
console.log(`Preview: ${issue.previewText}`);
console.log(`Sections: ${JSON.stringify(issue.counts)}`);

fs.writeFileSync(
  "newsletter-preview.html",
  `<!doctype html><meta charset="utf-8"><title>${issue.subject.replace(/</g, "&lt;")}</title><body style="margin:0;padding:24px;background:#eef1f4"><div style="background:#fff;max-width:640px;margin:0 auto;padding:20px">${issue.html}</div></body>`,
);
console.log("Wrote newsletter-preview.html");
if (flag("preview")) process.exit(0);

// A thin week (no stories and no deals) is skipped rather than sending a near-empty email.
if (issue.counts.stories === 0 && issue.counts.deals === 0) {
  console.log("Nothing new this week (no stories and no deals), so no issue was created.");
  process.exit(0);
}

const provider = getProvider();
if (!provider) {
  console.log("No newsletter service is connected (see docs/newsletter.md). Built the preview only.");
  process.exit(0);
}
const draft = flag("draft");
provider.createIssue({
  subject: issue.subject,
  previewText: issue.previewText,
  html: issue.html,
  description: `Weekly jerseys, ${date} (sent by the weekly-newsletter job)`,
  sendAt: draft ? null : new Date(Date.now() + 5 * 60_000),
}).then(
  (created) => console.log(`${draft ? "Saved a draft" : "Scheduled the issue"} in ${provider.name}: ${created.url ?? created.id}`),
  (e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); },
);

import { describe, expect, it } from "vitest";
import { buildIssue } from "@/lib/newsletter/issue";
import { getProvider } from "@/lib/newsletter/provider";

describe("weekly newsletter", () => {
  const issue = buildIssue("2026-11-24");

  it("builds an issue from the week's stories, deals and lists", () => {
    expect(issue.counts.stories).toBeGreaterThan(0);
    expect(issue.counts.leaders).toBeGreaterThan(0);
    expect(issue.subject.length).toBeLessThanOrEqual(120);
    expect(issue.html).toContain("Hot jerseys right now");
  });

  it("sends every shop click through /out/ with a newsletter placement", () => {
    const shop = [...issue.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).filter((h) => h.includes("/out/"));
    expect(shop.length).toBeGreaterThan(0);
    for (const h of shop) expect(h).toMatch(/\/out\/[^/]+\/\?at=nl_(deal|story|sale|leader)&from=%2Fnewsletter%2F2026-11-24%2F$/);
  });

  it("tags links to the site's pages for analytics", () => {
    const pages = [...issue.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((h) => !h.includes("/out/"));
    for (const h of pages) expect(h).toContain("utm_source=newsletter");
  });

  it("stays off until a service is configured", () => {
    expect(getProvider()).toBeNull();
  });
});

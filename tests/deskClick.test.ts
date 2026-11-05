import { describe, expect, it } from "vitest";
import { fromPage, isAutomated } from "@/lib/deskClick";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const req = (url: string, headers: Record<string, string> = {}, method = "GET") =>
  new Request(url, { method, headers: { host: "topsellingjerseys.net", "user-agent": UA, ...headers } });
const check = (r: Request) => isAutomated(r, fromPage(r));

describe("isAutomated", () => {
  it("counts a click from a page on the site", () => {
    expect(check(req("https://topsellingjerseys.net/out/x/?from=/top-selling-nba-jerseys/"))).toBe(false);
    expect(check(req("https://topsellingjerseys.net/out/x/", { referer: "https://topsellingjerseys.net/players/stephen-curry/" }))).toBe(false);
  });

  it("counts a user-initiated browser navigation even without a page", () => {
    expect(check(req("https://topsellingjerseys.net/out/x/", { "sec-fetch-user": "?1", "sec-fetch-mode": "navigate" }))).toBe(false);
  });

  it("skips direct fetches with no page, which is what scrapers send", () => {
    expect(check(req("https://topsellingjerseys.net/out/x/"))).toBe(true);
    expect(check(req("https://topsellingjerseys.net/out/x/", { referer: "https://example.com/" }))).toBe(true);
  });

  it("skips declared bots, HEAD requests and prefetches", () => {
    expect(check(req("https://topsellingjerseys.net/out/x/?from=/", { "user-agent": "Mozilla/5.0 (compatible; AhrefsBot/7.0)" }))).toBe(true);
    expect(check(req("https://topsellingjerseys.net/out/x/?from=/", {}, "HEAD"))).toBe(true);
    expect(check(req("https://topsellingjerseys.net/out/x/?from=/", { "sec-purpose": "prefetch" }))).toBe(true);
  });
});

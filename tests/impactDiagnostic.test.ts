import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyLink, runDiagnostic, DIAGNOSTIC_CATALOG_ID } from "@/lib/impactDiagnostic";

const env = { IMPACT_ACCOUNT_SID: "IRsecretSid123", IMPACT_AUTH_TOKEN: "tok-secret-456" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const item = (n: number) => ({
  Name: `Men's Nike Player ${n} Jersey`, ImageUrl: `https://images.footballfanatics.com/${n}.jpg`, CurrentPrice: "129.99", OriginalPrice: "150.00",
  Currency: "USD", StockAvailability: "InStock", Url: `https://lids.7q8j.net/c/6755530/1/9679?prodsku=${n}&u=https%3A%2F%2Fwww.lids.com%2Fp-${n}`,
  Description: "long text", Gtin: "123", FTPLocations: [{ Password: "x" }],
});
const noSecrets = (body: unknown) => {
  const s = JSON.stringify(body);
  expect(s).not.toContain(env.IMPACT_ACCOUNT_SID);
  expect(s).not.toContain(env.IMPACT_AUTH_TOKEN);
  expect(s).not.toMatch(/Basic |Authorization|Password/i);
};

describe("Impact catalog diagnostic", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls the fixed catalog with Basic auth and returns at most five safe items", async () => {
    const f = vi.fn(async () => json({ Items: Array.from({ length: 8 }, (_, i) => item(i + 1)) }));
    const r = await runDiagnostic(env, f as unknown as typeof fetch, "2026-10-29T07:00:00Z");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.impact.com/Mediapartners/IRsecretSid123/Catalogs/${DIAGNOSTIC_CATALOG_ID}/Items?PageSize=5`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("IRsecretSid123:tok-secret-456").toString("base64")}`);
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, code: "ok", catalogId: "5267", itemsInResponse: 8 });
    expect(r.body.items).toHaveLength(5);
    expect(r.body.items![0]).toEqual({
      name: "Men's Nike Player 1 Jersey", imageUrl: "https://images.footballfanatics.com/1.jpg", price: 129.99, originalPrice: 150, currency: "USD",
      stock: "InStock", productUrl: item(1).Url, link: { host: "lids.7q8j.net", kind: "impact-tracking", landingHost: "www.lids.com" },
    });
    expect(Object.keys(r.body.items![0])).not.toContain("FTPLocations");
    noSecrets(r.body);
  });

  it("names missing env vars without calling Impact", async () => {
    const f = vi.fn();
    const r = await runDiagnostic({ IMPACT_ACCOUNT_SID: "x" }, f as unknown as typeof fetch);
    expect(f).not.toHaveBeenCalled();
    expect(r).toMatchObject({ status: 500, body: { ok: false, code: "missing_env", missing: ["IMPACT_AUTH_TOKEN"] } });
  });

  it.each([
    [401, "auth_failed"], [403, "auth_failed"], [404, "catalog_not_found"], [429, "rate_limited"], [500, "upstream_error"],
  ])("maps Impact %i to %s without echoing Impact's error text", async (status, code) => {
    const f = vi.fn(async () => new Response(`<error>bad token tok-secret-456 for IRsecretSid123</error>`, { status }));
    const r = await runDiagnostic(env, f as unknown as typeof fetch);
    expect(r.body).toMatchObject({ ok: false, code, upstreamStatus: status });
    expect(r.status).toBeGreaterThanOrEqual(500);
    noSecrets(r.body);
  });

  it("handles unreachable hosts, timeouts and unexpected bodies", async () => {
    const boom = vi.fn(async () => { throw new TypeError("fetch failed IRsecretSid123"); });
    expect((await runDiagnostic(env, boom as unknown as typeof fetch)).body.code).toBe("upstream_error");
    const slow = vi.fn(async () => { throw Object.assign(new Error("t"), { name: "TimeoutError" }); });
    expect((await runDiagnostic(env, slow as unknown as typeof fetch)).body.code).toBe("timeout");
    const xml = vi.fn(async () => new Response("<Items/>", { status: 200 }));
    expect((await runDiagnostic(env, xml as unknown as typeof fetch)).body.code).toBe("bad_response");
    const odd = vi.fn(async () => json({ Catalogs: [] }));
    expect((await runDiagnostic(env, odd as unknown as typeof fetch)).body.code).toBe("bad_response");
  });

  it("tells tracking links from plain retailer links", () => {
    expect(classifyLink("https://www.lids.com/mlb/new-york-yankees/p-123").kind).toBe("lids-direct");
    expect(classifyLink("https://example.com/x").kind).toBe("other");
    expect(classifyLink("http://lids.7q8j.net/c/1/2/3").kind).toBe("missing");
    expect(classifyLink(undefined).kind).toBe("missing");
  });
});

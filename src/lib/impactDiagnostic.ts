/**
 * A read-only check that the Impact.com partner API can read the Lids catalog with this site's credentials.
 * Used by /api/impact-diagnostic/. Returns a handful of product fields and safe error codes only: never the
 * credentials, request headers, or Impact's raw error text.
 */

/** Lids Main Feed. Fixed here so the route cannot be pointed at anything else. */
export const DIAGNOSTIC_CATALOG_ID = "5267";
export const DIAGNOSTIC_LIMIT = 5;
const TIMEOUT_MS = 10_000;

export type DiagnosticCode = "ok" | "missing_env" | "auth_failed" | "catalog_not_found" | "rate_limited" | "upstream_error" | "timeout" | "bad_response";

export interface DiagnosticItem {
  name: string | null;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  currency: string | null;
  stock: string | null;
  productUrl: string | null;
  /** How the item's Url is built, so we know whether it already credits clicks to this account. */
  link: { host: string | null; kind: "impact-tracking" | "lids-direct" | "other" | "missing"; landingHost: string | null };
}

export interface DiagnosticBody {
  ok: boolean;
  code: DiagnosticCode;
  message: string;
  catalogId: string;
  checkedAt: string;
  /** HTTP status Impact answered with, when it answered. */
  upstreamStatus?: number;
  missing?: string[];
  itemsInResponse?: number;
  items?: DiagnosticItem[];
}

export interface DiagnosticResult { status: number; body: DiagnosticBody }

type Env = Record<string, string | undefined>;

const https = (u: unknown) => {
  if (typeof u !== "string") return null;
  try { const x = new URL(u); return x.protocol === "https:" ? x.toString() : null; } catch { return null; }
};
const num = (v: unknown) => { const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN; return Number.isFinite(n) && n > 0 ? n : null; };
const str = (v: unknown, max = 300) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/**
 * Impact tracking links have the path /c/{partnerId}/{adId}/{campaignId} on an Impact or vanity domain
 * (for Lids, lids.7q8j.net) and carry the destination in u=. A plain lids.com link earns nothing until it is
 * wrapped with the account's tracking link (AFFILIATE_DEEPLINK_LIDS).
 */
export function classifyLink(raw: unknown): DiagnosticItem["link"] {
  const u = https(raw);
  if (!u) return { host: null, kind: "missing", landingHost: null };
  const url = new URL(u);
  let landingHost: string | null = null;
  try { landingHost = new URL(url.searchParams.get("u") ?? "").hostname; } catch { /* no destination parameter */ }
  if (/^\/c\/\d+\/\d+\/\d+/.test(url.pathname)) return { host: url.hostname, kind: "impact-tracking", landingHost };
  if (/(^|\.)lids\.com$/i.test(url.hostname)) return { host: url.hostname, kind: "lids-direct", landingHost: url.hostname };
  return { host: url.hostname, kind: "other", landingHost };
}

export function toItem(raw: unknown): DiagnosticItem {
  const i = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    name: str(i.Name),
    imageUrl: https(i.ImageUrl),
    price: num(i.CurrentPrice),
    originalPrice: num(i.OriginalPrice),
    currency: typeof i.Currency === "string" && /^[A-Z]{3}$/.test(i.Currency) ? i.Currency : null,
    stock: str(i.StockAvailability, 40),
    productUrl: https(i.Url),
    link: classifyLink(i.Url),
  };
}

const fail = (status: number, code: DiagnosticCode, message: string, now: string, extra: Partial<DiagnosticBody> = {}): DiagnosticResult =>
  ({ status, body: { ok: false, code, message, catalogId: DIAGNOSTIC_CATALOG_ID, checkedAt: now, ...extra } });

/** Calls GET /Mediapartners/{AccountSID}/Catalogs/5267/Items and returns at most five shaped items. */
export async function runDiagnostic(env: Env, fetchImpl: typeof fetch = fetch, now = new Date().toISOString()): Promise<DiagnosticResult> {
  const sid = env.IMPACT_ACCOUNT_SID?.trim();
  const token = env.IMPACT_AUTH_TOKEN?.trim();
  const missing = [!sid && "IMPACT_ACCOUNT_SID", !token && "IMPACT_AUTH_TOKEN"].filter(Boolean) as string[];
  if (missing.length) return fail(500, "missing_env", "Impact credentials are not set on the server.", now, { missing });

  const url = `https://api.impact.com/Mediapartners/${encodeURIComponent(sid!)}/Catalogs/${DIAGNOSTIC_CATALOG_ID}/Items?PageSize=${DIAGNOSTIC_LIMIT}`;
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = (e as Error)?.name === "TimeoutError" || (e as Error)?.name === "AbortError";
    return fail(504, timedOut ? "timeout" : "upstream_error", timedOut ? "Impact did not answer within 10 seconds." : "Could not reach the Impact API.", now);
  }

  const upstreamStatus = res.status;
  if (res.status === 401 || res.status === 403) return fail(502, "auth_failed", "Impact rejected the credentials, or this account cannot read the catalog.", now, { upstreamStatus });
  if (res.status === 404) return fail(502, "catalog_not_found", `Catalog ${DIAGNOSTIC_CATALOG_ID} was not found for this account.`, now, { upstreamStatus });
  if (res.status === 429) return fail(503, "rate_limited", "Impact is rate limiting this account. Try again later.", now, { upstreamStatus });
  if (!res.ok) return fail(502, "upstream_error", "Impact returned an error.", now, { upstreamStatus });

  let data: unknown;
  try { data = await res.json(); } catch { return fail(502, "bad_response", "Impact's response was not JSON.", now, { upstreamStatus }); }
  const items = (data as { Items?: unknown } | null)?.Items;
  if (!Array.isArray(items)) return fail(502, "bad_response", "Impact's response had no Items list.", now, { upstreamStatus });

  return {
    status: 200,
    body: {
      ok: true,
      code: "ok",
      message: items.length ? "Connected to the Impact API and read the Lids catalog." : "Connected, but the catalog returned no items.",
      catalogId: DIAGNOSTIC_CATALOG_ID,
      checkedAt: now,
      upstreamStatus,
      itemsInResponse: items.length,
      items: items.slice(0, DIAGNOSTIC_LIMIT).map(toItem),
    },
  };
}

import { after } from "next/server";

export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

/** The host the visitor's browser asked for. Behind Netlify, req.url can carry an internal host instead. */
const publicHost = (req: Request) =>
  (req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host).split(",")[0].trim().toLowerCase();

const SITE_HOST = /(^|\.)topsellingjerseys\.net$|\.netlify\.app$|^localhost$/i;

/** The page the link was on: the link's own ?from= (added in the browser), else the Referer (this site only). */
export function fromPage(req: Request) {
  const from = new URL(req.url).searchParams.get("from") ?? "";
  if (/^\/[a-z0-9\-_/.~%]*$/i.test(from) && from.length <= 200) return from;
  try {
    const ref = new URL(req.headers.get("referer") ?? "");
    if (ref.host.toLowerCase() === publicHost(req) || SITE_HOST.test(ref.hostname)) return ref.pathname;
  } catch { /* no referrer */ }
  return "";
}

/** Set by /me/ on the editor's own browsers, so the desk can leave their clicks out. */
export const ME_COOKIE = "tsj_me";
const isMe = (req: Request) => /(?:^|;\s*)tsj_me=1(?:;|$)/.test(req.headers.get("cookie") ?? "");

const clientIp = (req: Request) => (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "").trim();

/**
 * Counts a click on the editor desk (DESK_CLICK_URL + DESK_CLICK_KEY) after the redirect is sent.
 * The IP and browser go along so the desk can rate-limit, tell visitors apart with a salted hash and
 * label the device; the desk stores neither as sent. The Referer and the "this is me" cookie go along too.
 */
export function sendClick(req: Request, click: { kind: "affiliate" | "ad"; slot: string; target: string; href: string; label: string; page: string; ref?: string }) {
  const url = process.env.DESK_CLICK_URL;
  const key = process.env.DESK_CLICK_KEY;
  const ua = req.headers.get("user-agent") ?? "";
  if (!url || !key || BOT.test(ua)) return;
  const body = {
    site: "topsellingjerseys", ...click, ip: clientIp(req), ua: ua.slice(0, 400),
    referrer: (req.headers.get("referer") ?? "").slice(0, 500), self: publicHost(req).split(":")[0], me: isMe(req),
  };
  after(async () => {
    try {
      await fetch(`${url.replace(/\/+$/, "")}/api/click`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
    } catch { /* never let counting break a click */ }
  });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/**
 * Passes a page view on to the editor desk (same DESK_CLICK_URL and key as clicks): the page, the referring
 * address, any utm_ tags, screen width, and Netlify's rough location. The desk keeps no IP address.
 */
export function sendView(req: Request, v: Record<string, unknown>, self: string) {
  const url = process.env.DESK_CLICK_URL;
  const key = process.env.DESK_CLICK_KEY;
  if (!url || !key) { console.error("desk page view: DESK_CLICK_URL or DESK_CLICK_KEY is not set"); return; }
  const ip = clientIp(req);
  const body = {
    site: "topsellingjerseys", page: str(v.page, 300), ref: str(v.ref, 500),
    utm_source: str(v.utm_source, 80), utm_medium: str(v.utm_medium, 80), utm_campaign: str(v.utm_campaign, 120),
    w: Number(v.w) || 0, reload: v.reload === true, self,
    ip, ua: (req.headers.get("user-agent") ?? "").slice(0, 400), geo: (req.headers.get("x-nf-geo") ?? "").slice(0, 4000),
  };
  after(async () => {
    try {
      const res = await fetch(`${url.replace(/\/+$/, "")}/api/visit`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) console.error(`desk page view: ${res.status}`);
    } catch (e) { console.error("desk page view failed", e); /* never let counting break a page */ }
  });
}

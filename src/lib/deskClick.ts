import { after } from "next/server";

export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

/** The page the link was on: the link's own ?from= (added in the browser), else the Referer (same site only). */
export function fromPage(req: Request) {
  const from = new URL(req.url).searchParams.get("from") ?? "";
  if (/^\/[a-z0-9\-_/.~%]*$/i.test(from) && from.length <= 200) return from;
  try {
    const ref = new URL(req.headers.get("referer") ?? "");
    if (ref.host === new URL(req.url).host) return ref.pathname;
  } catch { /* no referrer */ }
  return "";
}

/**
 * Counts a click on the editor desk (DESK_CLICK_URL + DESK_CLICK_KEY) after the redirect is sent.
 * The IP goes along for rate limiting only.
 */
export function sendClick(req: Request, click: { kind: "affiliate" | "ad"; slot: string; target: string; href: string; label: string; page: string; ref?: string }) {
  const url = process.env.DESK_CLICK_URL;
  const key = process.env.DESK_CLICK_KEY;
  if (!url || !key || BOT.test(req.headers.get("user-agent") ?? "")) return;
  const ip = (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "").trim();
  after(async () => {
    try {
      await fetch(`${url.replace(/\/+$/, "")}/api/click`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ site: "topsellingjerseys", ...click, ip }),
        signal: AbortSignal.timeout(4000),
      });
    } catch { /* never let counting break a click */ }
  });
}

import { NextResponse, after } from "next/server";
import { randomBytes } from "node:crypto";
import { resolveOffer, type Offer } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

const IMPACT = /(^|\.)7q8j\.net$/i;
const CJ = /(^|\.)(kqzyfj\.com|anrdoezrs\.net|jdoqocy\.com|tkqlhce\.com|dpbolvw\.net)$/i;

/** A short random click reference: "t" for TopSellingJerseys, then 11 letters and digits. */
const newRef = () => `t${[...randomBytes(11)].map((b) => (b % 36).toString(36)).join("")}`;

/** Sets one query parameter without re-encoding the others, so the network's own ?u= stays byte for byte. */
function setParam(href: string, name: string, value: string) {
  const k = href.indexOf("#");
  const hash = k >= 0 ? href.slice(k) : "";
  let h = (k >= 0 ? href.slice(0, k) : href).replace(new RegExp(`([?&])${name}=[^&]*&?`, "g"), "$1").replace(/[?&]$/, "");
  h += `${h.includes("?") ? "&" : "?"}${name}=${encodeURIComponent(value)}`;
  return h + hash;
}

/** The page the Shop button was on, when the browser says (same site only). */
function fromPage(req: Request) {
  try {
    const ref = new URL(req.headers.get("referer") ?? "");
    if (ref.host === new URL(req.url).host) return ref.pathname;
  } catch { /* no referrer */ }
  return "";
}

/**
 * Adds a click reference to Impact (Lids) and CJ links. The network reports it with any
 * sale, so the editor desk can show which page and button led to the purchase.
 */
function tagged(href: string, page: string): { href: string; ref: string } {
  let host = "";
  try { host = new URL(href).hostname; } catch { return { href, ref: "" }; }
  if (IMPACT.test(host)) {
    const ref = newRef();
    return { href: setParam(setParam(href, "subId2", ref), "subId3", page.toLowerCase().replace(/\//g, "~").slice(0, 80)), ref };
  }
  if (CJ.test(host)) {
    const ref = newRef();
    return { href: setParam(href, "sid", ref), ref };
  }
  return { href, ref: "" };
}

/**
 * Counts the click on the editor desk (DESK_CLICK_URL + DESK_CLICK_KEY) after the redirect is sent.
 * Records which offer, where on the page (?at=) and which page (Referer); the IP goes along for rate limiting only.
 */
function recordClick(req: Request, offer: Offer, page: string, ref: string) {
  const url = process.env.DESK_CLICK_URL;
  const key = process.env.DESK_CLICK_KEY;
  if (!url || !key || BOT.test(req.headers.get("user-agent") ?? "")) return;
  const at = (new URL(req.url).searchParams.get("at") ?? "").replace(/[^a-z0-9_]/gi, "").slice(0, 40);
  const ip = (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "").trim();
  after(async () => {
    try {
      await fetch(`${url.replace(/\/+$/, "")}/api/click`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ site: "topsellingjerseys", kind: "affiliate", slot: [offer.kind, at].filter(Boolean).join(" · "), target: offer.merchantName, href: offer.id, label: offer.label, page, ip, ref }),
        signal: AbortSignal.timeout(4000),
      });
    } catch { /* never let counting break shopping */ }
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const offer = resolveOffer(offerId);
  const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" };
  if (!offer) return new NextResponse("Link not found", { status: 404, headers });
  const page = fromPage(req);
  const bot = BOT.test(req.headers.get("user-agent") ?? "");
  const out = bot ? { href: offer.href, ref: "" } : tagged(offer.href, page);
  recordClick(req, offer, page, out.ref);
  return NextResponse.redirect(out.href, { status: 302, headers });
}

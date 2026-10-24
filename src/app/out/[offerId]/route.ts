import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { resolveOffer } from "@/lib/affiliate";
import { BOT, fromPage, sendClick } from "@/lib/deskClick";

export const dynamic = "force-dynamic";


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

/**
 * Adds a click reference to Impact (Lids) and CJ links. The network reports it with any
 * sale, so the editor desk can show which page and button led to the purchase.
 */
function tagged(href: string, page: string): { href: string; ref: string } {
  let host = "";
  try { host = new URL(href).hostname; } catch { return { href, ref: "" }; }
  if (IMPACT.test(host)) {
    const ref = newRef();
    return { href: setParam(setParam(href, "subId2", ref), "subId3", page.toLowerCase().replace(/(.)\/+$/, "$1").replace(/\//g, "~").slice(0, 80)), ref };
  }
  if (CJ.test(host)) {
    const ref = newRef();
    return { href: setParam(href, "sid", ref), ref };
  }
  return { href, ref: "" };
}

export async function GET(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const offer = resolveOffer(offerId);
  const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" };
  if (!offer) return new NextResponse("Link not found", { status: 404, headers });
  const page = fromPage(req);
  const bot = BOT.test(req.headers.get("user-agent") ?? "");
  const out = bot ? { href: offer.href, ref: "" } : tagged(offer.href, page);
  if (!bot) {
    const at = (new URL(req.url).searchParams.get("at") ?? "").replace(/[^a-z0-9_]/gi, "").slice(0, 40);
    sendClick(req, { kind: "affiliate", slot: [offer.kind, at].filter(Boolean).join(" · "), target: offer.merchantName, href: offer.id, label: offer.label, page, ref: out.ref });
  }
  return NextResponse.redirect(out.href, { status: 302, headers });
}

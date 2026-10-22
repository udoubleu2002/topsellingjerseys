import { NextResponse, after } from "next/server";
import { resolveOffer, type Offer } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

/**
 * Counts the click on the editor desk (DESK_CLICK_URL + DESK_CLICK_KEY) after the redirect is sent.
 * Records which offer, where on the page (?at=) and which page (Referer); the IP goes along for rate limiting only.
 */
function recordClick(req: Request, offer: Offer) {
  const url = process.env.DESK_CLICK_URL;
  const key = process.env.DESK_CLICK_KEY;
  if (!url || !key || BOT.test(req.headers.get("user-agent") ?? "")) return;
  const at = (new URL(req.url).searchParams.get("at") ?? "").replace(/[^a-z0-9_]/gi, "").slice(0, 40);
  let page = "";
  try {
    const ref = new URL(req.headers.get("referer") ?? "");
    if (ref.host === new URL(req.url).host) page = ref.pathname;
  } catch { /* no referrer */ }
  const ip = (req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "").trim();
  after(async () => {
    try {
      await fetch(`${url.replace(/\/+$/, "")}/api/click`, {
        method: "POST",
        headers: { "Content-Type": "text/plain", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ site: "topsellingjerseys", kind: "affiliate", slot: [offer.kind, at].filter(Boolean).join(" · "), target: offer.merchantName, href: offer.id, label: offer.label, page, ip }),
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
  recordClick(req, offer);
  return NextResponse.redirect(offer.href, { status: 302, headers });
}

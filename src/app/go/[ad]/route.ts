import { NextResponse } from "next/server";
import { houseAd } from "@/lib/houseAds";
import { fromPage, sendClick } from "@/lib/deskClick";

export const dynamic = "force-dynamic";

/** A click on an ad for one of our other sites: counted on the editor desk, then sent on. */
export async function GET(req: Request, { params }: { params: Promise<{ ad: string }> }) {
  const ad = houseAd((await params).ad);
  const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };
  if (!ad) return new NextResponse("Link not found", { status: 404, headers });
  const at = (new URL(req.url).searchParams.get("at") ?? "").replace(/[^a-z0-9_]/gi, "").slice(0, 40);
  const to = new URL(ad.url);
  to.searchParams.set("utm_source", "topsellingjerseys");
  to.searchParams.set("utm_medium", "house_ad");
  if (at) to.searchParams.set("utm_content", at);
  sendClick(req, { kind: "ad", slot: at || "house_ad", target: ad.domain, href: to.href, label: `${ad.name}: ${ad.pitch}`, page: fromPage(req) });
  return NextResponse.redirect(to.href, { status: 302, headers });
}

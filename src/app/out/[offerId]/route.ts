import { NextResponse } from "next/server";
import { resolveOffer } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId } = await params;
  const offer = resolveOffer(offerId);
  const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer-when-downgrade" };
  if (!offer) return new NextResponse("Link not found", { status: 404, headers });
  return NextResponse.redirect(offer.href, { status: 302, headers });
}

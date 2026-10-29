import { NextResponse } from "next/server";
import { BOT, sendView } from "@/lib/deskClick";

export const dynamic = "force-dynamic";

/** A page view from the site's own pages, passed on to the editor desk with where the visitor came from. */
export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204, headers });
  // Only this site's own pages (same origin) send page views.
  const origin = req.headers.get("origin");
  const { host, hostname } = new URL(req.url);
  if (origin && new URL(origin).host !== host) return new NextResponse(null, { status: 403, headers });
  const raw = await req.text();
  if (raw.length > 2000) return new NextResponse(null, { status: 413, headers });
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400, headers });
  }
  sendView(req, body, hostname);
  return new NextResponse(null, { status: 204, headers });
}

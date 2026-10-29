import { NextResponse } from "next/server";
import { BOT, sendView } from "@/lib/deskClick";

export const dynamic = "force-dynamic";

/** A page view from the site's own pages, passed on to the editor desk with where the visitor came from. */
export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204, headers });
  // Only this site's own pages send page views. Behind Netlify, req.url can carry an internal host,
  // so the page's own address comes from the Origin header (or the Host header the visitor's browser sent).
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || new URL(req.url).host;
  let self = host.split(":")[0];
  const origin = req.headers.get("origin");
  if (origin) {
    let o: URL;
    try { o = new URL(origin); } catch { return new NextResponse(null, { status: 403, headers }); }
    if (o.host !== host && !/(^|\.)topsellingjerseys\.net$|\.netlify\.app$|^localhost$/i.test(o.hostname)) return new NextResponse(null, { status: 403, headers });
    self = o.hostname;
  }
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
  sendView(req, body, self);
  return new NextResponse(null, { status: 204, headers });
}

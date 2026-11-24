import { NextResponse } from "next/server";
import { EMAIL_RE, getProvider } from "@/lib/newsletter/provider";
import { abs } from "@/lib/config";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, { status, headers });

/**
 * Newsletter sign-up from the sidebar and footer forms. The address goes straight to the newsletter service
 * (see src/lib/newsletter); the site stores nothing.
 */
export async function POST(req: Request) {
  const provider = getProvider();
  if (!provider) return reply(503, { error: "Sign-ups aren't open yet." });
  // Only this site's own pages can sign people up.
  const origin = req.headers.get("origin");
  if (origin) {
    let o: URL;
    try { o = new URL(origin); } catch { return reply(403, { error: "Not allowed." }); }
    const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0];
    if (o.hostname !== host && !/(^|\.)topsellingjerseys\.net$|\.netlify\.app$|^localhost$/i.test(o.hostname)) return reply(403, { error: "Not allowed." });
  }
  const raw = await req.text();
  if (raw.length > 1000) return reply(413, { error: "Too long." });
  let body: { email?: unknown; source?: unknown; website?: unknown };
  try { body = JSON.parse(raw); } catch { return reply(400, { error: "Enter a valid email address." }); }
  // Hidden "website" field: people never fill it in, form-filling bots do. Pretend it worked.
  if (typeof body.website === "string" && body.website) return reply(200, { ok: true });
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(400, { error: "Enter a valid email address." });
  const source = typeof body.source === "string" && /^\/[a-z0-9\-_/.~%]*$/i.test(body.source) ? body.source.slice(0, 120) : "";
  try {
    const result = await provider.subscribe(email, source ? abs(source) : "");
    return reply(200, { ok: true, already: result === "already" });
  } catch (e) {
    console.error("newsletter signup", e instanceof Error ? e.message : e);
    return reply(502, { error: "That didn't go through. Please try again." });
  }
}

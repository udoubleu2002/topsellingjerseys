import { NextResponse } from "next/server";
import { ME_COOKIE } from "@/lib/deskClick";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * Marks this browser as the editor's own, so the editor desk leaves its Shop clicks out of the counts.
 * Anyone can open it, but it only changes how their own clicks are counted. ?set=1 marks, ?set=0 unmarks.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const set = url.searchParams.get("set");
  const headers: Record<string, string> = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  const secure = (req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")) === "https" ? "; Secure" : "";
  if (set === "1" || set === "0") {
    const res = new NextResponse(null, { status: 303, headers: { ...headers, Location: "/me/" } });
    res.headers.append("Set-Cookie", set === "1"
      ? `${ME_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 400}; HttpOnly; SameSite=Lax${secure}`
      : `${ME_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`);
    return res;
  }
  const me = /(?:^|;\s*)tsj_me=1(?:;|$)/.test(req.headers.get("cookie") ?? "");
  const msg = me
    ? "This browser is marked as yours. Your Shop clicks here are still counted, but the editor desk leaves them out of its numbers."
    : "This browser is not marked. Mark it so the editor desk leaves your own Shop clicks out of its numbers. Do this once in each browser and phone you use.";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Mark this browser as me</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 16px;color:#1d2b22;background:#faf6ee}
a.btn{display:inline-block;padding:.6rem 1rem;border-radius:.4rem;background:#1f4d33;color:#fff;text-decoration:none;font-weight:600}
a.alt{background:none;color:#1f4d33;border:1px solid #1f4d33}</style></head><body>
<h1>${me ? "✓ This browser is you" : "Mark this browser as me"}</h1><p>${esc(msg)}</p>
<p>${me ? '<a class="btn alt" href="/me/?set=0">Unmark this browser</a>' : '<a class="btn" href="/me/?set=1">Mark this browser as me</a>'}</p>
<p><a href="/">Back to Top Selling Jerseys</a></p></body></html>`;
  return new NextResponse(html, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

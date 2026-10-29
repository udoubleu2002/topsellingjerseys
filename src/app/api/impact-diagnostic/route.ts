import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { runDiagnostic, type DiagnosticResult } from "@/lib/impactDiagnostic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" };

/** One Impact call per server instance per window: 10 minutes after a success, 1 minute after an error. */
let cached: { at: number; result: DiagnosticResult } | null = null;
const ttl = (r: DiagnosticResult) => (r.body.ok ? 600_000 : 60_000);

const digest = (s: string) => createHash("sha256").update(s).digest();
/** Constant-time compare, so response timing does not leak the key. */
const keyMatches = (given: string, expected: string) => timingSafeEqual(digest(given), digest(expected));

/**
 * GET /api/impact-diagnostic/ with header x-diagnostic-key (or ?key=) equal to IMPACT_DIAGNOSTIC_KEY.
 * Answers 404 without the key, and when IMPACT_DIAGNOSTIC_KEY is not set, so the route is off by default.
 * It takes no other input: the catalog and item limit are fixed in impactDiagnostic.ts.
 */
export async function GET(req: Request) {
  const expected = process.env.IMPACT_DIAGNOSTIC_KEY?.trim();
  const given = req.headers.get("x-diagnostic-key") ?? new URL(req.url).searchParams.get("key") ?? "";
  if (!expected || !keyMatches(given, expected)) return new NextResponse("Not found", { status: 404, headers });

  if (!cached || Date.now() - cached.at > ttl(cached.result)) {
    cached = { at: Date.now(), result: await runDiagnostic(process.env) };
    if (!cached.result.body.ok) console.error(`impact-diagnostic: ${cached.result.body.code} (upstream ${cached.result.body.upstreamStatus ?? "none"})`);
  }
  const ageSeconds = Math.round((Date.now() - cached.at) / 1000);
  return NextResponse.json({ ...cached.result.body, cacheAgeSeconds: ageSeconds }, { status: cached.result.status, headers });
}

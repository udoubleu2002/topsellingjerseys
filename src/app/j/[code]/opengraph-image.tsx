import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { ogSize } from "@/lib/og";
import { getLeague } from "@/lib/data";
import { decodeCollection, grouped, COLLECTION_LEAGUES, type CollectionLeague } from "@/lib/collection";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "A jersey collection from Top Selling Jerseys";

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "assets/fonts", f));
const ROWS = 8;

/** Link-preview card for a shared collection: the count, then every jersey by sport (overflow becomes "+N more"). */
export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const c = decodeCollection(code);
  const leagues = c ? COLLECTION_LEAGUES.filter((l) => c.jerseys[l].length) : [];
  // Five name columns in all: each sport gets one, and leftover columns go to the sports with the longest lists.
  const alloc: Record<string, number> = Object.fromEntries(leagues.map((l) => [l, 1]));
  for (let spare = 5 - leagues.length; spare > 0; spare--) {
    const need = (l: string) => Math.ceil(grouped(c!.jerseys[l as CollectionLeague]).length / ROWS) - alloc[l];
    const next = [...leagues].sort((a, b) => need(b) - need(a))[0];
    if (!next || need(next) <= 0) break;
    alloc[next]++;
  }
  const who = c?.name || "This collection";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0b0f18", color: "#f4f6fa", position: "relative", fontFamily: "Barlow", padding: "44px 56px 40px" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 3px, transparent 3px, transparent 20px)" }} />
        <div style={{ position: "absolute", right: -200, top: -260, width: 700, height: 700, display: "flex", borderRadius: 700, backgroundImage: "radial-gradient(circle, rgba(232,68,44,0.32), rgba(232,68,44,0) 65%)" }} />
        {/* "Joe has 16 jerseys", then the list, then the question that invites the reader to count theirs. */}
        <div style={{ display: "flex", alignItems: "baseline", textTransform: "uppercase", lineHeight: 1 }}>
          {c ? (
            <>
              <span style={{ fontSize: who.length > 16 ? 60 : 72 }}>{who} has</span>
              <span style={{ fontFamily: "BarlowItalic", fontSize: 104, color: "#f3b940", margin: "0 18px" }}>{c.count}</span>
              <span style={{ fontSize: who.length > 16 ? 60 : 72 }}>{c.count === 1 ? "jersey" : "jerseys"}</span>
            </>
          ) : <span style={{ fontSize: 76 }}>What&apos;s your jersey count?</span>}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 20, flex: 1, minHeight: 0 }}>
          {c ? leagues.map((l) => {
            const names = grouped(c.jerseys[l]);
            const cap = ROWS * alloc[l];
            const shown = names.length > cap ? names.slice(0, cap - 1) : names;
            const more = names.length - shown.length;
            const roomy = shown.length <= 5;
            const cols = Array.from({ length: Math.ceil((shown.length + (more ? 1 : 0)) / ROWS) }, (_, i) => shown.slice(i * ROWS, (i + 1) * ROWS));
            if (more) { if (!cols.length || cols[cols.length - 1].length === ROWS) cols.push([]); cols[cols.length - 1].push(`+${more} more`); }
            const lg = getLeague(l);
            return (
              <div key={l} style={{ display: "flex", flexDirection: "column", flex: cols.length, background: "rgba(18,25,39,0.92)", borderRadius: 12, borderTop: `6px solid ${lg?.accent ?? "#e8442c"}`, padding: "14px 18px", minWidth: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: 2 }}>
                  <span>{lg?.name ?? l.toUpperCase()}</span>
                  <span style={{ color: "#f3b940" }}>{c.jerseys[l].length}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {cols.map((col, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                      {/* Short columns have room for a long name to wrap; full ones keep one line per name. */}
                      {col.map((n) => (
                        <div key={n} style={{ display: "flex", fontFamily: "Public", fontSize: 22, lineHeight: roomy ? 1.2 : 1.45, marginBottom: roomy ? 8 : 0, color: n.startsWith("+") ? "#8d99b0" : "#e6eaf2", ...(roomy ? {} : { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }) }}>{n}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          }) : <div style={{ display: "flex", fontFamily: "Public", fontSize: 32, color: "#c5ccd9" }}>Add every jersey you own and share your count.</div>}
        </div>
        {c && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <div style={{ display: "flex", fontSize: 46, textTransform: "uppercase", color: "#f4f6fa" }}><span>What&apos;s</span><span style={{ color: "#e8442c", margin: "0 12px" }}>your</span><span>jersey count?</span></div>
            <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#8d99b0" }}>
              <svg width="30" height="30" viewBox="0 0 64 64"><path d="M23 9 13 13 4 23l8 9 5-4v28h30V28l5 4 8-9-9-10-10-4c-1.6 4.6-4.9 7-9 7s-7.4-2.4-9-7z" fill="#e8442c" /></svg>
              Top Selling Jerseys
            </span>
          </div>
        )}
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Barlow", data: font("BarlowCondensed-ExtraBold.ttf"), weight: 800, style: "normal" },
        { name: "BarlowItalic", data: font("BarlowCondensed-ExtraBoldItalic.ttf"), weight: 800, style: "italic" },
        { name: "Public", data: font("PublicSans-Medium.ttf"), weight: 500, style: "normal" },
      ],
    },
  );
}

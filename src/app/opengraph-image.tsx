import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { ogSize } from "@/lib/og";
import { getLeagues, getCurrentRanking, getPlayer, getTeam } from "@/lib/data";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Top Selling Jerseys: the No. 1 selling jersey in the NFL, NBA, WNBA, MLB, NHL and MLS";

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "assets/fonts", f));

/** Homepage share card: a five-league leaderboard of each official list's No. 1, built from the published data. */
export default function Image() {
  const rows = getLeagues().flatMap((l) => {
    const r = getCurrentRanking(l.id);
    const p = r && getPlayer(r.entries[0].playerId);
    if (!p) return [];
    const c = getTeam(p.teamId ?? p.lastTeamId)?.colors ?? { primary: "#e5e7eb", secondary: "#334155", accent: "#94a3b8" };
    return [{ league: l.name, accent: l.accent, name: p.name, num: p.number ?? "", c }];
  });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0f18", color: "#f4f6fa", position: "relative", fontFamily: "Barlow" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 3px, transparent 3px, transparent 20px)" }} />
        <div style={{ position: "absolute", left: -220, bottom: -260, width: 760, height: 760, display: "flex", borderRadius: 760, backgroundImage: "radial-gradient(circle, rgba(232,68,44,0.38), rgba(232,68,44,0) 65%)" }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, display: "flex", background: "#e8442c" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 40px 58px 72px", width: 560, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, background: "#e8442c", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>1</div>
            <div style={{ fontSize: 28, letterSpacing: 2, textTransform: "uppercase", display: "flex" }}>Top Selling Jerseys</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, letterSpacing: 4, color: "#f3b940", textTransform: "uppercase", display: "flex" }}>Official sales lists</div>
            <div style={{ fontSize: 112, lineHeight: 0.9, textTransform: "uppercase", marginTop: 10, display: "flex", flexDirection: "column" }}>
              <span>Who&apos;s</span>
              <span style={{ fontFamily: "BarlowItalic", color: "#e8442c" }}>No. 1?</span>
            </div>
            <div style={{ fontFamily: "Public", fontSize: 27, color: "#c5ccd9", marginTop: 20, lineHeight: 1.3, display: "flex" }}>The best-selling jerseys in five leagues, with stats and shop links.</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, flex: 1, paddingRight: 64, position: "relative" }}>
          {rows.map((r) => (
            <div key={r.league} style={{ display: "flex", alignItems: "center", height: 92, background: "#121927", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", borderLeft: `8px solid ${r.accent}`, paddingRight: 22, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
              <div style={{ width: 92, display: "flex", justifyContent: "center", fontSize: 30, letterSpacing: 2, color: "#c5ccd9" }}>{r.league}</div>
              <div style={{ width: 64, height: 70, borderRadius: 8, background: r.c.primary, color: r.c.secondary, borderBottom: `8px solid ${r.c.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>{r.num}</div>
              <div style={{ display: "flex", flex: 1, marginLeft: 20, fontSize: 40, textTransform: "uppercase", lineHeight: 1 }}>{r.name}</div>
              <div style={{ fontFamily: "BarlowItalic", fontSize: 34, color: "#f3b940", display: "flex" }}>No. 1</div>
            </div>
          ))}
        </div>
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

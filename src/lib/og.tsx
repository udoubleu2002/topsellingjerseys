import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "assets/fonts", f));

/** Share image in the site's broadcast style. Optional tile shows a team-color number swatch (never a jersey drawing). */
export function renderOg({ kicker, title, sub, tile, rank }: { kicker: string; title: string; sub?: string; tile?: { bg: string; fg: string; stripe: string; num: string }; rank?: number }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0f18", color: "#f4f6fa", position: "relative", fontFamily: "Barlow" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 3px, transparent 3px, transparent 20px)" }} />
        <div style={{ position: "absolute", right: -160, top: -160, width: 700, height: 700, display: "flex", borderRadius: 700, backgroundImage: "radial-gradient(circle, rgba(232,68,44,0.35), rgba(232,68,44,0) 65%)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", flex: 1, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Top Selling Jerseys</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: tile ? 720 : 1000 }}>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: "#f3b940", textTransform: "uppercase", display: "flex" }}>{kicker}</div>
            <div style={{ fontSize: title.length > 26 ? 84 : 112, fontWeight: 800, lineHeight: 0.95, textTransform: "uppercase", marginTop: 12, display: "flex", flexWrap: "wrap" }}>{title}</div>
            {sub && <div style={{ fontFamily: "Public", fontSize: 30, color: "#c5ccd9", marginTop: 22, display: "flex" }}>{sub}</div>}
          </div>
        </div>
        {tile && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingRight: 80, position: "relative" }}>
            {rank && <div style={{ fontFamily: "BarlowItalic", fontSize: 120, color: rank === 1 ? "#f3b940" : "#f4f6fa", lineHeight: 1, display: "flex" }}>{`No. ${rank}`}</div>}
            <div style={{ width: 300, height: 340, marginTop: 20, borderRadius: 14, background: tile.bg, borderBottom: `22px solid ${tile.stripe}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 190, fontWeight: 800, color: tile.fg, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>{tile.num}</div>
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

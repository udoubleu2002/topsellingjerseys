import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { ogSize } from "@/lib/og";
import { getLeagues, getCurrentRanking, getPlayer, getTeam } from "@/lib/data";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Who's selling the most? The No. 1 selling jersey in the NFL, NBA, WNBA, MLB, NHL and MLS";

const font = (f: string) => fs.readFileSync(path.join(process.cwd(), "assets/fonts", f));

/** A back-lit player seen from behind: dark shoulders and head with a red rim light. Drawn here, so no photo is shipped. */
const FIGURE = `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="630" viewBox="0 0 620 630">
<defs>
<radialGradient id="glow" cx="0.5" cy="0.32" r="0.55"><stop offset="0" stop-color="#e8442c" stop-opacity="0.55"/><stop offset="0.55" stop-color="#e8442c" stop-opacity="0.12"/><stop offset="1" stop-color="#e8442c" stop-opacity="0"/></radialGradient>
<linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1416"/><stop offset="1" stop-color="#07090f"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#0b0f18" stop-opacity="0"/><stop offset="1" stop-color="#0b0f18" stop-opacity="0.92"/></linearGradient>
<filter id="blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
</defs>
<rect width="620" height="630" fill="url(#glow)"/>
<g id="p">
<path d="M310 46c-38 0-62 30-62 72 0 30 8 52 22 66l-6 38c-64 12-128 30-170 62-40 30-58 92-70 170l-14 178h620l-14-178c-12-78-30-140-70-170-42-32-106-50-170-62l-6-38c14-14 22-36 22-66 0-42-24-72-62-72z"/>
</g>
<use href="#p" fill="none" stroke="#ff4a2e" stroke-width="10" filter="url(#blur)" opacity="0.9"/>
<use href="#p" fill="url(#body)" stroke="#ff5a3c" stroke-width="2.5" stroke-opacity="0.85"/>
<path d="M190 300c40-20 80-30 120-30s80 10 120 30" fill="none" stroke="#2a2024" stroke-width="4"/>
<path d="M310 270v360" stroke="#140f12" stroke-width="3"/>
<rect width="620" height="630" fill="url(#fade)"/>
</svg>`;
const figureSrc = `data:image/svg+xml;base64,${Buffer.from(FIGURE).toString("base64")}`;

/** Homepage share card: "Who's selling the most?" beside each league's current No. 1, built from the published data. */
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
        <img src={figureSrc} width={620} height={630} style={{ position: "absolute", left: -10, top: 0 }} alt="" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 30px 52px 60px", width: 600, position: "relative" }}>
          <div style={{ fontSize: 118, lineHeight: 0.92, textTransform: "uppercase", display: "flex", flexDirection: "column", textShadow: "0 4px 24px rgba(0,0,0,0.6)" }}>
            <span>Who&apos;s</span>
            <span style={{ color: "#e8442c" }}>Selling</span>
            <span>The most?</span>
          </div>
          <div style={{ width: 120, height: 7, background: "#e8442c", marginTop: 22, display: "flex" }} />
          <div style={{ fontFamily: "Public", fontSize: 30, color: "#e6e9f0", marginTop: 20, lineHeight: 1.3, display: "flex" }}>Best-selling jerseys across the NFL, NBA, WNBA, MLB, NHL &amp; MLS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, flex: 1, paddingRight: 48, position: "relative" }}>
          {rows.map((r) => (
            <div key={r.league} style={{ display: "flex", alignItems: "center", height: 86, background: "rgba(18,25,39,0.94)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", borderLeft: `8px solid ${r.accent}`, paddingRight: 22, boxShadow: "0 12px 30px rgba(0,0,0,0.35)" }}>
              <div style={{ width: 84, display: "flex", justifyContent: "center", fontSize: 26, letterSpacing: 2, color: "#c5ccd9" }}>{r.league}</div>
              <div style={{ width: 62, height: 86, background: r.c.primary, color: r.c.secondary, borderBottom: `6px solid ${r.c.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42 }}>{r.num}</div>
              <div style={{ display: "flex", flex: 1, marginLeft: 20, fontSize: 38, textTransform: "uppercase", lineHeight: 1 }}>{r.name}</div>
              <div style={{ fontSize: 40, color: "#f3b940", display: "flex" }}>#1</div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Barlow", data: font("BarlowCondensed-ExtraBold.ttf"), weight: 800, style: "normal" },
        { name: "Public", data: font("PublicSans-Medium.ttf"), weight: 500, style: "normal" },
      ],
    },
  );
}

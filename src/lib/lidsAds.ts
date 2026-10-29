/** Lids display banners from Impact (campaign 9679). Clicks go out through /out/ad-lids-<id>/ so the desk counts them. */
export type LidsBanner = { id: string; width: number; height: number; alt: string };

const PARTNER = "6755530";
const CAMPAIGN = "9679";

export const LIDS_BANNERS: LidsBanner[] = [
  { id: "1907269", width: 300, height: 250, alt: "Pre-Order Your Shohei Ohtani LA Dodgers Jersey at Lids.com" },
  { id: "2159657", width: 300, height: 250, alt: "Shop NHL jerseys at Lids.com" },
  { id: "4114443", width: 300, height: 250, alt: "Shop jerseys and fan gear at Lids.com" },
  { id: "4114444", width: 300, height: 250, alt: "Shop Milwaukee Brewers jerseys and gear at Lids.com" },
];

/** The Lids banner that rotates into about a quarter of all ad slots (see AdRotation). */
export const ROTATION_BANNER_ID = "4114443";
export const ROTATION_SHARE = 0.25;

export const lidsBanner = (id: string) => LIDS_BANNERS.find((b) => b.id === id);
export const bannerImage = (b: LidsBanner) => `https://a.impactradius-go.com/display-ad/${CAMPAIGN}-${b.id}`;
export const bannerPixel = (b: LidsBanner) => `https://imp.pxf.io/i/${PARTNER}/${b.id}/${CAMPAIGN}`;
export const bannerLink = (b: LidsBanner) => `https://lids.7q8j.net/c/${PARTNER}/${b.id}/${CAMPAIGN}`;

/** The 300x250 for a page: the NHL banner on NHL pages, the Ohtani banner elsewhere. `alt` picks the other one. */
export function rectFor(league?: string, alt = false): LidsBanner {
  const nhl = league === "nhl";
  return lidsBanner(nhl !== alt ? "2159657" : "1907269")!;
}

/** A banner pinned to the top of the sidebar through the end of `until` (UTC), or null when nothing is pinned. */
export const PINNED_RAIL_TOP: { bannerId: string; until: string } | null = { bannerId: "4114444", until: "2026-11-28" }; // Brewers, from Oct 29

/** The pinned sidebar banner while its run lasts. Pages are built ahead of time, so `ShowUntil` also hides it in the browser once the run ends. */
export function pinnedRailBanner(now = new Date()): { banner: LidsBanner; until: string } | null {
  const pin = PINNED_RAIL_TOP;
  const banner = pin && lidsBanner(pin.bannerId);
  if (!pin || !banner || now.toISOString().slice(0, 10) > pin.until) return null;
  return { banner, until: pin.until };
}

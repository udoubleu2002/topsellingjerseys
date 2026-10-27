/** Lids display banners from Impact (campaign 9679). Clicks go out through /out/ad-lids-<id>/ so the desk counts them. */
export type LidsBanner = { id: string; width: number; height: number; alt: string };

const PARTNER = "6755530";
const CAMPAIGN = "9679";

export const LIDS_BANNERS: LidsBanner[] = [
  { id: "1907274", width: 600, height: 600, alt: "Pre-Order Your Shohei Ohtani LA Dodgers Jersey at Lids.com" },
  { id: "1907269", width: 300, height: 250, alt: "Pre-Order Your Shohei Ohtani LA Dodgers Jersey at Lids.com" },
  { id: "2159657", width: 300, height: 250, alt: "Shop NHL jerseys at Lids.com" },
];

/** Text links: the top bar always shows these, ahead of any running deals. */
export const LIDS_TEXT_LINKS: { id: string; label: string }[] = [{ id: "614558", label: "NFL Jerseys" }];

export const lidsBanner = (id: string) => LIDS_BANNERS.find((b) => b.id === id);
/** Any Lids ad (banner or text link) by id, as { id, alt } for the /out/ resolver. */
export const lidsAd = (id: string) => lidsBanner(id) ?? LIDS_TEXT_LINKS.map((t) => ({ id: t.id, alt: t.label })).find((t) => t.id === id);
export const bannerImage = (b: Pick<LidsBanner, "id">) => `https://a.impactradius-go.com/display-ad/${CAMPAIGN}-${b.id}`;
export const bannerPixel = (b: Pick<LidsBanner, "id">) => `https://imp.pxf.io/i/${PARTNER}/${b.id}/${CAMPAIGN}`;
export const bannerLink = (b: Pick<LidsBanner, "id">) => `https://lids.7q8j.net/c/${PARTNER}/${b.id}/${CAMPAIGN}`;

/** The 300x250 for a page: the NHL banner on NHL pages, the Ohtani banner elsewhere. `alt` picks the other one. */
export function rectFor(league?: string, alt = false): LidsBanner {
  const nhl = league === "nhl";
  return lidsBanner(nhl !== alt ? "2159657" : "1907269")!;
}

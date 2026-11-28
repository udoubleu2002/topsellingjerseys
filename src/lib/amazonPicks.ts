import { getMerchant } from "./data";
import type { Offer } from "./affiliate";

/**
 * Jersey display, storage and care gear sold on Amazon. Jerseys themselves always go to Lids; these are the things a
 * fan buys once they own a jersey. Each pick opens an Amazon search rather than a single listing, so there is no
 * product, photo or price to go stale. Associates rules allow Amazon prices only from Amazon's own API, so none is shown.
 */
export interface AmazonPick { id: string; name: string; blurb: string; query: string }

export const AMAZON_PICKS: AmazonPick[] = [
  { id: "jersey-display-case", name: "Jersey display case", blurb: "A wall-mounted shadow box with a UV-protective front keeps a jersey flat, dust-free and on show.", query: "jersey display case shadow box" },
  { id: "jersey-frame", name: "Frame for a signed jersey", blurb: "A deep frame with a mat and hanger inside, for a signed or game-worn jersey you never plan to wear.", query: "jersey frame for signed jersey" },
  { id: "jersey-hangers", name: "Wide-shoulder hangers", blurb: "Wide, rounded shoulders stop the stretching and bumps a thin wire hanger leaves in a heavy jersey.", query: "wide shoulder hangers for jerseys" },
  { id: "garment-bags", name: "Breathable garment bags", blurb: "For jerseys out of season: breathable bags keep out dust and light without trapping moisture the way plastic does.", query: "breathable garment bags" },
  { id: "mesh-laundry-bags", name: "Mesh laundry bags", blurb: "Wash a jersey inside out in a mesh bag on cold to protect stitched numbers, names and patches.", query: "mesh laundry bags for delicates" },
  { id: "memorabilia-case", name: "Ball and cap display case", blurb: "A clear case for a signed ball, puck or cap to sit next to the jersey.", query: "sports memorabilia display case" },
];

export const getAmazonPick = (id: string) => AMAZON_PICKS.find((p) => p.id === id);

/** The Amazon search behind a pick, with the Associates tag from the environment (see withAffiliate). */
export function amazonOffer(pick: AmazonPick, withAffiliate: (url: string, merchantId: string) => string): Offer | null {
  const merchant = getMerchant("amazon");
  if (!merchant) return null;
  const raw = merchant.searchUrlTemplate.replace("{query}", encodeURIComponent(pick.query).replace(/%20/g, "+"));
  return { id: `amazon-${pick.id}`, kind: "search", merchantId: merchant.id, merchantName: merchant.name, label: `${pick.name} on Amazon`, href: withAffiliate(raw, merchant.id) };
}

/**
 * Pulls today's Lids deals from the Impact.com partner API into data/promotions.json.
 * Needs IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN (Impact: Settings > API). The Lids campaign id comes from
 * IMPACT_LIDS_CAMPAIGN_ID, or from the AFFILIATE_DEEPLINK_LIDS tracking link.
 * Hand-entered promotions are kept; only the previous Impact deals are replaced.
 * Run: npm run deals:fetch   (the Daily Lids deals workflow runs it every morning)
 */
import fs from "node:fs";
import path from "node:path";
import { adsToPromotions, campaignFromLink, mergePromotions, type ImpactAd } from "../src/lib/impactDeals";
import type { Promotion } from "../src/lib/schema";

const sid = process.env.IMPACT_ACCOUNT_SID;
const token = process.env.IMPACT_AUTH_TOKEN;
const campaign = process.env.IMPACT_LIDS_CAMPAIGN_ID || campaignFromLink(process.env.AFFILIATE_DEEPLINK_LIDS);
const file = path.join(process.cwd(), "data", "promotions.json");

async function fetchAds(): Promise<ImpactAd[]> {
  const ads: ImpactAd[] = [];
  const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
  let next: string | null = `/Mediapartners/${sid}/Ads?CampaignId=${campaign}&PageSize=200`;
  for (let page = 0; next && page < 10; page++) {
    const res = await fetch(`https://api.impact.com${next}`, { headers: { Authorization: auth, Accept: "application/json" } });
    if (!res.ok) throw new Error(`Impact API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { Ads?: ImpactAd[]; "@nextpageuri"?: string };
    ads.push(...(body.Ads ?? []));
    next = body["@nextpageuri"] || null;
  }
  return ads;
}

async function main() {
  if (!sid || !token || !campaign) {
    console.log("Skipping: set IMPACT_ACCOUNT_SID, IMPACT_AUTH_TOKEN and IMPACT_LIDS_CAMPAIGN_ID (or AFFILIATE_DEEPLINK_LIDS).");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const ads = await fetchAds();
  const fresh = adsToPromotions(ads, today);
  const existing: Promotion[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const merged = mergePromotions(existing, fresh, today);
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`${ads.length} Lids ads from Impact, ${fresh.length} active deals written (${merged.length} promotions total).`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});

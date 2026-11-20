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
// Same default as the product sync, so deals still load when the campaign secret is not set.
const campaign = process.env.IMPACT_LIDS_CAMPAIGN_ID || campaignFromLink(process.env.AFFILIATE_DEEPLINK_LIDS) || "9679";
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

const clip = (x: unknown) => String(x ?? "").replace(/\s+/g, " ").slice(0, 70);
const day = (x: unknown) => (typeof x === "string" ? x.slice(0, 10) : "-");
const host = (u: string | undefined) => { try { return new URL(u ?? "").hostname; } catch { return "-"; } };

/** Lists what Impact's Deals or PromoCodes endpoint returns for this account, for the log only. Never fails the run. */
async function probe(kind: "Deals" | "PromoCodes") {
  try {
    const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
    const res = await fetch(`https://api.impact.com/Mediapartners/${sid}/${kind}?CampaignId=${campaign}&PageSize=100`, { headers: { Authorization: auth, Accept: "application/json" } });
    if (!res.ok) return console.log(`${kind}: HTTP ${res.status}`);
    const body = (await res.json()) as Record<string, unknown>;
    const list = (body[kind] as Record<string, unknown>[] | undefined) ?? [];
    console.log(`${kind}: ${list.length} returned; keys: ${Object.keys(list[0] ?? {}).slice(0, 25).join(", ")}`);
    for (const d of list.slice(0, 15)) console.log(`${kind === "Deals" ? "deal " : "promo"} ${clip(d.Id)} | ${clip(d.Name ?? d.Code)} | ${clip(d.State)} | code ${clip(d.DefaultPromoCode ?? d.Code ?? "-")} | ${day(d.StartDate)} to ${day(d.EndDate)} | ${clip(d.CampaignId)}`);
  } catch (e) {
    console.log(`${kind}: ${(e as Error).message}`);
  }
}

async function main() {
  if (!sid || !token || !campaign) {
    console.log("Skipping: set IMPACT_ACCOUNT_SID, IMPACT_AUTH_TOKEN and IMPACT_LIDS_CAMPAIGN_ID (or AFFILIATE_DEEPLINK_LIDS).");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const ads = await fetchAds();
  // Diagnostics: show why ads were or were not kept, so a run's log answers "why no deals?".
  const withDeal = ads.filter((a) => a.DealId);
  const count = (xs: (string | null | undefined)[]) => Object.entries(xs.reduce<Record<string, number>>((m, x) => ((m[x ?? "none"] = (m[x ?? "none"] ?? 0) + 1), m), {})).map(([k, v]) => `${k}=${v}`).join(", ");
  console.log(`ad types: ${count(ads.map((a) => a.Type))}`);
  console.log(`${withDeal.length} ads carry a deal; deal states: ${count(withDeal.map((a) => a.DealState))}; deal types: ${count(withDeal.map((a) => a.DealType))}`);
  for (const a of withDeal.slice(0, 15)) console.log(`deal  ${a.DealId} | ${clip(a.DealName)} | code ${a.DealDefaultPromoCode ?? "-"} | ${day(a.StartDate)} to ${day(a.EndDate)} | ${host(a.LandingPageUrl)}`);
  await probe("Deals");
  await probe("PromoCodes");
  const fresh = adsToPromotions(ads, today);
  const existing: Promotion[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
  const merged = mergePromotions(existing, fresh, today);
  fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`${ads.length} Lids ads from Impact, ${fresh.length} active deals written (${merged.length} promotions total).`);
}

main().catch((e) => {
  // A refused or failed deals request must not stop the daily job: the product sync runs after this step.
  // Current promotions are left as they are.
  const msg = (e as Error).message;
  console.warn(`${process.env.GITHUB_ACTIONS ? "::warning::" : ""}Lids deals not refreshed: ${msg}${/ 40[13]/.test(msg) ? " (this Impact API token may not have access to the Ads endpoint)" : ""}`);
});

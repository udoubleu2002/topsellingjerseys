/**
 * Fills data/products.json with Lids jerseys (photo, price, stock, tracking link) from the Impact.com product catalog.
 * Needs IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN (Impact: Settings > API). Only items from the Lids campaign are used:
 * IMPACT_LIDS_CAMPAIGN_ID, else the one in AFFILIATE_DEEPLINK_LIDS, else 9679. Items must come from catalog IMPACT_LIDS_CATALOG_ID (default 5267, the Lids Main Feed).
 * Hand-entered products are kept; only the previous feed products are replaced.
 *   npm run products:sync            players on a published ranking
 *   npm run products:sync -- --all   every player (one API call each, so slower)
 *   npm run products:sync -- --dry   print matches without writing
 */
import fs from "node:fs";
import path from "node:path";
import { loadStore, getTeam } from "../src/lib/data";
import { checkStore } from "../src/lib/validate";
import { campaignFromLink } from "../src/lib/impactDeals";
import { itemToProduct, mergeProducts, pickJerseys, type ImpactItem } from "../src/lib/impactCatalog";
import { DIAGNOSTIC_CATALOG_ID } from "../src/lib/impactDiagnostic";
import { ProductSchema, type Product } from "../src/lib/schema";

const sid = process.env.IMPACT_ACCOUNT_SID;
const token = process.env.IMPACT_AUTH_TOKEN;
const campaignId = process.env.IMPACT_LIDS_CAMPAIGN_ID || campaignFromLink(process.env.AFFILIATE_DEEPLINK_LIDS) || "9679";
const catalogId = process.env.IMPACT_LIDS_CATALOG_ID || DIAGNOSTIC_CATALOG_ID;
const all = process.argv.includes("--all");
const dry = process.argv.includes("--dry");
const file = path.join(process.cwd(), "data", "products.json");
const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api<T>(pathAndQuery: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.impact.com${pathAndQuery}`, { headers: { Authorization: auth, Accept: "application/json" } });
    if (res.status === 429 && attempt < 3) { await sleep(5000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`Impact API ${res.status} on ${pathAndQuery.split("?")[0]}: ${(await res.text()).slice(0, 300)}`);
    return (await res.json()) as T;
  }
}

const search = async (keyword: string) =>
  (await api<{ Items?: ImpactItem[] }>(`/Mediapartners/${sid}/Catalogs/ItemSearch?Keyword=${encodeURIComponent(keyword)}&PageSize=100`)).Items ?? [];

async function main() {
  if (!sid || !token) {
    console.log("Skipping: set IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN.");
    return;
  }
  const store = loadStore();
  type Catalog = { Id: string | number; Name?: string; CampaignId?: string | number; AdvertiserName?: string; NumberOfItems?: number };
  const catalogs = await api<{ Catalogs?: Catalog[] }>(`/Mediapartners/${sid}/Catalogs`).catch((e) => { console.warn(`Could not list catalogs: ${(e as Error).message.split(":")[0]}`); return { Catalogs: [] as Catalog[] }; });
  const lids = (catalogs.Catalogs ?? []).find((c) => String(c.Id) === catalogId);
  for (const c of catalogs.Catalogs ?? []) console.log(`catalog ${c.Id}: ${c.Name} (${c.AdvertiserName}, campaign ${c.CampaignId}, ${c.NumberOfItems ?? "?"} items)`);
  if (!lids) console.warn(`Catalog ${catalogId} is not in this account's catalog list; searching anyway.`);

  const ranked = new Set(store.rankings.filter((r) => r.status === "published").flatMap((r) => r.entries.map((e) => e.playerId)));
  const players = store.players.filter((p) => all || ranked.has(p.id));
  const today = new Date().toISOString().slice(0, 10);
  const fresh: Product[] = [];
  const seen = new Set<string>();
  let withPhoto = 0;
  for (const p of players) {
    const team = getTeam(p.teamId ?? p.lastTeamId);
    if (!team) continue;
    const items = await search(`${p.name} jersey`);
    const picks = pickJerseys(items, p, team, { campaignId, catalogId });
    if (picks.length) withPhoto++;
    for (const i of picks) {
      // Never let one odd feed item fail the whole refresh: skip anything the data validation would reject.
      const prod = itemToProduct(i, p, team.id, today);
      const check = ProductSchema.safeParse(prod);
      if (!check.success || seen.has(prod.id)) {
        console.warn(`skip  ${prod.id}: ${check.success ? "same item already matched to another player" : `${check.error.issues[0].path.join(".")} ${check.error.issues[0].message}`}`);
        continue;
      }
      seen.add(prod.id);
      fresh.push(prod);
    }
    console.log(`${picks.length ? "found" : "none "} ${p.name}: ${picks.map((i) => i.Name).join(" | ") || `${items.length} search results, no matching Lids jersey`}`);
    await sleep(300);
  }

  const existing: Product[] = JSON.parse(fs.readFileSync(file, "utf8"));
  const merged = mergeProducts(existing, fresh);
  const { errors } = checkStore({ ...store, products: merged });
  for (const e of errors) console.error(process.env.GITHUB_ACTIONS ? `::error::${e}` : `error ${e}`);
  if (!dry) fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
  console.log(`${process.env.GITHUB_ACTIONS ? "::notice::" : ""}${withPhoto} of ${players.length} players have a Lids jersey; ${fresh.length} feed products${dry ? " (dry run, nothing written)" : ` written (${merged.length} products total)`}.`);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});

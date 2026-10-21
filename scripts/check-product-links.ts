/**
 * Checks every product URL in data/products.json and flags listings that no longer resolve.
 * Flagged products are hidden from the site until a reviewer clears the flag.
 *   npm run check:links            report only
 *   npm run check:links -- --write flag broken listings in products.json
 */
import fs from "node:fs";
import path from "node:path";

const file = path.join("data", "products.json");
const products = JSON.parse(fs.readFileSync(file, "utf8")) as { id: string; productUrl: string; flagged?: string | null }[];
const write = process.argv.includes("--write");
let broken = 0;
for (const p of products) {
  try {
    const r = await fetch(p.productUrl, { method: "GET", redirect: "follow", headers: { "User-Agent": "TopSellingJerseysLinkCheck/1.0" } });
    if (r.status >= 400) { broken++; console.log(`BROKEN ${r.status} ${p.id} ${p.productUrl}`); if (write) p.flagged = `HTTP ${r.status} on ${new Date().toISOString().slice(0, 10)}`; }
    else console.log(`ok     ${r.status} ${p.id}`);
  } catch (e) {
    broken++; console.log(`ERROR  ${p.id} ${(e as Error).message}`);
    if (write) p.flagged = `unreachable on ${new Date().toISOString().slice(0, 10)}`;
  }
}
if (write) fs.writeFileSync(file, JSON.stringify(products, null, 2) + "\n");
console.log(`${products.length} product(s) checked, ${broken} need review.`);

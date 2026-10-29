import { describe, it, expect } from "vitest";
import { availability, isJersey, itemToProduct, mergeProducts, pickJerseys, CATALOG_SOURCE, type ImpactItem } from "@/lib/impactCatalog";
import { getPlayer, getTeam } from "@/lib/data";
import { ProductSchema, type Product } from "@/lib/schema";

const judge = getPlayer("aaron-judge")!;
const yankees = getTeam("new-york-yankees")!;
let n = 0;
const item = (o: Partial<ImpactItem>): ImpactItem => {
  n++;
  return {
    Id: n, CatalogItemId: `SKU${n}`, CampaignId: 9679, CatalogId: 1,
    Name: "Men's Nike Aaron Judge White New York Yankees Home Limited Player Jersey",
    Url: `https://lids.7q8j.net/c/6755530/1/9679?prodsku=SKU${n}&u=https%3A%2F%2Fwww.lids.com%2Fp-${n}`,
    ImageUrl: `https://images.footballfanatics.com/${n}.jpg`, CurrentPrice: "175.00", OriginalPrice: "175.00", Currency: "USD",
    StockAvailability: "InStock", ItemGroupId: `G${n}`, ...o,
  };
};

describe("Impact Lids catalog", () => {
  it("recognizes jerseys and skips tees and collectibles", () => {
    expect(isJersey("Men's Nike Aaron Judge Navy New York Yankees Road Limited Player Jersey")).toBe(true);
    expect(isJersey("Men's Nike Aaron Judge Navy New York Yankees Name & Number T-Shirt")).toBe(false);
    expect(isJersey("Aaron Judge New York Yankees Framed Autographed Jersey")).toBe(false);
    expect(isJersey("Aaron Judge New York Yankees Dog Jersey")).toBe(false);
  });

  it("keeps the player's current-team Lids jerseys, best first, one per variant group", () => {
    const picks = pickJerseys([
      item({ Name: "Men's Nike Aaron Judge Gray New York Yankees Road Limited Player Jersey", StockAvailability: "OutOfStock" }),
      item({ ItemGroupId: "SAME" }),
      item({ ItemGroupId: "SAME", Name: "Men's Nike Aaron Judge White New York Yankees Home Limited Player Jersey (XL)" }),
      item({ Name: "Youth Nike Aaron Judge Navy New York Yankees Alternate Player Jersey" }),
      item({ Name: "Men's Nike Aaron Judge Fresno State Jersey" }),
      item({ Name: "Men's Nike Mookie Betts Los Angeles Dodgers Jersey" }),
      item({ CampaignId: 1234 }),
      item({ ImageUrl: "http://insecure.example.com/x.jpg" }),
      item({ Name: "Men's Nike Aaron Judge New York Yankees T-Shirt" }),
      item({ CatalogId: 999 }),
      item({ CampaignId: undefined, Url: "https://other.sjv.io/c/6755530/1/1234?u=https%3A%2F%2Fexample.com" }),
    ], judge, yankees, { campaignId: "9679", catalogId: "1" });
    expect(picks.map((i) => i.Name)).toEqual([
      "Men's Nike Aaron Judge White New York Yankees Home Limited Player Jersey",
      "Youth Nike Aaron Judge Navy New York Yankees Alternate Player Jersey",
      "Men's Nike Aaron Judge Gray New York Yankees Road Limited Player Jersey",
    ]);
  });

  it("does not drop items when Impact leaves out the catalog or campaign fields", () => {
    const picks = pickJerseys([item({ CampaignId: undefined, CatalogId: undefined })], judge, yankees, { campaignId: "9679", catalogId: "5267" });
    expect(picks).toHaveLength(1);
  });

  it("turns an item into a valid product with the feed photo and tracking link", () => {
    const p = itemToProduct(item({ CatalogItemId: "ABC 123", CurrentPrice: "139.99", OriginalPrice: "175.00" }), judge, yankees.id, "2026-10-29");
    expect(ProductSchema.parse(p)).toMatchObject({
      id: "impact-lids-abc-123", playerId: "aaron-judge", teamId: "new-york-yankees", league: "mlb", merchantId: "lids",
      productType: "jersey", edition: "Home", price: 139.99, listPrice: 175, currency: "USD", availability: "in-stock",
      lastVerified: "2026-10-29", image: { source: CATALOG_SOURCE },
    });
    expect(p.productUrl).toMatch(/^https:\/\/www\.lids\.com\/p-/);
    expect(p.affiliateUrl).toMatch(/^https:\/\/lids\.7q8j\.net\/c\//);
  });

  it("maps feed stock values", () => {
    expect(availability("InStock")).toBe("in-stock");
    expect(availability("out of stock")).toBe("out-of-stock");
    expect(availability("PreOrder")).toBe("preorder");
    expect(availability(null)).toBe("unknown");
  });

  it("replaces old feed products, keeps hand-entered ones and reviewer flags", () => {
    const base = itemToProduct(item({}), judge, yankees.id, "2026-10-01");
    const existing: Product[] = [
      { ...base, id: "manual-judge" },
      { ...base, id: "impact-lids-old" },
      { ...base, id: "impact-lids-bad", flagged: "wrong player" },
    ];
    const fresh = [{ ...base, id: "impact-lids-bad" }, { ...base, id: "impact-lids-new" }];
    const out = mergeProducts(existing, fresh);
    expect(out.map((p) => [p.id, p.flagged ?? null])).toEqual([["manual-judge", null], ["impact-lids-bad", "wrong player"], ["impact-lids-new", null]]);
  });
});

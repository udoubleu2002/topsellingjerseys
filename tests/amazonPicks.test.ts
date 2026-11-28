import { afterEach, describe, expect, it } from "vitest";
import { resolveOffer } from "../src/lib/affiliate";
import { AMAZON_PICKS } from "../src/lib/amazonPicks";

describe("Amazon picks", () => {
  afterEach(() => { delete process.env.AFFILIATE_PARAMS_AMAZON; });
  it("resolves every pick to an Amazon search with the Associates tag from the environment", () => {
    process.env.AFFILIATE_PARAMS_AMAZON = "tag=test-20";
    for (const p of AMAZON_PICKS) {
      const o = resolveOffer(`amazon-${p.id}`)!;
      const u = new URL(o.href);
      expect(u.hostname).toBe("www.amazon.com");
      expect(u.searchParams.get("tag")).toBe("test-20");
      expect(u.searchParams.get("k")).toBe(p.query);
    }
  });
  it("returns null for an unknown pick", () => {
    expect(resolveOffer("amazon-nope")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { addDays, promoDay, syncDealsInPage } from "../src/lib/promoDay";

describe("promoDay", () => {
  it("uses the US Eastern date, not UTC", () => {
    // 11:30pm ET on Nov 25 is already Nov 26 in UTC.
    expect(promoDay(new Date("2026-11-26T04:30:00Z"))).toBe("2026-11-25");
    expect(promoDay(new Date("2026-11-26T05:00:00Z"))).toBe("2026-11-26");
  });
  it("adds days", () => {
    expect(addDays("2026-11-28", 3)).toBe("2026-12-01");
  });
});

describe("syncDealsInPage", () => {
  type El = { dataset: Record<string, string>; hidden: boolean };
  const a: El = { dataset: { starts: "2026-11-25", ends: "2026-11-25" }, hidden: false };
  const b: El = { dataset: { starts: "2026-11-26", ends: "2026-11-27" }, hidden: true };
  const bar = { hidden: true, querySelector: () => [a, b].find((d) => !d.hidden) ?? null };
  const doc = { querySelectorAll: (sel: string) => (sel === "[data-deals]" ? [bar] : [a, b]) } as unknown as Document;
  it("switches deals by date and hides the bar when none is running", () => {
    syncDealsInPage(doc, "2026-11-25");
    expect([a.hidden, b.hidden, bar.hidden]).toEqual([false, true, false]);
    syncDealsInPage(doc, "2026-11-27");
    expect([a.hidden, b.hidden, bar.hidden]).toEqual([true, false, false]);
    syncDealsInPage(doc, "2026-11-28");
    expect(bar.hidden).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { headlineFrame, STALE_HEADLINE_PHRASES } from "@/lib/validate";

describe("story headline patterns", () => {
  it("treats two stories built on the same template as the same pattern", () => {
    const a = headlineFrame("Cutter Gauthier's Ducks Jersey Is on the Rise After a Record Hat Trick Run", { subject: "Cutter Gauthier", teamId: "anaheim-ducks" });
    const b = headlineFrame("Cooper Flagg's Mavericks Jersey Is on the Rise After His 43-Point Night", { subject: "Cooper Flagg", teamId: "dallas-mavericks" });
    expect(a).toBe(b);
  });

  it("tells different patterns apart", () => {
    const a = headlineFrame("Why to Add Darius Acuff Jr.'s Kings Jersey to Your Collection", { subject: "Darius Acuff Jr.", teamId: "sacramento-kings" });
    const b = headlineFrame("Two Prime-Time Wins Make Caleb Williams' No. 18 a Must-Have", { subject: "Caleb Williams", teamId: "chicago-bears" });
    expect(a).not.toBe(b);
  });

  it("lists the phrases new headlines may not use", () => {
    expect(STALE_HEADLINE_PHRASES).toContain("is on the rise");
  });
});

import { describe, it, expect } from "vitest";
import { storyJersey, storyPlayer } from "@/lib/stories";
import { loadStore } from "@/lib/data";

const withJersey = loadStore().products.find((p) => p.productType === "jersey" && p.image && !p.flagged);

describe("story jersey photos", () => {
  it("finds the player by playerId or, for older stories, by the subject's name", () => {
    expect(storyPlayer({ playerId: "aaron-judge", subject: "Anything" })?.id).toBe("aaron-judge");
    expect(storyPlayer({ playerId: null, subject: "aaron judge" })?.id).toBe("aaron-judge");
    expect(storyPlayer({ playerId: null, subject: "Milwaukee Brewers" })).toBeUndefined();
  });

  it.runIf(withJersey)("shows the subject's own jersey, or a team story's best-ranked player with one", () => {
    const player = loadStore().players.find((p) => p.id === withJersey!.playerId)!;
    expect(storyJersey({ playerId: player.id, subject: player.name, teamId: null })?.product.playerId).toBe(player.id);
    const team = storyJersey({ playerId: null, subject: "Team", teamId: withJersey!.teamId });
    expect(team?.player.teamId).toBe(withJersey!.teamId);
    expect(storyJersey({ playerId: null, subject: "Nobody Atall", teamId: null })).toBeUndefined();
  });
});

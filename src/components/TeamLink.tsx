import type { Team } from "@/lib/schema";
import { teamOffer } from "@/lib/affiliate";
import { ShopButton, type TrackContext } from "./ShopButton";

/** Secondary link to the whole team's jerseys, for fans shopping more than one player. */
export function TeamLink({ team, ctx }: { team: Team; ctx: TrackContext }) {
  const o = teamOffer(team);
  if (!o) return null;
  return (
    <ShopButton offer={o} variant="ghost" ctx={ctx}>
      Shop all {team.name}
    </ShopButton>
  );
}

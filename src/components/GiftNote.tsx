import fs from "node:fs";
import path from "node:path";

type Holiday = { christmas: string; standardCutoff: string | null; expressCutoff: string | null };
const holiday: Holiday = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/holiday-shipping.json"), "utf8"));

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/**
 * A short note for gift buyers beside the buy button, from Nov. 1 to Christmas. The delivery line shows only a cutoff
 * confirmed in data/holiday-shipping.json, and only until that date passes. The page rebuilds daily, so it rolls over.
 */
export function GiftNote() {
  const today = new Date().toISOString().slice(0, 10);
  const year = holiday.christmas.slice(0, 4);
  if (today < `${year}-11-01` || today > holiday.christmas) return null;
  const cutoff = [holiday.standardCutoff, holiday.expressCutoff].find((d): d is string => !!d && today <= d);
  const express = cutoff && cutoff === holiday.expressCutoff;
  return (
    <div className="gift-note">
      {cutoff && (
        <p className="gift-ship"><strong>Order by {day(cutoff)}</strong> for Christmas delivery with Lids {express ? "express" : "standard"} shipping.</p>
      )}
      <p>
        <strong>Buying as a gift?</strong> Men&apos;s jerseys fit most adults, women&apos;s jerseys have a slimmer cut, and youth jerseys
        use kids&apos; sizes. Check the size chart and return policy on Lids before you buy.
      </p>
    </div>
  );
}

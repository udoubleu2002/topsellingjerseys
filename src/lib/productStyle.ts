import type { Product } from "./schema";

/** Jersey style read only from the retailer's own title and edition field; nothing is guessed when the title does not say. */
export type ProductStyle = { fit: string | null; tier: string | null; edition: string | null };

const TIERS: [RegExp, string][] = [
  [/\bAuthentic\b|\bElite\b|\bVapor\b/i, "Authentic"],
  [/\bLimited\b/i, "Limited"],
  [/\bSwingman\b/i, "Swingman"],
  [/\bGame\b/i, "Game"],
  [/\bReplica\b|\bPremier\b|\bFanatics( Branded)? Breakaway\b/i, "Replica"],
];

export function productStyle(p: Pick<Product, "title" | "edition">): ProductStyle {
  const t = p.title;
  const fit = /^Women'?s\b/i.test(t) ? "Women's" : /^(Youth|Kids'?|Toddler|Preschool|Infant)\b/i.test(t) ? "Youth" : /^Men'?s\b/i.test(t) ? "Men's" : /^Unisex\b/i.test(t) ? "Unisex" : null;
  const tier = TIERS.find(([re]) => re.test(t))?.[1] ?? null;
  let edition = p.edition;
  if (edition === "Road") edition = "Away";
  if (!edition && /\bThrowback\b|\bCooperstown\b|\bRetro\b|\bMitchell & Ness\b/i.test(t)) edition = "Throwback";
  return { fit, tier, edition };
}

export const styleTags = (s: ProductStyle) => [s.tier, s.edition, s.fit].filter((x): x is string => !!x);

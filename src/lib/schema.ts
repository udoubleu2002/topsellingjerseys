import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const url = z.string().url();
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  sport: z.string(),
  slug: z.string(),
  accent: hex,
});

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  league: z.string(),
  colors: z.object({ primary: hex, secondary: hex, accent: hex }),
});

export const SourcedText = z.object({ text: z.string().min(1), source: url.nullable() });

export const PlayerSchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  leagues: z.array(z.string()).min(1),
  /** Current team; null for retired players and free agents. */
  teamId: z.string().nullable(),
  /** Most recent team, used for context when teamId is null. */
  lastTeamId: z.string().nullable(),
  status: z.enum(["Active", "Retired", "Free agent", "Injured"]),
  position: z.string(),
  number: z.string().nullable(),
  birthday: isoDate.nullable(),
  birthdaySource: url.nullable(),
  portrait: z.object({ url, source: z.string(), credit: z.string() }).nullable(),
  overview: z.string().nullable(),
  /** Exactly three editorial highlights: current season, role/trend, additional context. */
  highlights: z.array(SourcedText).length(3),
  sources: z.array(url),
  lastVerified: isoDate,
});

export const StatLineSchema = z.object({
  playerId: z.string(),
  league: z.string(),
  teamId: z.string(),
  /** Season label in the league's own convention, e.g. "2026" or "2025-26". */
  season: z.string(),
  competition: z.enum(["regular-season", "postseason"]),
  statistics: z.array(z.object({ label: z.string(), value: z.string(), unit: z.string().optional() })),
  note: z.string().nullable().optional(),
  source: url.nullable(),
  /** Last game date the numbers include. */
  throughDate: isoDate.nullable(),
  updatedAt: isoDate,
  /** Demo rows exist only for local layout work and are rejected by validation in production data. */
  isDemo: z.boolean(),
});

export const RankingSchema = z.object({
  id: z.string(),
  league: z.string(),
  /** Reports in the same series use the same method and period length, so rank movement can be compared. */
  series: z.string(),
  title: z.string(),
  publisher: z.string(),
  sourceUrl: url,
  publishedDate: isoDate,
  periodStart: isoDate.nullable(),
  periodEnd: isoDate.nullable(),
  periodLabel: z.string(),
  scope: z.string(),
  methodology: z.string().nullable(),
  retrievedDate: isoDate,
  lastVerified: isoDate,
  limitations: z.array(z.string()),
  status: z.enum(["draft", "published", "archived"]),
  entries: z.array(z.object({
    rank: z.number().int().positive(),
    playerId: z.string(),
    /** Team the report credited the sale to. Never changed when the player later moves. */
    teamIdAtReport: z.string().nullable(),
    /** Jersey number at the time of the report, when it differs from (or must not be inferred from) the player's current number. */
    numberAtReport: z.string().nullable().optional(),
  })).min(1),
});

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  homepage: url,
  searchUrlTemplate: z.string().includes("{query}"),
  affiliateEnv: z.string(),
  notes: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  teamId: z.string(),
  league: z.string(),
  title: z.string(),
  image: z.object({ url, source: z.string(), alt: z.string() }).nullable(),
  merchantId: z.string(),
  productType: z.enum(["jersey", "t-shirt", "other"]),
  edition: z.string().nullable(),
  /** Price and availability are shown only when present and verified. */
  price: z.number().positive().nullable(),
  /** Regular price shown by the retailer, if verified. A sale badge appears only when price is below it. */
  listPrice: z.number().positive().nullable().optional(),
  currency: z.string().length(3).nullable(),
  availability: z.enum(["in-stock", "out-of-stock", "preorder", "unknown"]),
  productUrl: url,
  /** Full tracking URL issued by the network, if the network requires a per-product link. */
  affiliateUrl: url.nullable(),
  numberOnProduct: z.string().nullable(),
  lastVerified: isoDate,
  flagged: z.string().nullable().optional(),
});

/** A retailer or network promotion. Shown only between its start and end dates; never invented. */
export const PromotionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  merchantId: z.string(),
  headline: z.string(),
  details: z.string().nullable(),
  code: z.string().nullable(),
  url: url,
  startDate: isoDate,
  endDate: isoDate,
  /** Leagues where the promotion applies; empty means sitewide. */
  leagues: z.array(z.string()),
  source: z.string(),
  lastVerified: isoDate,
});

export type League = z.infer<typeof LeagueSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type StatLine = z.infer<typeof StatLineSchema>;
export type Ranking = z.infer<typeof RankingSchema>;
export type Merchant = z.infer<typeof MerchantSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Promotion = z.infer<typeof PromotionSchema>;

/**
 * Daily sports stories: timely news with a jersey angle, stored as JSON in data/stories/<publish date>.json.
 * Body paragraphs are plain text; "## " starts a subheading and [anchor](/path/) is an internal link (same format as articles).
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getLatestAppearance, getPlayer, getPlayers, getProducts, teamPlayers } from "./data";
import type { Player, Product } from "./schema";

const url = z.string().url();
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const StorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  league: z.string(),
  status: z.enum(["published", "draft"]),
  kind: z.enum(["trending", "rising-star", "fan-favorite", "big-moment"]),
  /** The player or team the story is about. */
  subject: z.string().min(2),
  /** Our player page, when the subject has one. */
  playerId: z.string().nullable(),
  teamId: z.string().nullable(),
  headline: z.string().min(20).max(90),
  title: z.string().min(20).max(70),
  subheadline: z.string().min(20).max(200),
  /** Byline shown on the page and in NewsArticle data. Every story runs under the site name. */
  author: z.literal("Top Selling Jerseys"),
  description: z.string().min(100).max(170),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).min(2).max(4),
  searchIntent: z.string(),
  body: z.array(z.string().min(1)).min(3),
  /** Internal pages recommended at the end of the story. */
  related: z.array(z.object({ label: z.string(), href: z.string().regex(/^\/[a-z0-9/_-]*$/) })).min(1).max(3),
  shopLabel: z.string(),
  shopQuery: z.string(),
  updateTrigger: z.string(),
  sources: z.array(z.object({ label: z.string(), url, date: day.optional() })).min(1),
  reviewNotes: z.array(z.string()),
  publishedDate: day,
  lastVerified: day,
});
export type Story = z.infer<typeof StorySchema>;

const DIR = path.join(process.cwd(), "data", "stories");
let cache: Story[] | null = null;

/** Every story, newest first. */
export function loadStories(): Story[] {
  if (cache) return cache;
  const out: Story[] = [];
  if (fs.existsSync(DIR)) {
    for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
      const parsed = z.array(StorySchema).safeParse(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
      if (!parsed.success) throw new Error(`Invalid data in data/stories/${f}:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
      out.push(...parsed.data);
    }
  }
  return (cache = out.sort((a, b) => b.publishedDate.localeCompare(a.publishedDate)));
}

export const getStories = (league?: string) => loadStories().filter((s) => s.status === "published" && (!league || s.league === league));
export const getStory = (slug: string) => loadStories().find((s) => s.slug === slug && s.status === "published");
export const getPlayerStories = (playerId: string) => getStories().filter((s) => s.playerId === playerId);
export const storyPath = (s: Pick<Story, "slug">) => `/news/${s.slug}/`;

const fold = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The player a story is about: its playerId, or a player whose name is the story's subject (players added after the story). */
export function storyPlayer(s: Pick<Story, "playerId" | "subject">): Player | undefined {
  if (s.playerId) return getPlayer(s.playerId);
  const name = fold(s.subject);
  return getPlayers().find((p) => fold(p.name) === name);
}

/**
 * The Lids jersey shown with a story: the subject's own jersey, or for a team story the jersey of the team's
 * best-ranked player that has one. Undefined when nothing matches, so the page keeps its plain shop link.
 */
export function storyJersey(s: Pick<Story, "playerId" | "subject" | "teamId">): { product: Product; player: Player } | undefined {
  const own = storyPlayer(s);
  const pick = (p: Player) => getProducts(p.id).find((x) => x.productType === "jersey" && x.image);
  if (own) {
    const product = pick(own);
    return product ? { product, player: own } : undefined;
  }
  if (!s.teamId) return undefined;
  const best = (p: Player) => getLatestAppearance(p.id)?.rank ?? 999;
  for (const p of teamPlayers(s.teamId).filter((p) => p.teamId === s.teamId).sort((a, b) => best(a) - best(b))) {
    const product = pick(p);
    if (product) return { product, player: p };
  }
  return undefined;
}

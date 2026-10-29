/**
 * Daily sports stories: timely news with a jersey angle, stored as JSON in data/stories/<publish date>.json.
 * Body paragraphs are plain text; "## " starts a subheading and [anchor](/path/) is an internal link (same format as articles).
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

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

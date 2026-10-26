/**
 * Jersey sales news for the sidebar: outside stories that name a player's jersey as a top seller.
 * Curated by hand in data/news.json (newest first is not required; the list is sorted on read).
 * Each story links out to the outlet that published it; we never copy its text.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const NewsItemSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: z.string().min(1),
  outlet: z.string().min(1),
  url: z.string().url().startsWith("https://"),
  players: z.array(z.string().min(1)).min(1),
  /** Our player page, when the jersey is on one of the lists. */
  playerId: z.string().optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

const FILE = path.join(process.cwd(), "data", "news.json");
let cache: NewsItem[] | null = null;

export function loadNews(): NewsItem[] {
  if (cache) return cache;
  if (!fs.existsSync(FILE)) return (cache = []);
  const parsed = z.array(NewsItemSchema).safeParse(JSON.parse(fs.readFileSync(FILE, "utf8")));
  if (!parsed.success) throw new Error(`Invalid data in data/news.json:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  return (cache = parsed.data.slice().sort((a, b) => b.date.localeCompare(a.date)));
}

export const getLatestNews = (n = 5) => loadNews().slice(0, n);

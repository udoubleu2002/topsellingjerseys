/**
 * Editorial "jersey to watch" articles: one per player, stored as JSON in data/articles/<league>.json.
 * Body paragraphs are plain text; "## " starts a subheading and [anchor](/path/) is an internal link.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const url = z.string().url();

export const ArticleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  league: z.string(),
  status: z.enum(["published", "draft"]),
  player: z.string().min(2),
  teamId: z.string().nullable(),
  position: z.string(),
  number: z.string().nullable(),
  format: z.enum(["rising-star", "established-star", "breakout", "international", "team-success", "next-generation", "fan-favorite"]),
  headline: z.string().min(20).max(80),
  title: z.string().min(20).max(70),
  description: z.string().min(100).max(170),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).min(3).max(5),
  body: z.array(z.string().min(1)).min(3),
  shopLabel: z.string(),
  shopQuery: z.string(),
  updateTrigger: z.string(),
  /** A published sales list the player appears on, with the rank the source gives. */
  salesRank: z.object({ rank: z.number().int().positive(), list: z.string(), source: url }).nullable(),
  sources: z.array(z.object({ label: z.string(), url })).min(1),
  reviewNotes: z.array(z.string()),
  publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Article = z.infer<typeof ArticleSchema>;

const DIR = path.join(process.cwd(), "data", "articles");
let cache: Article[] | null = null;

export function loadArticles(): Article[] {
  if (cache) return cache;
  const out: Article[] = [];
  if (fs.existsSync(DIR)) {
    for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
      const parsed = z.array(ArticleSchema).safeParse(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
      if (!parsed.success) throw new Error(`Invalid data in data/articles/${f}:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
      out.push(...parsed.data);
    }
  }
  return (cache = out);
}

export const getArticles = (league?: string) => loadArticles().filter((a) => a.status === "published" && (!league || a.league === league));
export const getArticle = (slug: string) => loadArticles().find((a) => a.slug === slug && a.status === "published");
export const articlePath = (a: Pick<Article, "slug">) => `/jerseys/${a.slug}/`;

export type Inline = { text: string; href?: string };
const LINK = /\[([^\]]+)\]\((\/[a-z0-9/_-]*)\)/g;

/** Splits a paragraph into text and internal-link pieces. */
export function inline(p: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of p.matchAll(LINK)) {
    if (m.index! > last) out.push({ text: p.slice(last, m.index) });
    out.push({ text: m[1], href: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < p.length) out.push({ text: p.slice(last) });
  return out;
}

export const isHeading = (p: string) => p.startsWith("## ");
export const plain = (p: string) => p.replace(LINK, "$1").replace(/^## /, "");
export const linksIn = (p: string) => [...p.matchAll(LINK)].map((m) => m[2]);

/** Editorial word count: paragraphs only (subheadings, metadata and the shop box excluded). */
export function wordCount(a: Pick<Article, "body">) {
  return a.body.filter((p) => !isHeading(p)).map(plain).join(" ").split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

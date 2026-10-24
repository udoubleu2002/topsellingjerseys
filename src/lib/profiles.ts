/**
 * Player write-ups shown on /players/<slug>/: two short intro paragraphs, a bulleted list of
 * three reasons the jersey stands out, and a closing line. Stored in data/profiles.json, one per player.
 * Every fact must already appear in the player's sourced highlights or stats, or be a stable,
 * well-known detail (team colors, the number worn). Wording is original.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const ProfileSchema = z.object({
  playerId: z.string(),
  intro: z.array(z.string().min(1)).min(1).max(3),
  jerseyPoints: z.array(z.object({ label: z.string().min(1), text: z.string().min(1) })).length(3),
  closing: z.string().min(1),
  lastReviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type Profile = z.infer<typeof ProfileSchema>;

const FILE = path.join(process.cwd(), "data", "profiles.json");
let cache: Profile[] | null = null;

export function loadProfiles(): Profile[] {
  if (cache) return cache;
  if (!fs.existsSync(FILE)) return (cache = []);
  const parsed = z.array(ProfileSchema).safeParse(JSON.parse(fs.readFileSync(FILE, "utf8")));
  if (!parsed.success) throw new Error(`Invalid data in data/profiles.json:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  return (cache = parsed.data);
}

export const getProfile = (playerId: string) => loadProfiles().find((p) => p.playerId === playerId);

/** Editorial word count: intro, each point's label and text, and the closing (the subheading is excluded). */
export function profileWords(p: Profile) {
  return [...p.intro, ...p.jerseyPoints.flatMap((j) => [j.label, j.text]), p.closing]
    .join(" ").split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

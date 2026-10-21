import zlib from "node:zlib";

/**
 * A shared jersey collection travels entirely in its link, so the site stores nothing about visitors.
 * Code format (built by public/my-jerseys.js): "z" + base64url(deflate-raw(text)) or "p" + base64url(text), where
 * text is the owner's name on the first line, then one line per league: "nfl\tJosh Allen\tTom Brady".
 */
export const COLLECTION_LEAGUES = ["nfl", "nba", "wnba", "mlb", "nhl", "mls"] as const;
export type CollectionLeague = (typeof COLLECTION_LEAGUES)[number];
export type Collection = { name: string; jerseys: Record<CollectionLeague, string[]>; count: number };

const MAX_TEXT = 20000;
const MAX_JERSEYS = 300;
const clean = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

export function decodeCollection(code: string): Collection | null {
  try {
    if (!/^[zp][A-Za-z0-9_-]{1,12000}$/.test(code)) return null;
    const buf = Buffer.from(code.slice(1), "base64url");
    const text = (code[0] === "z" ? zlib.inflateRawSync(buf, { maxOutputLength: MAX_TEXT }) : buf).toString("utf8");
    const [first = "", ...lines] = text.split("\n");
    const jerseys = Object.fromEntries(COLLECTION_LEAGUES.map((l) => [l, [] as string[]])) as Record<CollectionLeague, string[]>;
    let count = 0;
    for (const line of lines) {
      const [lg, ...names] = line.split("\t");
      if (!(COLLECTION_LEAGUES as readonly string[]).includes(lg)) continue;
      for (const n of names) {
        const c = clean(n, 48);
        if (c && count < MAX_JERSEYS) { jerseys[lg as CollectionLeague].push(c); count++; }
      }
    }
    return count ? { name: clean(first, 24), jerseys, count } : null;
  } catch {
    return null;
  }
}

/** "Joe's jersey count is: 14", or "My jersey count is: 14" when no name was given. */
export function countHeadline(c: Collection) {
  const who = c.name ? `${c.name}${/s$/i.test(c.name) ? "'" : "'s"}` : "My";
  return `${who} jersey count is: ${c.count}`;
}

/** Groups repeats as "Josh Allen ×2" so a list of owned jerseys stays short. */
export function grouped(names: string[]) {
  const m = new Map<string, number>();
  for (const n of names) m.set(n, (m.get(n) ?? 0) + 1);
  return [...m].map(([n, k]) => (k > 1 ? `${n} ×${k}` : n));
}

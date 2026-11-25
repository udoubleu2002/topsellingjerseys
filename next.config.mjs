import { readFileSync } from "node:fs";

// Daily stories taken down (for example game recaps); their URLs redirect to the player's page or /news/.
const retiredStories = JSON.parse(readFileSync(new URL("./data/retired-stories.json", import.meta.url), "utf8"));
// The old /jerseys/<player>-jersey/ articles competed with the player pages for "<player> jersey" searches, so since
// Nov. 21, 2026 they are unpublished and each one redirects to its player page (or the players index).
const readJson = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
const asList = (d, key) => (Array.isArray(d) ? d : d[key]);
const playerSlugs = new Set(asList(readJson("./data/players.json"), "players").map((p) => p.slug));
const oldArticles = asList(readJson("./data/articles/nfl.json"), "articles").map((a) => {
  const slug = a.slug.replace(/-jersey$/, "");
  return { slug: a.slug, to: playerSlugs.has(slug) ? `/players/${slug}/` : "/players/" };
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Request-time routes (/out/, /j/ and their share images) read data/*.json and the share-image fonts and logo from disk,
  // so serverless hosts such as Netlify must ship those files with the functions.
  outputFileTracingIncludes: { "/**/*": ["./data/**/*", "./assets/fonts/**/*", "./assets/brand/**/*"] },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }, {
      // Share images are for link previews, not search results.
      source: "/:path*/opengraph-image",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    }, {
      source: "/opengraph-image",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    }, {
      // Font files have content-hashed names, so they can be cached for a year.
      source: "/fonts/:file*",
      headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
    }];
  },
  async redirects() {
    // Permanent redirects for URLs used by the first version of the site.
    const leagues = ["nfl", "nba", "wnba", "mlb", "nhl", "mls"];
    return [
      ...leagues.flatMap((l) => [
        { source: `/${l}`, destination: `/top-selling-${l}-jerseys/`, permanent: true },
        { source: `/${l}/:player`, destination: `/players/:player/`, permanent: true },
      ]),
      ...retiredStories.map((r) => ({ source: `/news/${r.slug}`, destination: r.to, permanent: true })),
      { source: "/jerseys", destination: "/players/", permanent: true },
      // Merged into /best-selling-jerseys/ on Nov. 21, 2026 so one page targets "best selling jerseys".
      { source: "/best-selling-jersey", destination: "/best-selling-jerseys/", permanent: true },
      { source: "/best-selling-sports-jerseys", destination: "/best-selling-jerseys/", permanent: true },
      ...oldArticles.map((a) => ({ source: `/jerseys/${a.slug}`, destination: a.to, permanent: true })),
    ];
  },
};
export default nextConfig;

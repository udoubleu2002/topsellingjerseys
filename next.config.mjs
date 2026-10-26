/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Request-time routes (/out/, /j/ and their share images) read data/*.json and the share-image fonts from disk,
  // so serverless hosts such as Netlify must ship those files with the functions.
  outputFileTracingIncludes: { "/**/*": ["./data/**/*", "./assets/fonts/**/*"] },
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
    const leagues = ["nfl", "nba", "mlb", "nhl", "mls"];
    return leagues.flatMap((l) => [
      { source: `/${l}`, destination: `/top-selling-${l}-jerseys/`, permanent: true },
      { source: `/${l}/:player`, destination: `/players/:player/`, permanent: true },
    ]);
  },
};
export default nextConfig;

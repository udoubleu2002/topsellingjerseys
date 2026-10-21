# Top Selling Jerseys

Jersey sales rankings for the NFL, NBA, MLB, NHL and MLS, with player profiles, stats and affiliate shopping links.
Next.js 15 (App Router) + TypeScript. Content is JSON in `data/`, validated with zod on every build.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional for local work
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build (validates data first)
npm test                     # unit tests (vitest)
npm run test:e2e             # crawl + layout checks against a running server (needs Playwright)
```

## What is where

| Path | Purpose |
| --- | --- |
| `data/leagues.json`, `teams.json` | Leagues (slug, name) and teams (colors used for image placeholders). |
| `data/players.json` | One record per player: stable `id` and `slug`, team, position, number, verified birthday, exactly 3 sourced highlights. |
| `data/stats.json` | Stat lines, separate from players. Each has season, competition, source URL, `throughDate` and `isDemo`. |
| `data/rankings/<league>/<id>.json` | One file per published report (a dated snapshot). Never edited in place once published; a new report is a new file. |
| `data/products.json` | Verified product listings (empty until listings are verified; see below). |
| `data/merchants.json` | Retailers: search URL template and the **name** of the env var holding affiliate parameters. |
| `data/research/*.json` | Research notes used to update players and stats (`python3 scripts/apply_research.py <file>`). |
| `src/app/` | Pages: `/`, `/top-selling-<league>-jerseys/`, `/players/<slug>/`, `/rankings/`, `/rankings/<league>/<id>/`, `/search/`, info pages, `/out/<offerId>/` redirect, `sitemap.xml`, `robots.txt`. |
| `src/lib/` | Data access (`data.ts`), schemas, validation, affiliate link building, analytics, formatting. |

## Updating data

### A new ranking is published
1. Copy `data/imports/EXAMPLE-ranking.json`, fill in every field from the source, and list entries in the **exact published order**.
2. `npm run import:ranking -- data/imports/<file>.json`. It matches players by id or exact name, rejects unknown players and teams, gaps, duplicates and bad dates, and saves a **draft** in `data/rankings/<league>/`.
3. For any new player, add a record to `players.json` with three sourced highlights and a verified birthday (or `null`), then re-run.
4. Compare the draft to the source, set `"status": "published"`, and set the old report to `"archived"` if you like (the newest published report is shown either way). Use the same `series` as earlier reports only when the method and period length match; rank movement is shown only within a series.
5. `npm run build`. The build fails on any validation error.

### Stats and highlights
Edit `stats.json` (or write a research file and run `apply_research.py`). Always set `throughDate` and `source`. A value you cannot confirm is left out, not estimated. Derived totals must say so in `note`.

### Freshness
`src/lib/config.ts` → `site.lastReviewed` is the date the content was last reviewed. League pages warn when a report's sales period ended more than 120 days before that date.

## Affiliate links (needs your accounts)

- Every shopping button points to `/out/<offerId>/`, a server route that 302-redirects to the retailer. Destinations and tracking can change without a rebuild, the route is `noindex`, blocked in robots.txt, and links carry `rel="sponsored nofollow noopener"`.
- Affiliate parameters live **only** in server environment variables, never in the repo or in page HTML. For Fanatics, set `AFFILIATE_PARAMS_FANATICS` to the query string your network issues (for example the parameters from your Impact or CJ tracking link). Until it is set, links go to the retailer with no tracking.
- If your network requires a per-product tracking URL, put it in that product's `affiliateUrl`.
- Without verified products, each player gets a clearly labeled Fanatics **search** for their jerseys. To show real products, add entries to `products.json` with the URL, image (with source), price/currency (or `null`), availability and `lastVerified`. Price and stock are displayed only when present. Run `npm run check:links -- --write` regularly to flag dead listings (flagged products are hidden).
- To add another retailer, add it to `merchants.json` with its own env var name.

## Deals, sale badges and price alerts

- **Deals bar:** add a promotion to `data/promotions.json` (`id`, `merchantId`, `headline`, `details`, `code`, `url`, `startDate`, `endDate`, `leagues` ([] for sitewide), `source`, `lastVerified`). It appears on the home, league and player pages only between its dates, links through `/out/promo-<id>/`, and hides itself in the browser once it ends. Use only offers published by the retailer or your affiliate network.
- **Sale badges:** set `price` and `listPrice` on a verified product. The badge shows only when `price` is lower.
- **Team stores:** every team with a ranked player gets a "Shop all <team>" link (`/out/team-fanatics-<teamId>/`).
- **Price alerts:** set `NEXT_PUBLIC_ALERTS_ENDPOINT` to a form or newsletter endpoint that accepts `{email, playerId}` JSON. The signup appears on player pages only when it is set.

## Analytics (needs your IDs)

`src/components/Tags.tsx` loads Google Analytics 4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) and Microsoft Clarity (`NEXT_PUBLIC_CLARITY_ID`) on every page; with consent required, GA starts in Consent Mode with analytics cookies denied and Clarity gets its consent signal only after the visitor clicks Allow. `src/components/Analytics.tsx` sends site events to GA4 through `gtag` and, if `NEXT_PUBLIC_ANALYTICS_ENDPOINT` is set, to that URL with `sendBeacon`. Nothing is sent until the visitor accepts the consent banner when `NEXT_PUBLIC_REQUIRE_CONSENT=true`.

Events: `page_view` (path, page type), `impression` (player cards: league, player, rank, placement), `affiliate_click` (offer, kind, merchant, league, player, rank, placement, page, CTA variant), `search`, `consent`. These support CTR by league, player, rank, retailer and placement. The `cta_wording` experiment assigns each visitor variant A ("Shop X Jerseys") or B ("Find X Jerseys") and records it with every click.

No GA tag is included in the code. Add your GTM container or GA4 snippet in `src/app/layout.tsx` once you have an ID, and update the privacy policy.

## SEO

- One H1 per page; league H1s are exactly "Top Selling {League} Jerseys". Unique titles and descriptions (checked by `test:e2e`).
- Canonical URLs, Open Graph tags, `sitemap.xml`, `robots.txt`, breadcrumbs with BreadcrumbList data, ItemList data on league pages, Person data on player pages, FAQPage data on league FAQs. No Product, Offer or Review markup is emitted unless a verified product exists, and no prices or ratings are invented.
- Player pages are indexed only when the player has three highlights and a ranking appearance.
- Old v1 URLs (`/nfl`, `/nfl/<player>`) redirect permanently.

**Search Console:** set `NEXT_PUBLIC_SITE_URL` to the live domain, deploy, verify the property (set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the meta-tag token, or use DNS), then submit `https://<domain>/sitemap.xml`.

## Deploying

Vercel: import the repo, set the env vars from `.env.example`, deploy. Any Node host works with `npm run build && npm start`. The `/out/` route needs a server, so a pure static export is not supported for production.

`npm run export:preview` writes a script-free static copy (shopping links resolved to their current destinations) for sharing a preview on any static host.

## Not included yet

- No admin UI: data is edited as JSON with the validated CLI workflow above.
- No team pages; teams are searchable and linked from player pages.
- NFL ranks 26 to 50 from the NFLPA list are not yet verified for import.
- Stats are maintained by hand from cited sources, not a live feed. A stats provider (for example Sportradar or SportsDataIO) would plug into `stats.json` generation.
- Product photos and player portraits need licensed sources; placeholders are clearly labeled until then.
- Privacy policy and terms are templates that need legal review.

## My Jerseys

`/my-jerseys/` lets visitors build a list of the jerseys they own, by league, and share it. The page shell is server-rendered and `public/my-jerseys.js` (plain JavaScript) runs it, including the header badge, so it also works on the static preview. The list is kept in the visitor's browser (localStorage). A share link `/j/{code}/` carries the whole list in the URL, compressed, so nothing is stored on the server; that page and its link-preview image (`src/app/j/[code]/opengraph-image.tsx`) are rendered on request from the code (`src/lib/collection.ts`).

Player search uses `public/player-index/{league}.json`, built by `python3 -I scripts/build-player-index.py SOURCE_DIR` from open datasets (sources listed in the script). Coverage: NFL rosters 1936 to 2026 (nflverse), every NBA player (nba_api), MLB players active in 1936 or later (Chadwick register), NHL players through 2021-22 (@nhl-api/players) plus 2009-10 to 2025-26 rosters (sportsdataverse). No open MLS player list was reachable when this was built, so MLS search covers only the site's ranked MLS players. In every league a visitor can add any name as typed.

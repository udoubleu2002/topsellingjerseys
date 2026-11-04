# Data maintenance checklist

Everything the site shows comes from JSON files in `data/`, each with one job. Pages read them; nothing is typed into a page.
`npm run validate` (also run by `npm run build`) fails on broken data and warns about anything due for review.

| What | Where | Notes |
| --- | --- | --- |
| Players and current teams | `data/players.json` | `teamId` is the current verified team (null for retired players and free agents), `lastTeamId` the most recent one, `status`, `number`, `lastVerified`, three sourced highlights. |
| Team in a sales report | `data/rankings/<league>/<id>.json` → `entries[].teamIdAtReport` (+ `numberAtReport`) | Never changed after a trade. Lists add "Now with …" automatically. |
| Team on a jersey for sale | `data/products.json` → `teamId` | From the Lids feed. Player pages flag a jersey from a former team. |
| Leagues | `data/leagues.json` | Name, slug, accent color. |
| Sales reports | `data/rankings/<league>/*.json` | One file per published report, never overwritten. Status labels are computed. |
| Stats | `data/stats.json` | One line per player and season with `source`, `throughDate`, `updatedAt`. |
| Shopping links | `data/products.json` (daily Lids sync), `data/merchants.json` | Affiliate tracking lives in environment variables only. |
| Player of the week | `data/featured.json` | Editor's pick with sourced reasons. Not a sales ranking. |
| Homepage hero story | `data/featured.json` → `hero` | Headline, dek, button label and internal link, and whose jersey photo to show. The rank under the photo comes from the latest report. |
| Trending (risers, new entries) | Computed from `data/rankings/` | Only between reports in the same `series`. Nothing to edit by hand. |
| League copy, FAQs | `src/lib/content.ts` | Mention specific years here only when you must. |
| Review date | `src/lib/config.ts` → `site.lastReviewed` | Drives "latest available" labels and validator warnings. |

## Weekly (about 30 minutes)
1. Search for new jersey sales reports for all six leagues (league sites, players associations, official retail partners, then Fanatics, then sports business press). Do not treat a store's "best selling" sort order as a report.
2. Check trades, releases, retirements and signings for every ranked player. Update `teamId`, `lastTeamId`, `status`, `number`, `lastVerified` and the player's sources. Never edit `teamIdAtReport`.
3. Pick a new player of the week in `data/featured.json` (each reason needs a source). Refresh the homepage `hero` too when a new list lands: point `cta.href` at that league and set `updated` (the validator warns after 21 days).
4. Update stats for ranked players in leagues that are in season; set `throughDate` to the last game included and `updatedAt` to today. Leave out any number you cannot confirm.
5. Set `site.lastReviewed`, run `npm run validate`, and fix every error and warning you can.

## When a new sales report is published
1. Copy `data/imports/EXAMPLE-ranking.json`, fill every field from the source (the sales period must end on or before the publication date; if the publisher doesn't state a cutoff, use the publication date and say so in `limitations`) and list players in the exact published order (no padding, no reordering).
2. `npm run import:ranking -- data/imports/<file>.json`, add any missing players, then set `"status": "published"`.
3. Use the same `series` as the earlier report only if the publisher, method and period length match; otherwise use a new series so the lists are not compared.
4. Keep the old report file. It becomes a Superseded or Historical Report automatically, with its URL unchanged.
5. Update league copy in `src/lib/content.ts` if it names a year or retailer, and record the change in `docs/quality-upgrade.md`.

## Monthly
- `npm run check:links -- --write` from a machine that can reach lids.com, then review flagged listings.
- Re-verify each latest report against its source and update `lastVerified` (the validator warns after 45 days).
- `npm run seo:snapshot` and diff against the baseline before merging any layout change.

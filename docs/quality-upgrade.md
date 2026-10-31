# Quality upgrade: plan, risk review and change log

The goal is a 9.4 to 9.5 site without risking organic traffic. Each phase ships as its own PR so it can be tested and
reverted on its own. Rollback point for the whole project: branch `rollback/pre-quality-upgrade-2026-10-31` (main at 61d699f).
SEO baseline: `docs/seo-baseline-2026-10-31.md`. Every PR is checked with `scripts/seo-snapshot.mjs diff` against it.

## Phase 1 (this PR): accuracy and freshness, all low risk

### Data errors corrected
- **Historical rankings showed players' new teams.** League pages, the homepage lists, the sidebar, the best-selling guides
  and player intros paired an old rank with the player's current team. Example: the NBA page listed LeBron James at No. 5
  as a Philadelphia 76er and LaMelo Ball at No. 15 as a Timberwolf, and LeBron's page said "LeBron James's No. 23
  Philadelphia 76ers jersey is No. 5 on the latest NBA sales list". Those sales were credited to the Lakers and Hornets.
  Lists now show the team the report credited (and its colors and number), with a "Now with ..." note when the player has
  moved, retired or become a free agent. Player pages keep the current team and add a "Team in report" column to ranking history.
- Affected entries: LeBron James (Lakers → 76ers), LaMelo Ball (Hornets → Timberwolves), Angel Reese (Sky → Dream),
  Kate Martin (Aces → Sky), Hirving Lozano (San Diego FC → LA Galaxy, on loan), Darlington Nagbe (Crew, now retired),
  Wilfried Zaha (Charlotte FC, now a free agent). Report-time numbers are recorded in a new optional `numberAtReport` field.
- The WNBA report's note "Teams shown are current" was no longer true and now says the teams are as credited at the time.

### Current affiliations verified (Oct 31, 2026)
- LaMelo Ball: Minnesota Timberwolves, No. 1, guard (nba.com player bio; traded June 25, 2026).
- LeBron James: Philadelphia 76ers, No. 23, forward (nba.com/sixers player page).
- Angel Reese: Atlanta Dream (traded April 6, 2026; Dream announcement). Kate Martin: Chicago Sky development contract,
  No. 20 (sky.wnba.com). Hirving Lozano: LA Galaxy on loan from San Diego FC (lagalaxy.com). Wilfried Zaha: left Charlotte
  FC when his loan ended (charlottefootballclub.com). Adley Rutschman: Red Sox (traded Aug 3, 2026; mlb.com).
- All 1,061 players passed consistency checks: every team exists and matches the player's league, no retired player has a
  team, no active player lacks one, and every record has a source list and a `lastVerified` date between Oct 21 and Oct 29, 2026.

### Report status system
- Every report now carries one label: **Latest Published Report**, **Superseded Report** (an older report in the same series,
  linked to its replacement) or **Historical Report** (older, different series). Nothing is labeled "Current".
- League and report pages show the status above the dates, whether a newer report exists, and for old lists (WNBA July
  2024, MLS October 2025, and any list whose sales period ended more than 120 days ago) that no newer report has been
  published and the list reflects that period, not sales right now.
- The archive's Status column, the player ranking history and the methodology page use the same labels.

### Left unchanged on purpose
- All URLs, titles, meta descriptions, H1s, canonicals, robots rules, sitemap entries and structured data (the SEO diff shows
  0 regressions; the only change is two new H2 sections on /methodology/).
- The latest report page stays canonical to its league page.
- Rankings themselves: no rank, order or report was edited or removed.
- Player titles and meta descriptions mention the current team, which is correct for a "where to buy" page; changing them is
  a medium-risk title change with no clear benefit.

## Phase 2: movement, discovery, shopping, collections

### Added
- **Earlier comparable reports:** NFLPA year-end 2024-25 (all 50 ranks, nflpa.com) and MLB's most popular jerseys of the
  2025 season (top 20, mlb.com). Each is in the same series as the latest report (same publisher, method and period length).
  Both are now Superseded Reports with their own pages and sitemap entries.
- **Players added to support them (8):** Tyreek Hill (free agent), Tua Tagovailoa (Falcons), Nick Bosa (49ers),
  Russell Wilson (retired), Isiah Pacheco (Lions), J.J. McCarthy (Giants), Sauce Gardner (Colts), Clayton Kershaw (retired),
  each with sourced status, three sourced highlights and Oct 31, 2026 verification. These are 8 new indexed player pages.
- **How the list changed** (NFL and MLB league pages and report pages): biggest risers and fallers, new entries, players
  back on the list, players out of the ranks shown, players who held their spot, and teams with two or more players.
  Shown only when a comparable earlier report exists; the NBA, NHL, MLS and WNBA pages are unchanged until one does.
- **Player pages:** most recent rank, highest rank and the previous comparable rank above the ranking history.
- **Shopping:** style tags on each listing (Authentic, Replica, Swingman, Game, Limited; Home, Away, Alternate, City, Throwback;
  Men's, Women's, Youth), read only from the retailer's title and edition field. A note separates retailer listings from the ranking.
- **My Jerseys:** optional jersey style on each owned jersey, links from list entries to player pages, totals (owned,
  wishlist, leagues, styles), GA4 events `jersey_added`, `wishlist_added` (from search), `jersey_style_set`, `collection_shared`.
  Existing lists load unchanged; the style is an optional field that older lists simply do not have.
- **Related reports** links on every report page.

### Checked and fixed before shipping
- The SEO diff caught that 26 player pages (e.g. Travis Kelce, Joe Burrow) would have changed their titles to quote a rank
  from the superseded 2024-25 list. Titles, intros, "No. X" labels and the search page now use only a player's place on the
  league's latest report. Result: 0 regressions against the baseline.

### Not done, and why
- **NBA, NHL, MLS, WNBA movement:** no comparable earlier report. NBA's 2024-25 list covered NBAStore.com only for the
  second half of the season (the 2025-26 list covers the full season on NBA Store and Fanatics). NHL's 2024-25 list is
  available only as a top 5 from a social post. MLS's earlier lists cover partial seasons. WNBA has one list.
- **Rookies entering the rankings:** needs reliable draft-year data per player, which the data model does not hold yet.
- **Shopping category pages:** no new indexed pages until there is clear search demand and real inventory per category.
- **MLS source link:** the MLS 2025 report links to an MLSsoccer.com article that now shows a January-May 2025 list. The
  season top 10 on the site matches Sports Illustrated's Oct 25, 2025 report of the season list. The link should be pointed
  at the season announcement once it is confirmed.

## Phase 3: archive depth, collection suggestions, measurement

### Done
- **MLS 2025 source corrected.** The report linked to an MLSsoccer.com article that holds MLS's January 1 to May 1, 2025
  list. The season top 10 shown on the site comes from MLS's 2025 regular-season review, published Oct. 23, 2025, which now
  is the source. The publication date (was an approximate Oct. 27), scope and method text were corrected: MLS did not name the
  retailers for the season list. The MLS league intro, its FAQ and the Oct. 29 Messi story no longer say MLSstore.com.
  The report URL is unchanged.
- **MLB 2024 season list** (MLB and MLB Players, Inc., Sept. 30, 2024, MLBShop.com only) added as a Historical Report in its
  own series. It is not compared rank by rank with 2025 and 2026, which cover MLBShop.com plus the Fanatics network.
- **My Jerseys suggestions:** "Top sellers you don't have yet" shows up to three players from the top 10 of each league the
  visitor collects, with one-tap "I have it" and "Want it".
- **Measurement:** new GA4 events `movement_view`, `movement_player_click`, `report_link_click` (with `report` and
  `placement`), suggestion adds tagged `placement=my_jerseys_suggest`, and `docs/analytics.md` with the key events, custom
  dimensions and reports to set up in GA4.

### Looked at and not done
- **NFLPA 2023-24 year-end list:** only the top 10 is retrievable from nflpa.com, and several players have no record yet.
  A partial list would make "new to the list" claims for 2024-25 unreliable, so it was not imported.
- **MLS January-May 2025 list:** 11 of its 25 players have no verified record on the site. Importing it would mean adding 11
  player pages for one partial-season list.
- **NBA 2024-25 (NBAStore.com, second half only):** only the top 5 is published on nba.com.
- **New SEO landing pages:** the existing league pages, best-selling guides, player pages and jersey guides already cover the
  main searches ("top selling NFL jerseys", "best selling jersey", "<player> jersey"). No new page type has both clear search
  demand and content that is not already on an existing page, so none were added.
- **Public collection pages stay out of search:** shared `/j/` links remain noindex.

## Later phases (separate PRs)

| Change | Risk | Plan |
| --- | --- | --- |
| Rank movement: risers, fallers, new entries, returning players | Low (adds content to existing pages) | Only within a series with matching method and period length. Today each league has one report on the site, so movement needs the previous season's reports imported first (e.g. NBA 2024-25, NFLPA 2024-25, MLB 2025). No comparison across series. |
| Import earlier official reports | Low to medium (new indexed report pages) | Each is a unique, sourced dataset and adds archive depth. Only official lists with retrievable sources. |
| Shopping by style (authentic, replica, home, away, alternate, throwback, women's, youth) | Low on player pages | Only from the Lids/Impact feed's real attributes, with price and stock shown only when present. No new indexed category pages until there is search demand and real inventory. |
| My Jerseys: owned vs wishlist, style, totals, by league/team/player, share graphic | Low | Builds on the existing localStorage + optional Supabase lists without migrating stored data. Shared collections stay noindex. |
| Player discovery: highest rank, most recent rank, related team rankings | Low | Adds sections to existing player pages; no new URLs. |
| News focus on jersey-demand stories | Low | New stories only; existing news URLs untouched. |
| GA4 events: collection adds, wishlist adds, shares, archive engagement | Low | Extends `src/lib/analytics.ts`; outbound clicks are already tracked. No sales claims beyond what affiliate reporting shows. |
| Changing titles, headings or internal-link patterns sitewide | Medium | Not planned without a specific, documented benefit. |
| URL, canonical or navigation changes, page consolidation | Higher | Not planned. |

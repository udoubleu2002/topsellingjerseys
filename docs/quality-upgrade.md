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

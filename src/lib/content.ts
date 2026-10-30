import type { Ranking } from "./schema";

/** "2026", or "2025-26" when a sales period spans two years. */
export function seasonLabel(r: Pick<Ranking, "periodStart" | "periodEnd" | "publishedDate">): string {
  const a = (r.periodStart ?? r.publishedDate).slice(0, 4), b = (r.periodEnd ?? r.publishedDate).slice(0, 4);
  return a === b ? b : `${a}-${b.slice(2)}`;
}
const pubYear = (r: Pick<Ranking, "publishedDate">) => r.publishedDate.slice(0, 4);

/**
 * League-specific editorial copy. The "who is No. 1" FAQ is generated from ranking data so it can never go stale.
 * `keyword` is the page's primary search phrase; no other page targets it. Titles take their year from the report
 * itself, so an older list (WNBA 2024, MLS 2025) is never labeled with the current year.
 */
export const leagueCopy: Record<string, { keyword: string; title: (r: Ranking) => string; intro: string; meta: string; faq: { q: string; a: string }[] }> = {
  nfl: {
    keyword: "best selling NFL jerseys",
    title: (r) => `Best Selling NFL Jerseys ${pubYear(r)}: NFLPA Top ${r.entries.length} Player Sales`,
    intro:
      "The NFL Players Association publishes the most watched sales list in football. It ranks players by licensed merchandise sold over a full year, and jerseys make up most of it. Below are the best selling NFL jerseys on the latest year-end list, in its published order, with each player's 2026 season to date.",
    meta: "The best selling NFL jerseys on the NFLPA's latest year-end sales list, in published order. See the most popular NFL jerseys, 2026 stats and where to shop.",
    faq: [
      { q: "How often does the NFLPA publish its sales list?", a: "The NFLPA usually releases a midseason list covering March through August and a year-end list covering March through February. We add each new list as a dated report and keep earlier lists in the archive." },
      { q: "Why does this page show 25 players when the NFLPA ranks 50?", a: "We publish entries only after checking them against the source report. Ranks 26 to 50 have not finished that check yet, so they are not shown." },
    ],
  },
  nba: {
    keyword: "best selling NBA jerseys",
    title: (r) => `Best Selling NBA Jerseys ${pubYear(r)}: Top ${r.entries.length} of the ${seasonLabel(r)} Season`,
    intro:
      "The NBA and the National Basketball Players Association release the league's jersey sales rankings, based on sales through the NBA Store and the Fanatics network. Below are the best selling NBA jerseys on the latest season-end list, in its published order, with each player's most recent season stats.",
    meta: "The best selling NBA jerseys on the league's latest season-end sales list, in published order. See the most popular NBA jerseys, player stats and where to shop.",
    faq: [
      { q: "What sales does the NBA list count?", a: "Online jersey sales on NBAStore.com, Fanatics.com and Fanatics partner sites during the regular season. In-arena and other store sales are not included." },
      { q: "When is the next NBA jersey list?", a: "The NBA has typically released a midseason list in January and a season-end list in April. This page updates when a new list is published." },
    ],
  },
  wnba: {
    keyword: "most popular WNBA jerseys",
    title: (r) => `Most Popular WNBA Jerseys: Top ${r.entries.length} on the ${pubYear(r)} Sales List`,
    intro:
      "The WNBA has not published a top-selling jersey list since 2021. The newest ranked list comes from Fanatics, the league's main licensed retailer, covering player merchandise in the first half of the 2024 season. Below are the most popular WNBA players on that list, in its published order, with each player's 2026 regular-season numbers.",
    meta: "The most popular WNBA jerseys on the newest ranked sales list (Fanatics, 2024), in published order. Best selling WNBA players, 2026 stats and where to shop.",
    faq: [
      { q: "Why is the WNBA list from 2024?", a: "It is the newest ranked WNBA sales list we could verify. The league's last official jersey list came out in 2021. We will add a newer list when the WNBA or a major retailer publishes one." },
      { q: "Is this a jersey-only list?", a: "Not exactly. Fanatics reported top sellers across player merchandise, which includes jerseys and other player items." },
    ],
  },
  mlb: {
    keyword: "most popular MLB jerseys",
    title: (r) => `Most Popular MLB Jerseys ${pubYear(r)}: Top ${r.entries.length} Player Jerseys`,
    intro:
      "Major League Baseball publishes its most popular player jerseys based on Nike MLB jersey sales through MLBShop.com and the Fanatics network. Below is the latest list of the best selling baseball jerseys in its published order, with each player's 2026 regular-season numbers.",
    meta: "The most popular MLB jerseys on MLB's latest list of top-selling player jerseys, in published order. Best selling baseball jerseys, 2026 stats and where to shop.",
    faq: [
      { q: "Does the MLB list include postseason sales?", a: "No. The 2026 list was released before the regular season ended and covers sales from Opening Day." },
      { q: "Where do the sales figures come from?", a: "MLB bases the list on sales at MLBShop.com and across the Fanatics network. Unit counts are not published." },
    ],
  },
  nhl: {
    keyword: "best selling NHL jerseys",
    title: (r) => `Best Selling NHL Jerseys ${pubYear(r)}: Top ${r.entries.length} of the ${seasonLabel(r)} Season`,
    intro:
      "The NHL shares its top-selling player jerseys from Shop.NHL.com and the Fanatics network at the end of each regular season. Below are the most popular hockey jerseys on the latest list, in its published order, with each player's current-season numbers.",
    meta: "The best selling NHL jerseys on the league's latest season-end jersey list, in published order. See the most popular hockey jerseys, player stats and where to shop.",
    faq: [
      { q: "Why is the source a news report?", a: "The league shared this list on social media, and we could not retrieve the original post directly. We cite the published coverage of it and note that on the report page." },
      { q: "How many players does the NHL rank?", a: "The 2025-26 list ranks 10 players, and this page shows all 10." },
    ],
  },
  mls: {
    keyword: "most popular MLS jerseys",
    title: (r) => `Most Popular MLS Jerseys: Top ${r.entries.length} Best-Sellers of ${seasonLabel(r)}`,
    intro:
      "Major League Soccer publishes its best-selling player jerseys from MLSstore.com at the end of each season. Below are the most popular MLS jerseys on the latest official list, in its published order, with each player's 2026 season numbers.",
    meta: "The most popular MLS jerseys on the league's latest best-selling jerseys list (2025), in published order. Best selling soccer jerseys in MLS, stats and where to shop.",
    faq: [
      { q: "Why is the MLS list from 2025?", a: "It is the most recent list MLS has published. MLS usually releases its list near the end of the regular season, and we will add the 2026 list when it appears." },
      { q: "Does this include club jerseys sold by other retailers?", a: "No. The ranking reflects player jersey sales on MLSstore.com." },
    ],
  },
};

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
 * itself, so an older list (e.g. WNBA 2024) is never labeled with the current year.
 */
export const leagueCopy: Record<string, { keyword: string; alt: string; title: (r: Ranking) => string; intro: string; meta: string; faq: { q: string; a: string }[] }> = {
  nfl: {
    keyword: "top selling NFL jerseys",
    alt: "best selling NFL jerseys",
    title: (r) => `Top Selling NFL Jerseys ${pubYear(r)}: NFLPA Top ${r.entries.length} Best Sellers`,
    intro:
      "The NFL Players Association publishes the most watched sales list in football. It ranks players by licensed merchandise sold over a full year, and jerseys make up most of it. Below are the best selling NFL jerseys on the latest year-end list, in its published order, with each player's 2026 season to date.",
    meta: "Top selling NFL jerseys from the NFLPA's latest year-end player sales list, in published order. The most popular NFL jerseys, 2026 stats and where to shop.",
    faq: [
      { q: "How often does the NFLPA publish its sales list?", a: "The NFLPA usually releases a midseason list covering March through August and a year-end list covering March through February. We add each new list as a dated report and keep earlier lists in the archive." },
      { q: "Why are some players shown with a team they no longer play for?", a: "The NFLPA credits each player's sales to the team he played for during the sales period. We keep that team on the list and note a later move, so the published ranking is never rewritten." },
    ],
  },
  nba: {
    keyword: "top selling NBA jerseys",
    alt: "best selling NBA jerseys",
    title: (r) => `Top Selling NBA Jerseys ${pubYear(r)}: Best Sellers of ${seasonLabel(r)}`,
    intro:
      "The NBA and the National Basketball Players Association release the league's jersey sales rankings, based on sales through the NBA Store and the Fanatics network. Below are the best selling NBA jerseys on the latest season-end list, in its published order, with each player's most recent season stats.",
    meta: "Top selling NBA jerseys from the league's latest jersey sales ranking, in published order. The best selling and most popular NBA jerseys, stats and where to shop.",
    faq: [
      { q: "What sales does the NBA list count?", a: "Online jersey sales on NBAStore.com, Fanatics.com and Fanatics partner sites during the regular season. In-arena and other store sales are not included." },
      { q: "When is the next NBA jersey list?", a: "The NBA has typically released a midseason list in January and a season-end list in April. This page updates when a new list is published." },
    ],
  },
  wnba: {
    keyword: "top selling WNBA jerseys",
    alt: "most popular WNBA jerseys",
    title: (r) => `Top Selling WNBA Jerseys: Most Popular on the ${pubYear(r)} List`,
    intro:
      "The WNBA has not published a top-selling jersey list since 2021. The newest ranked list comes from Fanatics, the league's main licensed retailer, covering player merchandise in the first half of the 2024 season. Below are the most popular WNBA players on that list, in its published order, with each player's 2026 regular-season numbers.",
    meta: "Top selling WNBA jerseys from the newest ranked sales list (Fanatics, 2024), in published order. The most popular WNBA players, 2026 stats and where to shop.",
    faq: [
      { q: "Why is the WNBA list from 2024?", a: "It is the newest ranked WNBA sales list we could verify. The league's last official jersey list came out in 2021. We will add a newer list when the WNBA or a major retailer publishes one." },
      { q: "Is this a jersey-only list?", a: "Not exactly. Fanatics reported top sellers across player merchandise, which includes jerseys and other player items." },
    ],
  },
  mlb: {
    keyword: "top selling MLB jerseys",
    alt: "most popular MLB jerseys",
    title: (r) => `Top Selling MLB Jerseys ${pubYear(r)}: ${r.entries.length} Most Popular Players`,
    intro:
      "Major League Baseball publishes its most popular player jerseys based on Nike MLB jersey sales through MLBShop.com and the Fanatics network. Below is the latest list of the best selling baseball jerseys in its published order, with each player's 2026 regular-season numbers.",
    meta: "Top selling MLB jerseys from MLB's latest player jersey sales ranking, in published order. The most popular baseball jerseys, 2026 stats and where to shop.",
    faq: [
      { q: "Does the MLB list include postseason sales?", a: "No. The 2026 list was released before the regular season ended and covers sales from Opening Day." },
      { q: "Where do the sales figures come from?", a: "MLB bases the list on sales at MLBShop.com and across the Fanatics network. Unit counts are not published." },
    ],
  },
  nhl: {
    keyword: "top selling NHL jerseys",
    alt: "best selling NHL jerseys",
    title: (r) => `Top Selling NHL Jerseys ${pubYear(r)}: Best Sellers of ${seasonLabel(r)}`,
    intro:
      "The NHL shares its top-selling player jerseys from Shop.NHL.com and the Fanatics network at the end of each regular season. Below are the most popular hockey jerseys on the latest list, in its published order, with each player's current-season numbers.",
    meta: "Top selling NHL jerseys from the league's latest jersey sales list, in published order. The best selling and most popular hockey jerseys, stats and where to shop.",
    faq: [
      { q: "Why is the source a news report?", a: "The league shared this list on social media, and we could not retrieve the original post directly. We cite the published coverage of it and note that on the report page." },
      { q: "How many players does the NHL rank?", a: "The 2025-26 list ranks 10 players, and this page shows all 10." },
    ],
  },
  mls: {
    keyword: "top selling MLS jerseys",
    alt: "most popular MLS jerseys",
    title: (r) => `Top Selling MLS Jerseys ${pubYear(r)}: Top ${r.entries.length} Best Sellers`,
    intro:
      "Major League Soccer announces its best-selling player jerseys near the end of each season. The newest list ranks jersey sales on the official MLS online store from January 1 to October 30, 2026. Below are the most popular MLS jerseys on it, in its published order, with each player's 2026 season numbers.",
    meta: "Top selling MLS jerseys from the league's latest jersey sales list (2026), in published order. The most popular soccer jerseys in MLS, stats and where to shop.",
    faq: [
      { q: "What sales does the 2026 MLS list count?", a: "Player jersey sales on the official MLS online store from January 1 to October 30, 2026, as announced by MLS on November 3, 2026. Other retailers and in-stadium sales are not included." },
      { q: "Where is the 2025 MLS list?", a: "It stays in the ranking archive as a historical report. MLS did not name the retailers behind its 2025 season list, so the two years are not compared rank by rank." },
    ],
  },
};

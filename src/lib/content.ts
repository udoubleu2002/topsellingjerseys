/** League-specific editorial copy. The "who is No. 1" FAQ is generated from ranking data so it can never go stale. */
export const leagueCopy: Record<string, { intro: string; meta: string; faq: { q: string; a: string }[] }> = {
  nfl: {
    intro:
      "The NFL Players Association publishes the most watched sales list in football. It ranks players by licensed merchandise sold over a full year, and jerseys make up most of it. Below is the latest year-end list in its published order, with each player's 2026 season to date.",
    meta: "Top Selling NFL Jerseys from the NFLPA's latest year-end sales list, in published order, with 2026 stats and links to shop each player's jersey.",
    faq: [
      { q: "How often does the NFLPA publish its sales list?", a: "The NFLPA usually releases a midseason list covering March through August and a year-end list covering March through February. We add each new list as a dated report and keep earlier lists in the archive." },
      { q: "Why does this page show 25 players when the NFLPA ranks 50?", a: "We publish entries only after checking them against the source report. Ranks 26 to 50 have not finished that check yet, so they are not shown." },
    ],
  },
  nba: {
    intro:
      "The NBA and the National Basketball Players Association release the league's jersey sales rankings, based on sales through the NBA Store and the Fanatics network. Below is the latest season-end list in its published order, with each player's most recent season stats.",
    meta: "Top Selling NBA Jerseys from the NBA's latest season-end sales list, in published order, with player stats and links to shop each jersey.",
    faq: [
      { q: "What sales does the NBA list count?", a: "Online jersey sales on NBAStore.com, Fanatics.com and Fanatics partner sites during the regular season. In-arena and other store sales are not included." },
      { q: "When is the next NBA jersey list?", a: "The NBA has typically released a midseason list in January and a season-end list in April. This page updates when a new list is published." },
    ],
  },
  wnba: {
    intro:
      "The WNBA has not published a top-selling jersey list since 2021. The newest ranked list comes from Fanatics, the league's main licensed retailer, covering player merchandise in the first half of the 2024 season. Below is that list in its published order, with each player's 2026 regular-season numbers.",
    meta: "Top Selling WNBA Jerseys from the newest ranked sales list (Fanatics, 2024), in published order, with 2026 stats and links to shop each jersey.",
    faq: [
      { q: "Why is the WNBA list from 2024?", a: "It is the newest ranked WNBA sales list we could verify. The league's last official jersey list came out in 2021. We will add a newer list when the WNBA or a major retailer publishes one." },
      { q: "Is this a jersey-only list?", a: "Not exactly. Fanatics reported top sellers across player merchandise, which includes jerseys and other player items." },
    ],
  },
  mlb: {
    intro:
      "Major League Baseball publishes its most popular player jerseys based on Nike MLB jersey sales through MLBShop.com and the Fanatics network. Below is the latest list in its published order, with each player's 2026 regular-season numbers.",
    meta: "Top Selling MLB Jerseys from MLB's latest most popular jerseys list, in published order, with 2026 stats and links to shop each jersey.",
    faq: [
      { q: "Does the MLB list include postseason sales?", a: "No. The 2026 list was released before the regular season ended and covers sales from Opening Day." },
      { q: "Where do the sales figures come from?", a: "MLB bases the list on sales at MLBShop.com and across the Fanatics network. Unit counts are not published." },
    ],
  },
  nhl: {
    intro:
      "The NHL shares its top-selling player jerseys from Shop.NHL.com and the Fanatics network at the end of each regular season. Below is the latest list in its published order, with each player's current-season numbers.",
    meta: "Top Selling NHL Jerseys from the league's latest season-end jersey list, in published order, with player stats and links to shop each jersey.",
    faq: [
      { q: "Why is the source a news report?", a: "The league shared this list on social media, and we could not retrieve the original post directly. We cite the published coverage of it and note that on the report page." },
      { q: "How many players does the NHL rank?", a: "The 2025-26 list ranks 10 players, and this page shows all 10." },
    ],
  },
  mls: {
    intro:
      "Major League Soccer publishes its best-selling player jerseys from MLSstore.com at the end of each season. Below is the latest official list in its published order, with each player's 2026 season numbers.",
    meta: "Top Selling MLS Jerseys from the league's latest best-selling jerseys list, in published order, with 2026 stats and links to shop each jersey.",
    faq: [
      { q: "Why is the MLS list from 2025?", a: "It is the most recent list MLS has published. MLS usually releases its list near the end of the regular season, and we will add the 2026 list when it appears." },
      { q: "Does this include club jerseys sold by other retailers?", a: "No. The ranking reflects player jersey sales on MLSstore.com." },
    ],
  },
};

# SEO baseline, 2026-10-31

Snapshot of the site as built from `main` at commit 61d699f, before the quality upgrade. Rollback point: branch
`rollback/pre-quality-upgrade-2026-10-31`. Full per-page data (title, meta description, canonical, robots, H1, every H2,
structured data types and every internal link) is in `docs/seo-baseline/baseline-2026-10-31.json`.

Re-check any change against it:

```bash
npm run build && npx next start -p 3100 &
node scripts/seo-snapshot.mjs crawl http://localhost:3100 /tmp/after.json
node scripts/seo-snapshot.mjs diff docs/seo-baseline/baseline-2026-10-31.json /tmp/after.json   # exits 1 on regressions
```

A regression is a URL that stopped returning 200, a changed title, canonical, robots directive or H1, removed structured
data, a URL removed from the sitemap, or a robots.txt change. Changed meta descriptions, added or removed H2s and removed
internal links are listed for review.

## Summary

- 1122 URLs reachable by crawling the sitemap and every internal link; all return 200.
- 1116 URLs in `sitemap.xml`. The 6 URLs not in the sitemap are each league's latest report page, which is
  canonical to its league page by design (the same list), so it is correctly left out.
- 0 duplicate titles, 0 duplicate meta descriptions, 0 missing descriptions, 0 missing canonicals, 0 noindex pages, exactly one H1 on every page.
- Structured data: BreadcrumbList (1120), FAQPage (1070), Person (1061), ProfilePage (1061), NewsArticle (18), Article (14), ItemList (7), WebSite (1).
- Redirects in `next.config.mjs`: `/<league>` → `/top-selling-<league>-jerseys/` and `/<league>/<player>` → `/players/<player>/` (301, from the first version of the site).

| Page type | URLs |
| --- | --- |
| Player pages | 1061 |
| News stories | 18 |
| Jersey guides | 14 |
| Hubs and info pages | 13 |
| Report pages | 6 |
| League ranking pages | 6 |
| Best-selling guides | 3 |
| Homepage | 1 |

## Every non-player page

Player pages (1061) all follow `/players/<slug>/`, self-canonical, in the sitemap, with Person, ProfilePage, BreadcrumbList and FAQPage data. See the JSON for each one.

| URL | Title | H1 | Canonical | Sitemap | Structured data |
| --- | --- | --- | --- | --- | --- |
| `/` | Top Selling Sports Jerseys: NFL, NBA, MLB, NHL, WNBA & MLS | Top selling sports jerseys in every league | self | yes | WebSite |
| `/about/` | About Top Selling Jerseys | Top Selling Jerseys | About Top Selling Jerseys | self | yes | BreadcrumbList |
| `/affiliate-disclosure/` | Affiliate Disclosure | Top Selling Jerseys | Affiliate Disclosure | self | yes | BreadcrumbList |
| `/best-selling-jersey/` | Best Selling Jersey in Every League | Top Selling Jerseys | Best Selling Jersey in Every League | self | yes | BreadcrumbList, FAQPage |
| `/best-selling-jerseys/` | Best Selling Jerseys: Latest Lists for Every League | Best Selling Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/best-selling-sports-jerseys/` | Best Selling Sports Jerseys: Where the Lists Come From | Best Selling Sports Jerseys | self | yes | BreadcrumbList, FAQPage |
| `/contact/` | Contact Top Selling Jerseys | Top Selling Jerseys | Contact | self | yes | BreadcrumbList |
| `/jerseys/` | Jerseys to Watch: The Next Potential Top Sellers | Jerseys to Watch | self | yes | BreadcrumbList |
| `/jerseys/a-j-brown-jersey/` | A.J. Brown Patriots Jersey: New Team, New No. 1 Look | A.J. Brown Patriots Jersey: A New Team and a New Number | self | yes | Article, BreadcrumbList |
| `/jerseys/ashton-jeanty-jersey/` | Ashton Jeanty Jersey Sales: The Rookie Craze, Year Two | Ashton Jeanty Jersey Sales: The Rookie Craze and Year Two | self | yes | Article, BreadcrumbList |
| `/jerseys/baker-mayfield-jersey/` | Baker Mayfield Jersey: Tampa Bay's Comeback Story Sells | Baker Mayfield Jersey: Tampa Bay's Comeback Story Sells | self | yes | Article, BreadcrumbList |
| `/jerseys/bijan-robinson-jersey/` | Bijan Robinson Jersey 2026: Atlanta's Face of the Future | Bijan Robinson Jersey 2026: Atlanta's Face of the Future | self | yes | Article, BreadcrumbList |
| `/jerseys/breece-hall-jersey/` | Breece Hall Jersey: The Jets Lock In Their Lead Back | Breece Hall Jersey: The Jets Lock In Their Lead Back | self | yes | Article, BreadcrumbList |
| `/jerseys/brock-bowers-jersey/` | Brock Bowers Jersey: The Raiders Tight End's Next Step | Brock Bowers Jersey: A Record-Setting Tight End's Next Step | self | yes | Article, BreadcrumbList |
| `/jerseys/derrick-henry-jersey/` | Derrick Henry Ravens Jersey: Still Selling in Year 11 | Derrick Henry Ravens Jersey: A Veteran Still Selling in Year 11 | self | yes | Article, BreadcrumbList |
| `/jerseys/drake-london-jersey/` | Drake London Jersey: Atlanta's $141 Million Breakout | Drake London Jersey: Atlanta's $141 Million Breakout | self | yes | Article, BreadcrumbList |
| `/jerseys/garrett-wilson-jersey/` | Garrett Wilson Jets Jersey: Star Power Waiting on Wins | Garrett Wilson Jets Jersey: Star Power Waiting on Wins | self | yes | Article, BreadcrumbList |
| `/jerseys/jamarr-chase-jersey/` | Ja'Marr Chase Jersey Ranking: An All-Pro Still Climbing | Ja'Marr Chase Jersey Ranking: An All-Pro Still Climbing | self | yes | Article, BreadcrumbList |
| `/jerseys/joe-burrow-jersey/` | Joe Burrow Jersey: Bengals QB Knocking on the Top 25 | Joe Burrow Jersey: The Bengals QB Knocking on the Top 25 | self | yes | Article, BreadcrumbList |
| `/jerseys/kyler-murray-jersey/` | Kyler Murray Vikings Jersey: A Fresh Start in Purple | Kyler Murray Vikings Jersey: A Fresh Start in Purple | self | yes | Article, BreadcrumbList |
| `/jerseys/malik-nabers-jersey/` | Malik Nabers Jersey: The Giants Star's Comeback Season | Malik Nabers Jersey: The Giants Star's Comeback Season | self | yes | Article, BreadcrumbList |
| `/jerseys/travis-kelce-jersey/` | Travis Kelce Jersey: Why the Chiefs' No. 87 Still Sells | Travis Kelce Jersey: Why the No. 87 Still Sells | self | yes | Article, BreadcrumbList |
| `/methodology/` | Jersey Ranking Methodology | Top Selling Jerseys | Ranking Methodology | self | yes | BreadcrumbList |
| `/my-jerseys/` | My Jerseys: Count and Share Your Jersey Collection | My Jerseys | self | yes |  |
| `/news/` | Jersey News: Today's Biggest Stories in Every League | Jersey News | self | yes | BreadcrumbList |
| `/news/angel-reese-dream-game-6/` | Angel Reese Faces Elimination After Record-Setting Year | Angel Reese Rewrote the Record Book. Now She Has to Save Atlanta's Season. | self | yes | BreadcrumbList, NewsArticle |
| `/news/atlanta-dream-force-first-wnba-finals-game-7/` | Allisha Gray Leads Dream to the First Game 7 in WNBA Finals | The Dream Stay Alive and Send the WNBA Finals to Its First Game 7 | self | yes | BreadcrumbList, NewsArticle |
| `/news/brewers-world-series-champions/` | Milwaukee Brewers Jerseys After a First World Series Title | The Brewers Are World Series Champions for the First Time | self | yes | BreadcrumbList, NewsArticle |
| `/news/brewers-world-series-parade-milwaukee/` | Brewers World Series Parade: Route, Rally and How to Watch | Milwaukee Throws Its First World Series Parade for the Brewers | self | yes | BreadcrumbList, NewsArticle |
| `/news/cameron-boozer-grizzlies-rookie/` | Cameron Boozer Jersey: Grizzlies Rookie Tops the Ladder | Cameron Boozer Is Already Doing Things Only Legends Did as Rookies | self | yes | BreadcrumbList, NewsArticle |
| `/news/christian-watson-packers-panthers-thursday-night/` | Christian Watson Returns to Lift Packers Past the Panthers | Christian Watson Left in an Ambulance, Then Came Back to Help Beat Carolina | self | yes | BreadcrumbList, NewsArticle |
| `/news/connor-hellebuyck-devils-debut/` | Connor Hellebuyck Devils Jersey: A Vezina Winner Debuts | Connor Hellebuyck Got His Fresh Start. The Devils Got a Contender's Goalie. | self | yes | BreadcrumbList, NewsArticle |
| `/news/connor-mcdavid-assist-streak-record/` | Connor McDavid Sets NHL Record With 13-Game Assist Streak | Connor McDavid Is Chasing Mario Lemieux's October | self | yes | BreadcrumbList, NewsArticle |
| `/news/fernando-mendoza-raiders-rookie-jersey/` | Fernando Mendoza Jersey: Raiders Rookie Still Waiting | The No. 1 Pick Is Still on the Bench. Fernando Mendoza's Moment Is Coming. | self | yes | BreadcrumbList, NewsArticle |
| `/news/golden-state-valkyries-wnba-finals/` | Golden State Valkyries Jerseys: One Win From a Title | The Valkyries Are One Win From a Championship in Year Two | self | yes | BreadcrumbList, NewsArticle |
| `/news/jacob-misiorowski-brewers-ace/` | Jacob Misiorowski Jersey: Brewers Ace Caps a Historic Year | Jacob Misiorowski's Historic Season Ended With a Ring | self | yes | BreadcrumbList, NewsArticle |
| `/news/jaxon-smith-njigba-seahawks-chiefs-sunday-night/` | Jaxon Smith-Njigba's 150-Yard Night Puts Him Center Stage | Jaxon Smith-Njigba Just Gave the Chiefs Their First Loss, and Everyone Saw It | self | yes | BreadcrumbList, NewsArticle |
| `/news/logan-cooley-hat-trick-mammoth-penguins/` | Logan Cooley Hat Trick With One Second Left Stuns Pittsburgh | Logan Cooley Ties It With One Second Left, and Utah Wins in Overtime | self | yes | BreadcrumbList, NewsArticle |
| `/news/luka-doncic-52-points-lakers-start/` | Luka Doncic's 52-Point Night Fuels a Fast Lakers Start | Luka Dončić Opened the Season Like He Wants Another Scoring Title | self | yes | BreadcrumbList, NewsArticle |
| `/news/messi-golden-boot-race-inter-miami/` | Messi Leads the MLS Golden Boot Race After Argentina Exit | Lionel Messi Is Done With Argentina. He Is Not Done Making MLS History. | self | yes | BreadcrumbList, NewsArticle |
| `/news/petar-musa-fc-dallas-golden-boot/` | Petar Musa: FC Dallas Striker Chasing Messi's Golden Boot | Petar Musa Is the Only Striker Still Chasing Messi | self | yes | BreadcrumbList, NewsArticle |
| `/news/philadelphia-union-clinch-playoffs-comeback/` | Philadelphia Union Clinch MLS Playoffs After a 1-10-4 Start | From Last Place to the Playoffs: The Union Complete a Remarkable Turnaround | self | yes | BreadcrumbList, NewsArticle |
| `/news/stephen-curry-44-points-warriors-timberwolves/` | Stephen Curry Scores 44 as Warriors Win Again in Minnesota | Stephen Curry Hits 44 in Minnesota and Adds Another Record to His Name | self | yes | BreadcrumbList, NewsArticle |
| `/players/` | All Player Jersey Pages | Top Selling Jerseys | All Player Jersey Pages | self | yes | BreadcrumbList |
| `/privacy/` | Privacy Policy | Top Selling Jerseys | Privacy Policy | self | yes | BreadcrumbList |
| `/rankings/` | Jersey Sales Report Archive | Top Selling Jerseys | Top Selling Jerseys Report Archive | self | yes | BreadcrumbList |
| `/rankings/mlb/mlb-2026-09-25-season-most-popular/` | MLB's Most Popular Player Jerseys of the 2026 Season | MLB's Most Popular Player Jerseys of the 2026 Season | https://topsellingjerseys.net/top-selling-mlb-jerseys/ | no | BreadcrumbList |
| `/rankings/mls/mls-2025-10-27-season-best-selling/` | MLS Best-Selling Jerseys of 2025 | Top Selling Jerseys | MLS Best-Selling Jerseys of 2025 | https://topsellingjerseys.net/top-selling-mls-jerseys/ | no | BreadcrumbList |
| `/rankings/nba/nba-2026-04-13-season-top-selling/` | Top-Selling NBA Jerseys, 2025-26 Regular Season | Top-Selling NBA Jerseys, 2025-26 Regular Season | https://topsellingjerseys.net/top-selling-nba-jerseys/ | no | BreadcrumbList |
| `/rankings/nfl/nfl-2026-06-09-nflpa-year-end/` | NFLPA Year-End Top 50 NFL Player Sales List | NFLPA Year-End Top 50 NFL Player Sales List | https://topsellingjerseys.net/top-selling-nfl-jerseys/ | no | BreadcrumbList |
| `/rankings/nhl/nhl-2026-04-18-season-top-selling/` | NHL's Top 10 Selling Jerseys of the 2025-26 Season | NHL's Top 10 Selling Jerseys of the 2025-26 Season | https://topsellingjerseys.net/top-selling-nhl-jerseys/ | no | BreadcrumbList |
| `/rankings/wnba/wnba-2024-07-23-fanatics-first-half/` | WNBA Top-Selling Players, First Half of 2024 (Fanatics) | WNBA Top-Selling Players, First Half of 2024 (Fanatics) | https://topsellingjerseys.net/top-selling-wnba-jerseys/ | no | BreadcrumbList |
| `/related-sites/` | Related Sites | Top Selling Jerseys | Related sites | self | yes | BreadcrumbList |
| `/sources/` | Jersey Sales Sources and Data Coverage | Top Selling Jerseys | Sources and Data Coverage | self | yes | BreadcrumbList |
| `/terms/` | Terms of Use | Top Selling Jerseys | Terms of Use | self | yes | BreadcrumbList |
| `/top-selling-mlb-jerseys/` | Most Popular MLB Jerseys 2026: Top 20 Player Jerseys | Top Selling MLB Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/top-selling-mls-jerseys/` | Most Popular MLS Jerseys: Top 10 Best-Sellers of 2025 | Top Selling MLS Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/top-selling-nba-jerseys/` | Best Selling NBA Jerseys 2026: Top 15 of the 2025-26 Season | Top Selling NBA Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/top-selling-nfl-jerseys/` | Best Selling NFL Jerseys 2026: NFLPA Top 25 Player Sales | Top Selling NFL Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/top-selling-nhl-jerseys/` | Best Selling NHL Jerseys 2026: Top 10 of the 2025-26 Season | Top Selling NHL Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |
| `/top-selling-wnba-jerseys/` | Most Popular WNBA Jerseys: Top 5 on the 2024 Sales List | Top Selling WNBA Jerseys | self | yes | BreadcrumbList, FAQPage, ItemList |

# Daily stories

Stories live in `data/stories/<YYYY-MM-DD>.json`, one file per publishing day, and appear at `/news/` and `/news/<slug>/`.
They are also listed in the side rail (home and league pages), on the player pages they mention, in the footer and in the sitemap.
`npm run validate` checks every story on each build.

## What to write each day

- **One story per league** the live site covers (today: NFL, NBA, WNBA, MLB, NHL, MLS). Check the homepage first; cover only leagues the site lists. No college sports.
- **The biggest positive story in that league** from the past 24 to 72 hours: a champion crowned, a big game, a record, a milestone, a huge individual moment. Not injuries, arrests, firings or losing streaks.
- If a league is quiet (offseason, no games), pick the most meaningful positive current development, such as an award, a signing or a milestone. Never invent news.
- 300 to 400 words of body copy. Short paragraphs, two or three `## ` subheadings, a strong specific opening, and a forward-looking close.

## Writing rules

- **Original writing only.** Take facts from sources, never their wording. Do not quote players, coaches or outlets, and do not reuse a headline or a distinctive phrase. Paraphrase what someone said as a fact ("Keefe praised his new goalie") or leave it out.
- Verify every number, date, score and team against a dated source, and list it in `sources` (with `date` when known).
- Sales claims only from a published list, named with its sales period. With no list, write about performance and popularity without implying sales.
- No invented quotes, prices, availability or rankings. Mark analysis and speculation as such.

## SEO fields

- `author` is always "Top Selling Jerseys" (the build rejects anything else). Never put a person's name or "Claude" in the byline.
- `title` 50 to 60 characters, `description` 140 to 160, `headline` (H1), `subheadline`, one `primaryKeyword` and two to four `secondaryKeywords`, `searchIntent`.
- A player who already has a page (`data/players.json`): do not make "[player] jersey" the primary keyword. Use it as anchor text to `/players/<slug>/` instead, and set `playerId`.
- Never target "best-selling/top selling [league] jerseys" as a primary keyword; link to `/top-selling-<league>-jerseys/` with that anchor instead.
- At least one internal link in the body (`[anchor](/path/)`) and one to three `related` links. Every link must be a real page; the build fails otherwise.
- `shopQuery` is a Lids search such as "Jacob Misiorowski Brewers jersey" or "Golden State Valkyries jersey".

## Checks before opening the PR

`npm run validate`, `npm test`, `npm run build`. Open a PR titled "Daily stories: <date>"; it merges automatically once the PR checks pass.

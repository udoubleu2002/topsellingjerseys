# Daily stories

Stories live in `data/stories/<YYYY-MM-DD>.json`, one file per publishing day, and appear at `/news/` and `/news/<slug>/`.
They are also listed in the side rail (home and league pages), on the player pages they mention, in the footer and in the sitemap.
`npm run validate` checks every story on each build.

## What to write each day

Each story is a **player feature**, not a game recap. A recent event is the hook; the player is the subject; the close makes the case for owning that player's jersey.

- **One story per league** the live site covers (today: NFL, NBA, WNBA, MLB, NHL, MLS). Check the homepage first; cover only leagues the site lists. No college sports.
- **Find the hook:** the biggest positive moment in that league from the past 24 to 72 hours (a title, a big game, a record, a milestone, an award, a signing). Not injuries, arrests, firings or losing streaks. If a league is quiet, use its most meaningful positive current development. Never invent news.
- **Pick one player from that moment** and make them the story. Prefer a player with a page in `data/players.json` (set `playerId`), and one not featured in the last week of stories unless there is a big new reason.
- **Shape of the story** (300 to 400 words, short paragraphs, two or three `## ` subheadings):
  1. Open with the player, using the recent moment as the hook in two or three sentences. Keep the event itself brief: the key line or stat, not a play-by-play or full box score.
  2. Feature the player: who they are, how they got here, their season so far, what makes their game distinctive, and what they mean to their team and its fans.
  3. **Why their jersey**: a closing section (for example `## Why fans want the [Name] jersey`) that makes the case from facts: their role as the face of a team, a breakout or milestone season, a fresh start with a new team, a rookie arriving, a championship. Link to `/players/<slug>/` and end with what to watch next.
- The headline, title and description lead with the player, not the score.

## Writing rules

- **Original writing only.** Take facts from sources, never their wording. Do not quote players, coaches or outlets, and do not reuse a headline or a distinctive phrase. Paraphrase what someone said as a fact ("Keefe praised his new goalie") or leave it out.
- Verify every number, date, score and team against a dated source, and list it in `sources` (with `date` when known).
- Sales claims only from a published list, named with its sales period. With no list, the jersey case rests on performance, role and popularity; never say or imply a jersey is selling well, selling out, or in short supply.
- No invented quotes, prices, availability or rankings. Mark analysis and speculation as such.

## SEO fields

- `author` is always "Top Selling Jerseys" (the build rejects anything else). Never put a person's name or "Claude" in the byline.
- `title` 50 to 60 characters, `description` 140 to 160, `headline` (H1), `subheadline`, one `primaryKeyword` and two to four `secondaryKeywords`, `searchIntent`.
- A player who already has a page (`data/players.json`): do not make "[player] jersey" the primary keyword. Use it as anchor text to `/players/<slug>/` instead, and set `playerId`.
- Jersey photo: a story page shows the Lids jersey photo, price and link automatically when the subject's jersey is in `data/products.json` (refreshed every morning). Set `playerId` for a player story, or `teamId` for a team story (it shows the team's best-ranked player's jersey). A story whose `subject` is a player's exact name also matches. Nothing else is needed.
- Never target "best-selling/top selling [league] jerseys" as a primary keyword; link to `/top-selling-<league>-jerseys/` with that anchor instead.
- At least one internal link in the body (`[anchor](/path/)`) and one to three `related` links. Every link must be a real page; the build fails otherwise.
- `shopQuery` is a Lids search such as "Jacob Misiorowski Brewers jersey" or "Golden State Valkyries jersey".

## Checks before opening the PR

`npm run validate`, `npm test`, `npm run build`. Open a PR titled "Daily stories: <date>"; it merges automatically once the PR checks pass.

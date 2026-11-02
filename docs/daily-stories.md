# Daily stories

Stories live in `data/stories/<YYYY-MM-DD>.json`, one file per publishing day, and appear at `/news/` and `/news/<slug>/`.
They are also listed in the side rail (home and league pages), on the player pages they mention, in the footer and in the sitemap.
`npm run validate` checks every story on each build.

## What to write each day

**Three stories a day in total, not one per league.** This overrides any older instruction (including in the scheduled task's prompt) to write one story per league. Files dated before 2026-11-02 use the old game-recap angle; do not copy their shape.

Each story is about **why one player's jersey is growing in popularity and is going to be a jersey people want**. Think of rising names like Yaxel in Golden State or Boozer in Memphis. A story is never a game recap.

- **Pick the 3 biggest sports news stories** from the past 24 to 72 hours across the leagues the live site covers (today: NFL, NBA, WNBA, MLB, NHL, MLS). Any mix of leagues is fine, including two from one league. Check the homepage first; no college sports.
- **Pick the one player at the center of each story** whose jersey is the angle. Skip a story with no clear player. Prefer rising and breakout players (rookies, young stars, players in a new role or on a new team) over established stars who already top every list, unless the news is really about that star. Skip injuries, arrests, firings and other negative news. Never invent news.
- Prefer a player with a page in `data/players.json` (set `playerId`), and one not featured in the last 7 days of stories unless there is a big new reason.
- Use `kind` "rising-star" for a breakout or young player, "trending" for a player suddenly in the spotlight, "fan-favorite" for an established crowd favorite, "big-moment" for a title or milestone.
- **Shape of the story** (300 to 400 words, short paragraphs, two or three `## ` subheadings):
  1. **The hook, briefly.** Open with the player and the news in one or two short paragraphs: the key line or stat only. No play-by-play, no score sequence, no box score walk-through.
  2. **Why this jersey is on the rise.** This is most of the story. Make the case from facts: the breakout or rising role, a new team or fresh start, rookie or young-star appeal, what the player means to the fan base and market, the team's momentum, the jersey's look (home, away, alternate or City Edition colorways, a new number), and where the player stands on our best-seller lists in `data/rankings/` (only if they actually appear there).
  3. **The close.** Why this is a jersey to get now and what to watch next, with a link to `/players/<slug>/`.
- **The headline, title and description are about the jersey**, not the score. Examples: "Why [Player]'s [Team] Jersey Is the One to Get", "[Player]'s [Team] Jersey Is on the Rise". Suggested subheadings: `## Why fans are buying in`, `## The look`, `## Why this jersey will last`.

## Writing rules

- **Original writing only.** Take facts from sources, never their wording. Do not quote players, coaches or outlets, and do not reuse a headline or a distinctive phrase. Paraphrase what someone said as a fact ("Keefe praised his new goalie") or leave it out.
- Verify every number, date, score and team against a dated source, and list it in `sources` (with `date` when known).
- Sales claims only from a published list, named with its sales period. With no list, write about popularity signals and why demand is rising (role, breakout, market, fan buzz, the look) and mark that as analysis; never state or imply actual sales figures, a sales rank, selling out, or short supply.
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

`npm run validate`, `npm test`, `npm run build`. Open a PR titled "Daily stories: <date>" from a branch named `daily-stories-<YYYY-MM-DD>`, changing only `data/stories/*.json`. The "Auto-merge daily stories" workflow merges it, and so publishes it, as soon as "PR checks" passes. Do not try to merge it yourself, and do not ask Joe to merge it; if checks fail, fix and push again. A PR that touches any other file is not auto-merged.

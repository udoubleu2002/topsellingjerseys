"""Builds public/player-index/{league}.json, the name lists behind the My Jerseys search.

Usage: python3 -I scripts/build-player-index.py SOURCE_DIR

SOURCE_DIR holds the downloaded open datasets (none are committed):
  nfl/r{1936..2026}.csv   nflverse rosters      github.com/nflverse/nflverse-data/releases/download/rosters/roster_{year}.csv
  data.py                 nba_api static list (NBA and WNBA)   raw.githubusercontent.com/swar/nba_api/master/src/nba_api/stats/library/data.py
  people-{0..f}.csv       Chadwick register     raw.githubusercontent.com/chadwickbureau/register/master/data/people-{x}.csv
  nhl/r{2010..2026}.csv   NHL rosters           github.com/sportsdataverse/sportsdataverse-data/releases/download/nhl_rosters/rosters_{year}.csv
  nhl/players.js          @nhl-api/players      npm package, lib/src/players.js (every NHL player through 2021-22)

Players whose careers ended in 1935 or earlier are left out. Every player on the site's own rankings is added for every league.
Each list entry is [name, info], where info is a short career span and team used to tell same-named players apart.
"""
import ast, csv, glob, json, os, re, sys

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "player-index")
MIN_YEAR = 1936


def span(a, b):
    return str(a) if a == b else f"{a}–{b}"


def nfl():
    people = {}
    for f in sorted(glob.glob(os.path.join(SRC, "nfl", "r*.csv"))):
        for r in csv.DictReader(open(f, encoding="utf-8")):
            name = (r["full_name"] or f"{r['first_name']} {r['last_name']}").strip()
            if not name or not r["season"]:
                continue
            key = r["pfr_id"] or r["gsis_id"] or f"{name}|{r['birth_date']}"
            y = int(r["season"])
            p = people.setdefault(key, {"name": name, "first": y, "last": y, "team": r["team"]})
            p["first"], p["name"] = min(p["first"], y), name
            if y >= p["last"]:
                p["last"], p["team"] = y, r["team"]
    return [[p["name"], f"{span(p['first'], p['last'])} · {p['team']}"] for p in people.values() if p["last"] >= MIN_YEAR]


def nba_api_list(start_marker, end_marker):
    text = open(os.path.join(SRC, "data.py"), encoding="utf-8").read()
    start = text.index(start_marker) + len(start_marker)
    end = text.index(end_marker, start)
    rows = ast.literal_eval(text[start:end].strip())
    return [[r[3], "Active" if r[4] else ""] for r in rows]


def nba():
    return nba_api_list("\nplayers = ", "\nwnba_players")


def wnba():
    return nba_api_list("\nwnba_players = ", "\nteam_index_id")


def mlb():
    out = []
    for f in sorted(glob.glob(os.path.join(SRC, "people-*.csv"))):
        for r in csv.DictReader(open(f, encoding="utf-8")):
            if not r["mlb_played_last"] or int(r["mlb_played_last"]) < MIN_YEAR:
                continue
            first = r["name_first"] or r["name_given"]
            name = f"{first} {r['name_last']}".strip() + (f" {r['name_suffix']}" if r["name_suffix"] else "")
            out.append([name, span(int(r["mlb_played_first"]), int(r["mlb_played_last"]))])
    return out


def nhl():
    people = {}
    for f in sorted(glob.glob(os.path.join(SRC, "nhl", "r*.csv"))):
        for r in csv.DictReader(open(f, encoding="utf-8")):
            y = int(r["season"])
            p = people.setdefault(r["player_id"], {"name": r["full_name"], "first": y, "last": y, "team": r["team_abbr"]})
            p["first"] = min(p["first"], y)
            if y >= p["last"]:
                p["last"], p["team"] = y, r["team_abbr"]
    # Seasons are labeled by the year they end, so 2026 is 2025-26.
    out = [[p["name"], f"{span(p['first'] - 1, p['last'])} · {p['team']}"] for p in people.values()]
    js = open(os.path.join(SRC, "nhl", "players.js"), encoding="utf-8").read()
    for pid, name in re.findall(r"id:\s*(\d+),\s*name:\s*'((?:[^'\\]|\\.)*)'", js):
        if pid not in people:
            out.append([name.replace("\\'", "'"), ""])
    return out


def site_players():
    extra = {}
    for p in json.load(open(os.path.join(ROOT, "data", "players.json"), encoding="utf-8")):
        for lg in p["leagues"]:
            extra.setdefault(lg, []).append(p["name"])
    return extra


def main():
    os.makedirs(OUT, exist_ok=True)
    lists = {"nfl": nfl(), "nba": nba(), "wnba": wnba(), "mlb": mlb(), "nhl": nhl(), "mls": []}
    for lg, names in site_players().items():
        have = {n.lower() for n, _ in lists[lg]}
        lists[lg] += [[n, ""] for n in names if n.lower() not in have]
    for lg, rows in lists.items():
        seen, clean = set(), []
        for name, info in rows:
            name = " ".join(name.split())
            if name and (name, info) not in seen:
                seen.add((name, info))
                clean.append([name, info])
        clean.sort(key=lambda r: (r[0].lower(), r[1]))
        with open(os.path.join(OUT, f"{lg}.json"), "w", encoding="utf-8") as fh:
            json.dump(clean, fh, ensure_ascii=False, separators=(",", ":"))
        print(lg, len(clean))


main()

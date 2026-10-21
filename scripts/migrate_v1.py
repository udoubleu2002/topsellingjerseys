"""One-time migration from the v1 static site data (league JSON files) to the v2 content model."""
import json, os, re, sys, unicodedata
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "data")

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

colors = json.load(open(os.path.join(SRC, "teams.json")))
LEAGUES = [
  {"id": "nfl", "name": "NFL", "fullName": "National Football League", "sport": "Football", "accent": "#013369"},
  {"id": "nba", "name": "NBA", "fullName": "National Basketball Association", "sport": "Basketball", "accent": "#1d428a"},
  {"id": "mlb", "name": "MLB", "fullName": "Major League Baseball", "sport": "Baseball", "accent": "#041e42"},
  {"id": "nhl", "name": "NHL", "fullName": "National Hockey League", "sport": "Hockey", "accent": "#111111"},
  {"id": "mls", "name": "MLS", "fullName": "Major League Soccer", "sport": "Soccer", "accent": "#2b2f6b"},
]
REPORTS = {
  "nfl": {"id": "nfl-2026-06-09-nflpa-year-end", "series": "nflpa-year-end", "title": "NFLPA Year-End Top 50 NFL Player Sales List",
          "publisher": "NFL Players Association (NFLPA)", "periodStart": "2025-03-01", "periodEnd": "2026-02-28",
          "scope": "All licensed NFL player merchandise (jerseys, apparel and other products) sold through licensees, online and at retail.",
          "methodology": "Compiled by NFL Players Inc. from licensee royalty reports. Unit counts are not published.",
          "limitations": ["The NFLPA list measures all licensed player merchandise, not jerseys alone.",
                          "The source report ranks 50 players. This site currently lists ranks 1-25; ranks 26-50 have not yet been verified for import."]},
  "nba": {"id": "nba-2026-04-13-season-top-selling", "series": "nba-season", "title": "Top-Selling NBA Jerseys, 2025-26 Regular Season",
          "publisher": "NBA and NBPA (via NBA.com)", "periodStart": "2025-10-01", "periodEnd": "2026-04-12",
          "scope": "Jersey sales on NBAStore.com, Fanatics.com and Fanatics partner sites during the 2025-26 regular season.",
          "methodology": "Based on online sales through the NBA Store and Fanatics network. Unit counts are not published.",
          "limitations": ["Online sales through the NBA Store and Fanatics network only; in-arena and other retail sales are not included."]},
  "mlb": {"id": "mlb-2026-09-25-season-most-popular", "series": "mlb-season", "title": "MLB's Most Popular Player Jerseys of the 2026 Season",
          "publisher": "MLB (via MLB.com)", "periodStart": "2026-03-26", "periodEnd": "2026-09-27",
          "scope": "Nike MLB jersey sales on MLBShop.com and the Fanatics network since Opening Day 2026.",
          "methodology": "Based on online sales through MLBShop.com and the Fanatics network. Unit counts are not published.",
          "limitations": ["Online sales through MLBShop.com and the Fanatics network only.",
                          "Released before the end of the regular season; it does not include postseason sales."]},
  "nhl": {"id": "nhl-2026-04-18-season-top-selling", "series": "nhl-season", "title": "NHL's Top 10 Selling Jerseys of the 2025-26 Season",
          "publisher": "NHL (Shop.NHL.com / Fanatics), as reported by HockeyFeed", "periodStart": "2025-10-07", "periodEnd": "2026-04-16",
          "scope": "Player jersey sales on Shop.NHL.com and the Fanatics network during the 2025-26 regular season.",
          "methodology": "League-announced ranking based on online sales. Unit counts are not published.",
          "limitations": ["The original league announcement could not be retrieved directly; the ranking is taken from published coverage of it.",
                          "Publication date inferred from the league's social media announcement."]},
  "mls": {"id": "mls-2025-10-27-season-best-selling", "series": "mls-season", "title": "MLS Best-Selling Jerseys of 2025",
          "publisher": "Major League Soccer (via MLSsoccer.com)", "periodStart": "2025-02-22", "periodEnd": "2025-10-18",
          "scope": "Player jersey sales on MLSstore.com during the 2025 MLS season.",
          "methodology": "Based on sales through MLSstore.com. Unit counts are not published.",
          "limitations": ["This is the most recent official MLS list; no 2026 list has been published yet.",
                          "Publication date is approximate (late October 2025)."]},
}
teams, players, stats, used = {}, {}, [], set()
SPECIAL = {"Charlotte FC (2025-26 loan)": ("Charlotte FC", "Free agent"), "Columbus Crew (retired)": ("Columbus Crew", "Retired")}
for lg in LEAGUES:
    L = lg["id"]
    d = json.load(open(os.path.join(SRC, f"{L}.json")))
    rep = dict(REPORTS[L]); rep.update({"league": L, "sourceUrl": d["source_url"], "publishedDate": d["published"],
        "periodLabel": d["period"], "retrievedDate": "2026-10-20", "lastVerified": "2026-10-21", "status": "published", "entries": []})
    lg["slug"] = f"top-selling-{L}-jerseys"
    for p in d["players"]:
        tname, status = SPECIAL.get(p["team"], (p["team"], "Active"))
        tid = slug(tname)
        if tid not in teams:
            c = colors.get(tname) or ["#1f2937", "#ffffff", "#9ca3af"]
            teams[tid] = {"id": tid, "name": tname, "league": L, "colors": {"primary": c[0], "secondary": c[1], "accent": c[2]}}
        pid = slug(p["name"])
        assert pid not in used, pid; used.add(pid)
        players[pid] = {"id": pid, "slug": pid, "name": p["name"], "leagues": [L],
            "teamId": None if status != "Active" else tid, "lastTeamId": tid, "status": status,
            "position": p["position"], "number": p.get("number") or None, "birthday": None, "birthdaySource": None,
            "portrait": None, "overview": None, "highlights": [{"text": b, "source": None} for b in p["bullets"]],
            "sources": [], "lastVerified": "2026-10-20"}
        rep["entries"].append({"rank": p["rank"], "playerId": pid, "teamIdAtReport": tid})
        if p.get("stats"):
            stats.append({"playerId": pid, "league": L, "teamId": tid, "season": d.get("stats_label", ""),
                "competition": "regular-season", "statistics": [{"label": s["label"], "value": s["value"]} for s in p["stats"] if s.get("value")],
                "note": p.get("stats_note"), "source": None, "throughDate": d.get("stats_as_of"), "updatedAt": "2026-10-20", "isDemo": False})
    os.makedirs(os.path.join(OUT, "rankings", L), exist_ok=True)
    json.dump(rep, open(os.path.join(OUT, "rankings", L, rep["id"] + ".json"), "w"), indent=2, ensure_ascii=False)
json.dump(LEAGUES, open(os.path.join(OUT, "leagues.json"), "w"), indent=2)
json.dump(sorted(teams.values(), key=lambda t: (t["league"], t["name"])), open(os.path.join(OUT, "teams.json"), "w"), indent=2, ensure_ascii=False)
json.dump(sorted(players.values(), key=lambda p: p["id"]), open(os.path.join(OUT, "players.json"), "w"), indent=2, ensure_ascii=False)
json.dump(stats, open(os.path.join(OUT, "stats.json"), "w"), indent=2, ensure_ascii=False)
json.dump([{"id": "fanatics", "name": "Fanatics", "homepage": "https://www.fanatics.com/",
            "searchUrlTemplate": "https://www.fanatics.com/?query={query}", "affiliateEnv": "AFFILIATE_PARAMS_FANATICS",
            "notes": "Official retail partner of all five leagues. Affiliate program via Impact; add approved tracking parameters in the environment."}],
          open(os.path.join(OUT, "merchants.json"), "w"), indent=2)
json.dump([], open(os.path.join(OUT, "products.json"), "w"))
print(len(players), "players", len(teams), "teams", len(stats), "stat lines")

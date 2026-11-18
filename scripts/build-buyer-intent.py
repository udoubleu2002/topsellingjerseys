"""
Builds data/buyer-intent.json: the players whose jersey searches carry the most buyer intent, from a keyword export.

    python3 -I scripts/build-buyer-intent.py KEYWORDS.csv [--updated YYYY-MM-DD]

KEYWORDS.csv is a keyword-tool export with at least: keyword, cpc, searches, lowest_da, weak_spots, player_id, and
optionally gsc_impressions_28d and gsc_avg_position from Search Console. Score per keyword is CPC x monthly searches,
raised by half when the weakest page-1 site has DA under 40 and by half again for each weak spot in the top 3.
Only player ids, a tier and the main keyword are written: CPC and volume stay in the private export.

Tiers:
  close   Search Console shows the player page at an average position of 15 or better for one of their keywords.
  unseen  No Search Console impressions yet for any of the player's keywords.
  far     Impressions, but only beyond position 15.
"""
import csv, json, sys, datetime, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

def num(v, kind=float):
    try:
        return kind(v)
    except (TypeError, ValueError):
        return None

def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    updated = datetime.date.today().isoformat()
    if "--updated" in args:
        updated = args[args.index("--updated") + 1]
    players = {p["id"] for p in json.load(open(ROOT / "data" / "players.json"))}
    agg = {}
    for r in csv.DictReader(open(args[0], newline="")):
        pid = (r.get("player_id") or "").strip()
        cpc, vol = num(r.get("cpc")) or 0, num(r.get("searches"), int) or 0
        if pid not in players or cpc <= 0 or vol <= 0:
            continue
        da, ws = num(r.get("lowest_da"), int), num(r.get("weak_spots"), int) or 0
        score = cpc * vol * (1 + (0.5 if da is not None and da < 40 else 0) + 0.5 * ws)
        a = agg.setdefault(pid, {"score": 0, "keyword": None, "best": 0, "pos": None, "seen": False})
        a["score"] += score
        if score > a["best"]:
            a["best"], a["keyword"] = score, r["keyword"].strip()
        pos, imp = num(r.get("gsc_avg_position")), num(r.get("gsc_impressions_28d"), int)
        if imp:
            a["seen"] = True
            a["pos"] = pos if a["pos"] is None else min(a["pos"], pos)
    rows = []
    for pid, a in agg.items():
        tier = "unseen" if not a["seen"] else "close" if a["pos"] is not None and a["pos"] <= 15 else "far"
        # Pages already near page 1 make the list at a lower bar: a small push there pays off soonest.
        if a["score"] < (300 if tier == "close" else 1000):
            continue
        rows.append((a["score"], {"playerId": pid, "tier": tier, "keyword": a["keyword"]}))
    rows.sort(key=lambda x: -x[0])
    out = {
        "note": "Players whose jersey searches carry the most buyer intent (CPC x searches, weighted for weak page-1 competition), best first. Built by scripts/build-buyer-intent.py; never used to order a sales ranking.",
        "updated": updated,
        "players": [r for _, r in rows],
    }
    (ROOT / "data" / "buyer-intent.json").write_text(json.dumps(out, indent=2) + "\n")
    print(f"{len(rows)} players: " + ", ".join(f"{t}={sum(1 for _, r in rows if r['tier'] == t)}" for t in ("close", "unseen", "far")))

main()

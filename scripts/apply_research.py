"""Applies a verified research file (data/research/*.json) to players.json and stats.json.
Only fields present in the research file change; everything else in the player record is kept."""
import json, sys, os
ROOT = os.path.join(os.path.dirname(__file__), "..", "data")
res = json.load(open(sys.argv[1]))
day = res["collected"]
players = json.load(open(os.path.join(ROOT, "players.json")))
stats = json.load(open(os.path.join(ROOT, "stats.json")))
byid = {p["id"]: p for p in players}
for pid, r in res["players"].items():
    p = byid[pid]
    if "birthday" in r: p["birthday"], p["birthdaySource"] = r["birthday"], r.get("bsrc")
    if r.get("number") is not None: p["number"] = r["number"]
    for k in ("teamId", "lastTeamId", "status", "position", "overview"):
        if k in r: p[k] = r[k]
    if "b" in r:
        assert len(r["b"]) == 3, pid
        p["highlights"] = [{"text": t, "source": s} for t, s in r["b"]]
    p["sources"] = sorted({s for _, s in r.get("b", [])} | ({r["bsrc"]} if r.get("bsrc") else set()))
    p["lastVerified"] = day
    if "lines" in r:
        stats = [s for s in stats if s["playerId"] != pid]
        for ln in r["lines"]:
            stats.append({"playerId": pid, "league": p["leagues"][0], "teamId": ln.get("team") or p["teamId"] or p["lastTeamId"],
                "season": ln["season"], "competition": ln.get("competition", "regular-season"),
                "statistics": [{"label": a, "value": b} for a, b in ln["stats"]], "note": ln.get("note"),
                "source": ln.get("source") or (r["b"][0][1] if r.get("b") else None), "throughDate": ln["through"],
                "updatedAt": day, "isDemo": False})
json.dump(players, open(os.path.join(ROOT, "players.json"), "w"), indent=2, ensure_ascii=False)
json.dump(stats, open(os.path.join(ROOT, "stats.json"), "w"), indent=2, ensure_ascii=False)
print("applied", len(res["players"]), "players from", sys.argv[1])

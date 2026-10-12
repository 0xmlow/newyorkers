"""Tally the onchain survey. Run from GO LIVE PACKAGE/:

    npx wrangler d1 execute new-yorkers --remote --json \
      --command "SELECT submitted_at, name, payload FROM submissions WHERE kind='survey'" > survey.json
    python3 "../NEW YORKERS SITE/_build/api/tally_survey.py" survey.json

Prints the vote per piece and overall, the other answers, and writes survey.csv."""
import json, sys, csv, collections
rows = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "survey.json"))[0]["results"]
P = [json.loads(r["payload"]) for r in rows]
LET = {"A": "First pass 192", "B": "Flat 256", "C": "Crisp 256", "D": "Crisp 320"}
def show(title, counter, names=None):
    n = sum(counter.values()) or 1
    print(f"\n{title}  ({sum(counter.values())} answers)")
    for k, v in counter.most_common():
        label = (names or {}).get(k, k) or "(blank)"
        print(f"  {label:42s} {v:4d}  {100*v/n:5.1f}%  " + "#" * round(30 * v / n))
print(len(P), "responses")
for slug in ("matriarch", "firstsale", "bodegacat", "mixtape"):
    show(f"Pick for {slug}", collections.Counter(p.get("picks", {}).get(slug, "") for p in P if p.get("picks", {}).get(slug)), LET)
show("Overall", collections.Counter(p.get("overall") for p in P if p.get("overall")), LET)
all_letters = collections.Counter()
for p in P:
    for v in list(p.get("picks", {}).values()) + [p.get("overall", "")]:
        if v: all_letters[v] += 1
show("Every vote combined", all_letters, LET)
for q in ("priority", "claim", "gas", "holds"):
    show(q, collections.Counter(p.get(q) for p in P if p.get(q)))
show("powers (multi)", collections.Counter(x for p in P for x in p.get("powers", [])))
print("\nNotes:")
for p in P:
    if p.get("notes"): print(f"  @{p.get('name') or 'anon'}: {p['notes']}")
with open("survey.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["submitted_at", "handle", "wallet_or_ens", "matriarch", "firstsale", "bodegacat", "mixtape", "overall",
                "priority", "claim", "gas", "powers", "holds", "notes", "ref"])
    for r, p in zip(rows, P):
        pk = p.get("picks", {})
        w.writerow([r["submitted_at"], p.get("name", ""), p.get("wallet_or_ens", ""), pk.get("matriarch", ""), pk.get("firstsale", ""),
                    pk.get("bodegacat", ""), pk.get("mixtape", ""), p.get("overall", ""), p.get("priority", ""), p.get("claim", ""),
                    p.get("gas", ""), " ".join(p.get("powers", [])), p.get("holds", ""), p.get("notes", ""), p.get("ref", "")])
print("\nwrote survey.csv")

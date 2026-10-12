# Reading what the forms collected

Everything the site collects goes into a Cloudflare D1 database called `new-yorkers`, on your own
account. No third party, no monthly bill, no inbox.

Run these from `GO LIVE PACKAGE/`.

## See everything

```bash
npx wrangler d1 execute new-yorkers --remote --command "SELECT submitted_at, kind, name, email, wallet, mint_count, ref FROM submissions ORDER BY submitted_at DESC"
```

## Just the allowlist

```bash
npx wrangler d1 execute new-yorkers --remote --command "SELECT submitted_at, name, email, wallet, mint_count, ref FROM submissions WHERE kind='allowlist' ORDER BY submitted_at DESC"
```

## Export to a spreadsheet

```bash
npx wrangler d1 execute new-yorkers --remote --json --command "SELECT * FROM submissions" > out.json
python3 - <<'PY'
import json, csv
rows = json.load(open("out.json"))[0]["results"]
if rows:
    with open("submissions.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys()); w.writeheader(); w.writerows(rows)
    print(len(rows), "rows -> submissions.csv")
PY
```

Open `submissions.csv` in Numbers or Excel, or import it into Google Sheets.

## The onchain survey

```bash
npx wrangler d1 execute new-yorkers --remote --json --command "SELECT submitted_at, name, payload FROM submissions WHERE kind='survey'" > survey.json
python3 "../NEW YORKERS SITE/_build/api/tally_survey.py" survey.json
```

Prints the vote for every piece and overall, the other answers and every note, and writes `survey.csv`.
Letters: A first pass 192, B flat 256, C crisp 256, D crisp 320.

## Who referred whom

```bash
npx wrangler d1 execute new-yorkers --remote --command "SELECT ref, COUNT(*) AS signups FROM submissions WHERE ref != '' GROUP BY ref ORDER BY signups DESC"
```

## The three kinds

| kind | form |
|---|---|
| `allowlist` | the allowlist page |
| `census` | Get Counted registration, and the allowlist form inside the 3D census |
| `nomination` | nominate a New Yorker |
| `survey` | the onchain survey at /survey (picks per piece, overall, claim, gas, powers) |

The full original submission is kept verbatim in the `payload` column as JSON, so nothing a form
collects is ever lost even if it is not pulled out into its own column.

## What protects it

- Rate limited to five submissions of a kind per ip per ten minutes.
- IP addresses are hashed, never stored raw.
- A second allowlist entry for the same wallet updates the first rather than duplicating it.
- Email and wallet formats are checked server side, not just in the browser.
- A honeypot field catches the simplest bots.
- There is no read endpoint. The only way to see the data is the commands above, authenticated as you.

## What it does not do

It does not verify that a wallet is a month old or holds anything. That is a separate job against the
chain after a snapshot, described in `COLLECTOR PLATFORM 2026-09-07/00_ARCHITECTURE.md`.

#!/usr/bin/env python3
"""THE LAST 361: a post from @n3wyorkers every time a census New Yorker gets counted.

Reads _build/collectors/chain.json (every Transfer on the two contracts, written by collectors/fetch_chain.py)
and finds census mints newer than the last one this script posted. Each one becomes

    No. 4400 just got counted by rikid.eth.
    The Auction Paddle Fell.

    757 OF 1,111 · 16 DAYS LEFT
    n3wyorkers.com/n/4400

with the painting attached. If more than three arrived since the last run, one summary goes out instead,
with a 2x2 grid of the newest four, so a busy hour does not flood the timeline.

The collector is named by X handle when one is known (identity.json, chain.json twitter), else ENS, else the
wallet's short form. Token to piece: census_traits.json gives the census number, data.js gives the page id.

    python3 mint_watch.py                 dry run: writes the would-be posts to outbox/, moves nothing
    python3 mint_watch.py --refresh       run collectors/fetch_chain.py first (network, no key)
    python3 mint_watch.py --replay 2      compose the two latest mints as if new, for a look. Never touches state
    python3 mint_watch.py --post          arm it: posts, and advances the watermark in state.json

The live watermark (state.json mint_watch.last) only moves with --post. The first armed run sets the
watermark at the latest mint and posts nothing, so arming never replays history. A dry run remembers what it
previewed so a launchd dry run every ten minutes does not rewrite the same outbox file."""
import os, sys, json, subprocess, argparse, time
from PIL import Image
from common import HERE, BUILD, SITE, link, days_left_line, census_cap, pieces_by_n, no_dash, load_state, save_state, stamp, now_ny
from x import X

COL = os.path.join(BUILD, "collectors")
ZERO = "0x" + "0" * 40
BATCH_AFTER = 3
MEDIA = os.path.join(HERE, "outbox", "media")


def census_mints(chain):
    """Every census mint, oldest first. A mint is a Transfer from the zero address."""
    m = [l for l in chain["logs"] if l.get("c") == "census" and l.get("from", "").lower() == ZERO]
    m.sort(key=lambda l: (l["b"], l["i"]))
    return m


def who(addr, chain, ident):
    """How to name the collector. An X handle gets tagged; otherwise ENS, a known username, or the short wallet."""
    a = addr.lower()
    idw = ident.get(a) or {}
    if idw.get("x"): return "@" + idw["x"].lstrip("@")
    tw = (chain.get("twitter") or {}).get(a)
    if tw: return "@" + tw.lstrip("@")
    ens = (chain.get("ens") or {}).get(a) or idw.get("ens")
    if ens: return ens
    if idw.get("user") and not idw["user"].startswith("0x"): return idw["user"]
    return a[:6] + "…" + a[-4:]


def piece_for(token, traits, by_n):
    t = traits.get(str(token)) or {}
    p = by_n.get(t.get("n"))
    pid = str(p["id"]) if p else (str(t["n"]) if t.get("n") is not None else str(token))
    title = (p or t).get("t") or f"Token {token}"
    img = os.path.join(SITE, "assets", "t", p["st"][0] + ".jpg") if p and p.get("st") else None
    return {"n": t.get("n", token), "id": pid, "title": title, "img": img if img and os.path.exists(img) else None}


def end(s):
    s = s.strip()
    return s if s[-1:] in ".!?…" else s + "."


def stat_line(total, cap):
    d = days_left_line()
    return f"{total:,} OF {cap:,}" + (f" · {d}" if d else "")


def single_text(pc, name, total, cap):
    return no_dash("\n".join([f"No. {pc['n']} just got counted by {name}.", end(pc["title"]), "", stat_line(total, cap), link(f"n/{pc['id']}")]))


def batch_text(k, span_sec, total, cap):
    if span_sec <= 3600: when = "in the last hour"
    elif span_sec <= 86400: when = "today"
    else: when = "since the last roll"
    return no_dash("\n".join([f"{k} New Yorkers got counted {when}.", "Every one of them is on the record now.", "", stat_line(total, cap), link()]))


def grid(pcs, out):
    """A 2x2 of the newest paintings on the house black. No text burned in."""
    W, H, G = 1000, 563, 12
    im = Image.new("RGB", (W * 2 + G * 3, H * 2 + G * 3), "#0D0D0D")
    for i, pc in enumerate(pcs[:4]):
        if not pc["img"]: continue
        tile = Image.open(pc["img"]).convert("RGB").resize((W, H))
        im.paste(tile, (G + (i % 2) * (W + G), G + (i // 2) * (H + G)))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, "JPEG", quality=88)
    return out


def main(argv):
    ap = argparse.ArgumentParser(description="Post census mints from @n3wyorkers. Dry run unless --post.")
    ap.add_argument("--refresh", action="store_true", help="run collectors/fetch_chain.py first")
    ap.add_argument("--replay", type=int, default=0, metavar="N", help="treat the N latest mints as new; never touches state")
    ap.add_argument("--post", action="store_true", help="actually post and advance the watermark")
    ap.add_argument("--batch-after", type=int, default=BATCH_AFTER, help="more new mints than this become one summary post")
    a = ap.parse_args(argv)

    if a.refresh:
        r = subprocess.run([sys.executable, os.path.join(COL, "fetch_chain.py")], capture_output=True, text=True)
        print((r.stdout or r.stderr).strip().splitlines()[-1] if (r.stdout or r.stderr).strip() else "chain refreshed")
        if r.returncode: print("  chain refresh failed; reading the last snapshot")

    chain = json.load(open(os.path.join(COL, "chain.json")))
    traits = json.load(open(os.path.join(COL, "census_traits.json")))
    idf = os.path.join(COL, "identity.json")
    ident = json.load(open(idf)).get("wallets", {}) if os.path.exists(idf) else {}
    by_n = pieces_by_n()
    cap = census_cap()
    mints = census_mints(chain)
    total = len({m["id"] for m in mints})
    if not mints: raise SystemExit("no census mints in chain.json")

    st = load_state(); ms = st.setdefault("mint_watch", {})
    key = lambda m: (m["b"], m["i"])
    latest = mints[-1]

    if a.replay:
        new = mints[-a.replay:]
    else:
        last = ms.get("last")
        if not last:
            if a.post:
                ms["last"] = {"b": latest["b"], "i": latest["i"], "tx": latest["tx"], "id": latest["id"], "set": now_ny().isoformat(timespec="seconds")}
                save_state(st)
                print(f"first armed run: watermark set at census token {latest['id']} (block {latest['b']}). Nothing posted. {total:,} of {cap:,} counted.")
                return
            # dry run before anything was ever armed: preview from the latest mint only
            new = [latest]
        else:
            new = [m for m in mints if key(m) > (last["b"], last["i"])]
        if not new:
            print(f"nothing new. {total:,} of {cap:,} counted, last token {latest['id']}."); return
        if not a.post and ms.get("previewed") == latest["tx"]:
            print(f"dry run: already previewed up to token {latest['id']}; nothing written."); return

    x = X(dry_run=not a.post, tag="mint_watch")
    recs = []
    if len(new) > a.batch_after:
        pcs = [piece_for(m["id"], traits, by_n) for m in reversed(new)]
        span = latest["t"] - new[0]["t"]
        img = grid(pcs, os.path.join(MEDIA, f"grid-{stamp()}.jpg"))
        recs.append(x.post(batch_text(len(new), span, total, cap), [img]))
    else:
        for m in new:
            pc = piece_for(m["id"], traits, by_n)
            recs.append(x.post(single_text(pc, who(m["to"], chain, ident), total, cap), [pc["img"]] if pc["img"] else []))
            if a.post and m is not new[-1]: time.sleep(20)

    if not a.replay:
        if a.post:
            ms["last"] = {"b": latest["b"], "i": latest["i"], "tx": latest["tx"], "id": latest["id"], "set": now_ny().isoformat(timespec="seconds")}
        else:
            ms["previewed"] = latest["tx"]
        ms["posted" if a.post else "previewed_at"] = now_ny().isoformat(timespec="seconds")
        save_state(st)
    for r in recs:
        print(("posted " if a.post else "dry run ") + r["outbox"])
        print("  " + r["text"].replace("\n", "\n  "))


if __name__ == "__main__":
    main(sys.argv[1:])

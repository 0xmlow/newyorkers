#!/usr/bin/env python3
"""states.html: Friday State, the schedule of states appended to NEW YORKERS tokens.

The ERC-7160 promise everywhere on the site is "the art inside keeps growing" and nowhere said when.
This page says when: what is already on the tokens, the next four Fridays, and how pinning works.
Every word comes from _build/states.json so MLow edits data, not code. Run before build_seo.py; the
orchestrator wires nav, footer, sitemap and build_all.sh. Passes active="STATES" to the shell.
"""
import json, os
from page_shell import shell, esc, cfg

HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
S = json.load(open(os.path.join(HERE, "states.json"), encoding="utf-8"))
URL = cfg()["siteUrl"]
for bad in ("—", "–", "→", "confirmed", "final"):
    assert bad not in json.dumps(S, ensure_ascii=False).lower(), f"states.json carries {bad!r}: house rule"

A, F, PIN = S["appended"], S["fridays"], S["pinning"]

def state_card(x):
    return (f'<li class="stcard"><div class="stname">{esc(x["name"])}</div><div class="strel">{esc(x["release"])}</div>'
            f'<div class="strange">{esc(x["range"])}</div><p>{esc(x["what"])}</p></li>')

def friday(c, i):
    return (f'<li class="stfri"><time datetime="{esc(c["date"])}">{esc(c["label"])}</time><div class="stno">{i + 1}</div>'
            f'<h3>{esc(c["state"])}</h3><div class="strel">{esc(c["release"])}</div><div class="strange">{esc(c["tranche"])}</div><p>{esc(c["line"])}</p></li>')

def link(l):
    ext = ' target="_blank" rel="noopener"' if l["u"].startswith("http") else ""
    return f'<a class="btn{"" if l.get("primary") else " ghost"}" href="{esc(l["u"])}"{ext}>{esc(l["t"])}</a>'
links = "".join(link(l) for l in PIN["links"])

body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:8px">
  <div class="kicker" style="color:var(--acid)">{esc(S["kicker"])}</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px">{esc(S["title"])}.</h1>
  <p class="lede" style="margin-top:16px;max-width:820px">{esc(S["lede"])}</p>
  <p class="stintent">{esc(S["intent"])}</p>
</section>
<section class="wrap st" id="appended">
  <h2 class="h-l">{esc(A["title"])}</h2>
  <p class="body stintro">{esc(A["intro"])}</p>
  <ul class="stgrid">{"".join(state_card(x) for x in A["states"])}</ul>
  <p class="stnote">{esc(A["note"])}</p>
</section>
<section class="wrap st" id="fridays">
  <h2 class="h-l">{esc(F["title"])}</h2>
  <ol class="stfris">{"".join(friday(c, i) for i, c in enumerate(F["cards"]))}</ol>
  <p class="stintent">{esc(S["intent"])}</p>
</section>
<section class="wrap st" id="pinning" style="padding-bottom:90px">
  <h2 class="h-l">{esc(PIN["title"])}</h2>
  <div class="stpin">{"".join(f"<p>{esc(l)}</p>" for l in PIN["lines"])}</div>
  <div class="stlinks">{links}</div>
</section>
"""

css = """
.st{padding-top:56px}
.stintent{font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--acid);margin-top:22px;line-height:1.8;max-width:820px}
.stintro{margin-top:14px;max-width:820px}
.stgrid{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:26px}
.stcard{background:var(--card);border:1px solid var(--divider);border-radius:12px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:6px}
.stname{font-family:var(--mono);font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:var(--acid)}
.strel{font-family:var(--mono);font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate)}
.strange{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--cloud)}
.stcard p,.stfri p{font-family:var(--sans);font-size:14px;line-height:1.55;color:var(--slate);margin-top:6px}
.stnote{font-family:var(--mono);font-size:11px;line-height:1.7;letter-spacing:.06em;color:var(--slate);margin-top:18px;max-width:820px}
.stfris{list-style:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:26px}
.stfri{position:relative;background:var(--card);border:1px solid var(--divider);border-radius:12px;padding:20px 18px 18px;display:flex;flex-direction:column;gap:6px;min-height:240px}
.stfri time{font-family:var(--mono);font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate)}
.stfri .stno{position:absolute;top:14px;right:16px;font-family:var(--serif);font-size:30px;line-height:1;color:var(--divider)}
.stfri h3{font-family:var(--mono);font-size:16px;letter-spacing:.18em;text-transform:uppercase;color:var(--acid);font-weight:500;margin-top:10px}
.stfri:first-child{border-color:var(--acid);box-shadow:0 0 0 1px var(--acid)}
.stpin{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:26px}
.stpin p{font-family:var(--sans);font-size:15.5px;line-height:1.65;color:var(--cloud)}
.stlinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:30px}
@media (max-width:900px){.stfris{grid-template-columns:repeat(2,minmax(0,1fr))}.stpin{grid-template-columns:1fr;gap:14px}}
@media (max-width:520px){.stfris{grid-template-columns:1fr}.stfri{min-height:0}}
"""

desc = f"{S['kicker'].capitalize()}: what is already on NEW YORKERS tokens (MOSH, MOSH LOOP, DITHER, PIXEL, ANIMATED) and the next four Fridays of states. {S['intent']}"
ld = [{"@context": "https://schema.org", "@type": "WebPage", "@id": URL + "/states", "name": "Friday State · NEW YORKERS by MLow", "url": URL + "/states",
       "description": desc, "isPartOf": {"@id": URL + "/#site"}},
      {"@context": "https://schema.org", "@type": "ItemList", "name": "The next four Fridays",
       "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": f'{c["label"]}: {c["state"]}, {c["tranche"]}'} for i, c in enumerate(F["cards"])]}]
page = shell(title="Friday State · NEW YORKERS by MLow", description=desc, body=body, path="states.html", active="STATES", extra_css=css,
             keywords=["NEW YORKERS", "MLow", "ERC-7160", "dynamic NFT states", "Friday State", "KEYSTONE", "THE CENSUS RELEASE", "Transient Labs"], jsonld=ld)
out = os.path.join(SITE, "states.html")
open(out, "w", encoding="utf-8").write(page)
print(f"states.html: {len(A['states'])} states appended, {len(F['cards'])} Fridays, {os.path.getsize(out) // 1024} KB")

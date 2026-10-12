#!/usr/bin/env python3
"""Shared bits for the posting scripts: paths, New York time, data.js, config.js, state.json, the outbox.

Every poster imports this. Nothing here touches the network and nothing here knows a secret."""
import json, os, re, datetime, tempfile
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.dirname(HERE)
SITE = os.path.dirname(BUILD)
ROOT = os.path.dirname(SITE)
OUTBOX = os.path.join(HERE, "outbox")
STATE = os.path.join(HERE, "state.json")
NY = ZoneInfo("America/New_York")


def cfg():
    """The few keys of assets/config.js the posters need."""
    s = open(os.path.join(SITE, "assets", "config.js"), encoding="utf-8").read()
    g = lambda k, d="": (re.search(rf'{k}:\s*"([^"]*)"', s) or [None, d])[1]
    return {"siteUrl": g("siteUrl", "https://n3wyorkers.com").rstrip("/"), "domain": g("domain", "N3WYORKERS.COM").lower(),
            "closeDate": g("closeDate", "")}


def link(path=""):
    """The bare link form the posts carry, n3wyorkers.com/n/4400. X autolinks it and it reads cleaner than https://."""
    d = cfg()["domain"]
    return d + ("/" + path.lstrip("/") if path else "")


def now_ny():
    return datetime.datetime.now(NY)


def ny_day(dt=None):
    """YYYY-MM-DD in New York, the same rule the home page uses to pick the New Yorker of the day."""
    return (dt or now_ny()).astimezone(NY).date().isoformat()


def days_left():
    """Whole days until THE CENSUS RELEASE closes (config.js closeDate), rounded up. None once it has closed."""
    c = cfg()["closeDate"]
    if not c: return None
    close = datetime.datetime.fromisoformat(c)
    secs = (close - datetime.datetime.now(datetime.timezone.utc)).total_seconds()
    if secs <= 0: return None
    return max(1, -(-int(secs) // 86400))


def days_left_line():
    d = days_left()
    if d is None: return ""
    return "LAST DAY" if d == 1 else f"{d} DAYS LEFT"


def census_cap():
    """The size of THE CENSUS RELEASE from releases.json, the only source of truth for what was promised."""
    r = json.load(open(os.path.join(BUILD, "releases.json"), encoding="utf-8"))
    return next(x["count"] for x in r["releases"] if x["id"] == "census")


_DATA = None
def data():
    """assets/data.js as a dict. Loaded once, 5 MB."""
    global _DATA
    if _DATA is None:
        d = open(os.path.join(SITE, "assets", "data.js"), encoding="utf-8").read()
        _DATA = json.loads(d[d.index("=") + 1:].rstrip().rstrip(";"))
    return _DATA


def pieces_by_n():
    return {p.get("n"): p for p in data()["pieces"] if p.get("n") is not None}


def pieces_by_id():
    return {str(p["id"]): p for p in data()["pieces"]}


def no_dash(s):
    """Brand rule: no em or en dashes in anything public."""
    return str(s).replace("—", ",").replace("–", " to ")


def first_sentence(s, cap=230):
    """The first sentence of a story, or a word boundary clip of it when the sentence runs long."""
    s = " ".join(str(s or "").split())
    m = re.search(r"^(.+?[.!?])(?:\s|$)", s)
    out = m.group(1) if m else s
    if len(out) > cap:
        out = out[:out.rfind(" ", 0, cap)].rstrip(",;:") + "…"
    return out


def load_state():
    if not os.path.exists(STATE): return {}
    try:
        return json.load(open(STATE, encoding="utf-8"))
    except ValueError:
        return {}


def save_state(st):
    """Atomic write, so a launchd job killed mid write cannot leave half a file."""
    fd, tmp = tempfile.mkstemp(dir=HERE, prefix=".state-", suffix=".json")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(st, f, indent=1, ensure_ascii=False)
    os.replace(tmp, STATE)


def stamp():
    """A filename safe timestamp with microseconds, so forty posts in one run never collide."""
    n = now_ny()
    return n.strftime("%Y%m%d-%H%M%S") + f"-{n.microsecond:06d}"

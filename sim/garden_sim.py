#!/usr/bin/env python3
"""THE GARDEN game engine: rosters, rules, a possession simulator, spatial choreography, highlights, tournaments.

Standard library only, deterministic by seed. The chain is the one in astra_plan.md section F:
roster + rules + seed -> game events -> spatial choreography -> motion and ball timeline -> (the walk renders it).

  python3 sim/garden_sim.py game --seed 7                      # NEW YORKERS v NIGHT SHIFT, writes sim/out/game_7.json
  python3 sim/garden_sim.py game --seed 7 --home BOD --away CAB
  python3 sim/garden_sim.py tournament --format knockout --seed 3
  python3 sim/garden_sim.py tournament --format groups --seed 3
  python3 sim/garden_sim.py calibrate --n 10000

Court frame is the walk's three.js world: x along the court (baskets at x = +-12.755), z across (sidelines +-7.62),
y up. The home side attacks +x in the first half and -x after it. Players are MLow's flower headed NEW YORKERS cast,
never real players; the building is THE GARDEN.
"""
import argparse, json, math, os, random, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, "out")
MANIFEST = os.path.join(os.path.dirname(ROOT), "UPGRADE ALL ROOMS 2026-10-28", "rig", "out", "rig_manifest.json")

# ---------------------------------------------------------------- court
HOOP, BASE, SIDE, RIMY, BALL_R, G = 12.755, 14.33, 7.62, 3.048, 0.12, 9.81
RIM_R = 0.2286
HZ_SIM, HZ_OUT = 30, 10

def sigmoid(x): return 1.0 / (1.0 + math.exp(-x))
def logit(p): return math.log(p / (1.0 - p))
def clamp(v, a, b): return a if v < a else b if v > b else v

# ---------------------------------------------------------------- the cast
CAST_FALLBACK = ["actress", "annieh", "bartender", "cabbie", "clerk", "discoking", "editor", "felix", "folksinger", "gown",
                 "hustler", "killer", "lensman", "loretta", "maitre", "oscar", "prince", "robber", "rosemary", "sally",
                 "susan", "tough", "wiseguy", "workgirl", "writer"]
DISPLAY = {"annieh": "ANNIE H", "discoking": "DISCO KING", "maitre": "MAITRE D", "folksinger": "FOLK SINGER",
           "wiseguy": "WISEGUY", "lensman": "LENSMAN"}
NOT_ATHLETES = {"blindwoman"}   # kept in the cast canon, not put on a court
PETALS = ["#ff4fa3", "#2962ff", "#f5f1e6", "#ff7a3d", "#9b6bff", "#e8433a", "#3fd0a0", "#ffd84a", "#22d3ee", "#f7a8c8"]
SKINS = ["#f0cfb4", "#d9a882", "#b97d56", "#8d5a3b", "#6b4129", "#4a2c1b", "#c48c66", "#5e3a24"]

def load_cast():
    ids, heights = list(CAST_FALLBACK), {}
    try:
        m = json.load(open(MANIFEST))
        ids = sorted(k for k in m if not k.startswith("_") and k not in NOT_ATHLETES)
        heights = {k: m[k].get("height_m") for k in ids}
    except Exception:
        pass
    cast = []
    for i, k in enumerate(ids):
        h = sum(ord(c) for c in k)
        cast.append({"id": k, "name": DISPLAY.get(k, k.upper()), "source": f"rig/out/{k}.glb", "flower": PETALS[h % len(PETALS)],
                     "eye": "#2962ff", "source_height": heights.get(k)})
    return cast

# ---------------------------------------------------------------- teams
TEAMS = [
    {"id": "NYK", "name": "NEW YORKERS", "kit": {"jersey": "#E8E5DC", "num": "#173B99", "trim": "#2962FF", "accent": "#12213A", "shorts": "#E8E5DC", "sock": "#E8E5DC", "shoe": "#12213A", "warm": "#173B99"}, "pace": 1.0, "three": 1.05, "q": 2.0},
    {"id": "NSH", "name": "NIGHT SHIFT", "kit": {"jersey": "#151D2C", "num": "#F0EDE5", "trim": "#2962FF", "accent": "#D8B574", "shorts": "#151D2C", "sock": "#151D2C", "shoe": "#F0EDE5", "warm": "#0c111b"}, "pace": 1.12, "three": 1.0, "q": 2.0},
    {"id": "BOD", "name": "BODEGA CATS", "kit": {"jersey": "#1F5A3D", "num": "#F4EBD0", "trim": "#E8433A", "accent": "#F4EBD0", "shorts": "#1F5A3D", "sock": "#F4EBD0", "shoe": "#101410", "warm": "#163f2b"}, "pace": 0.95, "three": 0.95, "q": 0.5},
    {"id": "CAB", "name": "YELLOW CABS", "kit": {"jersey": "#F6C21B", "num": "#121212", "trim": "#121212", "accent": "#FFFFFF", "shorts": "#121212", "sock": "#F6C21B", "shoe": "#121212", "warm": "#121212"}, "pace": 1.18, "three": 1.08, "q": 0.0},
    {"id": "STM", "name": "STEAM PIPES", "kit": {"jersey": "#E25A26", "num": "#FFFFFF", "trim": "#FFFFFF", "accent": "#3A3A3A", "shorts": "#E25A26", "sock": "#FFFFFF", "shoe": "#2b2b2b", "warm": "#3A3A3A"}, "pace": 1.05, "three": 0.9, "q": -0.5},
    {"id": "TWR", "name": "WATER TOWERS", "kit": {"jersey": "#6E4B33", "num": "#F2E6D0", "trim": "#9FB8C8", "accent": "#F2E6D0", "shorts": "#6E4B33", "sock": "#F2E6D0", "shoe": "#2a1d14", "warm": "#4a3222"}, "pace": 0.9, "three": 1.0, "q": -1.0},
    {"id": "CNL", "name": "CANAL STREET", "kit": {"jersey": "#B3122E", "num": "#FFFFFF", "trim": "#FFFFFF", "accent": "#1A1A1A", "shorts": "#B3122E", "sock": "#1A1A1A", "shoe": "#FFFFFF", "warm": "#7a0c1f"}, "pace": 1.08, "three": 1.12, "q": 0.5},
    {"id": "BLK", "name": "BLACKOUT", "kit": {"jersey": "#0B0B0E", "num": "#FFE7A3", "trim": "#FFE7A3", "accent": "#5B5B66", "shorts": "#0B0B0E", "sock": "#0B0B0E", "shoe": "#FFE7A3", "warm": "#0B0B0E"}, "pace": 0.98, "three": 0.98, "q": -1.5},
]
TEAM_BY_ID = {t["id"]: t for t in TEAMS}
ROSTER_SEED = 1126   # rosters are world canon: they do not change with the game seed
ARCH_ORDER = ["G", "G", "W", "W", "C", "G", "W", "C", "G", "W", "C", "G"]
ARCH = {"G": ("guard", 1.85, 1.98, 80, 95, 1.03, 1.08), "W": ("wing", 1.98, 2.08, 92, 108, 1.04, 1.09), "C": ("centre", 2.08, 2.20, 108, 125, 1.04, 1.10)}
RATING_KEYS = ["speed", "accel", "handle", "passing", "rim", "mid", "three", "reb", "int_def", "per_def", "stamina", "composure"]
ARCH_BASE = {
    "G": [77, 77, 75, 71, 61, 63, 67, 42, 40, 65, 74, 65],
    "W": [69, 69, 61, 59, 65, 63, 63, 56, 54, 65, 72, 63],
    "C": [57, 57, 43, 51, 73, 53, 43, 76, 74, 49, 68, 61],
}
NUMBERS = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 41, 42, 44, 45, 50, 55, 77]

def build_league():
    rng = random.Random(ROSTER_SEED)
    cast = load_cast()
    pool = [c["id"] for c in cast] * 4
    rng.shuffle(pool)
    teams = []
    for ti, T in enumerate(TEAMS):
        chosen = []
        for _ in range(12):
            j = next(k for k, cid in enumerate(pool) if cid not in chosen)
            chosen.append(pool.pop(j))
        nums = rng.sample(NUMBERS, 12)
        roster = []
        for slot in range(12):
            a = ARCH_ORDER[slot]; arch, h0, h1, m0, m1, w0, w1 = ARCH[a]
            tier = 4 if slot < 5 else 0 if slot < 8 else -4
            r = {}
            for k, base in zip(RATING_KEYS, ARCH_BASE[a]):
                r[k] = base + T["q"] + tier + rng.gauss(0, 6)
            best = max(RATING_KEYS, key=lambda k: r[k] if k not in ("stamina",) else -1)
            for k in RATING_KEYS:
                cap = 96 if (k == best and rng.random() < 0.3) else 89
                r[k] = int(round(clamp(r[k], 30, cap)))
            r["ft"] = int(round(clamp((r["mid"] + r["three"]) / 2 + (r["composure"] - 65) * 0.3 + 6, 40, 95)))
            h = round(rng.uniform(h0, h1), 2)
            cid = chosen[slot]; c = next(x for x in cast if x["id"] == cid)
            roster.append({"id": f"{T['id']}-{nums[slot]:02d}", "character": cid, "name": c["name"], "number": nums[slot], "archetype": arch,
                           "a": a, "height": h, "mass": round(rng.uniform(m0, m1)), "wingspan": round(h * rng.uniform(w0, w1), 2),
                           "hand": "L" if rng.random() < 0.14 else "R", "ratings": r, "skin": SKINS[rng.randrange(len(SKINS))],
                           "flower": c["flower"], "slot": slot})
        teams.append({**{k: T[k] for k in ("id", "name", "kit", "pace", "three")}, "roster": roster,
                      "starting_five": [p["id"] for p in roster[:5]], "rotation": [p["id"] for p in roster],
                      "tendencies": {"pace": T["pace"], "three_rate": T["three"], "transition": round(0.15 * T["pace"], 3)}})
    return cast, teams

# ---------------------------------------------------------------- rules
RULES = {
    "pro5v5-v1": {"id": "pro5v5-v1", "periods": 4, "period_len": 720, "shot_clock": 24, "reset_short": 14, "ot_len": 300,
                  "foul_out": 6, "bonus": 5, "timeouts": 7, "clock_stops_after_make_last": 120, "five": 5},
    "garden3-v1": {"id": "garden3-v1", "periods": 4, "period_len": 180, "shot_clock": 24, "reset_short": 14, "ot_len": 120,
                   "foul_out": 6, "bonus": 4, "timeouts": 2, "clock_stops_after_make_last": 60, "five": 5},
}

# ---------------------------------------------------------------- the shot model (astra F)
BASE_P = {"rim": 0.66, "short": 0.47, "mid": 0.42, "c3": 0.39, "ab3": 0.35, "heave": 0.04}
ZONE_RATING = {"rim": "rim", "short": None, "mid": "mid", "c3": "three", "ab3": "three", "heave": "three"}
ZONE_DIST = {"rim": 1.0, "short": 3.0, "mid": 5.4, "c3": 6.9, "ab3": 7.7, "heave": 16.0}
CONTEST_MEAN = {"rim": 0.42, "short": 0.36, "mid": 0.30, "c3": 0.30, "ab3": 0.36, "heave": 0.5}
CAL = {"rim": 0.28, "short": 0.50, "mid": 0.66, "c3": 0.52, "ab3": 0.55}   # calibration offsets in log odds, tuned by calibrate
FOUL_P = {"rim": 0.21, "short": 0.10, "mid": 0.05, "c3": 0.016, "ab3": 0.02, "heave": 0.0}
BLOCK_P = {"rim": 0.10, "short": 0.07, "mid": 0.02, "c3": 0.008, "ab3": 0.01, "heave": 0.0}
ZONE_W = {"guard": {"rim": 0.25, "short": 0.11, "mid": 0.13, "c3": 0.08, "ab3": 0.39},
          "wing": {"rim": 0.28, "short": 0.10, "mid": 0.13, "c3": 0.14, "ab3": 0.31},
          "centre": {"rim": 0.56, "short": 0.21, "mid": 0.11, "c3": 0.03, "ab3": 0.09}}
TRANS_W = {"rim": 0.62, "short": 0.05, "mid": 0.03, "c3": 0.08, "ab3": 0.22}

# tactical templates (spots are (u, v): metres out from the attacked baseline, metres across; by role 0 smallest to 4 biggest)
HALF_PLAYS = {
    "HORNS": [[(7.9, 0), (6.0, 5.6), (6.0, -5.6), (4.4, 2.5), (4.4, -2.5)], [(6.4, -3.2), (1.2, 6.6), (6.0, -5.6), (6.6, 1.0), (1.6, -2.0)]],
    "FIVE OUT": [[(7.6, 1.5), (1.1, 6.6), (3.5, -6.6), (6.6, -4.4), (6.6, 4.6)], [(7.6, -1.2), (5.8, 6.0), (1.1, -6.6), (6.9, 3.0), (1.6, 2.2)]],
    "SPAIN": [[(8.2, -0.6), (4.8, 5.8), (1.0, -6.6), (7.0, 0.8), (6.4, -1.0)], [(6.5, 1.6), (1.0, 6.6), (4.5, -6.0), (8.0, -0.6), (1.6, 0.4)]],
    "FLOPPY": [[(8.0, 0), (1.4, 2.4), (1.4, -2.4), (2.4, 4.0), (2.4, -4.0)], [(7.6, 1.8), (5.6, 5.8), (1.2, -6.6), (3.0, 3.0), (2.2, -2.2)]],
    "ZIPPER": [[(7.4, 2.6), (2.6, -6.2), (6.3, -4.6), (3.9, 2.7), (1.3, -1.2)], [(6.8, 4.4), (7.6, -1.0), (1.0, -6.6), (4.4, -2.4), (1.4, 2.0)]],
    "POST UP": [[(7.4, 4.8), (6.0, -5.4), (1.0, -6.6), (6.9, 0.0), (1.8, 2.4)], [(6.2, 6.0), (7.6, -2.0), (1.0, -6.6), (5.0, -3.0), (2.0, 2.2)]],
    "PISTOL": [[(6.5, -3.2), (7.0, 4.0), (1.2, -6.5), (4.4, -2.4), (1.4, 2.0)], [(5.0, -5.6), (8.0, 1.0), (1.2, 6.6), (6.4, -2.0), (1.6, -1.6)]],
    "STACK": [[(7.9, 0), (2.0, 3.0), (2.8, 3.0), (2.0, -3.0), (2.8, -3.0)], [(7.6, 2.0), (6.0, 6.0), (1.0, -6.6), (5.0, -3.0), (1.4, 2.0)]],
    "UCLA": [[(7.8, 1.2), (6.6, 5.6), (1.0, -6.6), (5.8, -3.4), (5.0, 2.4)], [(6.0, 5.6), (7.6, -2.0), (1.0, -6.6), (1.6, 2.4), (5.0, 2.4)]],
    "DOUBLE DRAG": [[(9.0, 0.4), (1.2, 6.6), (1.2, -6.6), (7.8, 2.2), (7.8, -1.8)], [(6.4, -1.0), (1.2, 6.6), (5.0, -6.0), (8.4, 2.0), (1.6, 1.0)]],
    "CORNER": [[(7.8, 0), (1.0, 6.6), (1.0, -6.6), (5.2, 3.4), (5.2, -3.4)], [(7.0, 2.6), (1.0, 6.6), (6.0, -5.4), (5.4, -1.0), (1.4, -2.0)]],
    "IVERSON": [[(8.0, -2.0), (4.6, 4.6), (2.0, -6.4), (5.2, -2.4), (5.2, 2.4)], [(6.6, 5.0), (7.8, -1.4), (1.0, -6.6), (4.8, -2.6), (1.6, 1.8)]],
}
TRANSITION = {
    "THREE LANES": [(7.5, 0), (2.0, 6.6), (2.0, -6.6), (9.5, 2.0), (1.3, 0.8)],
    "DRAG": [(8.5, 1.0), (1.0, 6.6), (5.5, -6.0), (8.0, -1.0), (1.6, -1.6)],
    "EARLY POST": [(7.0, 3.5), (1.2, 6.6), (7.6, -3.0), (9.6, 0.0), (1.8, 2.2)],
    "WING SPRINT": [(7.8, -1.0), (1.0, 6.6), (1.0, -6.6), (10.0, 1.0), (2.4, 2.0)],
    "TRAIL THREE": [(6.5, 4.8), (1.0, 6.6), (2.4, -6.4), (7.8, -0.8), (1.4, 0.0)],
    "RIM RUN": [(8.0, 0.0), (5.6, 6.0), (5.6, -6.0), (9.4, -2.0), (1.0, 0.4)],
}
INBOUNDS = {
    "BOX": [(3.2, 1.6), (3.2, -1.6), (1.4, 2.6), (1.4, -2.6)],
    "STACK": [(1.8, 2.4), (2.6, 2.4), (3.4, 2.4), (4.2, 2.4)],
    "LINE": [(2.4, 0), (3.6, 0), (4.8, 0), (6.0, 0)],
    "SIDE STACK": [(8.0, 0.0), (6.6, 2.4), (5.2, 4.2), (3.0, 1.6)],
}
LATE_CLOCK = {
    "HIGH PNR": [[(8.4, 0), (1.0, 6.6), (1.0, -6.6), (7.6, 1.0), (5.0, 4.6)]],
    "CLEAR OUT": [[(8.0, -2.4), (1.0, 6.6), (5.0, 6.0), (1.4, -6.6), (2.0, 4.0)]],
    "ELBOW ISO": [[(6.0, 2.4), (6.4, -5.4), (1.0, -6.6), (8.6, 0.0), (1.6, 3.0)]],
    "STEP UP": [[(8.6, 3.2), (1.0, -6.6), (5.0, -6.0), (8.4, 1.6), (1.4, -1.0)]],
}

# ---------------------------------------------------------------- the game (event level)
class Game:
    def __init__(self, home, away, seed, rules="pro5v5-v1", league=None):
        self.cast, self.teams = league or build_league()
        self.T = [next(t for t in self.teams if t["id"] == home), next(t for t in self.teams if t["id"] == away)]
        self.P = {p["id"]: p for t in self.T for p in t["roster"]}
        self.R = RULES[rules]; self.seed = seed
        self.rng = random.Random(seed * 7919 + 1)          # gameplay stream
        self.crng = random.Random(seed * 7919 + 2)         # choreography stream (positions inside a sampled zone)
        self.camrng = random.Random(seed * 7919 + 3)       # camera selection stream
        self.events, self.clockline, self.scoreline = [], [], []
        self.tau = 0.0; self.q = 1; self.clock = self.R["period_len"]; self.shot = self.R["shot_clock"]; self.live = False
        self.score = [0, 0]; self.team_fouls = [0, 0]; self.timeouts = [self.R["timeouts"]] * 2; self.run_pts = [0, 0]
        self.lineup = [list(t["starting_five"]) for t in self.T]
        self.fat = {pid: 0.0 for pid in self.P}; self.secs = {pid: 0.0 for pid in self.P}
        self.box = {pid: {k: 0 for k in ("pts", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "ast", "stl", "blk", "tov", "pf", "pm")} for pid in self.P}
        self.stats = {"poss": [0, 0], "zone": {z: [0, 0] for z in BASE_P}, "fta": [0, 0], "tov": [0, 0], "oreb": [0, 0], "dreb": [0, 0]}
        self.pi = 0; self.tip_winner = 0; self.fouled_out = set(); self.final = False

    # --- clocks
    def mark(self):
        self.clockline.append([round(self.tau, 3), self.q, round(self.clock, 3), round(self.shot, 3) if self.shot is not None else -1, 1 if self.live else 0])
    def set_live(self, v):
        if v != self.live: self.live = v; self.mark()
    def set_shot(self, s):
        self.shot = s; self.mark()
    def run(self, dt):
        if dt <= 0: return
        self.set_live(True)
        self.tau += dt; self.clock -= dt
        if self.shot is not None: self.shot = max(0.0, self.shot - dt)
        for t in (0, 1):
            for pid in self.lineup[t]:
                cap = 520 + 6.0 * self.P[pid]["ratings"]["stamina"]
                self.fat[pid] = min(1.0, self.fat[pid] + dt / cap); self.secs[pid] += dt
        on = set(self.lineup[0]) | set(self.lineup[1])
        for pid in self.P:
            if pid not in on: self.fat[pid] = max(0.0, self.fat[pid] - dt / 260)
    def dead(self, dt):
        if dt <= 0: return
        self.set_live(False); self.tau += dt
        on = set(self.lineup[0]) | set(self.lineup[1])
        for pid in self.P:
            if pid not in on: self.fat[pid] = max(0.0, self.fat[pid] - dt / 400)

    def ev(self, type, pbp=True, **kw):
        e = {"id": f"E{len(self.events) + 1:04d}", "t": round(self.tau, 3), "q": self.q, "clock": round(max(0.0, self.clock), 2),
             "shot": round(self.shot, 2) if self.shot is not None else None, "type": type, "score": list(self.score), "pi": self.pi}
        if not pbp: e["pbp"] = False
        e.update(kw); self.events.append(e); return e

    # --- people
    def roles(self, team):
        return sorted(self.lineup[team], key=lambda pid: (self.P[pid]["height"], pid))
    def r(self, pid, k): return self.P[pid]["ratings"][k]
    def defender_of(self, pid, off):
        return self.roles(1 - off)[self.roles(off).index(pid)]
    def usage_pick(self, team, exclude=()):
        c = [p for p in self.lineup[team] if p not in exclude]
        w = [math.exp((max(self.r(p, "rim"), self.r(p, "mid"), self.r(p, "three")) + self.r(p, "handle") * 0.3 - 85) / 9.0) * (1.25 - 0.5 * self.fat[p]) for p in c]
        return self.rng.choices(c, w)[0]
    def reb_pick(self, team):
        c = self.lineup[team]
        w = [math.exp((self.r(p, "reb") - 60) / 9.0) for p in c]
        return self.rng.choices(c, w)[0]

    def subs(self, protect=()):
        """At dead balls: tired players out for the freshest of their kind, starters back once rested."""
        if self.final: return
        for t in (0, 1):
            roster = self.T[t]["roster"]
            bench = [p["id"] for p in roster if p["id"] not in self.lineup[t] and p["id"] not in self.fouled_out]
            for i, pid in enumerate(list(self.lineup[t])):
                if pid in protect: continue
                tired = self.fat[pid] > 0.52 or pid in self.fouled_out
                cand = [b for b in bench if self.fat[b] < (0.22 if not pid in self.fouled_out else 0.9)]
                if not tired:
                    # a rested starter comes back for a reserve who has played a stint
                    slot = self.P[pid]["slot"]
                    if slot >= 5 and self.fat[pid] > 0.3:
                        cand = [b for b in bench if self.P[b]["slot"] < 5 and self.fat[b] < 0.12]
                        if not cand: continue
                    else:
                        continue
                if not cand: continue
                same = [b for b in cand if self.P[b]["a"] == self.P[pid]["a"]] or cand
                inn = min(same, key=lambda b: (self.P[b]["slot"] + self.fat[b] * 12, b))
                self.lineup[t][i] = inn; bench.remove(inn); bench.append(pid)
                self.ev("sub", team=t, out=pid, inn=inn, slot=i)

    def maybe_timeout(self, team_with_ball):
        for t in (0, 1):
            if self.run_pts[1 - t] >= 9 and self.timeouts[t] > 0 and not self.final:
                self.timeouts[t] -= 1; self.run_pts[1 - t] = 0
                self.ev("timeout", team=t); self.dead(6.0); self.subs(); return True
        return False

    def stop_after_make(self):
        return self.q >= self.R["periods"] and self.clock <= self.R["clock_stops_after_make_last"]

    # --- scoring
    def add_pts(self, team, pid, pts, t_score):
        self.score[team] += pts; self.box[pid]["pts"] += pts
        self.run_pts[team] += pts; self.run_pts[1 - team] = 0
        for p in self.lineup[team]: self.box[p]["pm"] += pts
        for p in self.lineup[1 - team]: self.box[p]["pm"] -= pts
        self.scoreline.append([round(t_score, 3), self.score[0], self.score[1]])

    def foul(self, pid, team_of_fouler):
        self.box[pid]["pf"] += 1; self.team_fouls[team_of_fouler] += 1
        if self.box[pid]["pf"] >= self.R["foul_out"]: self.fouled_out.add(pid)

    # --- free throws
    def free_throws(self, off, shooter, n, and_one=False):
        """Returns (next_off, start, info)."""
        self.dead(3.6); self.subs(protect={shooter}) if not and_one else None
        made_last = False
        for k in range(n):
            if k: self.dead(2.6)
            r = self.r(shooter, "ft")
            p = sigmoid(logit(0.815) + 0.022 * (r - 72) - 0.4 * self.fat[shooter] + (0.006 * (self.r(shooter, "composure") - 65) if self.clutch() else 0))
            made = self.rng.random() < p
            self.box[shooter]["fta"] += 1; self.stats["fta"][off] += 1
            e = self.ev("ft", team=off, a=shooter, made=made, k=k + 1, n=n, p=round(p, 3), tr=round(self.tau + 1.0, 3))
            if made:
                self.box[shooter]["ftm"] += 1; self.add_pts(off, shooter, 1, self.tau + 1.0); e["score"] = list(self.score)
            made_last = made
        if made_last:
            self.dead(1.2)
            return 1 - off, "made", {}
        # a live rebound off the last miss
        tc = 1.05; self.dead(tc)
        if self.rng.random() < 0.13:
            rb = self.reb_pick(off); self.box[rb]["oreb"] += 1; self.stats["oreb"][off] += 1
            self.run(0.7); self.set_shot(self.R["reset_short"]); self.ev("rebound", team=off, a=rb, off=True)
            return off, "oreb", {"rebounder": rb}
        rb = self.reb_pick(1 - off); self.box[rb]["dreb"] += 1; self.stats["dreb"][1 - off] += 1
        self.run(0.7); self.ev("rebound", team=1 - off, a=rb, off=False)
        return 1 - off, "dreb", {"rebounder": rb}

    def clutch(self):
        return self.q >= self.R["periods"] and self.clock < 150 and abs(self.score[0] - self.score[1]) <= 6

    # --- one possession
    def possession(self, off, start, info):
        R, rng = self.R, self.rng
        de = 1 - off
        if start not in ("oreb", "cont"): self.stats["poss"][off] += 1
        self.pi += 1
        roles = self.roles(off)
        front = start in ("oreb",) or info.get("front", False)
        # setup and who has it
        if start == "made":
            inb = roles[4] if rng.random() < 0.6 else roles[3]; rec = roles[0]
            dt = rng.uniform(1.4, 2.4)
            self.set_shot(R["shot_clock"])
            if self.stop_after_make(): self.dead(dt)
            else: self.run(dt)
            self.ev("possession", pbp=False, team=off, start=start, front=False)
            self.ev("inbound", team=off, a=inb, b=rec, kind="baseline", play=rng.choice(list(INBOUNDS)))
            handler, elapsed = rec, dt
        elif start in ("side", "base", "period", "cont"):
            self.subs(); self.maybe_timeout(off)
            roles = self.roles(off)
            if start != "period": self.dead(rng.uniform(2.2, 3.2))
            else: self.dead(1.0)
            self.set_shot(info.get("shot", R["shot_clock"]))
            inb = roles[2] if rng.random() < 0.5 else roles[1]; rec = roles[0] if inb != roles[0] else roles[1]
            kind = "baseline" if start == "base" else "side"
            self.ev("possession", pbp=False, team=off, start=start, front=front, spot=info.get("spot"))
            self.ev("inbound", team=off, a=inb, b=rec, kind=kind, play=rng.choice(["SIDE STACK"] if kind == "side" else list(INBOUNDS)),
                    x=info.get("x"))
            handler, elapsed = rec, 0.0
        else:  # dreb, oreb, steal
            handler = info["rebounder"] if start in ("dreb", "oreb") else info["stealer"]
            self.set_shot(R["reset_short"] if start == "oreb" else R["shot_clock"])
            self.ev("possession", pbp=False, team=off, start=start, front=front)
            elapsed = 0.0
        if self.clock <= 0.05: return None
        # tactic
        pace = self.T[off]["pace"]
        p_tr = {"steal": 0.6, "dreb": 0.16 * pace, "made": 0.03 * pace}.get(start, 0.0)
        transition = rng.random() < p_tr
        clock_left, shot_left = self.clock, self.shot
        limit = min(shot_left if self.clock > shot_left else 99, clock_left)
        late_period = clock_left < 26
        if transition:
            play = rng.choice(list(TRANSITION)); kind = "transition"
            npass = rng.choice([0, 0, 1, 1, 2]); gaps = [rng.uniform(0.6, 1.4) for _ in range(npass)]
            adv = 0.0; create = rng.uniform(1.6, 3.4) - sum(gaps) * 0.5
            create = max(0.7, create)
        else:
            late = late_period or shot_left < 12
            if late: play = rng.choice(list(LATE_CLOCK)); kind = "late"
            else: play = rng.choice(list(HALF_PLAYS)); kind = "half"
            adv = 0.0 if front else rng.uniform(5.0, 7.8)
            npass = rng.choice([0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5]) if not late else rng.choice([0, 1, 1, 2])
            gaps = [rng.uniform(1.3, 3.2) for _ in range(npass)]
            create = rng.uniform(0.8, 2.2)
        plan = adv + sum(gaps) + create
        forced = False
        # end of period: hold for the last shot when it is close
        if late_period and clock_left < shot_left + 1:
            want = clock_left - rng.uniform(0.6, 2.6)
            if want > 1.2:
                scale = want / plan if plan > 0 else 1
                adv *= scale; gaps = [g * scale for g in gaps]; create *= scale; plan = want
        if plan > limit - 0.25:
            if limit < 1.0:
                # no time for a set: a heave when it is the period clock, else the shot clock beats them
                if limit == clock_left and limit >= 0.45:
                    adv, gaps, create, npass, plan = 0.0, [], max(0.2, limit - 0.25), 0, max(0.2, limit - 0.25); forced = "heave"
                elif limit == clock_left:
                    self.run(limit); return None
                else:
                    self.run(limit); self.box[handler]["tov"] += 1; self.stats["tov"][off] += 1
                    self.ev("turnover", team=off, a=handler, kind="shot clock")
                    return de, "base", {}
            else:
                want = limit - rng.uniform(0.3, min(1.6, limit * 0.4))
                if limit == shot_left and rng.random() < 0.035:
                    self.run(limit); self.box[handler]["tov"] += 1; self.stats["tov"][off] += 1
                    self.ev("turnover", team=off, a=handler, kind="shot clock")
                    return de, "base", {}
                scale = want / plan
                adv *= scale; gaps = [g * scale for g in gaps]; create *= scale; plan = want; forced = True
        self.ev("play", pbp=False, team=off, name=play, kind=kind, adv=round(adv, 2), t_shot=round(self.tau + plan, 3))
        # late game: the trailing side fouls on purpose
        margin = self.score[off] - self.score[de]      # the trailing defence fouls on purpose
        if self.q >= R["periods"] and clock_left < 45 and 1 <= margin <= 8 and rng.random() < 0.8 and plan > 2.5:
            tf = rng.uniform(1.4, 3.2); self.run(tf)
            fouler = self.defender_of(handler, off); self.foul(fouler, de)
            self.ev("foul", team=de, a=fouler, b=handler, kind="take", shooting=False)
            return self.free_throws(off, handler, 2)
        # turnovers and non shooting fouls interrupt the plan
        hd = (self.r(handler, "handle") + self.r(handler, "passing")) / 2
        dd = sum(self.r(p, "per_def") for p in self.lineup[de]) / 5
        p_to = 0.106 + (dd - 64) * 0.003 - (hd - 66) * 0.002 + (0.04 if transition else 0) + (0.03 if forced else 0)
        p_f = 0.062
        cut = None
        x = rng.random()
        if x < p_to: cut = ("to", rng.uniform(0.25, 0.97) * plan)
        elif x < p_to + p_f: cut = ("foul", rng.uniform(0.2, 0.97) * plan)
        # play it out: advance, passes, then the shot
        t_next = adv; cur = handler
        shooter = self.usage_pick(off) if npass else handler
        chain = []
        for k in range(npass):
            if k == npass - 1: to = shooter
            else: to = rng.choice([p for p in self.lineup[off] if p != cur and p != shooter] or [p for p in self.lineup[off] if p != cur])
            if to == cur: continue
            t_next += gaps[k]; chain.append((cur, to, t_next)); cur = to
        if cur != shooter: shooter = cur
        t0 = self.tau; done = 0.0
        if adv > 0:
            self.ev("advance", pbp=False, team=off, a=handler, until=round(t0 + adv, 3))
        last_passer, last_pass_t = None, -9
        for (a, b, tp) in chain:
            if cut and cut[1] < tp:
                break
            self.run(tp - done); done = tp
            # a pass that gets picked off
            self.ev("pass", pbp=False, team=off, a=a, b=b)
            last_passer, last_pass_t = a, self.tau
            handler = b
        if cut:
            self.run(max(0.0, cut[1] - done))
            if self.clock <= 0: return None
            if cut[0] == "to":
                k = rng.random()
                self.box[handler]["tov"] += 1; self.stats["tov"][off] += 1
                if k < 0.55:
                    st = self.defender_of(handler, off); self.box[st]["stl"] += 1
                    self.ev("turnover", team=off, a=handler, kind="steal", b=st)
                    self.run(0.35)
                    return de, "steal", {"stealer": st}
                kind = "bad pass" if k < 0.8 else "offensive foul" if k < 0.9 else "travel"
                e = self.ev("turnover", team=off, a=handler, kind=kind)
                if kind == "offensive foul": self.foul(handler, off); e["foul"] = True
                return de, "side", {"x": None}
            else:
                fouler = self.defender_of(handler, off); self.foul(fouler, de)
                self.ev("foul", team=de, a=fouler, b=handler, kind="personal", shooting=False)
                if self.team_fouls[de] >= R["bonus"]:
                    return self.free_throws(off, handler, 2)
                return off, "cont", {"shot": max(R["reset_short"], self.shot), "front": True}
        self.run(max(0.0, plan - done))
        if self.clock < -0.01: return None
        return self.shoot(off, shooter, transition, forced, last_passer if self.tau - last_pass_t < 2.6 else None, create)

    def shoot(self, off, shooter, transition, forced, passer, create):
        rng, de = self.rng, 1 - self.rng.random() * 0 - off
        de = 1 - off
        a = self.P[shooter]["archetype"]
        if forced == "heave": zone = "heave"
        else:
            w = dict(TRANS_W if transition else ZONE_W[a])
            for z in ("c3", "ab3"): w[z] *= self.T[off]["three"] * (1 + (self.r(shooter, "three") - 62) * 0.02)
            for z in ("rim", "short"): w[z] *= 1 + (self.r(shooter, "rim") - 64) * 0.012
            w["mid"] *= 1 + (self.r(shooter, "mid") - 62) * 0.015
            zone = rng.choices(list(w), [max(0.005, v) for v in w.values()])[0]
        defender = self.defender_of(shooter, off)
        dkey = "int_def" if zone in ("rim", "short") else "per_def"
        cm = CONTEST_MEAN[zone] + (self.r(defender, dkey) - 62) * 0.006 + (0.18 if forced else 0) - (0.2 if transition else 0)
        catch = passer is not None and create < 1.0 and zone in ("mid", "c3", "ab3")
        if catch: cm -= 0.08
        contest = clamp(rng.gauss(cm, 0.2), 0.0, 1.0)
        rk = ZONE_RATING[zone]
        rating = (self.r(shooter, "rim") + self.r(shooter, "mid")) / 2 if rk is None else self.r(shooter, rk)
        dunk = zone == "rim" and rng.random() < clamp(0.08 + (self.r(shooter, "rim") - 60) * 0.008 + (0.3 if self.P[shooter]["a"] == "C" else 0.08 if self.P[shooter]["a"] == "W" else -0.04) + (0.25 if transition else 0) - contest * 0.25, 0.0, 0.85)
        offbal = forced is True or (zone in ("short", "mid") and rng.random() < 0.15)
        lo = logit(BASE_P[zone]) + 0.018 * (rating - 70) - 1.1 * contest - 0.6 * self.fat[shooter] + (0.12 if catch and contest < 0.45 else 0) - (0.25 if offbal else 0) + CAL.get(zone, 0.0)
        if dunk: lo += 1.1
        if self.clutch(): lo += 0.008 * (self.r(shooter, "composure") - 65)
        p = sigmoid(lo)
        fouled = rng.random() < FOUL_P[zone] * (0.7 + 0.6 * contest)
        made = rng.random() < (p * 0.38 if fouled else p)
        three = zone in ("c3", "ab3", "heave"); pts = 3 if three else 2
        blk = None
        if not made and not fouled and rng.random() < BLOCK_P[zone] * ((self.r(defender, "int_def") / 70) ** 2) * (0.5 + contest):
            blk = defender
        T_s = 0.55 + 0.075 * ZONE_DIST[zone] if not dunk else 0.15
        counts = made or not fouled          # a missed shot that drew a foul is not a field goal attempt
        if counts:
            self.box[shooter]["fga"] += 1; self.stats["zone"][zone][1] += 1
            if three: self.box[shooter]["tpa"] += 1
        assist = passer if made and passer and passer != shooter and rng.random() < (0.9 if catch else 0.62) else None
        kind = "dunk" if dunk else "layup" if zone == "rim" else "jumper"
        e = self.ev("shot", team=off, a=shooter, zone=zone, made=made, pts=pts if made else 0, three=three, contest=round(contest, 2), p=round(p, 3),
                    kind=kind, d=defender, fouled=fouled, blocked=blk, assist=assist, transition=transition, forced=bool(forced), tr=round(self.tau + T_s, 3))
        if made:
            self.box[shooter]["fgm"] += 1; self.stats["zone"][zone][0] += 1
            if three: self.box[shooter]["tpm"] += 1
            if assist: self.box[assist]["ast"] += 1
            self.add_pts(off, shooter, pts, self.tau + T_s); e["score"] = list(self.score)
        if fouled:
            self.foul(defender, de)
            self.ev("foul", team=de, a=defender, b=shooter, kind="shooting", shooting=True)
            return self.free_throws(off, shooter, 1 if made else (3 if three else 2), and_one=made)
        if made:
            self.run(min(T_s + 0.3, max(0.0, self.clock)))
            return de, "made", {}
        if blk:
            self.box[blk]["blk"] += 1
            self.ev("block", team=de, a=blk, b=shooter)
        # rebound
        tr = T_s + rng.uniform(0.55, 1.15)
        if self.clock <= tr:
            self.run(max(0.0, self.clock)); return None
        self.run(tr)
        if blk and rng.random() < 0.3:
            self.ev("out", pbp=False, team=off)
            return off, "side", {"shot": max(1.0, self.shot), "front": True}
        oreb_p = 0.235 * (sum(self.r(p, "reb") for p in self.lineup[off]) / max(1, sum(self.r(p, "reb") for p in self.lineup[de]))) ** 1.5
        if zone in ("c3", "ab3"): oreb_p *= 0.95
        if rng.random() < oreb_p:
            rb = self.reb_pick(off); self.box[rb]["oreb"] += 1; self.stats["oreb"][off] += 1
            self.ev("rebound", team=off, a=rb, off=True)
            return off, "oreb", {"rebounder": rb}
        rb = self.reb_pick(de); self.box[rb]["dreb"] += 1; self.stats["dreb"][de] += 1
        self.ev("rebound", team=de, a=rb, off=False)
        return de, "dreb", {"rebounder": rb}

    # --- periods
    def jump_ball(self):
        c = [self.roles(0)[4], self.roles(1)[4]]
        p = sigmoid((self.P[c[0]]["height"] - self.P[c[1]]["height"]) * 8 + (self.r(c[0], "reb") - self.r(c[1], "reb")) * 0.03)
        w = 0 if self.rng.random() < p else 1
        rec = self.roles(w)[0]
        self.set_shot(self.R["shot_clock"])
        self.ev("jump", team=w, a=c[0], b=c[1], winner=c[w], receiver=rec)
        self.dead(0.9); self.run(0.6)
        return w, "steal", {"stealer": rec}

    def play(self):
        R = self.R
        self.mark()
        self.ev("period_start", q=1)
        nxt = self.jump_ball(); self.tip_winner = nxt[0]
        while True:
            while self.clock > 0.05:
                res = self.possession(*nxt)
                if res is None: break
                nxt = res
            self.clock = 0.0; self.set_live(False)
            self.ev("period_end", q=self.q)
            if self.q >= R["periods"] and self.score[0] != self.score[1]:
                break
            self.dead(6.0)
            self.q += 1; self.team_fouls = [0, 0]
            self.clock = R["period_len"] if self.q <= R["periods"] else R["ot_len"]
            self.subs()
            self.set_shot(R["shot_clock"])
            self.ev("period_start", q=self.q)
            if self.q > R["periods"]:
                nxt = self.jump_ball()
            else:
                t = self.tip_winner if self.q == 4 else 1 - self.tip_winner
                nxt = (t, "period", {"shot": R["shot_clock"]})
        self.final = True
        self.ev("game_end", winner=0 if self.score[0] > self.score[1] else 1)
        self.mark()
        for pid in self.P: self.box[pid]["min"] = round(self.secs[pid] / 60, 1)
        return self

# ---------------------------------------------------------------- choreography
def tdir(team, q): return (1 if team == 0 else -1) * (1 if q <= 2 else -1)

class Choreo:
    """Turns the event list into positions for ten players and three referees and a ball timeline."""
    def __init__(self, g):
        self.g = g; self.rng = g.crng
        self.n = 13
        self.px = [0.0] * 13; self.pz = [0.0] * 13; self.vx = [0.0] * 13; self.vz = [0.0] * 13; self.yaw = [0.0] * 13
        self.tx = [0.0] * 13; self.tz = [0.0] * 13; self.maxsp = [6.5] * 13
        self.acts = [[] for _ in range(13)]; self.base_act = ["run"] * 13; self.one = [None] * 13
        self.over = {}       # actor -> (t0, t1, x, z)
        self.lineup = [list(x) for x in g.T and [g.T[0]["starting_five"], g.T[1]["starting_five"]]]
        self.segs = []       # finished ball segments
        self.bq = []         # queued ball segments [t0, t1, kind, data]
        self.ctx = {"mode": "tip", "off": 0, "dir": 1, "play": None, "fi": 0, "handler": None, "q": 1}
        self.frames = []
        self.need = []       # [t, actor] the ball must be in this actor's hands by t (inbounds, free throws)

    # actors
    def slot_actor(self, pid):
        for t in (0, 1):
            if pid in self.lineup[t]: return t * 5 + self.lineup[t].index(pid)
        return None
    def pid(self, a): return self.lineup[a // 5][a % 5] if a < 10 else None
    def scale(self, a):
        p = self.pid(a); return (self.g.P[p]["height"] / 1.95) if p else 0.94
    def roles(self, team):
        return sorted(range(team * 5, team * 5 + 5), key=lambda a: (self.g.P[self.pid(a)]["height"], self.pid(a)))
    def hand(self, a, y=1.3):
        s = self.scale(a)
        return [self.px[a] + math.sin(self.yaw[a]) * 0.35 * s, y * s, self.pz[a] + math.cos(self.yaw[a]) * 0.35 * s]

    def set_act(self, a, t, act, dur=None):
        self.acts[a].append([round(t, 2), act])
        if dur: self.one[a] = t + dur
    def set_base(self, a, t, act):
        if self.base_act[a] != act:
            self.base_act[a] = act
            if self.one[a] is None: self.acts[a].append([round(t, 2), act])

    # ball
    def cut(self, t):
        keep = []
        for s in self.bq:
            if s[0] >= t: continue
            if s[1] > t: s[1] = t
            keep.append(s)
        self.segs.extend(keep); self.bq = []
    def flush(self, t):
        while self.bq and self.bq[0][1] <= t:
            self.segs.append(self.bq.pop(0))
    def ball_at(self, t):
        for s in self.bq:
            if s[0] <= t <= s[1]: return self.eval_seg(s, t)
        if self.bq: return self.eval_seg(self.bq[-1], self.bq[-1][1])
        if self.segs: return self.eval_seg(self.segs[-1], min(t, self.segs[-1][1]))
        return [0.0, 1.0, 0.0]
    def eval_seg(self, s, t):
        k, d = s[2], s[3]
        if k == "f":
            u = t - s[0]; p, v = d["p"], d["v"]
            return [p[0] + v[0] * u, p[1] + v[1] * u - 0.5 * G * u * u, p[2] + v[2] * u]
        if k == "r":
            u = 0 if s[1] <= s[0] else clamp((t - s[0]) / (s[1] - s[0]), 0, 1); e = 1 - (1 - u) ** 2
            return [d["p"][i] + (d["q"][i] - d["p"][i]) * e for i in range(3)]
        return self.hand(d["a"])
    def holder(self, t):
        for s in self.bq:
            if s[0] <= t < s[1] and s[2] == "h": return s[3]["a"]
        return None
    def hold(self, t, a, style="dribble"):
        self.bq.append([t, 1e9, "h", {"a": a, "s": style}])
    def fly(self, t, p0, p1, T):
        T = max(0.06, T)
        v = [(p1[0] - p0[0]) / T, (p1[1] - p0[1] + 0.5 * G * T * T) / T, (p1[2] - p0[2]) / T]
        self.bq.append([t, t + T, "f", {"p": [round(x, 3) for x in p0], "v": [round(x, 3) for x in v]}])
        return t + T, v
    def bounces(self, t, p, v):
        """From a floor contact at p with velocity v: decaying bounces, a roll, then rest."""
        vx, vy, vz = v[0] * 0.85, abs(v[1]) * 0.7, v[2] * 0.85
        p = list(p)
        for _ in range(6):
            if vy < 0.9: break
            T = 2 * vy / G
            q = [clamp(p[0] + vx * T, -BASE - 2.4, BASE + 2.4), BALL_R, clamp(p[2] + vz * T, -SIDE - 2.4, SIDE + 2.4)]
            t, _ = self.fly(t, p, q, T); p = q; vy *= 0.7; vx *= 0.85; vz *= 0.85
        sp = math.hypot(vx, vz)
        if sp > 0.05:
            d = sp * sp / 2.4; T = sp / 1.2
            q = [clamp(p[0] + vx / sp * d, -BASE - 2.4, BASE + 2.4), BALL_R, clamp(p[2] + vz / sp * d, -SIDE - 2.4, SIDE + 2.4)]
            self.bq.append([t, t + T, "r", {"p": p, "q": q}]); t += T; p = q
        self.bq.append([t, 1e9, "r", {"p": p, "q": p}])

    def rim(self, d): return [d * HOOP, RIMY, 0.0]

    # spots
    def spot(self, uv, d, mirror=1):
        u, v = uv
        return d * (BASE - u), v * mirror * d
    def zone_spot(self, zone, d, near):
        """A concrete floor spot in a shot zone, the one nearest where the shooter already is, jittered."""
        rng = self.rng; rx = d * HOOP
        nx, nz = near
        ang0 = math.atan2(nz, (rx - nx) * d)   # angle across, 0 straight on
        if zone == "rim":
            a = clamp(ang0, -1.1, 1.1) + rng.uniform(-0.3, 0.3); r = rng.uniform(0.7, 1.2)
        elif zone == "short":
            a = clamp(ang0, -0.9, 0.9) + rng.uniform(-0.3, 0.3); r = rng.uniform(1.8, 3.6)
        elif zone == "mid":
            a = clamp(ang0, -1.2, 1.2) + rng.uniform(-0.25, 0.25); r = rng.uniform(4.4, 6.4)
        elif zone == "c3":
            side = 1 if nz >= 0 else -1
            return rx - d * rng.uniform(0.0, 1.9), side * rng.uniform(6.85, 7.15)
        elif zone == "heave":
            return -d * rng.uniform(0.0, 3.0), rng.uniform(-3, 3)
        else:
            a = clamp(ang0, -1.05, 1.05) + rng.uniform(-0.2, 0.2); r = rng.uniform(7.45, 8.4)
        return rx - d * r * math.cos(a), r * math.sin(a)

    # the moves
    def apply(self, e):
        g, t = self.g, e["t"]; ty = e["type"]
        A = lambda pid: self.slot_actor(pid)
        if ty == "sub":
            self.lineup[e["team"]][e["slot"]] = e["inn"]; return
        if ty in ("period_start",):
            self.ctx.update(q=e["q"]);
            if e["q"] == 1 or e["q"] > g.R["periods"]: self.ctx.update(mode="tip")
            return
        if ty == "jump":
            self.ctx.update(mode="tip", off=e["team"], dir=tdir(e["team"], e["q"]))
            a0, a1 = A(e["a"]), A(e["b"]); w = A(e["winner"]); rec = A(e["receiver"])
            self.cut(t)
            p0 = [0.0, 1.9, 0.0]; self.bq.append([t - 0.01, t, "r", {"p": p0, "q": p0}])
            t1, _ = self.fly(t, p0, [0.0, 3.55, 0.0], 0.55)
            for a in (a0, a1): self.set_act(a, t + 0.2, "jump", 0.95)
            self.fly(t1, [0.0, 3.55, 0.0], self.hand(rec), 0.7); self.hold(t1 + 0.7, rec)
            return
        if ty == "possession":
            off = e["team"]; d = tdir(off, e["q"])
            self.ctx.update(off=off, dir=d, start=e["start"], fi=0, mirror=self.rng.choice([1, -1]))
            self.ctx["mode"] = "dead" if e["start"] in ("side", "base", "period", "cont", "made") else "live"
            self.ctx["roles"] = [self.roles(0), self.roles(1)]
            self.plan_possession(e)
            return
        if ty == "inbound":
            off = e["team"]; d = self.ctx["dir"]; inb, rec = A(e["a"]), A(e["b"])
            self.ctx["handler"] = rec
            kind = e.get("kind", "baseline")
            self.cut(t)
            if self.holder(t) is None and self.holder(t - 0.01) != inb:
                pass
            self.fly(t, self.hand(inb), self.pred_hand(rec, 0.5), 0.5); self.hold(t + 0.5, rec)
            self.set_act(inb, t - 0.1, "pass", 0.35)
            self.ctx["mode"] = "live"; self.ctx["phase_t"] = t + 0.5
            return
        if ty == "play":
            self.ctx.update(play=e["name"], pkind=e["kind"], adv_until=t + e.get("adv", 0), fi=0)
            return
        if ty == "pass":
            a, b = A(e["a"]), A(e["b"])
            T = clamp(math.hypot(self.px[a] - self.px[b], self.pz[a] - self.pz[b]) / 11.0, 0.22, 1.1)
            self.cut(t)
            dest = self.pred_hand(b, T)
            self.fly(t, self.hand(a), dest, T); self.hold(t + T, b)
            if b not in self.over or self.over[b][4] < 2 or self.over[b][1] < t: self.over[b] = (t, t + T, dest[0], dest[2], 1)
            self.set_act(a, t - 0.1, "pass", 0.35)
            self.ctx["fi"] += 1; self.ctx["handler"] = b
            return
        if ty == "turnover":
            a = A(e["a"]); self.ctx["mode"] = "dead" if e["kind"] != "steal" else "live"
            if e["kind"] == "steal":
                b = A(e["b"]); self.cut(t)
                self.fly(t, self.hand(a), self.pred_hand(b, 0.3), 0.3); self.hold(t + 0.3, b)
                self.set_act(b, t - 0.15, "pass", 0.35); self.ctx["handler"] = b
            elif e["kind"] == "bad pass":
                self.cut(t); d = self.ctx["dir"]
                side = 1 if self.pz[a] >= 0 else -1
                p1 = [clamp(self.px[a] + d * 3, -BASE, BASE), BALL_R, side * (SIDE + 1.6)]
                t1, v = self.fly(t, self.hand(a), p1, 0.75); self.bounces(t1, p1, [v[0], v[1] - G * 0.75, v[2]])
                self.set_act(a, t - 0.1, "pass", 0.35)
            elif e["kind"] == "shot clock":
                pass
            self.whistle(t)
            return
        if ty == "foul":
            self.ctx["mode"] = "dead"; self.whistle(t)
            return
        if ty == "shot":
            self.do_shot(e); return
        if ty == "block":
            return
        if ty == "rebound":
            self.do_rebound(e); return
        if ty == "ft":
            self.do_ft(e); return
        if ty == "out":
            self.ctx["mode"] = "dead"; self.whistle(t); return
        if ty in ("timeout", "period_end"):
            self.ctx["mode"] = "break"; self.ctx["break_t"] = t
            if ty == "period_end": self.cut(t + 0.4) if False else None
            return
        if ty == "game_end":
            self.ctx["mode"] = "break"; return

    def whistle(self, t):
        for r in (10, 11, 12): self.set_act(r, t, "signal", 1.4)

    def pred_hand(self, a, T):
        s = self.scale(a)
        x = self.px[a] + self.vx[a] * T * 0.6; z = self.pz[a] + self.vz[a] * T * 0.6
        return [x + math.sin(self.yaw[a]) * 0.35 * s, 1.3 * s, z + math.cos(self.yaw[a]) * 0.35 * s]

    def plan_possession(self, e):
        """Look ahead inside the possession for the shot, the free throws and the inbound so the right people go to the right spots."""
        g = self.g; pi = e["pi"]; d = self.ctx["dir"]; off = e["team"]
        evs = [x for x in g.events if x["pi"] == pi]
        self.ctx["shotev"] = None; self.ctx["ftev"] = None; self.ctx["inb"] = None
        for x in evs:
            if x["type"] == "shot": self.ctx["shotev"] = x
            if x["type"] == "ft" and self.ctx["ftev"] is None: self.ctx["ftev"] = x
            if x["type"] == "inbound":
                a = self.slot_actor(x["a"])
                if x["kind"] == "baseline": ix, iz = -d * (BASE + 0.55) if e["start"] == "made" else d * (BASE + 0.55), self.rng.choice([-1.4, 1.4])
                else:
                    ix = x.get("x") if x.get("x") is not None else (0.0 if e["start"] == "period" else d * self.rng.uniform(3.0, 8.5))
                    iz = SIDE + 0.5
                self.ctx["inb"] = (a, ix, iz, x["t"]); self.need.append([x["t"], a])
        sh = self.ctx["shotev"]
        self.ctx["pend"] = None
        if sh:
            lead = 1.5 if sh["kind"] in ("dunk", "layup") else 3.0
            self.ctx["pend"] = (sh, sh["t"] - lead)   # the spot is chosen when he starts for it, from where he is then
            self.ctx["spot"] = (self.slot_actor(sh["a"]), 0, 0)

    def resolve_spot(self, t):
        pend = self.ctx.get("pend")
        if not pend or t < pend[1]: return
        sh, t0 = pend; self.ctx["pend"] = None; d = self.ctx["dir"]
        a = self.slot_actor(sh["a"])
        if a is None: return
        sx, sz = self.zone_spot(sh["zone"], d, (self.px[a], self.pz[a]))
        # keep it reachable in the time left
        reach = max(0.5, (sh["t"] - t) * self.maxsp[a] * 0.75); dx, dz = sx - self.px[a], sz - self.pz[a]; L = math.hypot(dx, dz)
        if L > reach and sh["zone"] not in ("c3",): sx, sz = self.px[a] + dx / L * reach, self.pz[a] + dz / L * reach
        self.over[a] = (t, sh["t"] + 0.25, sx, sz, 2)
        dfn = self.slot_actor(sh["d"]) if sh.get("d") in sum(self.lineup, []) else None
        if dfn is not None:
            rx = d * HOOP; dx, dz = rx - sx, -sz; L = math.hypot(dx, dz) or 1
            dc = 0.55 + (1 - sh["contest"]) * 2.3
            self.over[dfn] = (max(t, sh["t"] - 1.0), sh["t"] + 0.35, sx + dx / L * dc, sz + dz / L * dc, 2)
        self.ctx["spot"] = (a, sx, sz)

    def do_shot(self, e):
        g, t = self.g, e["t"]; a = self.slot_actor(e["a"]); d = self.ctx["dir"]
        rim = self.rim(d); s = self.scale(a)
        kind = e["kind"]
        self.cut(t - 0.45); self.hold(t - 0.45, a, "shoot")
        self.cut(t)
        if kind == "dunk":
            self.set_act(a, t - 0.45, "dunk", 1.3)
            p0 = [rim[0] - d * 0.25, RIMY + 0.32, rim[2] * 0.5]
            T = 0.16
        elif kind == "layup":
            self.set_act(a, t - 0.45, "layup", 1.15)
            p0 = self.hand(a, 2.55 / s * s / s if False else 2.75)
            p0[1] = 2.75 * s
            T = 0.62
        else:
            self.set_act(a, t - 0.5, "shoot", 1.3)
            p0 = self.hand(a, 2.6)
            dist = math.hypot(p0[0] - rim[0], p0[2] - rim[2])
            T = 0.55 + 0.075 * dist
        if e.get("d"):
            dfn = self.slot_actor(e["d"])
            if dfn is not None and (e["contest"] > 0.55 or e.get("blocked")): self.set_act(dfn, t - 0.25, "contest", 0.9)
        self.ctx["mode"] = "shot"; self.ctx["shot_t"] = t
        if e.get("blocked"):
            b = self.slot_actor(e["blocked"])
            if b is not None: self.set_act(b, t - 0.3, "jump", 0.95)
            p1 = [p0[0] + (rim[0] - p0[0]) * 0.18, p0[1] + 0.35, p0[2] + (rim[2] - p0[2]) * 0.18]
            t1, _ = self.fly(t, p0, p1, 0.14)
            self.ctx["miss"] = (t1, p1); self.fall(t1, p1, d, 3.0)
            return
        if e["made"]:
            p1 = [rim[0] - d * 0.02, RIMY + 0.02, rim[2]]
            t1, v = self.fly(t, p0, p1, T)
            p2 = [rim[0] - d * 0.12, 2.55, rim[2] + 0.02]
            t2, _ = self.fly(t1, p1, p2, 0.2)
            p3 = [rim[0] - d * 0.55, BALL_R, rim[2] + self.rng.uniform(-0.4, 0.4)]
            Tf = 0.5; t3, v3 = self.fly(t2, p2, p3, Tf)
            self.bounces(t3, p3, [v3[0] * 0.6, v3[1] - G * Tf, v3[2] * 0.6])
            self.ctx["mode"] = "dead" if True else "live"
            self.ctx["made_t"] = t1
        else:
            ang = math.atan2(p0[2] - rim[2], p0[0] - rim[0]); front = self.rng.random() < 0.55
            r = RIM_R + BALL_R * 0.4
            if not front: ang += math.pi
            ang += self.rng.uniform(-0.6, 0.6)
            p1 = [rim[0] + math.cos(ang) * r, RIMY + 0.1, rim[2] + math.sin(ang) * r]
            t1, _ = self.fly(t, p0, p1, T)
            self.ctx["miss"] = (t1, p1); self.fall(t1, p1, d, 1.8)

    def fall(self, t, p, d, dist):
        """A loose ball off the rim or a block: down to the floor and bouncing, until a rebound cuts it off."""
        a = self.rng.uniform(-1.2, 1.2); q = [clamp(p[0] - d * math.cos(a) * dist, -BASE + 0.3, BASE - 0.3), BALL_R, clamp(p[2] + math.sin(a) * dist, -SIDE + 0.3, SIDE + 0.3)]
        T = 0.75; t1, v = self.fly(t, p, q, T); self.bounces(t1, q, [v[0], v[1] - G * T, v[2]])

    def do_rebound(self, e):
        t = e["t"]; a = self.slot_actor(e["a"])
        self.cut(t)
        tc, C = self.ctx.get("miss") or (t - 1.0, self.ball_at(t - 1.0))
        tc = min(tc, t - 0.25)
        C = self.ball_at(tc)
        self.cut(tc)
        # the catch point: from the rim out toward where he is, inside what he can reach
        rx, rz = C[0], C[2]; dx, dz = self.px[a] - rx, self.pz[a] - rz; L = math.hypot(dx, dz) or 1
        T = t - tc; reach = max(1.0, L - self.maxsp[a] * T * 0.55)
        dist = clamp(reach, 0.9, 5.5)
        P = [rx + dx / L * dist, 2.45 * self.scale(a), rz + dz / L * dist]
        if T > 1.05:
            B = [rx + dx / L * dist * 0.65, BALL_R, rz + dz / L * dist * 0.65]
            t1, _ = self.fly(tc, C, B, T - 0.42); self.fly(t1, B, P, 0.42)
        else:
            self.fly(tc, C, P, T)
        self.hold(t, a, "hold")
        self.over[a] = (tc, t, P[0], P[2], 3)
        self.set_act(a, t - 0.42, "jump", 0.95)
        self.ctx["handler"] = a; self.ctx["mode"] = "live"; self.ctx["miss"] = None

    def do_ft(self, e):
        t = e["t"]; a = self.slot_actor(e["a"]); d = self.ctx["dir"] if self.ctx.get("off") == e["team"] else tdir(e["team"], e["q"])
        self.ctx["dir"] = d; self.ctx["off"] = e["team"]
        self.ctx["mode"] = "ft"; self.ctx["ft_shooter"] = a
        rim = self.rim(d)
        self.cut(t - 0.5)
        if self.holder(t - 0.6) != a:
            pass
        self.hold(t - 0.5, a, "shoot"); self.cut(t)
        self.set_act(a, t - 0.5, "ftshoot", 1.2)
        p0 = self.hand(a, 2.25)
        T = 0.95
        if e["made"]:
            p1 = [rim[0] - d * 0.02, RIMY + 0.02, 0.0]; t1, _ = self.fly(t, p0, p1, T)
            p2 = [rim[0] - d * 0.12, 2.55, 0.02]; t2, _ = self.fly(t1, p1, p2, 0.2)
            p3 = [rim[0] - d * 0.5, BALL_R, self.rng.uniform(-0.3, 0.3)]; t3, v3 = self.fly(t2, p2, p3, 0.5)
            self.bounces(t3, p3, [v3[0] * 0.6, v3[1] - G * 0.5, v3[2] * 0.6])
        else:
            ang = math.pi * (0 if d > 0 else 1) + self.rng.uniform(-0.7, 0.7) + (math.pi if self.rng.random() < 0.5 else 0)
            p1 = [rim[0] + math.cos(ang) * (RIM_R + 0.05), RIMY + 0.1, math.sin(ang) * (RIM_R + 0.05)]
            t1, _ = self.fly(t, p0, p1, T); self.ctx["miss"] = (t1, p1)
            if e["k"] < e["n"]:
                p2 = [rim[0] - d * 1.2, BALL_R, self.rng.uniform(-1, 1)]; t2, v2 = self.fly(t1, p1, p2, 0.6)
                self.bounces(t2, p2, [v2[0] * 0.5, v2[1] - G * 0.6, v2[2] * 0.5])
        if e["k"] < e["n"]: self.need.append([t + 2.5, a])

    # targets each step
    def targets(self, t):
        self.resolve_spot(t)
        c = self.ctx; d = c.get("dir", 1); off = c.get("off", 0); de = 1 - off
        mode = c["mode"]
        roles = [self.roles(0), self.roles(1)]
        O, D = roles[off], roles[de]
        mir = c.get("mirror", 1)
        H = c.get("handler")
        for a in range(10): self.maxsp[a] = 4.0 + self.g.P[self.pid(a)]["ratings"]["speed"] * 0.04
        if mode == "tip":
            for i, a in enumerate(roles[0]): self.put(a, *self.tip_spot(0, i))
            for i, a in enumerate(roles[1]): self.put(a, *self.tip_spot(1, i))
        elif mode in ("break",):
            bt = c.get("break_t", t)
            for tm in (0, 1):
                for i, a in enumerate(roles[tm]):
                    bx = (-1 if tm == 0 else 1) * (4.5 + i * 0.9)
                    self.put(a, bx, -6.6 + (i % 2) * 0.6); self.maxsp[a] = 2.2
        elif mode == "ft":
            sh = c.get("ft_shooter")
            lanes = [(2.1, 2.75), (2.1, -2.75), (3.0, 2.75), (3.0, -2.75), (3.9, 2.75), (3.9, -2.75)]
            dl = [a for a in D][:4]; ol = [a for a in O if a != sh][:4]
            order = [dl[0], dl[1], ol[0], ol[1], dl[2], ol[2]] if len(dl) > 2 and len(ol) > 2 else dl + ol
            for k, a in enumerate(order[:6]): self.put(a, *self.spot(lanes[k], d))
            rest = [a for a in range(10) if a not in order[:6] and a != sh]
            for k, a in enumerate(rest): self.put(a, *self.spot((8.6, 3.6 * (1 if k % 2 else -1)), d))
            if sh is not None: self.put(sh, *self.spot((5.8, 0.0), d))
            for a in range(10): self.maxsp[a] = 2.6
        else:
            # offence: formation by role
            pk = c.get("pkind", "half"); play = c.get("play")
            if pk == "transition" and play in TRANSITION: form = TRANSITION[play]
            elif pk == "late" and play in LATE_CLOCK: form = LATE_CLOCK[play][0]
            elif play in HALF_PLAYS: P = HALF_PLAYS[play]; form = P[c.get("fi", 0) % len(P)]
            else: form = HALF_PLAYS["FIVE OUT"][0]
            inb = c.get("inb")
            for i, a in enumerate(O):
                x, z = self.spot(form[i], d, mir)
                if mode == "dead" and inb and t < inb[3] + 0.2:
                    ip = INBOUNDS.get("BOX")
                    if a == inb[0]: x, z = inb[1], inb[2] * (1 if inb[2] else 1)
                    else:
                        k = [o for o in O if o != inb[0]].index(a)
                        if abs(inb[1]) > BASE:  # baseline: the box under the basket being attacked from that end
                            bd = 1 if inb[1] > 0 else -1; u, v = ip[k % 4]; x, z = bd * (BASE - u), v
                        else:
                            u, v = INBOUNDS["SIDE STACK"][k % 4]; x, z = clamp(inb[1] + d * (u - 6.5) * 0.6, -BASE + 1, BASE - 1), SIDE - 1.2 - v
                elif mode in ("live",) and a == H and t < c.get("adv_until", 0):
                    pass
                if mode == "shot" and a not in (c.get("spot", (None,))[0],):
                    x, z = (x + d * HOOP) / 2 if i >= 3 else x, z * (0.6 if i >= 3 else 1)
                self.put(a, x, z)
            # defence: between the man and the rim, tighter on the ball
            rx = d * HOOP
            for i, a in enumerate(D):
                o = O[i]; ox, oz = self.px[o], self.pz[o]
                dx, dz = rx - ox, -oz; L = math.hypot(dx, dz) or 1
                k = 0.95 if o == H else 1.7
                if mode == "dead" and inb and a == D[O.index(inb[0])] if inb and inb[0] in O else False:
                    k = 1.2
                self.put(a, ox + dx / L * min(k, L * 0.45), oz + dz / L * min(k, L * 0.45))
                if mode in ("live", "shot") and c.get("pkind") != "transition" and abs(ox - rx) < 11:
                    self.set_base(a, t, "defend")
                else:
                    self.set_base(a, t, "run")
            for a in O: self.set_base(a, t, "run")
        # referees: lead on the baseline, trail at the top, centre opposite
        self.put(10, d * (BASE + 0.9), -3.5); self.put(11, d * 2.5, SIDE + 0.35); self.put(12, d * 7.5, -SIDE - 0.35)
        for r in (10, 11, 12): self.maxsp[r] = 6.2
        if mode == "tip":
            self.put(10, 0.0, 1.2 if t - c.get("tip_t", t) < 0.5 else 4.0); self.put(11, -6.0, SIDE + 0.3); self.put(12, 6.0, -SIDE - 0.3)
        # overrides
        for a, (t0, t1, x, z, _) in list(self.over.items()):
            if t0 <= t <= t1: self.tx[a], self.tz[a] = x, z
            elif t > t1: del self.over[a]

    def put(self, a, x, z): self.tx[a], self.tz[a] = x, z
    def tip_spot(self, team, i):
        s = -1 if team == 0 else 1   # each side stands on its own half for the tip, home on -x
        if i == 4: return s * 0.45, 0.0
        a = [0.0, 0.9, -0.9, 0.45][i]; r = 3.6 if i else 4.2
        return s * r * math.cos(a), r * math.sin(a) * 1.4

    def step(self, t, dt):
        self.targets(t)
        holder = self.holder(t)
        for a in range(13):
            dx, dz = self.tx[a] - self.px[a], self.tz[a] - self.pz[a]
            L = math.hypot(dx, dz)
            msp = self.maxsp[a] * (0.82 if a == holder else 1.0)
            sp = min(msp, L * 2.2) if L > 0.05 else 0.0
            wx, wz = (dx / L * sp, dz / L * sp) if L > 1e-6 else (0.0, 0.0)
            acc = (6.0 if a < 10 else 4.0) * dt
            ux, uz = wx - self.vx[a], wz - self.vz[a]; ul = math.hypot(ux, uz)
            if ul > acc: ux, uz = ux / ul * acc, uz / ul * acc
            self.vx[a] += ux; self.vz[a] += uz
            self.px[a] += self.vx[a] * dt; self.pz[a] += self.vz[a] * dt
        # keep people apart
        for i in range(13):
            for j in range(i + 1, 13):
                dx, dz = self.px[j] - self.px[i], self.pz[j] - self.pz[i]; dd = dx * dx + dz * dz
                if 1e-6 < dd < 0.4225:
                    d = math.sqrt(dd); k = (0.65 - d) / d * 0.5
                    if i not in self.over: self.px[i] -= dx * k; self.pz[i] -= dz * k
                    if j not in self.over: self.px[j] += dx * k; self.pz[j] += dz * k
        # facing
        b = self.ball_at(t); d = self.ctx.get("dir", 1)
        for a in range(13):
            sp = math.hypot(self.vx[a], self.vz[a])
            if a == holder: want = math.atan2(d * HOOP - self.px[a], -self.pz[a])
            elif sp > 2.4 and self.base_act[a] != "defend": want = math.atan2(self.vx[a], self.vz[a])
            else: want = math.atan2(b[0] - self.px[a], b[2] - self.pz[a])
            dd = math.atan2(math.sin(want - self.yaw[a]), math.cos(want - self.yaw[a]))
            self.yaw[a] += dd * min(1.0, dt * 7)
        # one shot acts return to base
        for a in range(13):
            if self.one[a] is not None and t >= self.one[a]:
                self.one[a] = None; self.acts[a].append([round(t, 2), self.base_act[a]])

    def deliver(self, t):
        """Inbounds and free throws need the ball in the right hands: a referee's toss or a pick up when it is not."""
        for item in list(self.need):
            tn, a = item
            if tn - t > 1.25: continue
            self.need.remove(item)
            if tn < t: continue
            if self.holder(t) == a: continue
            p0 = self.ball_at(t); T = clamp(tn - t - 0.25, 0.45, 1.0)
            self.cut(t); dest = self.pred_hand(a, T)
            self.fly(t, p0, dest, T); self.hold(t + T, a, "hold")

    def run(self):
        g = self.g; dt = 1.0 / HZ_SIM; evs = g.events
        # start positions: the tip
        for tm in (0, 1):
            for i, a in enumerate(self.roles(tm)):
                self.px[a], self.pz[a] = self.tip_spot(tm, i); self.yaw[a] = math.pi / 2 * (1 if tm == 0 else -1)
        self.px[10], self.pz[10] = 0.0, 1.2; self.px[11], self.pz[11] = -6, SIDE + 0.3; self.px[12], self.pz[12] = 6, -SIDE - 0.3
        for a in range(13): self.acts[a].append([0.0, "run"])
        self.bq.append([0.0, 1e9, "r", {"p": [0.0, 1.9, 0.0], "q": [0.0, 1.9, 0.0]}])
        tend = evs[-1]["t"] + 2.0
        n = int(tend * HZ_SIM) + 1; i = 0; every = HZ_SIM // HZ_OUT
        for k in range(n):
            t = k * dt
            while i < len(evs) and evs[i]["t"] <= t:
                self.apply(evs[i]); i += 1
            self.deliver(t)
            self.step(t, dt)
            self.flush(t)
            if k % every == 0:
                row = []
                for a in range(13): row += [int(round(self.px[a] * 100)), int(round(self.pz[a] * 100)), int(round(math.degrees(self.yaw[a]))) % 360]
                self.frames.append(row)
        self.cut(tend); self.segs.extend(self.bq); self.bq = []
        out = []
        for s in self.segs:
            if s[1] - s[0] <= 1e-4 and s[2] != "h": continue
            o = {"t0": round(s[0], 3), "t1": round(min(s[1], tend), 3), "k": s[2]}
            o.update(s[3]); out.append(o)
        # merge consecutive holds by the same actor
        merged = []
        for o in out:
            if merged and o["k"] == "h" and merged[-1]["k"] == "h" and merged[-1]["a"] == o["a"] and abs(merged[-1]["t1"] - o["t0"]) < 1e-3 and merged[-1]["s"] == o["s"]:
                merged[-1]["t1"] = o["t1"]; continue
            merged.append(o)
        return {"hz": HZ_OUT, "actors": 13, "frames": self.frames, "acts": [[[a0, a1] for a0, a1 in self.dedupe(x)] for x in self.acts], "ball": merged,
                "duration": round(tend, 2)}

    @staticmethod
    def dedupe(lst):
        out = []
        for t, a in sorted(lst, key=lambda x: x[0]):
            if out and out[-1][1] == a: continue
            if out and abs(out[-1][0] - t) < 1e-6: out[-1] = [t, a]; continue
            out.append([t, a])
        return out

# ---------------------------------------------------------------- highlights (astra F, 0 to 100)
def highlights(g):
    evs = g.events; P = g.P
    rival = {g.T[0]["id"], g.T[1]["id"]} == {"NYK", "NSH"}
    out = []
    pts_by = {}; streak = {}
    for i, e in enumerate(evs):
        if e["type"] not in ("shot", "block", "turnover"): continue
        if e["type"] == "turnover" and e.get("kind") != "steal": continue
        q, clock = e["q"], e["clock"]
        before = list(e["score"]);
        if e["type"] == "shot" and e["made"]: before[e["team"]] -= e["pts"]
        team = e["team"]; margin_before = before[team] - before[1 - team]
        late = 0.0
        margin_after = margin_before + (e["pts"] if e["type"] == "shot" and e["made"] else 0)
        close = math.exp(-min(abs(margin_before), abs(margin_after)) / 10)
        if q >= g.R["periods"]: late = clamp(1 - clock / 300, 0, 1) * close
        if q > g.R["periods"]: late = max(late, 0.6 * close)
        if clock < 1.5: late = max(late, 0.45)   # beating any buzzer
        comp = {"difficulty": 0, "late": round(25 * late, 1), "impact": 0, "spectacle": 0, "context": 0, "crowd": 0}
        if e["type"] == "shot":
            if not e["made"]:
                if not e.get("blocked"): continue
            else:
                p = e["p"]; comp["difficulty"] = round(20 * clamp((0.78 - p) / 0.62, 0, 1), 1)
                after = margin_before + e["pts"]
                imp = 0
                if margin_before < 0 <= after: imp = 13 if after > 0 else 10
                if margin_before <= 0 < after and q >= g.R["periods"] and clock < 60: imp = 20
                if e["three"]: imp += 4
                if e.get("fouled"): imp += 4
                if g_run(evs, i, team) >= 8: imp += 5
                comp["impact"] = min(20, imp)
                spec = 0
                if e["kind"] == "dunk": spec = 12 + (3 if e.get("transition") or e.get("assist") else 0)
                elif e["zone"] == "heave": spec = 15
                elif e["three"] and e["contest"] > 0.6: spec = 9
                elif e["three"]: spec = 5
                elif e["kind"] == "layup": spec = 4 + (3 if e["contest"] > 0.6 else 0)
                else: spec = 3
                comp["spectacle"] = min(15, spec)
                pid = e["a"]; pts_by[pid] = pts_by.get(pid, 0) + e["pts"]; streak[pid] = streak.get(pid, 0) + 1
                ctx = 4 if rival else 0
                if streak[pid] >= 3: ctx += 3
                if pts_by[pid] >= 30 and pts_by[pid] - e["pts"] < 30: ctx += 3
                dfn = e.get("d")
                if dfn and P[dfn]["character"] == P[pid]["character"]: ctx += 3   # the same New Yorker on both sides
                comp["context"] = min(10, ctx)
        elif e["type"] == "block":
            comp["difficulty"] = 10; comp["spectacle"] = 12; comp["impact"] = 6 if abs(margin_before) <= 3 else 2
            comp["context"] = 4 if rival else 0
        else:
            comp["difficulty"] = 6; comp["spectacle"] = 6; comp["impact"] = 4; comp["context"] = 4 if rival else 0
            nxt = next((x for x in evs[i + 1:i + 8] if x["type"] == "shot"), None)
            if nxt and nxt["made"] and nxt.get("transition") and nxt["t"] - e["t"] < 6:
                comp["spectacle"] = 13; comp["impact"] = 10
        home = (team == 0) if e["type"] != "turnover" else (e.get("b") in g.lineup[0] or team == 1)
        comp["crowd"] = round(clamp((comp["spectacle"] / 15 * 5 + comp["late"] / 25 * 5) * (1.0 if home else 0.7), 0, 10), 1)
        if e["type"] == "shot" and not e["made"]:
            streak[e["a"]] = 0
        score = round(sum(comp.values()), 1)
        actor = e.get("blocked") if e["type"] == "shot" and e.get("blocked") else e.get("b") if e["type"] == "turnover" else e["a"]
        kind = "block" if (e["type"] == "block" or (e["type"] == "shot" and e.get("blocked"))) else "steal" if e["type"] == "turnover" else e.get("kind")
        if e["type"] == "shot" and e.get("blocked"): continue   # the block event carries it
        out.append({"event": e["id"], "t": e["t"], "q": q, "clock": clock, "score": score, "components": comp, "kind": kind,
                    "actor": actor, "team": team if e["type"] != "turnover" else 1 - team, "zone": e.get("zone"), "made": e.get("made")})
    # selection: above 65, at least 12 s apart unless they are one sequence
    out.sort(key=lambda h: -h["score"])
    sel = []
    for h in out:
        if h["score"] <= 65: break
        if any(abs(h["t"] - s["t"]) < 12 for s in sel): continue
        sel.append(h)
    fallback = False
    if len(sel) < 3:
        fallback = True
        for h in out:
            if len(sel) >= 3: break
            if any(abs(h["t"] - s["t"]) < 12 for s in sel): continue
            sel.append(h)
    cams = ["main", "baseline", "backboard", "handheld", "bridge"]
    for k, h in enumerate(sorted(sel, key=lambda h: -h["score"])):
        rng = random.Random(g.seed * 31 + k)
        h["rank"] = k + 1
        h["camera_sequence"] = ["main", rng.choice(["baseline", "backboard"]), "crowd" if h["team"] == 0 else "handheld"]
        h["replay_speed"] = 0.4
        h["window"] = [round(h["t"] - 4.5, 2), round(h["t"] + 2.5, 2)]
    return {"selected": sorted(sel, key=lambda h: h["t"]), "candidates": out[:40], "threshold": 65, "fallback_top3": fallback}

def g_run(evs, i, team):
    pts = 0
    for e in reversed(evs[:i + 1]):
        if e["type"] in ("shot", "ft") and e.get("made"):
            if e["team"] != team: break
            pts += e.get("pts", 1) if e["type"] == "shot" else 1
    return pts

# ---------------------------------------------------------------- output
def game_json(g, motion=True):
    meta = {"engine": "garden_sim 1", "seed": g.seed, "rules": g.R, "home": g.T[0]["id"], "away": g.T[1]["id"], "arena": "THE GARDEN",
            "court": {"hoop_x": HOOP, "baseline_x": BASE, "sideline_z": SIDE, "rim_y": RIMY, "ball_r": BALL_R, "frame": "three.js: x along, z across, y up; home attacks +x in halves 1"},
            "final": g.score, "periods": g.q, "generated": time.strftime("%Y-%m-%d")}
    teams = []
    for t in g.T:
        teams.append({k: t[k] for k in ("id", "name", "kit", "tendencies", "starting_five")} | {"roster": [
            {k: p[k] for k in ("id", "character", "name", "number", "archetype", "height", "mass", "wingspan", "hand", "ratings", "skin", "flower")} for p in t["roster"]]})
    box = {pid: dict(b) for pid, b in g.box.items()}
    out = {"meta": meta, "teams": teams, "cast": g.cast, "box": box, "team_stats": g.stats, "events": g.events,
           "clockline": g.clockline, "scoreline": g.scoreline, "lineups0": [g.T[0]["starting_five"], g.T[1]["starting_five"]]}
    if motion:
        c = Choreo(g); out["motion"] = c.run()
    out["highlights"] = highlights(g)
    return out

def play_game(home, away, seed, rules="pro5v5-v1", league=None):
    return Game(home, away, seed, rules, league).play()

# ---------------------------------------------------------------- tournaments
def team_strength(t):
    return sum(sum(p["ratings"][k] for k in ("rim", "mid", "three", "per_def", "int_def", "reb")) for p in t["roster"][:8]) / 8

def tournament(fmt, seed, rules="pro5v5-v1"):
    league = build_league(); cast, teams = league
    rng = random.Random(seed * 104729 + 5)   # the seeded draw stream
    seeds = sorted(teams, key=lambda t: -team_strength(t))
    order = [t["id"] for t in seeds]
    games = []
    def fixture(stage, h, a):
        gs = seed * 1000 + len(games) + 1
        g = play_game(h, a, gs, rules, league)
        rec = {"stage": stage, "home": h, "away": a, "seed": gs, "score": list(g.score), "ot": max(0, g.q - g.R["periods"]),
               "winner": h if g.score[0] > g.score[1] else a,
               "top": max(((pid, b["pts"]) for pid, b in g.box.items()), key=lambda x: x[1])}
        games.append(rec); return rec
    out = {"format": fmt, "seed": seed, "rules": rules, "seeding": order, "games": games}
    if fmt == "knockout":
        qf = [(0, 7), (3, 4), (1, 6), (2, 5)]
        w = [fixture("quarterfinal", order[i], order[j])["winner"] for i, j in qf]
        f = [fixture("semifinal", w[0], w[1])["winner"], fixture("semifinal", w[2], w[3])["winner"]]
        out["champion"] = fixture("final", f[0], f[1])["winner"]
        out["bracket"] = {"quarterfinals": [[order[i], order[j]] for i, j in qf], "semifinals": [[w[0], w[1]], [w[2], w[3]]], "final": f}
    else:
        A = [order[i] for i in (0, 3, 4, 7)]; B = [order[i] for i in (1, 2, 5, 6)]
        groups = {"A": A, "B": B}; tables = {}
        for gname, ids in groups.items():
            recs = []
            for i in range(4):
                for j in range(i + 1, 4):
                    recs.append(fixture("group " + gname, ids[i], ids[j]) if (i + j) % 2 else fixture("group " + gname, ids[j], ids[i]))
            tables[gname] = standings(ids, recs, rng)
        s1 = fixture("semifinal", tables["A"][0]["team"], tables["B"][1]["team"])["winner"]
        s2 = fixture("semifinal", tables["B"][0]["team"], tables["A"][1]["team"])["winner"]
        out["champion"] = fixture("final", s1, s2)["winner"]
        out["groups"] = groups; out["standings"] = tables
        out["bracket"] = {"semifinals": [[tables["A"][0]["team"], tables["B"][1]["team"]], [tables["B"][0]["team"], tables["A"][1]["team"]]], "final": [s1, s2]}
        out["tiebreaks"] = ["wins", "head to head", "point differential capped at 20 per game", "points scored", "seeded draw"]
    out["names"] = {t["id"]: t["name"] for t in teams}
    out["kits"] = {t["id"]: t["kit"] for t in teams}
    return out

def standings(ids, recs, rng):
    row = {i: {"team": i, "w": 0, "l": 0, "pf": 0, "pa": 0, "pd_capped": 0} for i in ids}
    for r in recs:
        h, a = r["home"], r["away"]; sh, sa = r["score"]
        row[h]["pf"] += sh; row[h]["pa"] += sa; row[a]["pf"] += sa; row[a]["pa"] += sh
        row[h]["pd_capped"] += clamp(sh - sa, -20, 20); row[a]["pd_capped"] += clamp(sa - sh, -20, 20)
        if sh > sa: row[h]["w"] += 1; row[a]["l"] += 1
        else: row[a]["w"] += 1; row[h]["l"] += 1
    draw = {i: rng.random() for i in ids}
    def h2h(team, tied):
        return sum(1 for r in recs if r["winner"] == team and {r["home"], r["away"]} <= set(tied) and len(tied) > 1)
    by_w = {}
    for i in ids: by_w.setdefault(row[i]["w"], []).append(i)
    for i in ids:
        tied = by_w[row[i]["w"]]
        row[i]["h2h"] = h2h(i, tied)
    table = sorted(row.values(), key=lambda r: (-r["w"], -r["h2h"], -r["pd_capped"], -r["pf"], draw[r["team"]]))
    for k, r in enumerate(table): r["rank"] = k + 1
    return table

# ---------------------------------------------------------------- calibration
def calibrate(n, rules="pro5v5-v1"):
    league = build_league(); ids = [t["id"] for t in league[1]]
    rng = random.Random(99)
    tot = {"pts": 0, "poss": 0, "fga": 0, "fgm": 0, "tpa": 0, "tpm": 0, "fta": 0, "ftm": 0, "tov": 0, "oreb": 0, "dreb": 0, "ast": 0, "ot": 0}
    zone = {z: [0, 0] for z in BASE_P}; mins = []
    t0 = time.time()
    for k in range(n):
        h, a = rng.sample(ids, 2)
        g = play_game(h, a, 500000 + k, rules, league)
        for pid, b in g.box.items():
            for key in ("fga", "fgm", "tpa", "tpm", "fta", "ftm", "ast"): tot[key] += b[key]
        tot["pts"] += sum(g.score); tot["poss"] += sum(g.stats["poss"]); tot["tov"] += sum(g.stats["tov"])
        tot["oreb"] += sum(g.stats["oreb"]); tot["dreb"] += sum(g.stats["dreb"]); tot["ot"] += g.q > g.R["periods"]
        for z in zone:
            zone[z][0] += g.stats["zone"][z][0]; zone[z][1] += g.stats["zone"][z][1]
        if k < 300:
            for t in g.T:
                mins.append(sorted((g.box[p["id"]]["min"] for p in t["roster"]), reverse=True))
    T = 2 * n
    res = {"games": n, "seconds": round(time.time() - t0, 1),
           "points_per_team": round(tot["pts"] / T, 1), "possessions_per_team": round(tot["poss"] / T, 1),
           "offensive_rating": round(100 * tot["pts"] / tot["poss"], 1),
           "fg_pct": round(tot["fgm"] / tot["fga"], 3), "three_pct": round(tot["tpm"] / tot["tpa"], 3), "ft_pct": round(tot["ftm"] / tot["fta"], 3),
           "three_rate": round(tot["tpa"] / tot["fga"], 3), "ft_rate": round(tot["fta"] / tot["fga"], 3),
           "fga_per_team": round(tot["fga"] / T, 1), "tov_per_team": round(tot["tov"] / T, 1), "oreb_pct": round(tot["oreb"] / (tot["oreb"] + tot["dreb"]), 3),
           "ast_per_team": round(tot["ast"] / T, 1), "overtime_rate": round(tot["ot"] / n, 3),
           "fg_by_zone": {z: {"pct": round(v[0] / v[1], 3) if v[1] else None, "share": round(v[1] / tot["fga"], 3)} for z, v in zone.items()},
           "minutes_by_rank": [round(sum(m[i] for m in mins) / len(mins), 1) for i in range(12)]}
    return res

# ---------------------------------------------------------------- cli
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    a = sp.add_parser("game"); a.add_argument("--seed", type=int, default=7); a.add_argument("--home", default="NYK"); a.add_argument("--away", default="NSH")
    a.add_argument("--rules", default="pro5v5-v1"); a.add_argument("--no-motion", action="store_true"); a.add_argument("--site", action="store_true", help="also copy to site/sim/")
    b = sp.add_parser("tournament"); b.add_argument("--format", choices=["knockout", "groups"], default="knockout"); b.add_argument("--seed", type=int, default=3); b.add_argument("--rules", default="pro5v5-v1")
    c = sp.add_parser("calibrate"); c.add_argument("--n", type=int, default=10000); c.add_argument("--rules", default="pro5v5-v1")
    r = sp.add_parser("roster")
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    if args.cmd == "game":
        t0 = time.time()
        g = play_game(args.home, args.away, args.seed, args.rules)
        data = game_json(g, motion=not args.no_motion)
        name = f"game_{args.seed}" + ("" if (args.home, args.away) == ("NYK", "NSH") else f"_{args.home}_{args.away}")
        path = os.path.join(OUT, name + ".json")
        json.dump(data, open(path, "w"), separators=(",", ":"))
        hl = {"game": name, "seed": args.seed, **data["highlights"]}
        json.dump(hl, open(os.path.join(OUT, f"highlights_{args.seed}.json" if name == f"game_{args.seed}" else f"highlights_{name[5:]}.json"), "w"), indent=1)
        if args.site:
            sd = os.path.join(ROOT, "site", "sim"); os.makedirs(sd, exist_ok=True)
            json.dump(data, open(os.path.join(sd, name + ".json"), "w"), separators=(",", ":"))
        T = data["teams"]
        print(f"{T[0]['name']} {g.score[0]}  {T[1]['name']} {g.score[1]}" + (f"  ({g.q - 4} OT)" if g.q > 4 else ""))
        for t in (0, 1):
            top = sorted(g.T[t]["roster"], key=lambda p: -g.box[p["id"]]["pts"])[:3]
            print("  " + ", ".join(f"{p['name']} #{p['number']} {g.box[p['id']]['pts']}" for p in top))
        print(f"events {len(g.events)}  highlights selected {len(data['highlights']['selected'])}  -> {path} ({os.path.getsize(path) // 1024} KB, {time.time() - t0:.1f}s)")
        for h in data["highlights"]["selected"]:
            print(f"  {h['score']:5.1f}  Q{h['q']} {int(h['clock'] // 60)}:{int(h['clock'] % 60):02d}  {h['kind']:7s} {g.P[h['actor']]['name']} #{g.P[h['actor']]['number']}  t={h['t']}")
    elif args.cmd == "tournament":
        res = tournament(args.format, args.seed, args.rules)
        path = os.path.join(OUT, f"tournament_{args.seed}" + ("" if args.format == "knockout" else "_groups") + ".json")
        json.dump(res, open(path, "w"), indent=1)
        for gm in res["games"]:
            print(f"  {gm['stage']:14s} {res['names'][gm['home']]:13s} {gm['score'][0]:3d}  {res['names'][gm['away']]:13s} {gm['score'][1]:3d}" + ("  OT" if gm["ot"] else "") + f"   seed {gm['seed']}")
        print("champion:", res["names"][res["champion"]], "->", path)
    elif args.cmd == "calibrate":
        print(json.dumps(calibrate(args.n, args.rules), indent=1))
    elif args.cmd == "roster":
        cast, teams = build_league()
        for t in teams:
            print(t["id"], t["name"], round(team_strength(t), 1))
            for p in t["roster"]: print(f"   #{p['number']:<3d} {p['name']:13s} {p['archetype']:7s} {p['height']} m  {p['ratings']}")

if __name__ == "__main__":
    main()

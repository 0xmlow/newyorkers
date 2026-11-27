// THE GARDEN replay: reads a game JSON written by sim/garden_sim.py and answers "where is everyone, where is the ball,
// what does the clock say" for any time t in seconds from the opening tip. Pure functions of t, so a capture can jump to
// any moment and a replay at 0.4x reads the same timeline as the live shot. Nothing here invents a result.
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const G = 9.81;

function lastLE(arr, t, key = (x) => x[0]) { // index of the last element with key <= t, or -1
  let lo = 0, hi = arr.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (key(arr[m]) <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}
const cr = (p0, p1, p2, p3, u) => 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);

export async function loadReplay(url) {
  const r = await fetch(url); if (!r.ok) throw new Error('replay: ' + url + ' ' + r.status);
  return makeReplay(await r.json());
}

export function makeReplay(D) {
  const M = D.motion, F = M.frames, hz = M.hz, NA = M.actors;
  const P = {}; D.teams.forEach((tm, ti) => tm.roster.forEach((p) => { P[p.id] = { ...p, team: ti }; }));
  const subs = D.events.filter((e) => e.type === 'sub');
  const poss = D.events.filter((e) => e.type === 'possession' || e.type === 'jump');
  const ends = D.events.filter((e) => e.type === 'game_end');
  const ball = M.ball;
  const acts = M.acts;
  const pbp = D.events.filter((e) => e.pbp !== false);

  function lineupAt(t) {
    const L = [D.lineups0[0].slice(), D.lineups0[1].slice()];
    for (const e of subs) { if (e.t > t) break; L[e.team][e.slot] = e.inn; }
    return L;
  }
  // actor a (0..4 home slots, 5..9 away slots, 10..12 referees) at time t: [x, z, yaw]
  function actor(t, a, out = [0, 0, 0]) {
    const f = clamp(t * hz, 0, F.length - 1.0001), i = Math.floor(f), u = f - i, n = F.length - 1;
    const r0 = F[Math.max(0, i - 1)], r1 = F[i], r2 = F[Math.min(n, i + 1)], r3 = F[Math.min(n, i + 2)], o = a * 3;
    out[0] = cr(r0[o], r1[o], r2[o], r3[o], u) / 100; out[1] = cr(r0[o + 1], r1[o + 1], r2[o + 1], r3[o + 1], u) / 100;
    let y1 = r1[o + 2], y2 = r2[o + 2], dy = ((y2 - y1 + 540) % 360) - 180;
    out[2] = (y1 + dy * u) * Math.PI / 180;
    return out;
  }
  const _a = [0, 0, 0], _b = [0, 0, 0];
  function velocity(t, a, out = [0, 0]) { actor(t - 0.05, a, _a); actor(t + 0.05, a, _b); out[0] = (_b[0] - _a[0]) * 10; out[1] = (_b[1] - _a[1]) * 10; return out; }
  function actAt(t, a) { const L = acts[a], i = lastLE(L, t); return i < 0 ? ['run', 0] : L[i]; }
  function segAt(t) { const i = lastLE(ball, t, (s) => s.t0); return i < 0 ? { seg: ball[0], i: 0 } : { seg: ball[i], i }; }
  function evalSeg(s, t, out = [0, 0, 0]) {
    if (s.k === 'f') { const u = clamp(t, s.t0, s.t1) - s.t0; out[0] = s.p[0] + s.v[0] * u; out[1] = s.p[1] + s.v[1] * u - 0.5 * G * u * u; out[2] = s.p[2] + s.v[2] * u; return out; }
    if (s.k === 'r') { const u = s.t1 > s.t0 ? clamp((t - s.t0) / (s.t1 - s.t0), 0, 1) : 1, e = 1 - (1 - u) * (1 - u); for (let k = 0; k < 3; k++) out[k] = s.p[k] + (s.q[k] - s.p[k]) * e; return out; }
    actor(t, s.a, _a); out[0] = _a[0] + Math.sin(_a[2]) * 0.3; out[1] = 1.2; out[2] = _a[1] + Math.cos(_a[2]) * 0.3; return out;
  }
  // the ball without the rig (for cameras): the holder's chest when held
  function ballApprox(t, out = [0, 0, 0]) { return evalSeg(segAt(t).seg, t, out); }
  function clockAt(t) {
    const C = D.clockline, i = lastLE(C, t); if (i < 0) return { q: 1, clock: D.meta.rules.period_len, shot: 24, live: false };
    const [t0, q, c, s, live] = C[i], run = live ? t - t0 : 0;
    return { q, clock: Math.max(0, c - run), shot: s < 0 ? -1 : Math.max(0, s - run), live: !!live };
  }
  function scoreAt(t) { const S = D.scoreline, i = lastLE(S, t); return i < 0 ? [0, 0] : [S[i][1], S[i][2]]; }
  function lastScore(t) { const S = D.scoreline, i = lastLE(S, t); if (i < 0) return null; const prev = i ? S[i - 1] : [0, 0, 0]; return { t: S[i][0], team: S[i][1] > prev[1] ? 0 : 1, pts: (S[i][1] - prev[1]) + (S[i][2] - prev[2]) }; }
  function offAt(t) { const i = lastLE(poss, t, (e) => e.t); return i < 0 ? 0 : poss[i].team; }
  function finalAt(t) { return ends.length && t >= ends[0].t; }
  function attackDir(team, q) { return (team === 0 ? 1 : -1) * (q <= 2 ? 1 : -1); }
  function eventsBetween(t0, t1) { const out = []; for (const e of pbp) { if (e.t > t1) break; if (e.t > t0) out.push(e); } return out; }
  return { D, P, NA, duration: M.duration, lineupAt, actor, velocity, actAt, segAt, evalSeg, ballApprox, clockAt, scoreAt, lastScore, offAt, finalAt, attackDir, eventsBetween,
    teams: D.teams, events: D.events, highlights: D.highlights };
}

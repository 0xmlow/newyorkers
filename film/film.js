// film.js: the director for the BREAK GLASS hype film. Injected after the piece loads (rig.py), with
// window.__CUES set first. window.__frame(t, dt) runs one film frame: fires the cue events due by t,
// sets the camera rig for t, steps the piece by dt times the sim speed for t, and draws the type for t.
(() => {
  const C = window.__CUES, F = window.__breakglass.film, BG = window.__breakglass;
  const B = 60 / C.bpm;

  // ---------- easing: cubic beziers by Newton, and the house set ----------
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; } return Y(Math.min(1, Math.max(0, t))); };
  }
  const E = { in: bez(0.16, 1, 0.3, 1), out: bez(0.6, 0, 0.9, 0.35), move: bez(0.76, 0, 0.24, 1), land: bez(0.34, 1.56, 0.64, 1) };
  const cl = x => Math.min(1, Math.max(0, x)), lerp = (a, b, k) => a + (b - a) * k, V = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
  const prog = (t, t0, dur) => cl((t - t0) / dur);

  // ---------- events: fired once, in order, when film time passes them ----------
  const EV = [];
  const at = (t, fn) => EV.push([t, fn]);
  at(0, () => { F.look.tx = F.look.x = 0; F.look.ty = F.look.y = -0.1; });
  at(C.emergency, () => { F.look.tx = -0.9; F.look.ty = 0.2; });                       // every eye snaps to the side
  at(C.blink, () => F.EYES.forEach(e => { if (!e.twin) e.bt = 0.001; }));              // and blinks on the beat
  at(C.beacon, () => F.setAlarm(1.6));
  at(C.dolly, () => { F.look.tx = 0.15; F.look.ty = 0; F.EYES.forEach((e, i) => { if (!e.twin && i % 2) e.bt = 0.001; }); });
  at(C.pyro1, () => F.ignite(1.5, 0.9));
  at(C.strikes[0] - 0.3, () => { window.__FORCE = { no: 501, st: 1 }; });
  C.strikes.forEach((t, i) => at(t, () => F.strike([{ x: 0.14, y: 0.05 }, { x: 0.05, y: 0.12 }, { x: 0.1, y: 0.06 }][i])));
  at(C.drop, () => { F.look.tx = 0; F.look.ty = 0.6; });
  C.pulls.forEach((p, i) => {
    const prev = i ? C.pulls[i - 1].t : C.drop, gap = p.t - prev, lead = gap >= 2 ? 0.5 : 0.42;
    at(prev + 0.25, () => F.prep(p.no, p.st));
    at(p.t - lead, () => F.rearm());
    at(p.t, () => F.smash([{ x: -0.2, y: 0.1 }, { x: 0.25, y: -0.05 }, { x: 0.05, y: 0.15 }, { x: -0.1, y: -0.1 }, { x: 0.3, y: 0.12 }, { x: -0.28, y: 0.02 }, { x: 0, y: 0.05 }][i]));
  });
  at(C.pulls[C.pulls.length - 1].t + 0.02, () => { F.ignite(3.6, 1.3); F.setAlarm(5); });
  at(C.wide, () => F.ignite(2.6, 1.05));
  at(C.rearm_wide, () => F.rearm());
  at(C.tag - 1.0, () => F.prep(1, 1));
  at(C.front, () => { F.look.tx = 0; F.look.ty = 0; });
  at(C.final, () => { F.smash({ x: 0, y: 0.04 }); });
  at(C.final + 0.02, () => { F.ignite(4.2, 1.35); F.setAlarm(6); });
  const SNAP = [];
  at(C.drop + 0.1, () => { SNAP[0] = { ...BG.current }; });
  C.pulls.forEach((p, i) => at(p.t + 0.02, () => { SNAP[i + 1] = { ...BG.current }; }));
  let ei = 0;

  // ---------- sim speed: real time, slow motion at the drop, fast forward through the rewinds ----------
  function speed(t) {
    if (t > C.drop + 0.01 && t < C.slow_end) return lerp(0.22, 0.32, (t - C.drop) / (C.slow_end - C.drop));   // the impact frame itself runs at full speed
    if (t >= C.slow_end && t < C.slow_end + 0.5) return lerp(0.32, 1, E.move((t - C.slow_end) / 0.5));
    for (let i = 0; i < C.pulls.length; i++) {
      const p = C.pulls[i], prev = i ? C.pulls[i - 1].t : C.drop, lead = p.t - prev >= 2 ? 0.5 : 0.42;
      if (t >= p.t - lead && t < p.t) return 3.0;      // the rewind finishes on the downbeat
    }
    return 1;
  }

  // ---------- cameras ----------
  const impacts = [C.hit1, C.hit2, C.drop, ...C.pulls.map(p => p.t), C.final];
  function shake(t) {
    let a = 0; for (const h of impacts) { const d = t - h; if (d >= 0 && d < 0.6) a += (h === C.drop || h === C.final ? 0.05 : 0.022) * Math.exp(-d * 9); }
    return [Math.sin(t * 91.7) * a, Math.sin(t * 77.3 + 1.3) * a, 0];
  }
  const hand = (t, amp) => [Math.sin(t * 1.3) * amp + Math.sin(t * 3.1) * amp * 0.4, Math.sin(t * 1.7 + 2) * amp * 0.8, Math.sin(t * 0.9 + 4) * amp * 0.5];
  const orbit = (c, r, a, y) => [c[0] + Math.sin(a) * r, y, c[2] + Math.cos(a) * r];
  const SHOTS = [
    [0, 2.0, t => { const k = E.move(t / 2); return { p: V([-1.5, 0.27, 0.06], [-1.4, 0.27, 0.06], k), l: [-1.15, 0.27, 0.06], fov: lerp(25, 22, k) }; }],
    [2.0, 3.0, t => { const a = lerp(0.9, 0.1, E.move(t)); return { p: orbit([0, 0.98, 0.02], 0.62, a, 1.12), l: [0, 0.98, 0.02], fov: 32 }; }],
    [3.0, 4.0, t => { const k = E.move(t); return { p: V([0.32, 0.16, 1.05], [0.55, 0.32, 2.9], k), l: V([0.05, 0.12, 0.2], [0, 0.05, 0.2], k), fov: lerp(34, 40, k) }; }],
    [4.0, 4.5, t => ({ p: V([-2.55, -1.32, 2.05], [-2.45, -1.28, 1.95], t * 2), l: [-1.72, -0.55, 0.62], fov: 44 })],
    [4.5, 5.0, t => ({ p: V([1.88, 0.22, 0.86], [1.82, 0.2, 0.8], t * 2), l: [1.27, 0.04, 0.18], fov: 30 })],
    [5.0, 5.5, t => ({ p: V([0.3, -0.74, 1.72], [0.22, -0.76, 1.66], t * 2), l: [-0.18, -1.07, 0.76], fov: 30 })],
    [5.5, 6.0, t => ({ p: V([-1.62, 0.5, 1.05], [-1.56, 0.46, 1.0], t * 2), l: [-1.15, 0.3, 0.1], fov: 30 })],
    [6.0, 6.5, t => ({ p: V([0.45, -1.22, 2.1], [0.38, -1.22, 2.0], t * 2), l: [0, -1.3, 1.0], fov: 26 })],
    [6.5, 7.0, t => ({ p: V([-2.7, -1.15, 2.5], [-2.6, -1.1, 2.4], t * 2), l: [-0.9, -0.8, 0.1], fov: 40 })],
    [7.0, 7.5, t => ({ p: V([0.25, 3.2, 1.6], [0.2, 3.1, 1.5], t * 2), l: [0, -0.3, 0.2], fov: 42 })],
    [7.5, 11.5, t => { const k = E.move(cl(t / 4)); return { p: V([0.6, 0.38, 3.2], [0.32, 0.22, 2.25], k), l: [0.08, 0.1, 0.2], fov: 36 }; }],
    [11.5, 12.0, t => ({ p: V([0.42, 0.16, 1.02], [0.38, 0.15, 0.95], t * 2), l: [0.1, 0.1, 0.2], fov: 30 })],
    [12.0, 14.0, t => { const a = lerp(-0.62, 0.55, E.move(t / 2)); return { p: orbit([0, -0.05, 0.25], 2.7, a, lerp(-0.25, 0.35, t / 2)), l: [0, -0.05, 0.25], fov: 44 }; }],
    [14.0, 16.0, t => ({ p: V([0, 0.14, 2.35], [0, 0.13, 2.05], E.move(t / 2)), l: [0, 0.1, 0.2], fov: 36 })],
    [16.0, 18.0, t => ({ p: V([-1.45, 0.42, 2.35], [-1.25, 0.36, 2.2], t / 2), l: [0, 0.05, 0.2], fov: 38 })],
    [18.0, 20.0, t => ({ p: V([0.3, -0.95, 3.5], [0.1, -0.88, 3.3], t / 2), l: [0, 0.02, 0.2], fov: 42 })],
    [20.0, 22.0, t => ({ p: V([0.38, 0.2, 1.48], [0.28, 0.18, 1.38], t / 2), l: [0, 0.1, 0.15], fov: 32 })],
    [22.0, 24.0, t => ({ p: V([1.7, 1.35, 2.5], [1.55, 1.25, 2.35], t / 2), l: [0, -0.2, 0.2], fov: 40 })],
    [24.0, 25.0, t => ({ p: V([-0.22, 0.12, 1.7], [-0.18, 0.12, 1.62], t), l: [0, 0.1, 0.18], fov: 34 })],
    [25.0, 26.0, t => ({ p: V([-1.05, -0.62, 2.1], [-0.98, -0.6, 2.02], t), l: [0, 0.05, 0.2], fov: 38 })],
    [26.0, 28.0, t => ({ p: V([0, 0.16, 2.9], [0, 0.13, 1.95], E.move(t / 2)), l: [0, 0.1, 0.2], fov: 36 })],
    [28.0, 32.0, t => { const a = lerp(-0.38, 0.32, t / 4); return { p: orbit([0, -0.4, 0.15], 6.6, a, 1.0), l: [0, -0.35, 0.15], fov: 38 }; }],
    [32.0, 34.5, t => { const a = lerp(0.32, Math.PI, E.move(t / 2.5)); return { p: orbit([0, -0.2, 0], lerp(6.6, 3.4, E.move(t / 2.5)), a, lerp(1.0, 0.3, E.move(t / 2.5))), l: [0, lerp(-0.35, 0.05, E.move(t / 2.5)), 0], fov: 38 }; }],
    [34.5, 36.0, t => ({ p: V([-0.52, -0.2, -0.95], [-0.56, -0.22, -0.8], E.move(t / 1.5)), l: [-0.6, -0.24, -0.24], fov: 30 })],
    [36.0, 38.5, t => ({ p: V([0.5, 0.32, 3.2], [0.3, 0.22, 2.6], E.move(t / 2.5)), l: [0.03, 0.08, 0.2], fov: 38 })],
    [38.5, 44.01, t => { const k = E.move(cl(t / 5.5)); return { p: V([0.25, 0.4, 4.8], [0.1, 0.9, 7.6], k), l: [0, lerp(-0.75, -1.05, k), 0.2], fov: 36 }; }],
  ];
  function cam(t) {
    let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[0]) s = x;
    const c = s[2](t - s[0]), sh = shake(t), hh = hand(t, 0.006);
    c.p = [c.p[0] + sh[0] + hh[0], c.p[1] + sh[1] + hh[1], c.p[2] + hh[2]];
    return c;
  }

  // ---------- type ----------
  const css = document.createElement('style');
  css.textContent = `
  #ov{position:fixed;inset:0;pointer-events:none;font-family:"Arial Black",Impact,Arial,sans-serif;color:#fff;overflow:hidden}
  #ov .el{position:absolute;opacity:0;will-change:transform,opacity,clip-path}
  #ov .big{left:7%;bottom:12%;font-size:150px;line-height:.92;letter-spacing:.01em}
  #ov .big .row{display:block}
  #ov .plate{display:inline-block;background:#2962FF;padding:.04em .16em .02em}
  #ov .slam{left:50%;top:50%;font-size:200px;letter-spacing:.01em;white-space:nowrap}
  #ov .slam span{display:inline-block;background:#2962FF;padding:.02em .18em 0}
  #ov .cap{left:7%;bottom:10%;font:700 40px Consolas,"Courier New",monospace;letter-spacing:.18em;padding:16px 26px 14px 30px;background:rgba(4,8,23,.78);border-left:10px solid #2962FF}
  #ov .name{left:6%;bottom:9%;padding:22px 34px 24px 30px;background:rgba(4,8,23,.84);border-left:10px solid #2962FF;max-width:62%}
  #ov .name .no{font:700 34px Consolas,monospace;letter-spacing:.2em;color:#9fc4ff}
  #ov .name .ti{font:700 88px/1.02 Georgia,"Times New Roman",serif;margin:8px 0 10px}
  #ov .name .od{font:700 32px Consolas,monospace;letter-spacing:.16em;color:#cfe0ff}
  #ov .name.boot{border-left-color:#D7FF1F}
  #ov .badge{right:6%;top:10%;font:900 46px "Arial Black",Impact,sans-serif;color:#0d0d0d;background:#D7FF1F;padding:14px 26px 10px;letter-spacing:.04em}
  #ov .badge small{display:block;font:700 22px Consolas,monospace;letter-spacing:.18em;margin-top:6px}
  #ov .count{right:5%;top:8%;font:700 30px Consolas,monospace;letter-spacing:.24em;background:rgba(4,8,23,.7);padding:10px 18px}
  #ov .wide{left:7%;top:13%;font-size:112px;line-height:.95}
  #ov .shade{inset:0;background:linear-gradient(180deg,rgba(3,6,18,.05) 20%,rgba(3,6,18,.9) 62%)}
  #ov .end{left:0;right:0;top:54%;text-align:center}
  #ov .end .bg{font-size:180px;line-height:.9;display:inline-block;background:#2962FF;padding:.05em .2em .02em}
  #ov .end .by{font:700 40px Consolas,monospace;letter-spacing:.3em;margin-top:40px}
  #ov .end .url{font:700 30px Consolas,monospace;letter-spacing:.2em;color:#9fc4ff;margin-top:18px}
  #ov .end img{height:54px;margin-top:34px}
  #ov .flash{inset:0;background:#eaf4ff}
  `;
  document.head.appendChild(css);
  const ov = document.createElement('div'); ov.id = 'ov'; document.body.appendChild(ov);
  const mk = (cls, html) => { const d = document.createElement('div'); d.className = 'el ' + cls; d.innerHTML = html; ov.appendChild(d); return d; };
  const logo = (document.querySelector('#top img') || {}).src || '';

  const T = [];   // each: el, t0, t1, kind
  const add = (el, t0, t1, kind) => T.push({ el, t0, t1, kind });
  // intro stack
  const ic = mk('big', '<span class="row r1">IN CASE OF</span><span class="row r2"><span class="plate">EMERGENCY</span></span>');
  add(ic, C.in_case, C.blink - 0.05, 'stack');
  add(mk('cap', 'ONE CASE.'), C.build, C.build + 1.0, 'cap');
  add(mk('cap', 'ONE HAMMER.'), C.build + 1.0, C.build + 2.0, 'cap');
  add(mk('cap', '111 NEW YORKERS INSIDE.'), C.build + 2.0, C.silence1 - 0.02, 'cap');
  add(mk('slam', '<span>HIT IT.</span>'), C.hit1, C.hit2 - 0.1, 'slam');
  add(mk('slam', '<span>HARDER.</span>'), C.hit2, C.roll + 0.4, 'slam');
  add(mk('slam', '<span>ONE MORE.</span>'), C.one_more, C.silence2, 'slam');
  const flash = mk('flash', ''); add(flash, C.drop, C.drop + 0.3, 'flash');
  // name cards, filled from the pull the piece actually made
  const reveals = [{ t: C.card_big, t1: C.pulls[0].t - 0.55 }, ...C.pulls.map((p, i) => ({ t: p.t + 0.12, t1: (C.pulls[i + 1] ? C.pulls[i + 1].t - (C.pulls[i + 1].t - p.t >= 2 ? 0.55 : 0.45) : C.wide + 0.1), boot: p.st === 5 && p.no === 487 }))];
  reveals.forEach((r, i) => { r.el = mk('name' + (r.boot ? ' boot' : ''), ''); r.i = i; add(r.el, r.t, r.t1, 'name'); });
  const count = mk('count', ''); add(count, C.pulls[0].t + 0.1, C.wide, 'count');
  add(mk('badge', 'CANAL STREET BOOTLEG<small>THE RAREST PULL IN THE CASE</small>'), C.pulls[C.pulls.length - 1].t + 0.08, C.wide + 0.3, 'badge');
  add(mk('wide', '111 KEYSTONE WORKS.'), C.w1, C.w2 - 0.05, 'wide');
  add(mk('wide', '163 PAINTED STATES.'), C.w2, C.w3 - 0.05, 'wide');
  add(mk('wide', 'ONE PULL AT A TIME.'), C.w3, C.back + 0.5, 'wide');
  add(mk('cap', 'TURN IT AROUND.'), C.back + 0.6, C.tag - 0.05, 'cap');
  add(mk('slam', '<span style="font-size:170px">ONE LAST TIME.</span>'), C.last_line, C.final - 0.04, 'slam');
  const flash2 = mk('flash', ''); add(flash2, C.final, C.final + 0.25, 'flash');
  add(mk('shade', ''), C.end_card - 0.2, 99, 'shade');
  add(mk('end', `<div><span class="bg">BREAK GLASS</span></div><div class="by">A NEW YORKERS 1/1 BY MLow</div><div class="url">n3wyorkers.com/breakglass</div>${logo ? `<img src="${logo}" alt="">` : ''}`), C.end_card, 99, 'end');

  function fillName(r) {
    const c = SNAP[r.i]; if (!c || r.filled === c) return;
    r.filled = c;
    r.el.innerHTML = `<div class="no">NO. ${String(c.no).padStart(4, '0')}</div><div class="ti">${c.t}</div><div class="od">${['', 'KEYSTONE STATE', 'ALTERNATE STATE', 'CANAL STREET BOOTLEG'][c.tier]} . 1 IN ${c.odds}</div>`;
  }

  function type(t) {
    for (const x of T) {
      const el = x.el, on = t >= x.t0 && t < x.t1;
      if (!on) { el.style.opacity = 0; continue; }
      const u = t - x.t0, left = x.t1 - t;
      if (x.kind === 'stack') {
        const r1 = el.querySelector('.r1'), r2 = el.querySelector('.r2');
        const k1 = E.in(prog(u, 0, 0.35)), k2 = E.in(prog(t, C.emergency, 0.3));
        r1.style.clipPath = `inset(0 ${100 - k1 * 100}% 0 0)`;
        r2.style.opacity = t >= C.emergency ? 1 : 0; r2.style.transform = `scale(${lerp(1.18, 1, k2)})`; r2.style.transformOrigin = 'left center'; r2.style.display = 'block';
        el.style.opacity = left < 0.08 ? left / 0.08 : 1;
      } else if (x.kind === 'cap') {
        const k = E.in(prog(u, 0, 0.28));
        el.style.opacity = left < 0.1 ? left / 0.1 : 1; el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`;
      } else if (x.kind === 'slam') {
        const k = prog(u, 0, 5 / 30), s = lerp(1.22, 1, E.in(k));
        el.style.opacity = left < 0.06 ? 0 : 1; el.style.transform = `translate(-50%,-50%) scale(${s})`;
      } else if (x.kind === 'flash') {
        el.style.opacity = 0.85 * (1 - E.in(prog(u, 0, x.t1 - x.t0)));
      } else if (x.kind === 'name') {
        const r = reveals.find(q => q.el === el); fillName(r);
        const k = E.in(prog(u, 0, 0.32));
        el.style.opacity = left < 0.12 ? left / 0.12 : 1; el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`;
      } else if (x.kind === 'count') {
        const n = reveals.filter(q => q.i > 0 && t >= q.t).length + 1;
        el.textContent = `PULL ${String(n).padStart(2, '0')}`; el.style.opacity = 1;
      } else if (x.kind === 'badge') {
        const k = prog(u, 0, 5 / 30); el.style.opacity = left < 0.1 ? left / 0.1 : 1; el.style.transform = `rotate(-3deg) scale(${lerp(1.3, 1, E.in(k))})`;
      } else if (x.kind === 'wide') {
        const k = E.in(prog(u, 0, 0.3)); el.style.opacity = left < 0.08 ? left / 0.08 : 1; el.style.clipPath = `inset(0 ${100 - k * 100}% 0 0)`;
      } else if (x.kind === 'shade') {
        el.style.opacity = E.in(prog(u, 0, 0.6));
      } else if (x.kind === 'end') {
        const kb = E.in(prog(u, 0, 0.45)), kl = E.in(prog(u, 0.35, 0.4)), ku = E.in(prog(u, 0.7, 0.4)), ki = E.in(prog(u, 1.0, 0.4));
        el.style.opacity = 1;
        el.querySelector('.bg').style.clipPath = `inset(0 ${100 - kb * 100}% 0 0)`;
        el.querySelector('.by').style.opacity = kl; el.querySelector('.url').style.opacity = ku;
        const im = el.querySelector('img'); if (im) im.style.opacity = ki;
        const s = 1 + 0.02 * E.move(cl(u / 5.5)); el.style.transform = `scale(${s})`;
      }
    }
  }

  // ---------- one frame ----------
  window.__frame = (t, dt) => {
    while (ei < EV.length && EV[ei][0] <= t + 1e-6) EV[ei++][1]();
    window.__cam = cam(t);
    const sim = dt * speed(t), n = Math.max(1, Math.ceil(sim / 0.045));
    for (let i = 0; i < n; i++) window.__tick(sim / n);
    type(t);
    return { state: F.state, ready: F.ready(), hits: F.hits };
  };
  EV.sort((a, b) => a[0] - b[0]);
  window.__filmReady = true;
})();

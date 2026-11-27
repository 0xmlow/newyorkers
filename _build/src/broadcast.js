// THE GARDEN broadcast: the camera grammar from astra_plan.md section F and the graphics package over it.
// Every camera is a pure function of game time and frame shape, so a capture at any moment is repeatable:
// main (high side, tracks possession), baseline (85 mm, the end being attacked), backboard (behind and over the glass),
// bridge (from the hanging bridge), crowd (a long lens on the front rows), handheld (sideline, moving with play), iso (one player).
// Graphics: a score bug (#101722, #F2EFE8, #2962FF), a REPLAY marker, a lower third, a hook line, one skyline wipe, an end card.
import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;
const LENS = { tight: 135, main: 45, baseline: 85, backboard: 20, bridge: 32, crowd: 120, handheld: 50, iso: 85 };

export function makeBroadcast({ camera, replay: R, game }) {
  const look = new THREE.Vector3(), pos = new THREE.Vector3(), tmp = [0, 0, 0], tmpA = [0, 0, 0];
  // a smoothed ball: the mean of the timeline ball over a short window, weighted to what comes next (a camera operator leads the play)
  function smoothBall(t, back = 0.7, fwd = 0.35, out = look) {
    let x = 0, y = 0, z = 0, w = 0;
    for (let k = 0; k <= 12; k++) { const s = t - back + (back + fwd) * k / 12, q = 1 - Math.abs(k - 8) / 13; R.ballApprox(s, tmp); x += tmp[0] * q; y += tmp[1] * q; z += tmp[2] * q; w += q; }
    return out.set(x / w, y / w, z / w);
  }
  function attackDir(t) { const c = R.clockAt(t); return R.attackDir(R.offAt(t), c.q); }
  // framing: the width of floor to keep in frame at the subject, by camera and shape (portrait keeps less width, more height)
  const WIDTH = { tight: [9, 6.5, 5.2], main: [20, 11, 7.2], baseline: [7.5, 5.5, 4.2], backboard: [15, 11, 9], bridge: [30, 20, 16], crowd: [9, 6.5, 5], handheld: [8, 6, 4.4], iso: [3.6, 3.0, 2.4] };
  const state = { cam: 'main', iso: null, fovMul: 1, roll: 0 };
  function frame(width, dist, aspect) { // vertical fov that holds `width` metres at `dist`
    const hf = 2 * Math.atan(width / 2 / Math.max(7, dist)); return Math.min(aspect < 0.8 ? 58 : 50, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hf / 2) / aspect)));
  }
  function shapeIdx(aspect) { return aspect > 1.2 ? 0 : aspect > 0.8 ? 1 : 2; }
  function apply(t, aspect = camera.aspect, which = state.cam) {
    const si = shapeIdx(aspect); let fov = 30, roll = 0;
    if (which === 'main') {
      smoothBall(t, 0.9, 0.4); const tx = clamp(look.x, -13, 13);
      pos.set(clamp(tx * 0.3, -5, 5), 9, -22); look.set(tx, 1.2 + look.y * 0.12, clamp(look.z * 0.8, -6, 6));
      fov = frame(WIDTH.main[si], pos.distanceTo(look), aspect);
    } else if (which === 'baseline') {
      const d = attackDir(t); smoothBall(t, 0.5, 0.3);
      // the corner away from the play, so a corner shooter is never on top of the lens
      const zs = smoothBall(t, 2.5, 0, pos).z, side = zs > 0.3 ? -1 : zs < -0.3 ? 1 : d; smoothBall(t, 0.5, 0.3);
      pos.set(d * 14.75, 1.35, side * 5.2); look.set(clamp(look.x, -14, 14), clamp(look.y * 0.3 + 1.0, 1.1, 2.0), look.z);
      fov = frame(WIDTH.baseline[si], pos.distanceTo(look), aspect);
    } else if (which === 'backboard') {
      const d = attackDir(t); smoothBall(t, 0.6, 0.3);
      pos.set(d * 13.45, 5.7, 1.5); look.set(d * 8.4 + (look.x - d * 8.4) * 0.6, 0.3, look.z * 0.6);
      fov = frame(WIDTH.backboard[si], pos.distanceTo(look), aspect);
    } else if (which === 'tight') {
      // the replay lens: from the main position, close on the ball and the shooter, a short smoothing window
      smoothBall(t, 0.35, 0.25); const tx = clamp(look.x, -14, 14);
      pos.set(clamp(tx * 0.45, -7, 7), 7.5, -19.5); look.set(tx, clamp(look.y * 0.45 + 0.8, 1.0, 2.6), clamp(look.z, -7.5, 7.5));
      fov = frame(WIDTH.tight[si], pos.distanceTo(look), aspect);
    } else if (which === 'bridge') {
      smoothBall(t, 1.2, 0.5); pos.set(clamp(look.x * 0.4, -10, 10), 20.5, 24); look.set(clamp(look.x, -12, 12) * 0.85, 0, look.z * 0.5);
      fov = frame(WIDTH.bridge[si], pos.distanceTo(look), aspect);
    } else if (which === 'crowd') {
      // across the floor from the bench side, a long lens on the front rows behind the far sideline
      smoothBall(t, 1.5, 0.2); const cx = clamp(look.x * 0.2, -4, 4);
      pos.set(cx + 3, 1.55, -8.4); look.set(cx - 2.5, 2.4, 11.5);
      fov = frame(WIDTH.crowd[si], pos.distanceTo(look), aspect);
    } else if (which === 'handheld') {
      smoothBall(t, 1.0, 0.25); const sh = Math.sin(t * 2.1) * 0.035 + Math.sin(t * 3.7 + 1) * 0.02, sv = Math.sin(t * 2.9 + 2) * 0.025;
      pos.set(clamp(look.x * 0.8, -12, 12) + sh, 1.6 + sv, -8.05); look.set(clamp(look.x, -14, 14), 1.25 + look.y * 0.1, look.z);
      roll = Math.sin(t * 1.3) * 0.012; fov = frame(WIDTH.handheld[si], pos.distanceTo(look), aspect);
    } else if (which === 'iso') {
      const a = state.iso ?? 0; R.actor(t, a, tmpA); R.actor(t - 0.5, a, tmp);
      look.set(tmpA[0], 1.45, tmpA[1]); const side = look.z > 0 ? 1 : -1;
      pos.set(tmpA[0] - 2.5, 1.7, look.z - side * 7.5); fov = frame(WIDTH.iso[si], pos.distanceTo(look), aspect);
    }
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look);
    if (roll) camera.rotateZ(roll);
    camera.fov = clamp(fov * state.fovMul, 4, 80); camera.aspect = aspect; camera.updateProjectionMatrix();
  }

  // ---------- the graphics, as DOM over the canvas
  const css = `
body.capture #hud,body.capture #intro,body.capture #bars,body.capture #ride,body.capture #card,body.capture #stick,body.capture #toast{display:none!important}
#bc{position:fixed;inset:0;pointer-events:none;z-index:30;font-family:Archivo,system-ui,sans-serif;color:#F2EFE8;--u:min(1vw,1vh)}
#bc .bug{position:absolute;display:flex;align-items:stretch;background:#101722;border-radius:calc(var(--u)*.9);overflow:hidden;box-shadow:0 calc(var(--u)*.6) calc(var(--u)*3) rgba(0,0,0,.45);font-size:calc(var(--u)*2.6)}
#bc .tm{display:flex;align-items:center;gap:calc(var(--u)*1.1);padding:calc(var(--u)*.9) calc(var(--u)*1.4);position:relative}
#bc .tm i{width:calc(var(--u)*1.2);align-self:stretch;border-radius:2px;display:block}
#bc .tm b{font:400 1em Anton,Impact,sans-serif;letter-spacing:.04em}
#bc .tm s{text-decoration:none;font:400 1.45em Anton,Impact,sans-serif;min-width:2.1em;text-align:right;font-variant-numeric:tabular-nums}
#bc .tm.on::after{content:"";position:absolute;left:0;right:0;bottom:0;height:calc(var(--u)*.55);background:#2962FF}
#bc .tm.flash{background:#2962FF}
#bc .clk{display:flex;align-items:center;gap:calc(var(--u)*1.2);padding:0 calc(var(--u)*1.5);border-left:1px solid rgba(242,239,232,.14);font:600 1em "JetBrains Mono",monospace;font-variant-numeric:tabular-nums}
#bc .clk em{font-style:normal;color:#9aa3b8;font-weight:500}
#bc .sc{color:#101722;background:#F2EFE8;border-radius:calc(var(--u)*.5);padding:calc(var(--u)*.2) calc(var(--u)*.6);font-weight:700}
#bc .sc.lo{background:#2962FF;color:#F2EFE8}
#bc .rp{position:absolute;display:none;align-items:center;gap:calc(var(--u)*1);background:#2962FF;color:#F2EFE8;font:400 calc(var(--u)*3) Anton,Impact,sans-serif;letter-spacing:.12em;padding:calc(var(--u)*.7) calc(var(--u)*1.6);border-radius:calc(var(--u)*.8)}
#bc .rp small{font:600 calc(var(--u)*1.8) "JetBrains Mono",monospace;letter-spacing:.05em;opacity:.85}
#bc .rp.on{display:flex}
#bc .lt{position:absolute;display:flex;align-items:stretch;opacity:0;transform:translateX(-4%);background:#101722;border-radius:calc(var(--u)*.9);overflow:hidden;box-shadow:0 calc(var(--u)*.6) calc(var(--u)*3) rgba(0,0,0,.45)}
#bc .lt .n{display:grid;place-items:center;min-width:calc(var(--u)*9);font:400 calc(var(--u)*6) Anton,Impact,sans-serif}
#bc .lt .t{padding:calc(var(--u)*1.2) calc(var(--u)*2.2) calc(var(--u)*1.2) calc(var(--u)*1.8);display:flex;flex-direction:column;justify-content:center;gap:calc(var(--u)*.4)}
#bc .lt .nm{font:400 calc(var(--u)*4.4)/1 Anton,Impact,sans-serif;letter-spacing:.03em}
#bc .lt .sub{font:600 calc(var(--u)*1.9) Archivo,sans-serif;letter-spacing:.12em;color:#c9cfdc;text-transform:uppercase}
#bc .lt .st{font:600 calc(var(--u)*2.1) "JetBrains Mono",monospace;color:#F2EFE8}
#bc .lt .st b{color:#7da2ff;font-weight:700}
#bc .hk{position:absolute;left:6%;right:6%;text-align:center;opacity:0;font:400 calc(var(--u)*7.4)/1.02 Anton,Impact,sans-serif;letter-spacing:.02em;color:#F2EFE8;text-shadow:0 calc(var(--u)*.4) calc(var(--u)*2.4) rgba(0,0,0,.75)}
#bc .hk span{display:inline-block;background:#101722;padding:calc(var(--u)*.6) calc(var(--u)*1.6);border-radius:calc(var(--u)*.6);margin:calc(var(--u)*.3) 0}
#bc .hk span.b{background:#2962FF}
#bc .wp{position:absolute;left:0;right:0;top:0;height:185vh;transform:translateY(100vh)}
#bc .wp svg{display:block;width:100%;height:25vh}#bc .wp div{height:160vh;background:#101722;margin-top:-1px}
#bc .end{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(var(--u)*2);opacity:0;background:rgba(10,14,22,.62)}
#bc .end .f{font:600 calc(var(--u)*2.2) "JetBrains Mono",monospace;letter-spacing:.3em;color:#9aa3b8}
#bc .end .s{display:flex;gap:calc(var(--u)*4);align-items:center;font:400 calc(var(--u)*5.2) Anton,Impact,sans-serif;letter-spacing:.03em}
#bc .end .s div{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*.6)}
#bc .end .s b{font-weight:400;font-size:2.1em;line-height:.9;font-variant-numeric:tabular-nums}
#bc .end .s .w b{color:#F2EFE8}#bc .end .s .l b{color:#7f889c}
#bc .end .br{margin-top:calc(var(--u)*3);font:400 calc(var(--u)*2.6) "N3W Skyline",Anton,sans-serif;letter-spacing:.14em;color:#F2EFE8;opacity:.9}
#bc .end .br small{display:block;text-align:center;font:500 calc(var(--u)*1.6) Archivo,sans-serif;letter-spacing:.08em;color:#9aa3b8;margin-top:calc(var(--u)*.8)}
`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'bc'; document.body.appendChild(root);
  const T = R.teams;
  root.innerHTML = `<div class="bug"><div class="tm" data-t="0"><i></i><b></b><s>0</s></div><div class="tm" data-t="1"><i></i><b></b><s>0</s></div><div class="clk"><em class="q">1ST</em><span class="c">12:00</span><span class="sc">24</span></div></div>
<div class="rp">REPLAY <small>0.4x</small></div>
<div class="lt"><div class="n"></div><div class="t"><div class="nm"></div><div class="sub"></div><div class="st"></div></div></div>
<div class="hk"></div><div class="end"></div>
<div class="wp"><svg viewBox="0 0 100 25" preserveAspectRatio="none">${skyline()}</svg><div></div></div>`;
  const $ = (s) => root.querySelector(s), tms = [...root.querySelectorAll('.tm')];
  tms.forEach((el, i) => { el.querySelector('i').style.background = T[i].kit.jersey === '#0B0B0E' ? T[i].kit.num : T[i].kit.jersey; el.querySelector('i').style.boxShadow = `inset 0 0 0 1px ${T[i].kit.trim}`; el.querySelector('b').textContent = T[i].id; });
  const ord = (q) => (q <= 4 ? ['1ST', '2ND', '3RD', '4TH'][q - 1] : q === 5 ? 'OT' : (q - 4) + 'OT');
  const fmt = (c) => (c < 60 ? c.toFixed(1) : Math.floor(c / 60) + ':' + String(Math.floor(c % 60)).padStart(2, '0'));
  const G = { bug: true, replay: false, speed: 0.4, lower: null, lowerT: 0, hook: null, hookT: 0, wipe: 0, end: 0, flash: 0 };
  function layout(aspect) {
    const bug = $('.bug').style, rp = $('.rp').style, lt = $('.lt').style, hk = $('.hk').style;
    for (const s of [bug, rp, lt, hk]) s.left = s.right = s.top = s.bottom = '';
    if (aspect > 1.2) { bug.left = '3.2%'; bug.bottom = '6%'; rp.right = '3.2%'; rp.top = '6%'; lt.left = '3.2%'; lt.bottom = '15%'; hk.top = '9%'; }
    else if (aspect > 0.8) { bug.left = '4%'; bug.top = '4.5%'; rp.right = '4%'; rp.top = '4.5%'; lt.left = '4%'; lt.bottom = '7%'; hk.top = '18%'; }
    else { bug.left = '50%'; bug.top = '6%'; bug.transform = 'translateX(-50%) scale(1.3)'; bug.transformOrigin = '50% 0'; rp.right = '5%'; rp.top = '13.5%'; lt.left = '5%'; lt.bottom = '16%'; hk.top = '22%'; }
    if (aspect > 0.8) bug.transform = '';
  }
  let lastAspect = 0;
  function update(t) {
    const a = innerWidth / innerHeight; if (Math.abs(a - lastAspect) > 0.01) { lastAspect = a; layout(a); }
    const s = R.scoreAt(t), c = R.clockAt(t), off = R.offAt(t), fin = R.finalAt(t);
    $('.bug').style.display = G.bug ? 'flex' : 'none';
    tms.forEach((el, i) => { el.querySelector('s').textContent = s[i]; el.classList.toggle('on', !fin && off === i); el.classList.toggle('flash', G.flash > 0 && G.flashTeam === i); });
    $('.q').textContent = fin ? 'FINAL' : ord(c.q); $('.c').textContent = fin ? '' : fmt(c.clock);
    const sc = $('.sc'); sc.style.display = fin || c.shot < 0 || c.shot >= c.clock + 0.5 ? 'none' : ''; sc.textContent = c.shot < 5 ? c.shot.toFixed(1) : Math.ceil(c.shot); sc.classList.toggle('lo', c.shot < 5);
    $('.rp').classList.toggle('on', !!G.replay); $('.rp small').textContent = G.speed + 'x';
    const lt = $('.lt'); if (G.lower) { const L = G.lower, k = G.lowerT, e = k < 0.15 ? k / 0.15 : k > 0.85 ? (1 - k) / 0.15 : 1;
      lt.style.opacity = clamp(e, 0, 1); lt.style.transform = `translateX(${(1 - clamp(e, 0, 1)) * -4}%)`;
      const n = lt.querySelector('.n'); n.textContent = '#' + L.num; n.style.background = L.kit.jersey; n.style.color = L.kit.num; n.style.boxShadow = `inset -${3}px 0 0 ${L.kit.trim}`;
      lt.querySelector('.nm').textContent = L.name; lt.querySelector('.sub').textContent = L.sub; lt.querySelector('.st').innerHTML = L.stat || ''; } else lt.style.opacity = 0;
    const hk = $('.hk'); if (G.hook) { const k = G.hookT, e = k < 0.12 ? k / 0.12 : k > 0.86 ? (1 - k) / 0.14 : 1; hk.style.opacity = clamp(e, 0, 1); hk.style.transform = `translateY(${(1 - clamp(e, 0, 1)) * 12}px)`;
      if (hk.dataset.txt !== G.hook.join('|')) { hk.dataset.txt = G.hook.join('|'); hk.innerHTML = G.hook.map((l, i) => `<span class="${i === G.hook.length - 1 ? 'b' : ''}">${l}</span>`).join('<br>'); } } else hk.style.opacity = 0;
    // the wipe: the skyline rises over the frame and carries on up, 0 to 1 over 0.35 to 0.5 s
    $('.wp').style.transform = `translateY(${100 - G.wipe * 285}vh)`;   // fully covered from 0.44 to 0.65: cut there
    const end = $('.end'); end.style.opacity = G.end; if (G.end > 0 && !end.dataset.on) { end.dataset.on = 1; const w = s[0] > s[1] ? 0 : 1;
      end.innerHTML = `<div class="f">${fin ? 'FINAL' : ord(c.q) + ' ' + fmt(c.clock)} · THE GARDEN</div><div class="s">${[0, 1].map((i) => `<div class="${i === w ? 'w' : 'l'}">${T[i].name}<b>${s[i]}</b></div>`).join('')}</div><div class="br">N3W YORKERS<small>by MLow</small></div>`; }
    if (G.end <= 0) delete end.dataset.on;
  }
  return { apply, update, state, gfx: G, set: (o) => Object.assign(G, o), cam: (c, o = {}) => Object.assign(state, { cam: c }, o), LENS, smoothBall, root };
}

function skyline() { // a run of towers across the width, one spire, in the score bug navy with a blue cap line
  const H = [11, 15, 9, 17, 13, 6, 19, 10, 14, 8, 15.5, 12, 18, 9.5, 13.5, 7, 16.5, 11];
  let x = 0, k = 0, top = 'M0 25 ';
  while (x < 100) { const w = 4 + (k * 37 % 5), y = 25 - H[k % H.length]; top += `L${x} ${y} `; if (k === 6) top += `L${x + w / 2 - 0.5} ${y} L${x + w / 2} ${y - 5} L${x + w / 2 + 0.5} ${y} `; top += `L${x + w} ${y} `; x += w; k++; }
  return `<path d="${top} L100 25 Z" fill="#101722"/><path d="${top}" fill="none" stroke="#2962FF" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
}

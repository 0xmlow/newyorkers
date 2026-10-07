/* ---------------- NEW YORK TIME, SUN AND MOON (ported from Marfa Light, src/00-core.js) ----------------
   The island sits off Liberty Island. Every visitor sees the harbour's real sky for the minute they look:
   the sun and moon are computed for 40.69 N, 74.04 W, the clock is Eastern with daylight saving. */
const D2R = PI / 180, R2D = 180 / PI, LAT = 40.6892, LONW = -74.0445, SPHI = Math.sin(LAT * D2R), CPHI = Math.cos(LAT * D2R);
function daysFromCivil(y, m, d) {
  y -= (m <= 2) ? 1 : 0; const era = Math.floor(y / 400), yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1, doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}
function civilFromDays(z) {
  z += 719468; const era = Math.floor(z / 146097), doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400, doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153), d = doy - Math.floor((153 * mp + 2) / 5) + 1, m = mp + (mp < 10 ? 3 : -9);
  return [y + (m <= 2 ? 1 : 0), m, d];
}
const weekday = days => (((days % 7) + 7) % 7 + 4) % 7; // 0 is Sunday
function nthSunday(y, m, n) { const d1 = daysFromCivil(y, m, 1); return d1 + ((7 - weekday(d1)) % 7) + 7 * (n - 1); }
// US Eastern: daylight time from 2:00 on the second Sunday in March to 2:00 on the first Sunday in November
function nycOffset(utc) { const y = civilFromDays(Math.floor(utc / 86400))[0], s = nthSunday(y, 3, 2) * 86400 + 7 * 3600, e = nthSunday(y, 11, 1) * 86400 + 6 * 3600; return (utc >= s && utc < e) ? -4 : -5; }
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'], DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
function nycTime(utc) {
  const off = nycOffset(utc), l = utc + off * 3600, days = Math.floor(l / 86400), sec = l - days * 86400, ymd = civilFromDays(days);
  return { utc, off, zone: off === -4 ? 'EDT' : 'EST', days, y: ymd[0], mo: ymd[1], d: ymd[2], sec, h: Math.floor(sec / 3600), m: Math.floor(sec / 60) % 60, hours: sec / 3600, wd: weekday(days) };
}
function nycUtc(y, mo, d, h, mi) { const g = daysFromCivil(y, mo, d) * 86400 + h * 3600 + mi * 60 + 5 * 3600; return g + (-5 - nycOffset(g)) * 3600; }
const jdn = utc => utc / 86400 + 2440587.5;
function lst(utc) { const n = jdn(utc) - 2451545.0, g = (18.697374558 + 24.06570982441908 * n) % 24; return (((g * 15 + LONW) % 360) + 360) % 360 * D2R; }
function altAz(ra, dec, Lr) { const H = Lr - ra; const el = Math.asin(SPHI * Math.sin(dec) + CPHI * Math.cos(dec) * Math.cos(H)) * R2D; const az = Math.atan2(-Math.sin(H), Math.tan(dec) * CPHI - SPHI * Math.cos(H)) * R2D; return { el, az: (az + 360) % 360 }; }
function sunPos(utc) {
  const n = jdn(utc) - 2451545.0, Ls = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * D2R;
  const lam = (Ls + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R, eps = 23.439 * D2R;
  return altAz(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), Math.asin(Math.sin(eps) * Math.sin(lam)), lst(utc));
}
// the moon, after Paul Schlyter's low precision method
function moonPos(utc) {
  const d = jdn(utc) - 2451543.5, N = (125.1228 - 0.0529538083 * d) * D2R, inc = 5.1454 * D2R, w = (318.0634 + 0.1643573223 * d) * D2R, a = 60.2666, e = 0.0549;
  const M = ((115.3654 + 13.0649929509 * d) % 360) * D2R; let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 3; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xv = a * (Math.cos(E) - e), yv = a * Math.sqrt(1 - e * e) * Math.sin(E), v = Math.atan2(yv, xv), r = Math.sqrt(xv * xv + yv * yv);
  const xh = r * (Math.cos(N) * Math.cos(v + w) - Math.sin(N) * Math.sin(v + w) * Math.cos(inc)), yh = r * (Math.sin(N) * Math.cos(v + w) + Math.cos(N) * Math.sin(v + w) * Math.cos(inc)), zh = r * Math.sin(v + w) * Math.sin(inc);
  let lon = Math.atan2(yh, xh) * R2D, lat = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)) * R2D;
  const Ms = (356.0470 + 0.9856002585 * d) % 360, ws = 282.9404 + 4.70935e-5 * d, Lsun = Ms + ws, Mm = M * R2D, Lm = N * R2D + w * R2D + Mm, Dd = Lm - Lsun, F = Lm - N * R2D, s = x => Math.sin(x * D2R);
  lon += -1.274 * s(Mm - 2 * Dd) + 0.658 * s(2 * Dd) - 0.186 * s(Ms) - 0.059 * s(2 * Mm - 2 * Dd) - 0.057 * s(Mm - 2 * Dd + Ms) + 0.053 * s(Mm + 2 * Dd) + 0.046 * s(2 * Dd - Ms) + 0.041 * s(Mm - Ms) - 0.035 * s(Dd) - 0.031 * s(Mm + Ms) - 0.015 * s(2 * F - 2 * Dd) + 0.011 * s(Mm - 4 * Dd);
  lat += -0.173 * s(F - 2 * Dd) - 0.055 * s(Mm - F - 2 * Dd) - 0.046 * s(Mm + F - 2 * Dd) + 0.033 * s(F + 2 * Dd) + 0.017 * s(2 * Mm + F);
  const ecl = (23.4393 - 3.563e-7 * d) * D2R, lo = lon * D2R, la = lat * D2R, xe = Math.cos(la) * Math.cos(lo), ye = Math.cos(la) * Math.sin(lo), ze = Math.sin(la);
  const y2 = ye * Math.cos(ecl) - ze * Math.sin(ecl), z2 = ye * Math.sin(ecl) + ze * Math.cos(ecl);
  const p = altAz(Math.atan2(y2, xe), Math.atan2(z2, Math.sqrt(xe * xe + y2 * y2)), lst(utc));
  const dl = ((lon - Lsun) % 360 + 360) % 360, elong = Math.acos(Math.cos(dl * D2R) * Math.cos(la));
  p.illum = (1 - Math.cos(elong)) / 2; p.waxing = dl < 180; p.age = dl / 360; return p;
}
function moonName(m) { const a = m.age; if (a < 0.03 || a > 0.97) return 'NEW MOON'; if (a < 0.22) return 'WAXING CRESCENT'; if (a < 0.28) return 'FIRST QUARTER'; if (a < 0.47) return 'WAXING GIBBOUS'; if (a < 0.53) return 'FULL MOON'; if (a < 0.72) return 'WANING GIBBOUS'; if (a < 0.78) return 'LAST QUARTER'; return 'WANING CRESCENT'; }
// +x east, +y up, -z north: the island's own frame
const dirAzEl = (az, el, out) => (out || new V3()).set(Math.cos(el * D2R) * Math.sin(az * D2R), Math.sin(el * D2R), -Math.cos(el * D2R) * Math.cos(az * D2R));
const _st = {};
function sunTimes(t) {
  if (_st[t.days]) return _st[t.days]; const base = t.days * 86400 - t.off * 3600; let prev = null, rise = null, set = null;
  for (let m = 0; m <= 1440; m += 5) { const el = sunPos(base + m * 60).el + 0.833; if (prev !== null) { if (prev < 0 && el >= 0) rise = m - 5 + 5 * (-prev / (el - prev)); if (prev >= 0 && el < 0) set = m - 5 + 5 * (prev / (prev - el)); } prev = el; }
  return (_st[t.days] = { rise: rise === null ? 360 : rise, set: set === null ? 1140 : set });
}
const pad2 = n => (n < 10 ? '0' : '') + n, hhmm = mm => pad2(Math.floor(mm / 60) % 24) + ':' + pad2(Math.round(mm) % 60);
const TIME = { mode: 'live', utc: Date.now() / 1000, shift: 0, gmT: 0, gmPrev: 'live', lastKey: 0 };
function tickTime(dt) {
  if (TIME.gmT > 0) { TIME.gmT -= dt; TIME.utc += dt * 900; if (TIME.gmT <= 0) TIME.mode = TIME.gmPrev; return; }
  if (TIME.mode === 'live') TIME.utc = Date.now() / 1000 + TIME.shift; else if (TIME.mode === 'lapse') TIME.utc += dt * 900; // a day in 96 seconds
}
function shiftTime(sec) { if (TIME.mode === 'live') TIME.shift += sec; else TIME.utc += sec; }
function jumpLocal(min) { const t = nycTime(TIME.utc); TIME.mode = 'fixed'; TIME.utc = nycUtc(t.y, t.mo, t.d, 0, 0) + min * 60; }

/* sky state: four FLORA photographs of one harbour, crossfaded by the sun's real elevation */
const SKY = { el: 0, az: 0, w: new THREE.Vector4(1, 0, 0, 0), sun: null, moon: null, sunDir: new V3(), moonDir: new V3(), t: null };
const PCOL = {}; ['golden', 'dawn', 'day', 'night'].forEach(p => { PCOL[p] = {}; COLOR_KEYS.forEach(k => PCOL[p][k] = new THREE.Color(PRESETS[p][k])); });
const _mix = {}; COLOR_KEYS.forEach(k => _mix[k] = new THREE.Color()); const _grey = new THREE.Color();
function skyWeights(el) {
  const day = smooth(7, 26, el), gold = (1 - day) * smooth(-3, 5, el), twi = (1 - day - gold) * smooth(-14, -3, el);
  return [gold, twi, day, Math.max(0, 1 - day - gold - twi)];
}
function updateSky(dt) {
  const s = sunPos(TIME.utc), m = moonPos(TIME.utc); SKY.sun = s; SKY.moon = m; SKY.el = s.el; SKY.t = nycTime(TIME.utc);
  let w = skyWeights(s.el);
  const inSummer = Math.hypot(P.x - SUMMER.x, P.z - SUMMER.z) < SUMMER.r;
  if (inSummer && w[2] < 0.9) { w = [0, 0, 1, 0]; if (!state.summerNote) { state.summerNote = true; toast('SUMMER.JPG. WEATHER UPDATES DISABLED. IT IS ALWAYS NOON HERE.'); } } else if (!inSummer) state.summerNote = false;
  const pk = ['golden', 'dawn', 'day', 'night'];
  COLOR_KEYS.forEach(k => { _mix[k].setRGB(0, 0, 0); pk.forEach((p, i) => { _mix[k].r += PCOL[p][k].r * w[i]; _mix[k].g += PCOL[p][k].g * w[i]; _mix[k].b += PCOL[p][k].b * w[i]; }); });
  const tgt = {}; NUM_KEYS.forEach(k => tgt[k] = pk.reduce((a, p, i) => a + PRESETS[p][k] * w[i], 0));
  const wx = WX, fogK = Math.max(wx.fog, wx.wet * 0.55, wx.snow * 0.5), dark = Math.max(wx.wet, wx.snow * 0.6, wx.fog * 0.7);
  if (inSummer) { tgt.lamps = 0; }
  // weather: fog closes the harbour, rain dims the sun and lights the lamps early
  _grey.setScalar(0.62 * (0.25 + 0.75 * (w[2] + w[0] * 0.8 + w[1] * 0.5)));
  _mix.fog.lerp(_grey, fogK * 0.85); tgt.near = tgt.near * (1 - fogK) + 10 * fogK; tgt.far = tgt.far * (1 - fogK) + 150 * fogK;
  tgt.sunI *= 1 - 0.6 * dark; tgt.lamps = Math.min(1, tgt.lamps + 0.5 * dark);
  const k = 1 - Math.exp(-dt * (TIME.gmT > 0 || TIME.mode === 'lapse' ? 12 : 3));
  COLOR_KEYS.forEach(c => L[c].lerp(_mix[c], k)); NUM_KEYS.forEach(n => L[n] += (tgt[n] - L[n]) * k);
  panoMat.uniforms.w.value.set(w[0], w[1], w[2], w[3]).lerp(SKY.w, 0); SKY.w.set(w[0], w[1], w[2], w[3]);
  panoMat.uniforms.tint.value.setScalar(1 - 0.35 * dark).lerp(_grey.setScalar(0.75), fogK * 0.55);
  // the key light: the sun while it is up, the moon after, never from under the sea
  dirAzEl(s.az, s.el, SKY.sunDir); dirAzEl(m.az, m.el, SKY.moonDir);
  const target = s.el > -3 ? dirAzEl(s.az, Math.max(s.el, 7), _p2) : (m.el > 8 ? SKY.moonDir : _p2.set(0.3, 0.85, 0.35).normalize());
  L.dir.lerp(target, k).normalize();
  applyLight();
}
function setPreset(name, quiet) {
  const t = nycTime(TIME.utc), st = sunTimes(t);
  if (name === 'golden') jumpLocal(st.set - 40); else if (name === 'day') jumpLocal(12 * 60 + 30); else if (name === 'night') jumpLocal(23 * 60 + 30); else if (name === 'dawn') jumpLocal(st.rise - 20);
  else if (name === 'live') { TIME.mode = 'live'; TIME.shift = 0; } else if (name === 'lapse') TIME.mode = TIME.mode === 'lapse' ? 'fixed' : 'lapse';
  if (TIME.mode !== 'live' && TIME.mode !== 'lapse') TIME.mode = 'fixed';
  if (!quiet) toast(name === 'live' ? 'LIVE. THE REAL SKY OVER NEW YORK HARBOUR, RIGHT NOW.' : name === 'lapse' ? (TIME.mode === 'lapse' ? 'TIME-LAPSE: A DAY IN 96 SECONDS.' : 'TIME HELD.') : 'JUMPED TO ' + (name === 'day' ? 'NOON' : name.toUpperCase()) + ' TODAY. L FOR LIVE.', 'blue');
  syncTimeButtons();
}
function syncTimeButtons() { document.querySelectorAll('[data-p]').forEach(b => b.classList.toggle('on', b.dataset.p === (TIME.mode === 'live' ? 'live' : TIME.mode === 'lapse' ? 'lapse' : ''))); }

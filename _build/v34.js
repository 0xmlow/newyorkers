/* ================================================================
   v34 THE JOURNAL AND THE PHONE (2026-11-22)
   - SECRETS.EXE: a window in the island's own Win98 style (J, the Start menu, or the BOOK button on phones) that
     lists every secret, found ones by name and unfound ones as ??? with a hint, plus the running tallies: golden
     slices, fresh cards, buckets, fetches, the CATCH record.
   - PHONES: a TYPE button opens the word box (the eggs are words, and a phone has no keyboard until asked), plus
     RADIO, PHOTO and BOOK buttons. The heaviest night effects (searchlights, festoon halo, the constellation lines)
     are lighter on phones and the Impermanent Vision paint draws fewer lines in the distance.
   ================================================================ */
const JOURNAL = { el: null, open: false };
const SECRET_NAMES = {
  taxi: ['THE N3W CAB', 'type a word for a ride'], pizza: ['THE PIZZA RAT', 'a slice on legs'], whale: ['THE WHALE', 'ask the sea'], disco: ['THE MIRROR BALL', 'the Floor can dance'], moon: ['MOON GRAVITY', 'jump somewhere lighter'],
  shrink: ['PIGEON HEIGHT', 'see what the pigeons see'], grow: ['KAIJU', 'be bigger than the ferry'], fireworks: ['FIREWORKS', 'celebrate'], n3w: ['THE N3W', 'the E is a 3'], snow: ['SNOW DAY', 'a cold word'], sus: ['SUS', 'everyone turns round'],
  bodega: ['THE CAT IS LISTENING', 'say where the cat lives'], '420': ['THE CLOCK MAN', 'a famous time'], phone: ['THE PAY PHONE', 'it rings by the pier'], hotdog: ['N3W DOGS', 'a dollar on the beach'], petcat: ['PET THE CAT', 'in the bodega'],
  slice: ['A GOLDEN SLICE', 'nine are hidden'], slices: ['SLICE CLUES', 'ask for slices'], xspot: ['X MARKS THE SPOT', 'stand still on GM Beach'], ghost: ['THE GHOST SHIP', 'three in the morning'], help: ['HELP', 'just ask'],
  busker: ['THE SAX PLAYER', 'tip him'], cheer: ['THE CIRCLE', 'cheer the breakers'], statue: ['THE STATUE MOVED', 'look away, look back'], rainbow: ['RAINBOW', 'after rain'], storm: ['STORM', 'call the weather'],
  snowman: ['THE SNOWMAN', 'a winter word'], snowmangm: ['GM, SNOWMAN', 'say hello to him'], bucket: ['A BUCKET', 'the N3W COURT'], onfire: ['ON FIRE', 'three in a row'], subway: ['THE N3W LINE', 'swipe again'], catch: ['CATCH', 'jpgs from the sky'],
  finale: ['THE FINALE', 'midnight, or ask for a show'], show: ['A SHOW', 'ask for one'], jetski: ['THE JET SKI', 'west of the pier'], halal: ['CHICKEN OVER RICE', 'the halal truck'], coffee: ['LIGHT AND SWEET', 'the coffee truck'],
  icecream: ['SOFT SERVE', 'call the truck'], cone: ['A CONE', 'buy one'], heli: ['N3W AIR', 'the helipad'], fetch: ['FETCH', 'throw the stick'], pspsps: ['THE STRAY', 'what you say to a cat'], parade: ['THE PARADE', 'November'],
  el: ['THE N3W EL', 'the stair on the pier'], balldrop: ['THE BALL DROP', 'a new year'], wish: ['A WISH', 'after a shooting star'], meteors: ['METEORS', 'look up'], stars: ['THE CONSTELLATION', 'ask the stars'],
  witness: ['THE WITNESS BLINKS', 'ask it to'], thecut: ['THE CUT', 'walk through the door'], fresh: ['FRESH', 'the newest memes'], airdrop: ['AN AIRDROP', 'open a crate'], airdropcall: ['CALL A DROP', 'ask for one'], freshall: ['ALL FIFTY', 'collect every fresh card'],
  radio: ['N3W RADIO', 'press M'], drummer: ['THE BUCKET DRUMMER', 'by the subway'], photo: ['PHOTO MODE', 'press O']
};
(function journalWindow() {
  const el = document.createElement('div'); el.className = 'win'; el.id = 'journal';
  el.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,92vw);max-height:78vh;z-index:58;display:none;flex-direction:column';
  el.innerHTML = '<div class="title"><img src="assets/eye.png" alt=""><span>SECRETS.EXE</span><div class="tbtns"><button id="jX" aria-label="Close">&#215;</button></div></div><div class="inner" style="overflow:auto;padding:10px 12px"><div id="jTop" style="font:400 26px/1.1 Anton,Impact,sans-serif;letter-spacing:.03em;margin-bottom:6px"></div><div id="jTally" class="small" style="margin-bottom:8px"></div><div id="jList" style="columns:2;column-gap:14px;font:600 11px/1.6 \'JetBrains Mono\',Menlo,monospace"></div></div>';
  document.body.appendChild(el); JOURNAL.el = el; el.querySelector('#jX').onclick = () => journal(false);
  const sm = document.querySelector('#startmenu .items'); if (sm) { const b = document.createElement('button'); b.innerHTML = '<img src="assets/eye.png" alt="" style="width:16px;height:16px"> Secrets'; b.onclick = () => journal(true); sm.appendChild(b); }
})();
function journal(on) {
  JOURNAL.open = on === undefined ? !JOURNAL.open : on; JOURNAL.el.style.display = JOURNAL.open ? 'flex' : 'none'; if (!JOURNAL.open) return; try { document.exitPointerLock(); } catch (e) { }
  const keys = [...new Set(Object.keys(SECRET_NAMES).concat([...PLAY.found]))].filter(k => !/^bottle\d$|^egg:/.test(k));
  $('jTop').textContent = `SECRETS ${PLAY.found.size} OF ${PLAY.total}`;
  $('jTally').innerHTML = `GOLDEN SLICES ${HUNT.got.size}/9 · FRESH CARDS ${window.__DROP ? __DROP.got.size : 0}/${FRESH.length} · BUCKETS ${window.__GAMES ? __GAMES.made : 0} · CATCH RECORD ${window.__GAMES ? __GAMES.best : 0} · FETCHES ${window.__ZOO ? __ZOO.fetches : 0}`;
  $('jList').innerHTML = keys.map(k => { const n = SECRET_NAMES[k] || [k.toUpperCase(), '']; const got = PLAY.found.has(k); return `<div style="break-inside:avoid;opacity:${got ? 1 : 0.55}">${got ? '■' : '□'} ${got ? n[0] : '???'}${got ? '' : ' <span style="opacity:.8;font-weight:400">· ' + n[1] + '</span>'}</div>`; }).join('');
}
let journalKeyT = null;
addEventListener('keydown', e => { if ($('chat').style.display === 'block' || e.repeat) return; if (journalKeyT) { clearTimeout(journalKeyT); journalKeyT = null; if (e.key.length === 1) return; } if (e.code === 'KeyJ') journalKeyT = setTimeout(() => { journalKeyT = null; journal(); }, 420); if (e.code === 'Escape' && JOURNAL.open) journal(false); });
EGGS.journal = () => journal(true); EGGS.journal.__s = true; EGGS.secrets = EGGS.journal;

/* phones: buttons for the things a keyboard does */
(function phoneButtons() {
  const box = $('mbtn'); if (!box) return;
  const add = (label, fn) => { const b = document.createElement('button'); b.className = 'b'; b.textContent = label; b.style.cssText = 'width:64px;height:40px;font-weight:700;font-size:10px'; b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fn(); }); box.appendChild(b); };
  add('TYPE', () => { $('chat').style.display = 'block'; $('chatIn').focus(); }); add('RADIO', () => radioNext()); add('PHOTO', () => photoMode()); add('BOOK', () => journal());
})();
if (isMobile) {
  try { (window.__NEON && __NEON.beams || []).forEach(b => b.beam.parent && b.beam.parent.remove(b.beam)); if (window.__NEON) __NEON.beams = []; if (window.__NEON && __NEON.halo) __NEON.halo.visible = false; } catch (e) { }
  try { if (window.__IV) __IV.mats.forEach(m => { m.userData.ivMobile = true; }); } catch (e) { }
  try { if (window.__NSKY) __NSKY.sats.forEach(q => q.p.parent && q.p.parent.remove(q.p)); } catch (e) { }
}

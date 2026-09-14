/* THE MUSEUM network: the doors panel on a minted room page. Reads window.NY_NET, written by mint_network.py.
   Every href is relative to the network root (the room page sets <base href="../../">). [ and ] walk back and forward. */
(function () {
  var N = window.NY_NET;
  if (!N) return;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var label = { back: 'BACK', forward: 'FORWARD', borough: 'SAME BOROUGH', across: 'ACROSS THE CITY' };
  var nav = document.createElement('nav');
  nav.className = 'nynet';
  nav.setAttribute('aria-label', 'Doors to other rooms');
  nav.innerHTML =
    '<button type="button" class="nynet-tab" aria-expanded="false">DOORS <b>' + N.doors.length + '</b></button>' +
    '<div class="nynet-panel" hidden>' +
    '<div class="nynet-head">ROOM ' + esc(N.room) + ' · ' + esc(N.wing).toUpperCase() + ' · ' + esc(N.borough).toUpperCase() + '</div>' +
    N.doors.map(function (d) {
      return '<a class="nynet-door" href="' + esc(d.href) + '"><span>' + label[d.rel] + ' · ROOM ' + esc(d.room) + '</span><b>' + esc(d.name) + '</b><i>' + esc(d.area) + '</i></a>';
    }).join('') +
    '<div class="nynet-foot"><a href="index.html">THE LOBBY · ALL ' + N.count + ' ROOMS</a><a href="' + esc(N.viewer) + '">THIS ROOM AS AN OBJECT</a></div>' +
    '</div>';
  document.body.appendChild(nav);
  var tab = nav.querySelector('.nynet-tab'), panel = nav.querySelector('.nynet-panel');
  var set = function (open) { panel.hidden = !open; tab.setAttribute('aria-expanded', String(open)); };
  tab.addEventListener('click', function (e) { e.stopPropagation(); set(panel.hidden); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) set(false); });
  addEventListener('keydown', function (e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var go = function (rel) { var d = N.doors.filter(function (x) { return x.rel === rel; })[0]; if (d) location.href = new URL(d.href, document.baseURI).href; };
    if (e.key === '[') go('back');
    else if (e.key === ']') go('forward');
    else if (e.key === 'Escape') set(false);
  });
})();

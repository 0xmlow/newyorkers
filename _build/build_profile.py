#!/usr/bin/env python3
"""profile.html: the collector profile.

Signs in with Privy, then reads everything from our own API. Degrades honestly: with no Privy App ID
configured it says so rather than showing a broken button, and every panel handles being empty.
"""
import os, json
from page_shell import shell, esc, cfg

CFG_LOGIN = cfg().get("loginEnabled", False)   # config.js is the switch; see assets/config.js
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]
rooms = json.load(open(os.path.join(HERE, "rooms_full.json"), encoding="utf-8"))
ROOM_TOTAL = len(rooms)
arts = []
import glob
for f in sorted(glob.glob(os.path.join(HERE, "learn", "articles_*.json"))): arts += json.load(open(f, encoding="utf-8"))

body = f"""
<section class="wrap" style="padding-top:64px;padding-bottom:10px">
  <div class="kicker">Your profile</div>
  <h1 class="h-xl" id="hello" style="margin-top:14px">You are a New Yorker.</h1>
  <p class="lede" style="margin-top:18px;max-width:820px;color:var(--slate)" id="lede">Sign in and the census remembers you: the rooms you have walked, the eggs you found, the New Yorker the city matched you with, and your own share link.</p>
</section>

<section class="wrap" style="padding-bottom:90px">
  <div id="signedOut">
    <div class="panel">
      <div class="kicker" style="font-size:10px">Sign in</div>
      <p class="body" style="margin-top:10px">A wallet or an email. No password, nothing to remember.</p>
      <div class="signin">
        <div class="srow">
          <button class="btn" id="walletBtn">CONNECT A WALLET</button>
          <span class="sor">or</span>
        </div>
        <div class="srow" id="walletPick" hidden></div>
        <div class="srow" id="emailRow">
          <input id="emailIn" type="email" inputmode="email" autocomplete="email" placeholder="you@somewhere.com" aria-label="Email address">
          <button class="btn ghost" id="codeBtn">EMAIL ME A CODE</button>
        </div>
        <div class="srow" id="codeRow" hidden>
          <input id="codeIn" inputmode="numeric" autocomplete="one-time-code" placeholder="6 digit code" aria-label="Login code">
          <button class="btn" id="verifyBtn">SIGN IN</button>
          <button class="btn ghost sm" id="backBtn">USE ANOTHER EMAIL</button>
        </div>
      </div>
      <p class="fine" id="staleWarn" hidden style="color:var(--pink)"></p>
      <p class="fine" id="authNote"></p>
      <pre id="authDetail" class="authdetail" hidden></pre>
      <p><button class="btn ghost sm" id="copyDetail" hidden>COPY THE DETAILS</button></p>
    </div>
  </div>

  <div id="signedIn" hidden>
    <div class="pgrid">
      <div class="panel">
        <div class="kicker" style="font-size:10px">Who you are</div>
        <dl class="kv" id="whoami"></dl>
        <button class="btn ghost sm" id="editBtn" style="margin-top:14px">EDIT HANDLES</button>
        <button class="btn ghost sm" id="outBtn" style="margin-top:14px;margin-left:6px">SIGN OUT</button>
        <form id="editForm" hidden>
          <label>Display name<input name="display_name" maxlength="60"></label>
          <label>X<input name="handle_x" maxlength="40" placeholder="@degens"></label>
          <label>Discord<input name="handle_discord" maxlength="40"></label>
          <label>Telegram<input name="handle_telegram" maxlength="40"></label>
          <button class="btn sm" type="submit">SAVE</button>
        </form>
      </div>

      <div class="panel">
        <div class="kicker" style="font-size:10px">Your wallets</div>
        <div id="wallets"></div>
        <p class="fine">Wallets appear here once Privy has verified you control them. Connect another from the sign in modal.</p>
      </div>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="kicker" style="font-size:10px">Your New Yorker</div>
      <div id="quiz"></div>
    </div>

    <div class="statgrid" id="statgrid"></div>

    <div class="panel" style="margin-top:16px">
      <div class="kicker" style="font-size:10px">Your share link</div>
      <p class="body" style="font-size:14px;margin:8px 0 12px">If someone signs in through your link it is recorded against you, permanently and once. Referral rewards are a stated rate, not an automatic payout.</p>
      <input id="refLink" readonly>
      <div class="share" id="refShare" style="margin-top:12px"></div>
      <p class="fine" id="refStats"></p>
    </div>

    <div class="panel" style="margin-top:16px">
      <div class="kicker" style="font-size:10px">Allowlist</div>
      <div id="allow"></div>
    </div>
  </div>
</section>"""

extra_css = """
.panel{background:var(--card);border:1px solid var(--divider);border-radius:14px;padding:26px 28px}
.signin{margin-top:20px;display:flex;flex-direction:column;gap:14px;max-width:560px}
.signin .srow{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.signin input{flex:1 1 240px;min-width:0;background:var(--ink);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:12px 14px;border-radius:8px;outline:none}
.signin input:focus{border-color:var(--cyan)}
.signin input:disabled{opacity:.5}
.signin .sor{font-family:var(--mono);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--slate)}
.signin button:disabled{opacity:.5;cursor:default}
.authdetail{background:var(--ink);border:1px solid var(--divider);border-radius:8px;padding:14px 16px;margin-top:14px;max-width:560px;overflow-x:auto;font-family:var(--mono);font-size:11.5px;line-height:1.6;color:var(--slate);white-space:pre-wrap;word-break:break-word}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:860px){.pgrid{grid-template-columns:1fr}}
.kv{display:grid;grid-template-columns:110px 1fr;gap:9px 14px;margin-top:14px}
.kv dt{font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--blue);padding-top:3px}
.kv dd{font-family:var(--sans);font-size:15px;color:var(--cloud);word-break:break-word}
.fine{font-family:var(--sans);font-size:13px;line-height:1.6;color:var(--slate);margin-top:14px}
#wallets .w{font-family:var(--mono);font-size:13px;color:var(--cyan);background:var(--ink);border:1px solid var(--divider);border-radius:7px;padding:11px 13px;margin-top:9px;word-break:break-all}
#wallets .w span{color:var(--slate);font-size:10px;letter-spacing:.2em;text-transform:uppercase;margin-left:8px}
.statgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
@media (max-width:860px){.statgrid{grid-template-columns:repeat(2,1fr)}}
.statgrid .s{background:var(--card);border:1px solid var(--divider);border-radius:12px;padding:20px 22px}
.statgrid .s b{display:block;font-family:var(--mono);font-size:32px;color:var(--cyan);line-height:1}
.statgrid .s span{display:block;font-family:var(--sans);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--slate);margin-top:8px}
.statgrid .s em{display:block;font-style:normal;font-size:12px;color:#5f6b7a;margin-top:6px}
#quiz .q{display:flex;gap:18px;align-items:center;margin-top:12px;flex-wrap:wrap}
#quiz img{width:150px;aspect-ratio:16/10;object-fit:cover;border-radius:10px;border:1px solid var(--divider)}
#refLink{width:100%;background:var(--ink);border:1px solid var(--acid);color:var(--acid);font-family:var(--mono);font-size:13px;padding:13px 14px;border-radius:7px}
#editForm{display:flex;flex-direction:column;gap:12px;margin-top:18px;border-top:1px solid var(--divider);padding-top:18px}
#editForm label{display:flex;flex-direction:column;gap:6px;font-family:var(--mono);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--slate)}
#editForm input{background:var(--ink);border:1px solid var(--divider);color:var(--cloud);font-family:var(--sans);font-size:15px;padding:12px 13px;border-radius:7px;outline:none}
"""

script = """
<script type="module">
const CFG = window.NY_CONFIG || {};
const $ = (s) => document.querySelector(s);
const ROOM_TOTAL = __ROOMS__, ARTICLE_TOTAL = __ARTICLES__, EGG_TOTAL = 14;

function stat(n, label, note){ return `<div class="s"><b>${n}</b><span>${label}</span>${note?`<em>${note}</em>`:''}</div>`; }

const BUILD = '__BUILD_ID__';
/* A stale tab reports a fixed bug as still broken. Ask the server which build is current and
   say so plainly, rather than letting an old page waste another round trip. */
(async () => {
  try{
    const r = await fetch('/build.json', {cache:'no-store'});
    const j = await r.json();
    if (j.build && BUILD !== '__BUILD' + '_ID__' && j.build !== BUILD){
      const b = document.getElementById('staleWarn');
      b.hidden = false;
      b.textContent = 'This page is an old version (' + BUILD + '). The current one is ' + j.build + '. Reload before trying again.';
    }
  }catch(e){}
})();

const note = (t) => { $('#authNote').textContent = t; };
const lockUI = (on) => ['walletBtn','codeBtn','verifyBtn'].forEach(id => { const e=$('#'+id); if(e) e.disabled = on; });

async function paint(){
  const r = await fetch('/api/profile', {credentials:'same-origin'});
  const d = await r.json().catch(()=>({}));
  if(!d.signedIn){
    $('#signedOut').hidden=false; $('#signedIn').hidden=true;
    /* The App Secret lives only on the server, so only the server knows if login can work. */
    if(d.loginReady === false){ lockUI(true); $('#emailIn').disabled = true;
      note('Sign in is not open yet. The profile is built and waiting on the last Privy key.'); }
    return;
  }
  $('#signedOut').hidden=true; $('#signedIn').hidden=false;
  const p=d.profile;
  $('#hello').textContent = p.display_name ? p.display_name : 'You are counted.';
  $('#lede').textContent = 'Everything the census remembers about you, in one place.';
  $('#whoami').innerHTML =
    (p.email?`<dt>Email</dt><dd>${p.email}</dd>`:'') +
    (p.handle_x?`<dt>X</dt><dd>${p.handle_x}</dd>`:'') +
    (p.handle_discord?`<dt>Discord</dt><dd>${p.handle_discord}</dd>`:'') +
    (p.handle_telegram?`<dt>Telegram</dt><dd>${p.handle_telegram}</dd>`:'') +
    `<dt>Since</dt><dd>${(p.created_at||'').slice(0,10)}</dd>`;
  ['display_name','handle_x','handle_discord','handle_telegram'].forEach(k=>{ const el=$('#editForm [name='+k+']'); if(el) el.value=p[k]||''; });

  $('#wallets').innerHTML = d.wallets.length
    ? d.wallets.map(w=>`<div class="w">${w.address}${w.is_primary?'<span>primary</span>':''}</div>`).join('')
    : '<p class="fine" style="margin-top:10px">No wallet connected yet.</p>';

  const s=d.stats;
  $('#statgrid').innerHTML =
    stat(s.rooms.length, 'Rooms walked', 'of ' + ROOM_TOTAL) +
    stat(s.eggs.length, 'Eggs found', 'of ' + EGG_TOTAL) +
    stat(s.articles.length, 'Articles read', 'of ' + ARTICLE_TOTAL) +
    stat(d.referrals.signups, 'People referred', 'signed in through your link');

  $('#quiz').innerHTML = s.quiz && s.quiz.id
    ? `<div class="q"><img src="/assets/t/${s.quiz.thumb}.jpg" alt=""><div><div class="kicker" style="font-size:10px;color:var(--cyan)">NO. ${String(s.quiz.n).padStart(4,'0')}</div><div style="font-size:22px;font-weight:600;margin-top:6px">${s.quiz.title||''}</div><p class="fine" style="margin-top:6px">Matched by the Get Counted quiz. <a href="/n/${s.quiz.id}.html" style="color:var(--cyan)">Open the record</a></p></div></div>`
    : '<p class="fine" style="margin-top:10px">You have not taken the quiz yet. <a href="/counted.html" style="color:var(--cyan)">Get counted</a> and the city picks your New Yorker.</p>';

  const link = location.origin + '/?ref=' + d.referrals.code;
  $('#refLink').value = link;
  $('#refStats').textContent = d.referrals.signups + ' ' + (d.referrals.signups===1?'person has':'people have') + ' signed in through your link.';
  if(window.NY && NY.shareRow) NY.shareRow($('#refShare'), {title:'NEW YORKERS by MLow', text:'A painted census of New York City. Come get counted.', url:link});
  $('#refLink').onclick=function(){ this.select(); navigator.clipboard && navigator.clipboard.writeText(link); NY.toast&&NY.toast('Link copied.'); };

  $('#allow').innerHTML = d.allowlist
    ? `<p class="fine" style="margin-top:10px">You put your name down on ${(d.allowlist.submitted_at||'').slice(0,10)}, asking for ${d.allowlist.mint_count}. The allowlist was retired: THE CENSUS RELEASE is open to everyone, so nothing was gated in the end.</p>`
    : '<p class="fine" style="margin-top:10px">There is no allowlist. THE CENSUS RELEASE is open to everyone, minting now on OpenSea.</p>';
}

$('#editBtn').onclick = () => { $('#editForm').hidden = !$('#editForm').hidden; };
$('#editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target), o = {};
  fd.forEach((v,k)=>o[k]=v);
  await fetch('/api/profile', {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify(o)});
  $('#editForm').hidden = true; paint();
});
$('#outBtn').onclick = async () => { await fetch('/api/session',{method:'DELETE',credentials:'same-origin'}); location.reload(); };

/* ---- Privy ----
   js-sdk-core is HEADLESS: there is no auth.login() modal. The real API is
   auth.email.sendCode / loginWithCode and auth.siwe.init / loginWithSiwe, and the
   constructor requires a storage instance and an explicit initialize(). Building our
   own two buttons also keeps the sign in inside the site's own type and colour.     */
const appId = CFG.privyAppId || '';

if(!appId){
  lockUI(true); $('#emailIn').disabled = true;
  note('Sign in is not open yet. The profile is built and waiting on a Privy App ID.');
} else {
  let privy = null;
  const ready = (async () => {
    const mod = await import('https://esm.sh/@privy-io/js-sdk-core@0.73.0');
    const Privy = mod.default, LocalStorage = mod.LocalStorage;
    privy = new Privy({ appId, storage: new LocalStorage() });
    await privy.initialize();
  })().catch(err => { lockUI(true); note('The sign in library did not load. Try again, or message @degens on X.'); throw err; });

  /* Hand Privy's access token to our own API, which verifies it server side and sets the session. */
  async function finish(){
    const token = await privy.getAccessToken();
    if(!token){ note('Privy did not return a token.'); return; }
    const ref = new URLSearchParams(location.search).get('ref') || localStorage.getItem('ny_ref') || '';
    const res = await fetch('/api/session', {method:'POST', credentials:'same-origin',
      headers:{'content-type':'application/json'}, body:JSON.stringify({token, ref})});
    const j = await res.json();
    if(!j.ok){ note(j.error || 'That did not work.'); return; }
    note(''); paint();
  }

  /* Wallet discovery. window.ethereum is only ever ONE provider, and with several extensions
     installed they overwrite each other, so the button can drive a wallet you did not mean.
     EIP-6963 is how wallets announce themselves properly; we collect those and fall back. */
  const providers = [];
  window.addEventListener('eip6963:announceProvider', (e) => {
    if (!providers.some(p => p.info.uuid === e.detail.info.uuid)) providers.push(e.detail);
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));

  function providerList(){
    if (providers.length) return providers.map(p => ({ name: p.info.name, provider: p.provider }));
    if (window.ethereum) return [{ name: 'Browser wallet', provider: window.ethereum }];
    return [];
  }

  /* Wallet errors are the ones people actually hit, so say which one it was. A silent
     failure reads as "it just does not work" and is impossible to report usefully. */
  /* Privy requires an EIP-55 checksummed address: its own ExternalWallet type says so. Nearly
     every wallet returns eth_requestAccounts addresses in lowercase, and a lowercase address
     produces a SIWE message Privy rejects with 422 "Invalid SIWE message and/or signature",
     which looks exactly like a bad signature and is why this took so long to find. */
  function toChecksumAddress(addr){
    const a = String(addr || '').toLowerCase().replace(/^0x/, '');
    if (!/^[0-9a-f]{40}$/.test(a) || typeof keccak256 !== 'function') return addr;
    const h = keccak256(a);
    let out = '0x';
    for (let i = 0; i < a.length; i++) out += parseInt(h[i], 16) >= 8 ? a[i].toUpperCase() : a[i];
    return out;
  }

  function walletProblem(err, step){
    const code = err && (err.code != null ? err.code : (err.cause && err.cause.code));
    const msg = String((err && (err.message || err.error || err.reason)) || '');
    if (code === 4001 || /reject|denied|declined/i.test(msg))
      return 'You declined the signature in your wallet.';
    if (code === -32002)
      return 'Your wallet already has a request open. Open the wallet, finish or dismiss it, then try again.';
    if (code === 4900 || code === 4901)
      return 'Your wallet is locked or not connected. Unlock it and try again.';
    return 'Sign in failed at the "' + step + '" step. ' + (msg || 'The wallet gave no reason.');
  }

  /* Everything a thrown object carries, flattened. Error properties are mostly non enumerable,
     so JSON.stringify of an error gives "{}" and tells you nothing. This is what gets copied
     to me when a wallet I cannot reproduce fails. */
  function errorDetail(err, step){
    const d = { step: step, type: Object.prototype.toString.call(err) };
    if (err && typeof err === 'object'){
      ['name','code','status','message','error','reason','details'].forEach(k => {
        if (err[k] !== undefined && typeof err[k] !== 'object') d[k] = String(err[k]).slice(0, 300);
      });
      if (err.cause) d.cause = String(err.cause.message || err.cause.code || err.cause).slice(0, 200);
      try { const own = JSON.parse(JSON.stringify(err)); if (own && Object.keys(own).length) d.body = own; } catch(e){}
    } else { d.value = String(err).slice(0, 300); }
    return d;
  }

  function showDetail(err, step, facts){
    const box = document.getElementById('authDetail');
    const btn = document.getElementById('copyDetail');
    const d = errorDetail(err, step);
    d.build = BUILD;
    if (facts) d.wallet = facts;
    box.textContent = JSON.stringify(d, null, 1);
    box.hidden = false; btn.hidden = false;
    btn.textContent = 'COPY THE DETAILS';
    btn.onclick = async () => {
      try { await navigator.clipboard.writeText(box.textContent); btn.textContent = 'COPIED'; }
      catch(e){ const r = document.createRange(); r.selectNodeContents(box);
                getSelection().removeAllRanges(); getSelection().addRange(r);
                btn.textContent = 'SELECTED, PRESS COPY'; }
    };
  }


  async function connectWith(eth, walletName){
    let step = 'connect';
    /* What the wallet actually did. A 422 from Privy is the same whether the signature is
       wrong, the address is wrong, or the wallet is a smart contract signing with EIP-1271,
       so record enough to tell those apart instead of guessing again. */
    const facts = { wallet: walletName || 'unknown' };
    try{
      lockUI(true);
      document.getElementById('authDetail').hidden = true;
      document.getElementById('copyDetail').hidden = true;
      note('Check your wallet: it should ask you to connect.');
      const accounts = await eth.request({ method:'eth_requestAccounts' });
      if(!accounts || !accounts[0]){ note('Your wallet did not share an address.'); return; }
      const rawAddress = accounts[0];
      const address = toChecksumAddress(rawAddress);
      facts.addressFromWallet = rawAddress;
      facts.addressSentToPrivy = address;
      facts.checksumChanged = rawAddress !== address;
      facts.accountsReturned = accounts.length;
      const chainRaw = await eth.request({ method:'eth_chainId' });
      const chainNum = (typeof chainRaw === 'string' && chainRaw.indexOf('0x') === 0)
        ? parseInt(chainRaw, 16) : parseInt(chainRaw, 10);
      facts.chainIdRaw = String(chainRaw);
      facts.chainId = chainNum;
      const wallet = { address, chainId: 'eip155:' + chainNum };

      /* Is this a smart contract wallet? Then personal_sign is an EIP-1271 or 6492 blob, not a
         65 byte key signature, and no amount of encoding or checksum work will fix it. */
      try {
        const code = await eth.request({ method:'eth_getCode', params:[address, 'latest'] });
        facts.isSmartContractWallet = !!(code && code !== '0x' && code !== '0x0');
        facts.codeSize = code ? (code.length - 2) / 2 : 0;
      } catch(e){ facts.isSmartContractWallet = 'could not check'; }

      const toHex = (t) => '0x' + Array.from(new TextEncoder().encode(t))
        .map(v => v.toString(16).padStart(2, '0')).join('');

      /* EIP-191 passes the message as hex, and most wallets decode it before signing, but some
         sign the literal characters of the hex string and some refuse a raw one. Both choices
         fail the same way: a signature Privy rejects with 422. So try one, and if the SIGNATURE
         is what Privy rejected, take a fresh nonce and try the other. */
      async function attempt(asHex){
        step = 'nonce';
        const { message } = await privy.auth.siwe.init(wallet, location.host, location.origin);
        step = 'signature';
        note('Check your wallet again: it should ask you to sign a message. Nothing is spent and no transaction is sent.');
        const signature = await eth.request({
          method: 'personal_sign', params: [asHex ? toHex(message) : message, address] });
        facts.encodingTried = asHex ? 'hex' : 'raw';
        const NL = String.fromCharCode(10);   // never an escape in generated JS
        facts.messageFirstLine = String(message).split(NL)[0];
        facts.messageAddressLine = String(message).split(NL)[1];
        facts.signatureLength = String(signature || '').length;
        facts.signatureBytes = Math.max(0, (String(signature || '').length - 2) / 2);
        facts.signatureTail = String(signature || '').slice(-6);
        step = 'verify';
        note('Signature received, finishing sign in...');
        await privy.auth.siwe.loginWithSiwe(signature, wallet);
      }
      const rejectedSignature = (e) =>
        e && (String(e.code) === 'invalid_data' || Number(e.status) === 422 ||
              /siwe|signature/i.test(String(e.message || e.error || '')));

      try { await attempt(true); }
      catch(e1){
        if (e1 && (e1.code === 4001 || /reject|denied/i.test(String(e1.message)))) throw e1;
        if (!rejectedSignature(e1)) throw e1;
        console.warn('[wallet] hex encoding rejected, retrying with the raw message', e1);
        note('Trying a different signature format, please approve once more.');
        await attempt(false);
      }
      await finish();
    }catch(err){
      console.error('[wallet sign in] step=' + step, err, facts);
      if (facts.isSmartContractWallet === true)
        note('This looks like a smart contract wallet. Those sign differently and are not supported here yet. Use the email code below, or sign in with a regular key wallet.');
      else
        note(walletProblem(err, step));
      showDetail(err, step, facts);
    }
    finally{ lockUI(false); }
  }

  $('#walletBtn').onclick = async () => {
    await ready;
    const list = providerList();
    if(!list.length){
      note('No wallet extension found in this browser. On a phone, open n3wyorkers.com inside your wallet app browser, or use the email code below.');
      return;
    }
    if(list.length === 1){ await connectWith(list[0].provider, list[0].name); return; }
    /* Several wallets announced themselves. Show them as buttons: a window.prompt would
       need escaped newlines in a generated string, which is exactly how this script was
       shipped broken once. */
    const row = document.getElementById('walletPick');
    row.innerHTML = '';
    list.forEach(w => {
      const b = document.createElement('button');
      b.className = 'btn ghost sm';
      b.textContent = w.name;
      b.onclick = () => { row.hidden = true; connectWith(w.provider, w.name); };
      row.appendChild(b);
    });
    row.hidden = false;
    note('You have more than one wallet. Pick the one to sign with.');
  };

  $('#codeBtn').onclick = async () => {
    const email = $('#emailIn').value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ note('That does not look like an email address.'); return; }
    try{
      await ready; lockUI(true); note('Sending a code...');
      await privy.auth.email.sendCode(email);
      $('#emailRow').hidden = true; $('#codeRow').hidden = false; $('#codeIn').focus();
      note('Code sent to ' + email + '. It expires in a few minutes.');
    }catch(err){ note('Could not send a code to that address.'); }
    finally{ lockUI(false); }
  };

  $('#verifyBtn').onclick = async () => {
    const code = $('#codeIn').value.trim();
    if(!code){ note('Enter the code from the email.'); return; }
    try{
      lockUI(true); note('Checking...');
      await privy.auth.email.loginWithCode($('#emailIn').value.trim(), code);
      await finish();
    }catch(err){ note('That code did not work. Check it, or send a new one.'); }
    finally{ lockUI(false); }
  };

  $('#backBtn').onclick = () => { $('#codeRow').hidden = true; $('#emailRow').hidden = false; $('#codeIn').value=''; note(''); };
  $('#codeIn').addEventListener('keydown', e => { if(e.key === 'Enter') $('#verifyBtn').click(); });
  $('#emailIn').addEventListener('keydown', e => { if(e.key === 'Enter') $('#codeBtn').click(); });
}

paint();
</script>"""
script = script.replace("__ROOMS__", str(ROOM_TOTAL)).replace("__ARTICLES__", str(len(arts)))

LOGIN_OFF_BODY = """
<section class="wrap" style="padding-top:76px;padding-bottom:90px"><div class="article" style="max-width:760px;margin:0">
  <div class="kicker" style="font-size:10px">Collector profiles</div>
  <h1 class="h-xl" style="font-size:clamp(34px,5vw,68px);margin-top:16px">Not open yet</h1>
  <p class="lede" style="margin-top:18px">Profiles are built and the census is keeping the records. Sign in is switched off while a wallet problem is sorted out, so nothing here can take your details and lose them.</p>
  <p class="body" style="margin-top:18px">When it opens, a profile will hold the rooms you have walked, the eggs you have found, the New Yorker the city matched you with, your wallets and your share link. Nothing is lost in the meantime: the museum and the census remember what they can without an account.</p>
  <p style="margin-top:26px;display:flex;gap:10px;flex-wrap:wrap">
    <a class="btn" href="museum.html#room=random">SPIN A ROOM</a>
    <a class="btn ghost" href="counted.html">GET COUNTED</a>
  </p>
</div></section>
"""

if not CFG_LOGIN:
    page = shell(title="Collector profiles · NEW YORKERS by MLow",
                 description="Collector profiles for NEW YORKERS by MLow are not open yet.",
                 body=LOGIN_OFF_BODY, path="profile.html", active=None, noindex=True)
    open(os.path.join(SITE, "profile.html"), "w", encoding="utf-8").write(page)
    print("profile.html written: sign in is OFF (config.loginEnabled is false)")
    raise SystemExit(0)

page = shell(title="Your profile · NEW YORKERS by MLow",
             description="Your collector profile: the rooms you have walked, the eggs you found, the New Yorker the city matched you with, your wallets and your share link.",
             body=body, path="profile.html", active=None, noindex=True,
             extra_head='<script src="assets/sha3.min.js"></script>',
             extra_css=extra_css, scripts_after=script)
open(os.path.join(SITE, "profile.html"), "w", encoding="utf-8").write(page)
print(f"profile.html written ({ROOM_TOTAL} rooms, {len(arts)} articles referenced)")

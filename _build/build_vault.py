#!/usr/bin/env python3
"""THE VAULT: an anti treasure hunt. The joke is that there is nothing to find.

Design note, deliberate and load bearing:
  The earlier version of this page announced a real 25,000 dollar prize with contest rules and a claim
  process. MLow's intent is a troll: unsolvable, no money, pure mystery. Those two things cannot be
  combined. Announcing a prize that cannot be won is a deceptive promotion, and doing it to drive
  allowlist signups ties the deception to commercial gain.
  So the page keeps the bit and drops the lie. It never claims money exists. It says plainly, in the
  second line, that there is nothing to find, and then it is funny about it for as long as you keep
  typing. The riddles stay as decoys. Every guess is wrong, and the page tells you so in a different
  way each time, which is the actual reward.
"""
import os, json, random
from page_shell import shell, esc, cfg
HERE = os.path.dirname(os.path.abspath(__file__)); SITE = os.path.dirname(HERE)
C = cfg(); URL = C["siteUrl"]

RIDDLES = [
    ("I", "The one the census will not count.", "It has lived here since the sixteen hundreds, it has never registered, and it is not leaving. Every New Yorker has a number. This one has the number nobody was given."),
    ("II", "The year the lights went out and stayed out.", "Lightning took the lines on a July night and the city went dark for twenty five hours. The reading room has the whole story, with its sources."),
    ("III", "Where the wheel has turned since 1920.", "One room in the museum stands where a wheel has carried people over the water for more than a century, beside a coaster from 1927 and a nickel hot dog from 1916."),
    ("IV", "What the dancers say before the pole.", "The train doors close, the speaker crackles, and somebody announces themselves to the whole car. The city says it back."),
]

# Every guess is wrong. The variety is the point.
REPLIES = [
 "NO.","STILL NO.","COLDER.","THAT IS A DECOY. THEY ALL ARE.","THE CITY DOES NOT KNOW THAT ONE.",
 "CLOSE. NOT REALLY. THERE IS NO CLOSE.","THE VAULT ACKNOWLEDGES YOUR EFFORT AND DECLINES.",
 "A CLERK WROTE THAT DOWN AND FILED IT UNDER NO.","INCORRECT, BUT CONFIDENTLY TYPED.",
 "THAT WAS SOMEBODY ELSE'S GUESS TOO.","NO. THE PIGEON SAYS NO AS WELL.",
 "FILED. UNREAD. NO.","THE VAULT HAS NO DOOR. YOU ARE KNOCKING ON A WALL.",
 "WRONG, AND THE WALL IS LOAD BEARING.","NO. TRY THE ONE YOU ALREADY TRIED.",
 "THE ANSWER IS NOT IN THE SOURCE. THE ANSWER IS NOT ANYWHERE.",
 "YOU HAVE BEEN COUNTED AS SOMEBODY WHO TRIED.","NO. GO OUTSIDE. THEN COME BACK AND TRY AGAIN.",
]
MILESTONES = {
 5:  "Five attempts. The census notes persistence.",
 10: "Ten. A clerk has started a file on you.",
 25: "Twenty five. You are now in the top percentile of people who did not find it.",
 50: "Fifty. There is genuinely nothing here. This has been said. You are still typing.",
 100:"One hundred attempts. You have been added to the archive as a New Yorker who would not let it go. That is the whole prize and it always was.",
}

body = f"""
<section class="wrap" style="padding-top:70px;padding-bottom:10px">
  <div class="kicker" style="color:var(--acid)">The Vault</div>
  <h1 class="h-xl" style="margin-top:14px;max-width:1000px">There is <span style="color:var(--acid)">$25,000</span> hidden in this website.</h1>
  <p class="lede" style="margin-top:18px;max-width:840px;color:var(--cloud)">There is not.</p>
  <p class="body" style="margin-top:14px;max-width:840px">There is no money, no key and no winner. There never was. The four riddles below lead nowhere, every answer is wrong, and the vault has no door. This is a rumour the city started about itself, and the census is only writing it down.</p>
  <p class="body" style="margin-top:12px;max-width:840px">Keep looking anyway. People do. That is the part that was always true.</p>
</section>

<section class="wrap" style="padding-bottom:20px">
  <div class="riddles">
    {"".join(f'<div class="r"><span class="n">{n}</span><h3>{esc(t)}</h3><p>{esc(b)}</p></div>' for n, t, b in RIDDLES)}
  </div>
  <p class="mono decoyline">All four are decoys. So is every other thing on this site that looks like a fragment.</p>
</section>

<section class="wrap" style="padding-bottom:60px">
  <div class="vaultbox">
    <div class="kicker" style="font-size:10px">Try the key anyway</div>
    <input id="key" placeholder="XXXX-XXXX-XXXXX-XXXXXXXX" autocomplete="off" spellcheck="false">
    <button class="btn" id="try">OPEN THE VAULT</button>
    <p id="msg"></p>
    <p class="tries mono" id="tries"></p>
  </div>
  <p class="body" style="margin-top:26px;max-width:780px;font-size:14px">If you came here from somebody who told you there was money in it, they were repeating the joke. There is no entry, no prize, no draw and nothing to win. Nothing on this page asks you for anything, and nothing you do here affects the census, the allowlist or a mint.</p>
</section>"""

extra_css = """
.riddles{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:10px}
@media (max-width:800px){.riddles{grid-template-columns:1fr}}
.riddles .r{background:var(--card);border:1px solid var(--divider);border-left:3px solid var(--acid);border-radius:12px;padding:22px 24px 24px;opacity:.92}
.riddles .n{font-family:var(--mono);font-size:11px;letter-spacing:.3em;color:var(--acid)}
.riddles h3{font-size:clamp(19px,1.9vw,24px);font-weight:600;line-height:1.2;margin:10px 0 10px}
.riddles p{font-family:var(--sans);font-size:15px;line-height:1.65;color:var(--slate)}
.decoyline{margin-top:16px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate)}
.vaultbox{background:var(--card);border:1px solid var(--divider);border-radius:14px;padding:30px clamp(20px,3vw,34px);max-width:720px}
.vaultbox input{width:100%;margin:12px 0 14px;background:var(--ink);border:1px solid var(--divider);color:var(--acid);font-family:var(--mono);font-size:clamp(16px,2.2vw,22px);letter-spacing:.16em;padding:16px 18px;border-radius:8px;outline:none;text-transform:uppercase}
.vaultbox input:focus{border-color:var(--acid)}
.vaultbox #msg{font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin-top:14px;min-height:18px;color:var(--pink)}
.vaultbox #msg.mile{color:var(--acid);text-transform:none;letter-spacing:.06em;font-size:13px}
.tries{font-size:11px;letter-spacing:.2em;color:var(--slate);margin-top:14px;text-transform:uppercase}
"""

script = """
<script>
(function(){
 var $=function(s){return document.querySelector(s)};
 var R=%s, MILE=%s;
 var n=0; try{ n=+(localStorage.getItem('ny_vault_tries')||0); }catch(e){}
 function paint(){ $('#tries').textContent = n ? n+' attempt'+(n===1?'':'s')+'. All of them wrong.' : ''; }
 paint();
 function go(){
   var v=$('#key').value.trim();
   if(!v) return;
   n++; try{ localStorage.setItem('ny_vault_tries',String(n)); }catch(e){}
   var m=$('#msg');
   if(MILE[n]){ m.textContent=MILE[n]; m.classList.add('mile'); }
   else { m.textContent=R[Math.floor(Math.random()*R.length)]; m.classList.remove('mile'); }
   paint();
   $('#key').select();
 }
 $('#try').onclick=go;
 $('#key').addEventListener('keydown',function(e){ if(e.key==='Enter') go(); });
 try{ console.log('%%cTHE VAULT','font:700 20px monospace;color:#D7FF1F','\\nThere is nothing in here. Reading the source will confirm it.\\nThere is no hash to crack and no answer to find. That is the joke.'); }catch(e){}
})();
</script>""" % (json.dumps(REPLIES), json.dumps({str(k): v for k, v in MILESTONES.items()}))

page = shell(title="The Vault · there is nothing hidden in this website",
             description="A rumour the city started about itself. There is no prize, no key and no winner. Every answer is wrong on purpose. Keep looking anyway.",
             body=body, path="vault.html", active=None,
             keywords=["internet puzzle joke", "NEW YORKERS by MLow", "the vault", "unsolvable puzzle"],
             extra_css=extra_css, scripts_after=script)
open(os.path.join(SITE, "vault.html"), "w", encoding="utf-8").write(page)
sol = os.path.join(HERE, "VAULT_SOLUTION.md")
if os.path.exists(sol): os.remove(sol)
print("vault.html rewritten as the anti hunt. No prize claimed, no rules, no solution file (deleted, there is nothing to solve).")

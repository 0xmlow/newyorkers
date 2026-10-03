/* NEW YORKERS collector card: draws a collector's name, rank, badges and every New Yorker they hold
   on a canvas and downloads it as a PNG. Shared by collectors.html and my.html; built from
   _build/build_collectors.py history, edit here. Needs same origin images (assets/t, assets/collectors). */
(function(){
// The downloadable collector card: name, rank, badges and every New Yorker in a grid, drawn on a canvas
// from same origin thumbnails so it can be saved as a PNG.
function loadImg(src){return new Promise(function(ok){if(!src)return ok(null);var i=new Image();i.onload=function(){ok(i);};i.onerror=function(){ok(null);};i.src=src;});}
function wrapText(ctx,txt,max,maxLines){var w=String(txt||'').split(/\s+/),L=[],cur='';w.forEach(function(t){var tryL=cur?cur+' '+t:t;if(ctx.measureText(tryL).width>max&&cur){L.push(cur);cur=t;}else cur=tryL;});if(cur)L.push(cur);if(L.length>maxLines){L=L.slice(0,maxLines);L[maxLines-1]=L[maxLines-1].replace(/\s*\S*$/,'')+'\u2026';}return L;}
function cover(ctx,im,dx,dy,dw,dh){var r=Math.max(dw/im.width,dh/im.height),sw=dw/r,sh=dh/r;ctx.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,dx,dy,dw,dh);}
function fit(ctx,txt,max,size,font){var s=size;do{ctx.font=font.replace('{s}',s);s-=2;}while(ctx.measureText(txt).width>max&&s>20);return s+2;}
window.NYCard=function(r,opt,btn){
  var BD=opt.badges,D={meta:opt.meta},BASE=window.NY_BASE||'';
  function short(a){return a.slice(0,6)+'\u2026'+a.slice(-4);}
  function who(r){return r.nm||r.ens||short(r.a);}
  var old=btn.textContent;btn.textContent='Drawing…';btn.disabled=true;
  var W=1600,P=72,G=10,n=r.pieces.length,cols=Math.max(3,Math.min(10,Math.ceil(Math.sqrt(n*1.2)))),cell=Math.floor((W-2*P-(cols-1)*G)/cols),rows=Math.ceil(n/cols);
  var CH=64,CG=14,c=document.createElement('canvas'),x=c.getContext('2d');
  // badge chip rows are measured before the height is known
  x.font='500 22px "Space Grotesk",sans-serif';
  var chips=r.badges.map(function(id){return {b:BD[id],w:CH+16+x.measureText(BD[id].name.toUpperCase()).width+26};}),lines=[[]],lw=0;
  chips.forEach(function(ch){if(lw+ch.w>W-2*P&&lines[0].length){lines.push([]);lw=0;}lines[lines.length-1].push(ch);lw+=ch.w+CG;});
  // an honoree's portrait, card and bio, the one we wrote for the honoraries, sit between the name and the badges
  var ho=r.honor||null,HB=ho?380:0;
  // their N3W YORKERS logo: one of MLow's lockups, picked by the wallet so the card and their page always match
  var LG=window.NY_LOGOS?window.NY_LOGOS.url(window.NY_LOGOS.forKey((r.ens||r.a).toLowerCase()),false):null,LS=210;
  var top=330+HB,bh=r.badges.length?lines.length*(CH+CG)+30:0,H=top+bh+rows*(cell+G)-G+150;
  c.width=W;c.height=H;
  Promise.all([document.fonts?document.fonts.ready:null,loadImg(BASE+'assets/brand/logo_white.png'),loadImg(ho&&ho.img?BASE+ho.img:null),loadImg(ho&&ho.card?BASE+ho.card:null),loadImg(LG?LG:null)]
    .concat(r.badges.map(function(id){return loadImg(BD[id]&&BD[id].img?BASE+BD[id].img:null);}))
    .concat(r.pieces.map(function(p){return loadImg(p.th?BASE+p.th:null);}))).then(function(res){
    var logo=res[1],hoImg=res[2],hoCard=res[3],lg=res[4],bimg={};r.badges.forEach(function(id,i){bimg[id]=res[5+i];});var imgs=res.slice(5+r.badges.length);
    x.fillStyle='#0D0D0D';x.fillRect(0,0,W,H);
    x.fillStyle='#D7FF1F';x.fillRect(0,0,W,8);
    if(logo){var lh=46;x.drawImage(logo,P,P-14,logo.width*lh/logo.height,lh);}
    x.textBaseline='alphabetic';x.fillStyle='#D7FF1F';x.font='500 20px "IBM Plex Mono",monospace';
    if(lg){var lx=W-P-LS,ly=P-36;x.save();x.beginPath();x.roundRect?x.roundRect(lx,ly,LS,LS,22):x.rect(lx,ly,LS,LS);x.clip();x.drawImage(lg,lx,ly,LS,LS);x.restore();
      x.strokeStyle='#D7FF1F';x.lineWidth=3;x.beginPath();x.roundRect?x.roundRect(lx,ly,LS,LS,22):x.rect(lx,ly,LS,LS);x.stroke();
      x.textAlign='left';x.fillText('N3W YORKERS  COLLECTOR CARD',P+(logo?logo.width*46/logo.height+26:0),P+20);}
    else{x.textAlign='right';x.fillText('NEW YORKERS  COLLECTOR CARD',W-P,P+20);}
    x.textAlign='left';x.fillStyle='#F0F4F8';
    var name=who(r),fs=fit(x,name,W-2*P-(r.tag?190:0)-(lg?LS+30:0),96,'600 {s}px "Fraunces",Georgia,serif');x.fillText(name,P,P+150);
    if(r.tag){var nw=x.measureText(name).width;x.font='500 22px "IBM Plex Mono",monospace';var tw=x.measureText(r.tag.toUpperCase()).width+36,tx=P+nw+24,ty=P+150-fs*0.42-22;
      x.strokeStyle='#D7FF1F';x.lineWidth=2;x.beginPath();x.roundRect?x.roundRect(tx,ty,tw,44,22):x.rect(tx,ty,tw,44);x.stroke();x.fillStyle='#D7FF1F';x.fillText(r.tag.toUpperCase(),tx+18,ty+30);}
    x.font='500 26px "IBM Plex Mono",monospace';x.fillStyle='#8899AA';
    var tot=r.census+r.keystone;
    x.fillText(('NO. '+r.rank+' OF '+D.meta.collectors+'   '+r.pts.toLocaleString()+' POINTS   '+tot+' NEW YORKER'+(tot===1?'':'S')+(r.keystone?' ('+r.keystone+' KEYSTONE)':'')),P,P+210);
    if(ho){
      var by=300,bh2=HB-40,bx=P,bw=W-2*P;
      x.fillStyle='#141820';x.beginPath();x.roundRect?x.roundRect(bx,by,bw,bh2,18):x.rect(bx,by,bw,bh2);x.fill();
      x.strokeStyle='#FF2E63';x.lineWidth=2;x.stroke();
      var pw=Math.round((bh2-40)*1.6),ph=bh2-40,px=bx+20,py=by+20;
      var port=hoImg||hoCard;
      if(port){x.save();x.beginPath();x.roundRect?x.roundRect(px,py,pw,ph,12):x.rect(px,py,pw,ph);x.clip();cover(x,port,px,py,pw,ph);x.restore();}
      var cw=hoCard&&hoImg?Math.round(ph*hoCard.width/hoCard.height):0,cx0=bx+bw-20-cw;
      if(cw){x.save();x.beginPath();x.roundRect?x.roundRect(cx0,py,cw,ph,10):x.rect(cx0,py,cw,ph);x.clip();x.drawImage(hoCard,cx0,py,cw,ph);x.restore();}
      var tx0=px+pw+34,tmax=(cw?cx0-30:bx+bw-30)-tx0,ty0=py+30;
      x.textAlign='left';x.fillStyle='#FF2E63';x.font='500 20px "IBM Plex Mono",monospace';x.fillText('HONORARY NEW YORKER',tx0,ty0);
      x.fillStyle='#F0F4F8';fit(x,ho.name,tmax,50,'600 {s}px "Fraunces",Georgia,serif');x.fillText(ho.name,tx0,ty0+56);
      var sub=(ho.handle||'')+(ho.title?(ho.handle?'   ':'')+'\u201c'+ho.title+'\u201d':'');
      if(sub){x.fillStyle='#8899AA';fit(x,sub,tmax,22,'italic 400 {s}px "Fraunces",Georgia,serif');x.fillText(sub,tx0,ty0+94);}
      if(ho.bio){x.fillStyle='#DDE3EA';x.font='400 25px "Space Grotesk",sans-serif';wrapText(x,ho.bio,tmax,5).forEach(function(l,i){x.fillText(l,tx0,ty0+140+i*35);});}
    }
    var y=top;
    lines.forEach(function(line){var cx=P;line.forEach(function(ch){
      x.fillStyle='#141820';x.beginPath();x.roundRect?x.roundRect(cx,y,ch.w,CH,CH/2):x.rect(cx,y,ch.w,CH);x.fill();
      x.strokeStyle=ch.b.color;x.lineWidth=3;x.beginPath();x.arc(cx+CH/2,y+CH/2,CH/2-5,0,Math.PI*2);x.stroke();
      var bi=bimg[ch.b.id];
      if(bi){x.save();x.beginPath();x.arc(cx+CH/2,y+CH/2,CH/2-7,0,Math.PI*2);x.clip();cover(x,bi,cx+7,y+7,CH-14,CH-14);x.restore();}
      else{x.textAlign='center';x.font='28px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';x.fillStyle=ch.b.color;x.fillText(ch.b.icon,cx+CH/2,y+CH/2+10);}
      x.textAlign='left';x.font='500 22px "Space Grotesk",sans-serif';x.fillStyle='#F0F4F8';x.fillText(ch.b.name.toUpperCase(),cx+CH+12,y+CH/2+8);
      cx+=ch.w+CG;});y+=CH+CG;});
    y=top+bh;
    r.pieces.forEach(function(p,i){
      var gx=P+(i%cols)*(cell+G),gy=y+Math.floor(i/cols)*(cell+G),im=imgs[i];
      x.save();x.beginPath();x.roundRect?x.roundRect(gx,gy,cell,cell,10):x.rect(gx,gy,cell,cell);x.clip();
      x.fillStyle='#141820';x.fillRect(gx,gy,cell,cell);
      if(im){var s=Math.min(im.width,im.height);x.drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,gx,gy,cell,cell);}
      else{x.fillStyle='#F0F4F8';x.font='500 '+Math.max(12,cell/10|0)+'px "Space Grotesk",sans-serif';x.textAlign='center';x.fillText(p.t.slice(0,18),gx+cell/2,gy+cell/2);x.textAlign='left';}
      var gr=x.createLinearGradient(0,gy+cell*0.7,0,gy+cell);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.75)');x.fillStyle=gr;x.fillRect(gx,gy+cell*0.7,cell,cell*0.3);
      x.fillStyle='#fff';x.font='500 '+Math.max(11,cell/13|0)+'px "IBM Plex Mono",monospace';x.fillText(p.c==='keystone'?'KEYSTONE':'NO. '+p.n,gx+8,gy+cell-9);
      x.restore();
      if(p.c==='keystone'){x.strokeStyle='#D7FF1F';x.lineWidth=4;x.beginPath();x.roundRect?x.roundRect(gx+2,gy+2,cell-4,cell-4,9):x.rect(gx+2,gy+2,cell-4,cell-4);x.stroke();}
    });
    x.fillStyle='#2A3040';x.fillRect(P,H-96,W-2*P,1);
    x.font='600 26px "Space Grotesk",sans-serif';x.fillStyle='#F0F4F8';x.fillText('N3WYORKERS.COM/COLLECTORS',P,H-48);
    x.textAlign='right';x.font='400 20px "IBM Plex Mono",monospace';x.fillStyle='#8899AA';x.fillText('BY MLOW  ·  AS OF '+D.meta.asOf.toUpperCase(),W-P,H-48);x.textAlign='left';
    c.toBlob(function(b){
      var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='new-yorkers-'+(r.ens||short(r.a)).replace(/[^a-z0-9.]+/gi,'-').toLowerCase()+'.png';
      document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},4000);
      btn.textContent='Downloaded';btn.disabled=false;setTimeout(function(){btn.textContent=old;},2500);
    },'image/png');
  });
};
})();

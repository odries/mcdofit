/* MCDO FIT — schermen: Vandaag, Kalender, Instellingen, snel afvinken, begeleide modus.
   Stijl zoals mcdo-pt: tegels (.tile) met kleurthema's (.t-orange, .t-cream, ...). */

/* =====================================================================
   ICONEN
   ===================================================================== */
const CHECK='<svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5 10-11"/></svg>';
const CHEV='<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
const CLOSE='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/* =====================================================================
   HULPJES
   ===================================================================== */
let tab="today", infoOpen={}, calView=null, calSel=null, sheetOpen=false;
let qRunning={};
function clearQuickTimers(){ for(const k in qRunning) clearInterval(qRunning[k].iv); qRunning={}; }
function syncScroll(){ document.body.classList.toggle("noscroll", sheetOpen || !!G); }
function plural(n,one,more){ return n+" "+(n===1?one:more); }
function catTag(it){ return `<span class="tag c-${it.cat}">${it.pool==="open"?"Opener":it.pool==="close"?"Stretch":CATS[it.cat].short}</span>`; }
function gainedChips(r){
  if(!r || (!r.levelUp && !r.gained.length)) return "";
  return `<div class="gained">${r.levelUp?`<span>⬆ Niveau ${r.levelUp} bereikt</span>`:""}${r.gained.map(id=>{const a=ACH.find(x=>x.id===id);return `<span>${a.em} ${a.name}</span>`;}).join("")}</div>`;
}
function compChips(slots){
  return `<div class="chips">${composition(slots).map(x=>`<span class="chip-static c-${x.cat}"><span class="dot"></span>${x.n>=2?x.n+"× ":""}${CATS[x.cat].short.toLowerCase()}</span>`).join("")}</div>`;
}

function render(){
  clearQuickTimers();
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("on", p.id==="p-"+tab));
  document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on", b.dataset.tab===tab));
  const fab=document.getElementById("fab"); if(fab) fab.classList.toggle("on", tab==="set");
  if(tab==="today") renderToday();
  if(tab==="cal") renderCal();
  if(tab==="set") renderSet();
  renderSheet();
  document.querySelector('meta[name=theme-color]').content=getComputedStyle(document.body).backgroundColor;
}

/* ---------- Vandaag ---------- */
function renderToday(){
  const t=todayStr(), done=state.log[t], streak=computeStreak(), L=state.lvl, need=needFor(L.level), rest=!!state.rest[t];
  const view=done||buildPlan(state.dayIdx);
  const nextTitle=dayTitle(daySlots((state.dayIdx+1)%DAYS.length));
  const greet = done ? "Gedaan voor vandaag. <b>Sterk werk.</b>"
    : rest ? "Joker vandaag. <b>Rust telt ook.</b>"
    : streak>0 ? "Hou de reeks vast. <b>Nog één sessie.</b>"
    : "Nog niks gedaan vandaag. <b>Tijd om te bewegen.</b>";
  const lvlK = state.settings.lockLevel ? "niveau · vast" : L.level>=MAX ? "niveau · max" : `niveau · ${L.prog}/${need}`;
  const pct = L.level>=MAX ? 100 : L.prog/need*100;

  let h=`<div class="stack">
    <section class="tile t-orange">
      <div class="tl"><span>Vandaag</span><span>${prettyDate(t)}</span></div>
      <p class="greet">${greet}</p>
      <div class="bignum">${streak}<span class="of">${streak===1?"dag":"dagen"}</span></div>
      <div class="bignumcap">op rij · record ${state.best}${L.resetNote?` · teller herstart na ${INACTIEF_DAGEN}+ dagen pauze`:""}</div>
      <div class="momo">
        <div class="mm t-cream"><div class="mv">${L.level}</div><div class="mk">${lvlK}</div><div class="bar"><i style="width:${pct}%"></i></div></div>
        <div class="mm t-black"><div class="mv">${total()}</div><div class="mk">${total()===1?"sessie":"sessies"} totaal</div></div>
      </div>
    </section>`;

  if(done){
    h+=`<section class="tile t-mint workout">
      <div class="tl"><span>Dag ${done.tag} · ${done.title}</span><span>✓ voltooid</span></div>
      <div class="done-row"><div class="tt">Gedaan.</div><span class="check pop">✓</span></div>
      ${gainedChips(celebrate)}
      <div class="btnrow"><button class="btn secondary" data-act="sheet">Wat je deed</button><button class="btn primary" data-act="guided">Nog eens</button></div>
      <div class="hint">Morgen: ${nextTitle}</div>
    </section>`;
  } else {
    const started=Object.keys(state.checks).length>0;
    h+=`<section class="tile t-cream workout">
      <div class="tl"><span>Vanavond · dag ${view.tag}</span><button class="chip" data-act="sheet">Snel afvinken</button></div>
      <div class="tt">${view.title}</div>
      ${compChips(view.slots)}
      ${rest?`<div class="hint">Joker ingezet — toch zin? Een workout telt gewoon als sessie.</div>`:""}
      <button class="btn primary big" data-act="guided">${started?"Verder doen":"Start workout"}</button>
      <div class="hint">${view.items.filter(i=>!i.opt).length} oefeningen${view.items.some(i=>i.opt)?" + 1 optioneel":""} · ~${Math.round(view.items.length*1.25)} min · morgen: ${nextTitle}</div>
    </section>`;
  }
  h+=`</div>`;
  document.getElementById("p-today").innerHTML=h;
}

/* ---------- Snel afvinken (eigen scherm) ---------- */
function renderSheet(){
  const host=document.getElementById("sheet");
  if(!sheetOpen){ host.hidden=true; host.innerHTML=""; syncScroll(); return; }
  const t=todayStr(), done=state.log[t], view=done||buildPlan(state.dayIdx);
  const left=view.items.filter((it,j)=>!it.opt && !state.checks[j]).length;
  let h=`<div class="ov-top"><button class="iconbtn" data-act="sheetclose" aria-label="Terug">${CHEV}</button>
    <div class="ov-title">${done?"Wat je deed":"Snel afvinken"}</div><span class="ov-count">${done?"✓ KLAAR":left+" TE GAAN"}</span></div>
    <div class="sheet-in"><section class="tile">`;
  view.items.forEach((it,j)=>{
    const on=done?true:!!state.checks[j], lock=!!done, info=INFO[it.n], iOpen=!!infoOpen[j];
    const tm=!lock?it.r.match(/(\d+)\s*sec/):null;
    h+=`<div class="ex${on&&!lock?" done":""}">
      <button class="cb${on?" on":""}${lock?" lock":""}" ${lock?"disabled":`data-act="check" data-j="${j}"`} aria-label="afvinken">${CHECK}</button>
      <div class="ex-txt">${catTag(it)}${it.opt?` <span class="tag opt">optioneel</span>`:""}
        <div class="ex-top"><button class="ex-name" ${info?`data-act="info" data-j="${j}"`:""}>${it.n}<span class="rep">${it.r}</span></button>
        ${tm?`<button class="qt" data-act="qtimer" data-j="${j}" data-sec="${tm[1]}">▶ ${tm[1]}s</button>`:""}
        ${info?`<button class="ibtn${iOpen?" open":""}" data-act="info" data-j="${j}" aria-label="uitleg">i</button>`:""}</div>
        ${it.note?`<div class="ex-note">${it.note}</div>`:""}${it.easy?`<div class="ex-easy"><b>makkelijker:</b> ${it.easy}</div>`:""}
        ${info&&iOpen?`<div class="ex-info">${info}</div>`:""}
      </div></div>`;
  });
  h+=`</section></div>`;
  host.hidden=false; host.innerHTML=h; syncScroll();
}

/* ---------- Kalender ---------- */
function renderCal(){
  const t=todayStr();
  if(!calView){ const d=parseISO(t); calView={y:d.getFullYear(),m:d.getMonth()}; }
  if(!calSel) calSel=t;
  const {y,m}=calView, offset=(new Date(y,m,1).getDay()+6)%7, nDays=new Date(y,m+1,0).getDate();
  const firstLog=Object.keys(state.log).sort()[0]||t;
  let cells=["ma","di","wo","do","vr","za","zo"].map(x=>`<div class="mcl">${x}</div>`).join(""), monthDone=0, monthRest=0;
  for(let i=0;i<offset;i++) cells+=`<div class="mcell empty"></div>`;
  for(let day=1;day<=nDays;day++){
    const d=isoDate(new Date(y,m,day));
    let c = state.log[d]?"done": state.rest[d]?"rest": d>t?"future": d===t?"todo": d<firstLog?"pre":"miss";
    if(state.log[d]) monthDone++;
    if(state.rest[d]) monthRest++;
    if(d===calSel) c+=" sel";
    cells+=`<button class="mcell ${c}" data-act="calday" data-d="${d}" aria-label="${longDate(d)}">${day}</button>`;
  }

  let h=`<div class="stack">
    <div class="stat3">
      <div class="tile stat t-yellow"><div class="k">Reeks</div><div class="v">${computeStreak()}</div></div>
      <div class="tile stat t-blue"><div class="k">Record</div><div class="v">${state.best}</div></div>
      <div class="tile stat t-peach"><div class="k">Totaal</div><div class="v">${total()}</div></div>
    </div>
    <section class="tile">
      <div class="mt"><div><div class="bigtitle">${MONTHS[m]}</div><div class="sub">${y} · ${plural(monthDone,"sessie","sessies")}${monthRest?` · ${monthRest} joker`:""}</div></div>
        <div class="navbtns"><button class="iconbtn" data-act="calnav" data-dir="-1" aria-label="vorige maand">${CHEV}</button><button class="iconbtn flip" data-act="calnav" data-dir="1" aria-label="volgende maand">${CHEV}</button></div></div>
      <div class="month">${cells}</div>
      <div class="legend"><span><span class="dot" style="background:var(--c-orange)"></span>gedaan</span><span><span class="dot" style="background:var(--c-blue)"></span>joker</span><span><span class="dot" style="box-shadow:inset 0 0 0 1.5px var(--mute)"></span>gemist</span></div>
    </section>`;

  const d=calSel, entry=state.log[d];
  let det=`<div class="tl"><span>${d===t?"Vandaag":d>t?"Nog niet":"Dag"}</span>${entry?`<span>niveau ${entry.lvl}</span>`:""}</div><div class="dtitle">${longDate(d)}</div>`;
  if(entry){
    det+=`<div class="hint" style="margin:0 0 8px">Dag ${entry.tag} · ${entry.title}</div>${entry.items.map(it=>`<div class="row"><span class="rn">${it.cat?`<span class="dot c-${it.cat}"></span>`:""}${it.n}${it.opt?` <span class="tag opt">opt.</span>`:""}</span><span class="rd">${it.r}</span></div>`).join("")}`;
  } else if(state.rest[d]){
    det+=`<div class="hint">Joker ingezet — je reeks bleef beschermd.</div><div class="btnrow"><button class="btn secondary" data-act="joker" data-d="${d}">Joker annuleren</button></div>`;
  } else if(d>t){
    det+=`<div class="hint">Deze dag moet nog komen.</div>`;
  } else {
    det+=`<div class="hint">${d===t?"Nog geen sessie vandaag.":"Geen sessie."}${restCountInWeek(d)<1?" Eén joker per week (ma–zo) beschermt je reeks.":" De joker van deze week is al gebruikt."}</div>`;
    if(restCountInWeek(d)<1) det+=`<div class="btnrow"><button class="btn primary" data-act="joker" data-d="${d}">Joker inzetten</button></div>`;
  }
  h+=`<section class="tile t-cream">${det}</section>`;

  const un=unlockedIds();
  h+=`<section class="tile"><div class="tl"><span>Achievements</span><span>${un.length}/${ACH.length}</span></div>${ACH.map(a=>{const u=un.includes(a.id);return `<div class="ach ${u?"":"lk"}"><span class="em">${a.em}</span><div><b>${a.name}</b><small>${u?a.sub:"nog vergrendeld"}</small></div></div>`;}).join("")}</section>
  </div>`;
  document.getElementById("p-cal").innerHTML=h;
}

/* ---------- Instellingen ---------- */
function renderSet(){
  const S=state.settings, L=state.lvl, catKeys=Object.keys(CATS), cnt=exCount();
  const lvlStatus = S.lockLevel ? `Vastgezet op niveau ${L.level}. Er wordt niet verder opgebouwd.`
    : L.level<MAX ? `${L.prog}/${needFor(L.level)} sessies naar niveau ${L.level+1}. Meer dan ${INACTIEF_DAGEN} dagen pauze zet die teller terug op 0.`
    : "Niveau 6 is het plafond.";
  let h=`<div class="sechead"><h3>Instellingen</h3><span>alles wordt bewaard op dit toestel</span></div><div class="stack">`;

  h+=`<section class="tile"><div class="card-h">Niveau</div><p class="card-d">Tik een ander getal om daar te (her)starten — de teller naar het volgende niveau begint dan op 0.</p>
      <div class="seg six">${[1,2,3,4,5,6].map(n=>`<button class="${L.level===n?"on":""}" data-act="lvl" data-v="${n}">${n}</button>`).join("")}</div>
      <div class="lab">Na elke sessie</div>
      <div class="seg"><button class="${!S.lockLevel?"on":""}" data-act="lock" data-v="0">Verder opbouwen</button><button class="${S.lockLevel?"on":""}" data-act="lock" data-v="1">Niveau vastzetten</button></div>
      <div class="hint">${lvlStatus}</div></section>`;

  h+=`<section class="tile t-blue"><div class="count-head"><div><div class="tl" style="margin-bottom:8px"><span>Aantal oefeningen</span></div><div class="hint" style="margin:0">Opener en afsluitstretch inbegrepen.<br>De optionele oefening komt er nog bij.</div></div><span class="count-v" id="countv">${cnt}</span></div>
      <input type="range" class="range" id="count" min="${OEFENINGEN_MIN}" max="${OEFENINGEN_MAX}" step="1" value="${cnt}" aria-label="Aantal oefeningen">
      <div class="range-ends"><span>${OEFENINGEN_MIN}</span><span id="countmin">~${Math.round(cnt*1.25)} min</span><span>${OEFENINGEN_MAX}</span></div></section>`;

  h+=`<section class="tile"><div class="card-h">Focus</div><p class="card-d">Per aangevinkte categorie wordt elke dag één andere oefening gewisseld voor die categorie. De sessie blijft even lang.</p>
      <div class="seg cats">${catKeys.map(c=>`<button class="c-${c}${S.focus.includes(c)?" on":""}" data-act="focus" data-c="${c}">${CATS[c].short}</button>`).join("")}</div></section>`;

  const modes=[["off","Uit"],["auto","Auto"],["cat","Categorie"],["ex","Oefening"]];
  h+=`<section class="tile"><div class="card-h">Optionele oefening</div><p class="card-d">Een extra oefening die je mag overslaan. Auto = de dag kiest zelf.</p>
      <div class="seg">${modes.map(([v,l])=>`<button class="${S.opt.mode===v?"on":""}" data-act="optmode" data-v="${v}">${l}</button>`).join("")}</div>`;
  if(S.opt.mode==="cat") h+=`<div class="lab">Altijd iets voor</div><div class="seg cats">${catKeys.map(c=>`<button class="c-${c}${S.opt.cat===c?" on":""}" data-act="optcat" data-c="${c}">${CATS[c].short}</button>`).join("")}</div>`;
  if(S.opt.mode==="ex") h+=`<div class="lab">Altijd deze oefening</div><select class="sel" id="optex">${catKeys.map(c=>`<optgroup label="${CATS[c].label}">${poolList(c).map(k=>`<option value="${k}"${S.opt.ex===k?" selected":""}>${EX[k].n}</option>`).join("")}</optgroup>`).join("")}</select>`;
  h+=`</section>`;

  h+=`<section class="tile"><div class="card-h">Weergave</div><p class="card-d">Systeem volgt de instelling van je telefoon.</p>
      <div class="seg">${[["system","Systeem"],["light","Licht"],["dark","Donker"]].map(([v,l])=>`<button class="${S.theme===v?"on":""}" data-act="theme" data-v="${v}">${l}</button>`).join("")}</div></section>`;

  h+=`</div><div class="foot">MCDO FIT · elke avond ~10 minuten<br>Normale spiervermoeidheid hoort erbij. Scherpe pijn = stoppen.<br><button class="danger" data-act="reset">Alles resetten</button></div>`;
  document.getElementById("p-set").innerHTML=h;
}

/* =====================================================================
   BEGELEIDE MODUS (fullscreen)
   Elke oefening krijgt een kleur uit het palet; bij "Volgende" schuift de
   volgende oefening als tegel in beeld.
   ===================================================================== */
const PAL=["t-orange","t-blue","t-yellow","t-mint","t-forest","t-peach"];
const END_THEME="t-cream";
const STAPEL=3, PEEK=9; // aantal gedane oefeningen dat achter de tegel piept (0 = geen stapel) en hoeveel px elk
let G=null, gIv=null, actx=null, wakeLock=null;
const RING_C=2*Math.PI*90;

function ensureAudio(){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==="suspended") actx.resume(); }catch(e){} }
function beep(f,d){ if(!actx) return; try{ const o=actx.createOscillator(), g=actx.createGain(), n=actx.currentTime; o.frequency.value=f; g.gain.setValueAtTime(.18,n); g.gain.exponentialRampToValueAtTime(.001,n+d); o.connect(g); g.connect(actx.destination); o.start(n); o.stop(n+d+.02); }catch(e){} }
function buzz(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }
async function wakeOn(){ try{ wakeLock=await navigator.wakeLock.request("screen"); }catch(e){} }
function wakeOff(){ try{ wakeLock && wakeLock.release(); }catch(e){} wakeLock=null; }
function themeFor(i){ return i>=G.items.length ? END_THEME : PAL[i%PAL.length]; }
function fgOf(cls){ const d=document.createElement("div"); d.className=cls; d.style.color="var(--fg)"; document.body.appendChild(d); const c=getComputedStyle(d).color; d.remove(); return c; }

/* Overgang: de oefening is een afgeronde tegel. Bij "Volgende" schuift de nieuwe tegel van rechts
   over de vorige, die achteruit de stapel in gaat. Bij "Vorige" schuift de bovenste weer weg. */
let sliding=false;
function slide(nextIdx, swap){
  if(sliding) return;
  const host=document.getElementById("guided"), old=host.querySelector(".gcard"), dir=nextIdx<G.i?-1:1;
  if(prefersReduced() || !Element.prototype.animate || nextIdx===G.i || !old){ swap(); return; }
  sliding=true; host.style.overflow="hidden";
  const r=old.getBoundingClientRect(), ghost=old.cloneNode(true);
  ghost.querySelectorAll("[id]").forEach(e=>e.removeAttribute("id"));
  ghost.style.cssText=`position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;transition:none;pointer-events:none`;
  swap();
  const card=host.querySelector(".gcard");
  card.parentNode.insertBefore(ghost, dir>0?card:card.nextSibling);
  const ease="cubic-bezier(.3,0,.15,1)", opts={duration:440,easing:ease,fill:"forwards"};
  const back=`translateY(${-PEEK}px) scale(${(r.width-16)/r.width})`, top=[{transform:"translateX(0)"},{transform:"translateX(110%)"}];
  ghost.style.transformOrigin=card.style.transformOrigin="50% 0";
  const moved = dir>0
    ? [ghost.animate([{transform:"none"},{transform:back}],opts), card.animate(top.slice().reverse(),opts)]
    : [ghost.animate(top,opts), card.animate([{transform:back},{transform:"none"}],opts)];
  moved[1].onfinish=()=>{ ghost.remove(); moved[1].cancel(); host.style.overflow=""; sliding=false; };
}
function prefersReduced(){ return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }

/* Timer klaar: het scherm flitst 3× in de contrastkleur (zichtbaar vanuit je ooghoek, ook zonder geluid).
   Is de oefening helemaal klaar, dan blijft het scherm daarna mint tot je verdergaat. */
function timerAlert(kind){
  const host=document.getElementById("guided"); if(!host || host.hidden) return;
  const card=host.querySelector(".gcard");
  if(kind==="done" && card) card.className="gcard "+screenTheme(G.i);
  const f=document.createElement("div"); f.className="flashfx"; f.style.background=fgOf(screenTheme(G.i));
  document.body.appendChild(f);
  const n=kind==="done"?3:2, kf=[];
  for(let k=0;k<n;k++) kf.push({opacity:0},{opacity:.92},{opacity:0});
  // bij "beweging beperken": één rustige oplichting i.p.v. flitsen
  const anim = prefersReduced() || !f.animate ? null : f.animate(kf,{duration:n*420,easing:"ease-in-out"});
  if(anim) anim.onfinish=()=>f.remove();
  else { f.style.transition="opacity .6s"; f.style.opacity=".6"; setTimeout(()=>{ f.style.opacity="0"; setTimeout(()=>f.remove(),600); },600); }
}
function screenTheme(i){
  const base=themeFor(i);
  if(i<G.items.length && G.timer && G.timer.fin) return base==="t-mint"?"t-cream":"t-mint";
  return base;
}

function timerFor(it){
  const m=it.r.match(/(\d+)\s*sec/); if(!m) return null;
  const sec=+m[1];
  return {sec, rem:sec, sides:/p\/(kant|been)/.test(it.r)?2:1, side:1, run:false, fin:false, endAt:0, last:null};
}
function openGuided(){
  const t=todayStr(), done=state.log[t];
  const items=done?done.items:buildPlan(state.dayIdx).items;
  let i=0;
  if(!done){ const k=items.findIndex((it,j)=>!state.checks[j]); i=k<0?0:k; }
  G={items, i, replay:!!done, result:null, timer:timerFor(items[i])};
  wakeOn(); renderGuided();
}
function closeGuided(){ clearInterval(gIv); G=null; wakeOff(); renderGuided(); render(); }
function gGo(i){
  clearInterval(gIv);
  G.i=i;
  if(G.i>=G.items.length){
    if(!G.replay){ G.items.forEach((it,j)=>{ if(!it.opt) state.checks[j]=true; }); G.result=complete(); }
    beep(880,.15); setTimeout(()=>beep(1320,.3),160); buzz([100,60,200]);
  } else G.timer=timerFor(G.items[G.i]);
  renderGuided();
}
function gToggleTimer(){
  const T=G&&G.timer; if(!T||T.fin) return;
  ensureAudio();
  if(T.run){ T.rem=Math.max(0,(T.endAt-Date.now())/1000); T.run=false; clearInterval(gIv); }
  else{ T.switched=false; T.endAt=Date.now()+T.rem*1000; T.run=true; T.last=null; gIv=setInterval(gTick,100); }
  paintTimer();
}
function gTick(){
  const T=G&&G.timer; if(!T||!T.run){ clearInterval(gIv); return; }
  T.rem=Math.max(0,(T.endAt-Date.now())/1000);
  const s=Math.ceil(T.rem);
  if(s<=3 && s>0 && T.last!==s){ T.last=s; beep(660,.08); }
  if(T.rem<=0){
    T.run=false; clearInterval(gIv); beep(990,.3); buzz(300);
    if(T.side<T.sides){ T.side++; T.rem=T.sec; T.switched=true; paintTimer(); timerAlert("switch"); return; }
    T.fin=true; paintTimer(); timerAlert("done"); return;
  }
  paintTimer();
}
function paintTimer(){
  const T=G&&G.timer, el=document.getElementById("gring"); if(!T||!el) return;
  el.classList.toggle("hurry", T.run && T.rem>0 && T.rem<=3);
  el.querySelector(".prg").style.strokeDashoffset = T.fin?0:RING_C*(1-T.rem/T.sec);
  el.querySelector(".rn b").textContent = T.fin?"✓":Math.ceil(T.rem);
  const side = T.sides>1?`kant ${T.side}/2<br>`:"";
  el.querySelector(".rn span").innerHTML = T.fin?"klaar":T.run?side+"tik = pauze":T.switched?"wissel<br>tik = start":side+(T.rem<T.sec?"tik = verder":"tik = start");
}
/* "30 sec p/kant" → groot getal + kleine eenheid, zoals de grote cijfers in mcdo-pt */
function repHTML(r){ const m=r.match(/^(\d+)\s*(.*)$/); return m?`${m[1]}<span class="u">${m[2]}</span>`:r; }

function stackHTML(){
  let h="";
  for(let j=Math.min(STAPEL,G.i);j>=1;j--) h+=`<div class="peek ${PAL[(G.i-j)%PAL.length]}" style="top:${(STAPEL-j)*PEEK}px;left:${12+j*8}px;right:${12+j*8}px"></div>`;
  return h;
}
function renderGuided(){
  const host=document.getElementById("guided");
  if(!G){ host.hidden=true; host.innerHTML=""; syncScroll(); return; }
  host.hidden=false; syncScroll();
  const n=G.items.length, atEnd=G.i>=n;
  const top=`<div class="ov-top"><button class="iconbtn" data-act="gclose" aria-label="Sluiten">${CLOSE}</button>
      <div class="gd-bar">${G.items.map((x,j)=>`<i class="${j<G.i?"done":j===G.i?"cur":""}"></i>`).join("")}</div>
      <span class="ov-count">${atEnd?n:G.i+1}/${n}</span></div>`;
  let card;
  if(atEnd){
    const streak=computeStreak();
    card=`<div class="gd-main">
        <div class="tl"><span>${G.replay?"Extra rondje":"Sessie voltooid"}</span></div>
        <div class="end-big">${G.replay?"Extra<br>rondje.":"Gedaan."}</div>
        ${G.replay?`<p class="end-p">Telt niet als extra sessie, wel als extra goed gevoel.</p>`:`<div class="momo end-momo">
          <div class="mm t-orange"><div class="mv">${streak}</div><div class="mk">${streak===1?"dag":"dagen"} op rij</div></div>
          <div class="mm t-black"><div class="mv">#${total()}</div><div class="mk">sessie</div></div></div>`}
        ${gainedChips(G.result)}
      </div>
      <div class="gd-foot"><button class="btn primary big" data-act="gclose">Terug naar vandaag</button></div>`;
  } else {
    const it=G.items[G.i], info=INFO[it.n], T=G.timer, last=G.i===n-1;
    card=`<div class="gd-main">
      <div class="gd-cat"><span>${catLabel(it)}</span>${it.opt?`<span class="tag opt">optioneel</span>`:""}</div>
      <div class="gd-name">${it.n}</div>
      <div class="gd-rep">${repHTML(it.r)}</div>
      ${it.note?`<div class="gd-note">${it.note}</div>`:""}${it.easy?`<div class="gd-easy"><b>makkelijker:</b> ${it.easy}</div>`:""}
      ${T?`<button class="ring" id="gring" data-act="gtimer" aria-label="timer starten of pauzeren"><svg viewBox="0 0 200 200"><circle class="trk" cx="100" cy="100" r="90" fill="none" stroke-width="12"/><circle class="prg" cx="100" cy="100" r="90" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg><div class="rn"><b></b><span></span></div></button>`:""}
      ${info?`<p class="gd-info">${info}</p>`:""}
    </div>
    <div class="gd-foot">
      ${G.i>0?`<button class="round" data-act="gprev" aria-label="Vorige">${CHEV}</button>`:""}
      ${it.opt?`<button class="btn secondary" style="flex:0 0 auto;width:auto" data-act="gskip">Overslaan</button>`:""}
      <button class="btn primary big" data-act="gnext">${last?"Afronden":"Volgende"}</button>
    </div>`;
  }
  host.innerHTML=top+`<div class="stage" style="padding-top:${STAPEL*PEEK}px">${stackHTML()}<section class="gcard ${screenTheme(G.i)}">${card}</section></div>`;
  host.scrollTop=0;
  if(!atEnd && G.timer) paintTimer();
}

/* =====================================================================
   ACTIES (één centrale click-handler)
   ===================================================================== */
function planChanged(){ if(!state.log[todayStr()]) state.checks={}; infoOpen={}; }
function isDark(){ const th=state.settings.theme; return th==="dark" || (th==="system" && !(window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches)); }
const ACT={
  tab:el=>{ tab=el.dataset.tab; infoOpen={}; render(); window.scrollTo(0,0); },
  themeflip:()=>{ state.settings.theme = isDark()?"light":"dark"; applyTheme(); save(); render(); },
  guided:()=>openGuided(),
  sheet:()=>{ sheetOpen=true; infoOpen={}; render(); document.getElementById("sheet").scrollTop=0; },
  sheetclose:()=>{ sheetOpen=false; render(); },
  check:el=>{
    const j=el.dataset.j; state.checks[j]=!state.checks[j]; if(!state.checks[j]) delete state.checks[j];
    const items=buildPlan(state.dayIdx).items;
    if(items.every((it,k)=>it.opt||state.checks[k])){ complete(); sheetOpen=false; } else save();
    render();
  },
  info:el=>{ const j=el.dataset.j; infoOpen[j]=!infoOpen[j]; render(); },
  qtimer:el=>{
    const j=el.dataset.j, sec=+el.dataset.sec;
    if(qRunning[j]){ clearInterval(qRunning[j].iv); delete qRunning[j]; el.className="qt"; el.textContent="▶ "+sec+"s"; return; }
    ensureAudio();
    const endAt=Date.now()+sec*1000; el.className="qt run"; el.textContent=sec+"s";
    qRunning[j]={iv:setInterval(()=>{
      const rem=Math.ceil((endAt-Date.now())/1000);
      if(rem<=0){ clearInterval(qRunning[j].iv); delete qRunning[j]; el.className="qt fin"; el.textContent="klaar ✓"; beep(990,.3); buzz(200);
        setTimeout(()=>{ el.className="qt"; el.textContent="▶ "+sec+"s"; },1600);
      } else el.textContent=rem+"s";
    },200)};
  },
  calnav:el=>{ let {y,m}=calView; m+=+el.dataset.dir; if(m<0){m=11;y--;} if(m>11){m=0;y++;} calView={y,m}; render(); },
  calday:el=>{ calSel=el.dataset.d; render(); },
  joker:el=>toggleRest(el.dataset.d),
  lvl:el=>{ setLevel(+el.dataset.v); save(); render(); },
  lock:el=>{ state.settings.lockLevel = el.dataset.v==="1"; save(); render(); },
  focus:el=>{ const c=el.dataset.c, f=state.settings.focus; state.settings.focus = f.includes(c)?f.filter(x=>x!==c):Object.keys(CATS).filter(x=>x===c||f.includes(x)); planChanged(); save(); render(); },
  optmode:el=>{ state.settings.opt.mode=el.dataset.v; planChanged(); save(); render(); },
  optcat:el=>{ state.settings.opt.cat=el.dataset.c; planChanged(); save(); render(); },
  theme:el=>{ state.settings.theme=el.dataset.v; applyTheme(); save(); render(); },
  reset:()=>{
    if(!confirm("Alles wissen: sessies, reeks, jokers, niveau en instellingen?")) return;
    const theme=state.settings.theme; state=freshState(); state.settings.theme=theme; state.today=todayStr();
    infoOpen={}; celebrate=null; save(); render();
  },
  gclose:()=>closeGuided(),
  gnext:()=>{ if(sliding) return; if(!G.replay) state.checks[G.i]=true; save(); slide(G.i+1,()=>gGo(G.i+1)); },
  gskip:()=>{ if(sliding) return; if(!G.replay) delete state.checks[G.i]; save(); slide(G.i+1,()=>gGo(G.i+1)); },
  gprev:()=>{ if(sliding) return; const p=Math.max(0,G.i-1); slide(p,()=>gGo(p)); },
  gtimer:()=>gToggleTimer(),
};
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]"); if(!el || el.disabled) return;
  const fn=ACT[el.dataset.act]; if(fn){ e.preventDefault(); fn(el,e); }
});
// schuifregelaar: getal live bijwerken tijdens het slepen, opslaan bij loslaten
document.addEventListener("input",e=>{
  if(e.target.id!=="count") return;
  const v=+e.target.value;
  document.getElementById("countv").textContent=v;
  document.getElementById("countmin").textContent="~"+Math.round(v*1.25)+" min";
});
document.addEventListener("change",e=>{
  if(e.target.id==="count"){ state.settings.count=+e.target.value; planChanged(); save(); render(); return; }
  if(e.target.id==="optex"){ state.settings.opt.ex=e.target.value; planChanged(); save(); render(); }
});
// App blijft soms openstaan over 04:00 heen: bij terugkeren opnieuw de dag checken
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="visible") return;
  if(state.today!==todayStr()){ celebrate=null; freshen(); save(); if(!G) render(); }
  if(G) wakeOn();
});
try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ applyTheme(); render(); }); }catch(e){}

/* =====================================================================
   OPSTARTEN
   ===================================================================== */
(async()=>{ await load(); freshen(); applyTheme(); await save(); render(); })();

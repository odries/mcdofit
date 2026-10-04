/* MCDO FIT — schermen: Vandaag, Kalender, Instellingen, snel afvinken, begeleide modus. */

/* =====================================================================
   ICONEN & MASCOTTE
   ===================================================================== */
const CHECK='<svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5 10-11"/></svg>';
const CHEV='<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
const WAVE_D="C70 22 95 4 150 4S230 28 285 28S360 22 400 22"; // golf die naadloos herhaalt (begint en eindigt op hoogte 22)
const WAVE='<svg class="wave" viewBox="0 0 400 36" preserveAspectRatio="none" aria-hidden="true"><path d="M0 36V22'+WAVE_D+'V36Z"/></svg>';
const FLOOD_WAVE='<svg class="fw" viewBox="0 0 800 36" preserveAspectRatio="none" aria-hidden="true"><path d="M0 36V22'+WAVE_D+'C470 22 495 4 550 4S630 28 685 28S760 22 800 22V36Z"/></svg>';

/* Het frietje. mood: "happy" | "sleep" | "flex" */
function fries(mood,size){
  size=size||120; const ink="#16152B", y="#FFC93C", box="#F48DB8";
  const eyes = mood==="sleep"
    ? `<path d="M41 92q6 5 12 0M67 92q6 5 12 0" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="47" cy="91" r="5.5" fill="${ink}"/><circle cx="73" cy="91" r="5.5" fill="${ink}"/><circle cx="49" cy="89" r="1.8" fill="#fff"/><circle cx="75" cy="89" r="1.8" fill="#fff"/>`;
  const mouth = mood==="sleep"
    ? `<path d="M55 107q5 3 10 0" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<path d="M49 103Q60 116 71 103" stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  const arms = mood==="flex"
    ? `<g stroke="${ink}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M28 100L12 96L10 80"/><path d="M92 100L108 96L110 80"/></g><circle cx="10" cy="75" r="6.5" fill="${y}" stroke="${ink}" stroke-width="3"/><circle cx="110" cy="75" r="6.5" fill="${y}" stroke="${ink}" stroke-width="3"/>`
    : "";
  return `<svg class="fries" viewBox="0 0 120 140" width="${size}" height="${Math.round(size*140/120)}" aria-hidden="true">
    <g fill="${y}" stroke="${ink}" stroke-width="3" stroke-linejoin="round">
      <rect x="30" y="22" width="13" height="56" rx="4" transform="rotate(-14 36 50)"/>
      <rect x="45" y="10" width="13" height="66" rx="4" transform="rotate(-5 51 43)"/>
      <rect x="61" y="7" width="13" height="70" rx="4" transform="rotate(4 67 42)"/>
      <rect x="76" y="18" width="13" height="60" rx="4" transform="rotate(13 82 48)"/>
    </g>${arms}
    <path d="M17 58Q60 74 103 58L93 130Q60 137 27 130Z" fill="${box}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="37" cy="102" rx="5" ry="3" fill="#FFD3E4"/><ellipse cx="83" cy="102" rx="5" ry="3" fill="#FFD3E4"/>
    ${eyes}${mouth}
  </svg>`;
}

/* =====================================================================
   RENDER
   ===================================================================== */
let tab="today", infoOpen={}, calView=null, calSel=null, sheetOpen=false;
let qRunning={};
function clearQuickTimers(){ for(const k in qRunning) clearInterval(qRunning[k].iv); qRunning={}; }
function syncScroll(){ document.body.classList.toggle("noscroll", sheetOpen || !!G); }
function plural(n,one,more){ return n+" "+(n===1?one:more); }
function gainedChips(r){
  if(!r || (!r.levelUp && !r.gained.length)) return "";
  return `<div class="gained">${r.levelUp?`<span>⬆️ Niveau ${r.levelUp} bereikt</span>`:""}${r.gained.map(id=>{const a=ACH.find(x=>x.id===id);return `<span>${a.em} ${a.name}</span>`;}).join("")}</div>`;
}

function render(){
  clearQuickTimers();
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("on", p.id==="p-"+tab));
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("on", b.dataset.tab===tab));
  document.body.classList.toggle("pg-cal", tab==="cal");
  document.body.classList.toggle("pg-set", tab==="set");
  if(tab==="today") renderToday();
  if(tab==="cal") renderCal();
  if(tab==="set") renderSet();
  renderSheet();
  // statusbalk van de telefoon kleurt mee met de pagina
  document.querySelector('meta[name=theme-color]').content=getComputedStyle(document.body).backgroundColor;
}

function weekStrip(t){
  const mon=mondayOf(t), lab=["ma","di","wo","do","vr","za","zo"], firstLog=Object.keys(state.log).sort()[0]||t; let h="";
  for(let i=0;i<7;i++){
    const d=addDays(mon,i);
    let c=state.log[d]?"done":state.rest[d]?"rest":d>t?"future":d===t?"":d<firstLog?"future":"miss";
    if(d===t) c+=" today";
    h+=`<div class="${c}">${lab[i]}<b></b></div>`;
  }
  return `<div class="wk">${h}</div>`;
}
function compText(slots){
  return composition(slots).map(x=>(x.n>=2?x.n+"× ":"")+CATS[x.cat].short.toLowerCase()).join(" · ");
}

/* ---------- Vandaag: alles op één scherm ---------- */
function renderToday(){
  const t=todayStr(), done=state.log[t], streak=computeStreak(), lv=curLevel(), L=state.lvl, need=needFor(L.level);
  const view=done||buildPlan(state.dayIdx);
  const nextTitle=dayTitle(applyFocus(DAYS[(state.dayIdx+1)%DAYS.length].slots, state.settings.focus));
  const lvlTxt = state.settings.manualLevel ? "vastgezet" : L.level>=MAX ? "onderhoudsmodus" : `${L.prog}/${need} naar niveau ${L.level+1}`;
  const fillPct = L.level>=MAX ? 100 : L.prog/need*100;

  let h=`<div class="t-top wrap pad-top">
    <header class="top"><div class="brand">${fries("happy",26)}MCDO FIT</div><span class="date">${prettyDate(t)}</span></header>
    <div class="hero">
      <div class="blob${streak?"":" cold"}"><b>${streak}</b></div>
      <div class="hero-l">${streak===1?"dag":"dagen"} op rij</div>
      <div class="hero-s">${plural(total(),"sessie","sessies")} · record ${state.best}</div>
      <div class="lvl"><div class="lvl-row"><b>Niveau ${lv}</b><span>${lvlTxt}</span></div><div class="track"><div class="fill" style="width:${fillPct}%"></div></div></div>
      ${L.resetNote?`<div class="hero-note">Meer dan ${INACTIEF_DAGEN} dagen pauze: de teller begint opnieuw, je niveau blijft.</div>`:""}
    </div>
    ${weekStrip(t)}
  </div>`;

  if(done){
    h+=`<section class="t-block done">${WAVE}<div class="wrap">
      <div class="donerow"><div class="mascot pop">${fries("flex",58)}</div><div><div class="eyebrow">Vanavond · dag ${done.tag}</div><div class="t-title" style="margin:4px 0 0">Gedaan!</div></div></div>
      ${gainedChips(celebrate)}
      <button class="btn-w" data-act="guided">Nog eens doen</button>
      <button class="linkbtn" data-act="sheet">Bekijk wat je deed</button>
      <div class="meta">Morgen: ${nextTitle}</div>
    </div></section>`;
  } else {
    const started=Object.keys(state.checks).length>0;
    h+=`<section class="t-block">${WAVE}<div class="wrap">
      <div class="eyebrow">Vanavond · dag ${view.tag}</div>
      <div class="t-title">${view.title}</div>
      <div class="comp">${compText(view.slots)}</div>
      ${state.rest[t]?`<div class="t-rest">Joker ingezet — toch zin? Een workout telt gewoon als sessie.</div>`:""}
      <button class="btn-w" data-act="guided">${started?"Verder doen":"Start workout"}</button>
      <button class="linkbtn" data-act="sheet">of vink snel af</button>
      <div class="meta">${view.items.length} oefeningen · ~${Math.round(view.items.length*1.25)} min · morgen: ${nextTitle}</div>
    </div></section>`;
  }
  document.getElementById("p-today").innerHTML=h;
}

/* ---------- Snel afvinken (eigen scherm) ---------- */
function renderSheet(){
  const host=document.getElementById("sheet");
  if(!sheetOpen){ host.hidden=true; host.innerHTML=""; syncScroll(); return; }
  const t=todayStr(), done=state.log[t], view=done||buildPlan(state.dayIdx);
  const left=view.items.filter((it,j)=>!it.opt && !state.checks[j]).length;
  let h=`<div class="ov-top"><button class="iconbtn" data-act="sheetclose" aria-label="Terug">${CHEV}</button>
    <div class="ov-title">${done?"Wat je deed":"Snel afvinken"}</div><span class="ov-count">${done?"✓ klaar":left+" te gaan"}</span></div>
    <div class="sheet-list">`;
  view.items.forEach((it,j)=>{
    const on=done?true:!!state.checks[j], lock=!!done, info=INFO[it.n], iOpen=!!infoOpen[j];
    const tm=!lock?it.r.match(/(\d+)\s*sec/):null;
    h+=`<div class="ex${on&&!lock?" done":""}">
      <button class="cb${on?" on":""}${lock?" lock":""}" ${lock?"disabled":`data-act="check" data-j="${j}"`} aria-label="afvinken">${CHECK}</button>
      <div class="ex-txt"><div class="ex-cat">${catLabel(it)}${it.opt?" · optioneel":""}</div>
        <div class="ex-top"><button class="ex-name" ${info?`data-act="info" data-j="${j}"`:""}>${it.n}<span class="rep">${it.r}</span></button>
        ${tm?`<button class="qt" data-act="qtimer" data-j="${j}" data-sec="${tm[1]}">▶ ${tm[1]}s</button>`:""}
        ${info?`<button class="ibtn${iOpen?" open":""}" data-act="info" data-j="${j}" aria-label="uitleg">i</button>`:""}</div>
        ${it.note?`<div class="ex-note">${it.note}</div>`:""}${it.easy?`<div class="ex-easy">makkelijker: ${it.easy}</div>`:""}
        ${info&&iOpen?`<div class="ex-info">${info}</div>`:""}
      </div></div>`;
  });
  h+=`</div>`;
  host.hidden=false; host.innerHTML=h; syncScroll();
}

/* ---------- Kalender ---------- */
function renderCal(){
  const t=todayStr();
  if(!calView){ const d=parseISO(t); calView={y:d.getFullYear(),m:d.getMonth()}; }
  if(!calSel) calSel=t;
  const {y,m}=calView, offset=(new Date(y,m,1).getDay()+6)%7, nDays=new Date(y,m+1,0).getDate();
  const firstLog=Object.keys(state.log).sort()[0]||t;
  const inChain=d=>!!(state.log[d]||state.rest[d]);
  let cells="", monthDone=0, monthRest=0;
  for(let i=0;i<offset;i++) cells+=`<div></div>`;
  for(let day=1;day<=nDays;day++){
    const d=isoDate(new Date(y,m,day)), col=(offset+day-1)%7;
    let c = state.log[d]?"done": state.rest[d]?"rest": d>t?"future": d===t?"todo": d<firstLog?"pre":"miss";
    if(state.log[d]) monthDone++;
    if(state.rest[d]) monthRest++;
    if(inChain(d)){ if(col<6 && inChain(addDays(d,1))) c+=" lr"; if(col>0 && inChain(addDays(d,-1))) c+=" ll"; }
    if(d===calSel) c+=" sel";
    cells+=`<button class="c ${c}" data-act="calday" data-d="${d}" aria-label="${longDate(d)}"><i>${day}</i></button>`;
  }
  let h=`<div class="wrap pad-top page-end">
    <h1 class="page-h">Kalender</h1>
    <div class="stats3"><div class="stat hot"><div class="v">${computeStreak()}</div><div class="k">reeks</div></div>
      <div class="stat"><div class="v">${state.best}</div><div class="k">record</div></div>
      <div class="stat"><div class="v">${total()}</div><div class="k">totaal</div></div></div>
    <div class="cal">
      <div class="cal-head"><button class="iconbtn" data-act="calnav" data-dir="-1" aria-label="vorige maand">${CHEV}</button>
        <div class="cal-title"><b>${MONTHS[m]}</b><span>${y} · ${plural(monthDone,"sessie","sessies")}${monthRest?` · ${monthRest} joker`:""}</span></div>
        <button class="iconbtn flip" data-act="calnav" data-dir="1" aria-label="volgende maand">${CHEV}</button></div>
      <div class="cal-dow">${["ma","di","wo","do","vr","za","zo"].map(x=>`<div>${x}</div>`).join("")}</div>
      <div class="cal-grid">${cells}</div>
      <div class="legend"><span><span class="ld" style="background:var(--cal-done)"></span>gedaan</span><span><span class="ld" style="background:var(--blue)"></span>joker</span><span><span class="ld" style="border:2px dashed var(--line)"></span>gemist</span></div>
    </div>`;

  const d=calSel, entry=state.log[d];
  let det=`<div class="eyebrow">${d===t?"Vandaag":d>t?"Nog niet":"Dag"}</div><h3>${longDate(d)}</h3>`;
  if(entry){
    det+=`<div class="tagline">Dag ${entry.tag} · ${entry.title} · niveau ${entry.lvl}</div><ul>${entry.items.map(it=>`<li>${it.n}${it.opt?" <small style='color:var(--muted)'>(opt.)</small>":""}<span>${it.r}</span></li>`).join("")}</ul>`;
  } else if(state.rest[d]){
    det+=`<div style="font-weight:600">Joker ingezet — je reeks bleef beschermd.</div><button class="btn-s soft" data-act="joker" data-d="${d}">Joker annuleren</button>`;
  } else if(d>t){
    det+=`<div style="color:var(--muted);font-weight:600">Deze dag moet nog komen.</div>`;
  } else {
    det+=`<div style="color:var(--muted);font-weight:600">${d===t?"Nog geen sessie vandaag.":"Geen sessie."}</div>`;
    det+= restCountInWeek(d)<1
      ? `<button class="btn-s" data-act="joker" data-d="${d}">Joker inzetten</button><div class="small">Eén joker per week (ma–zo). Die beschermt je reeks.</div>`
      : `<div class="small">De joker van deze week is al gebruikt.</div>`;
  }
  h+=`<div class="detail">${det}</div>`;

  const un=unlockedIds();
  h+=`<div class="sec"><h2 class="sec-h" style="margin-bottom:18px">Achievements</h2><div class="badges">${ACH.map(a=>{const u=un.includes(a.id);return `<div class="badge ${u?"":"lk"}"><span class="em">${a.em}</span><div><b>${a.name}</b><small>${u?a.sub:"nog vergrendeld"}</small></div></div>`;}).join("")}</div></div>
    </div>`;
  document.getElementById("p-cal").innerHTML=h;
}

/* ---------- Instellingen ---------- */
function renderSet(){
  const S=state.settings, L=state.lvl, catKeys=Object.keys(CATS);
  const lvBtns=`<button class="wide${!S.manualLevel?" on":""}" data-act="lvl" data-v="auto">Automatisch</button>`+[1,2,3,4,5,6].map(n=>`<button class="${S.manualLevel===n?"on":""}" data-act="lvl" data-v="${n}">${n}</button>`).join("");
  let h=`<div class="wrap pad-top page-end"><h1 class="page-h">Instel&shy;lingen</h1>`;

  h+=`<section class="set"><h3 class="sec-h">Niveau</h3><p class="sec-p">Automatisch bouwt vanzelf op. Kies een getal om het niveau vast te zetten.</p>
      <div class="seg six">${lvBtns}</div>
      <div class="small">Automatisch niveau: <b style="color:var(--ink)">${L.level}</b>${L.level<MAX?` · ${L.prog}/${needFor(L.level)} sessies naar niveau ${L.level+1}`:" · plafond bereikt"}</div></section>`;

  h+=`<section class="set"><h3 class="sec-h">Focus</h3><p class="sec-p">Per aangevinkte categorie wordt elke dag één andere oefening gewisseld voor die categorie. De sessie blijft even lang.</p>
      <div class="seg pinkon">${catKeys.map(c=>`<button class="${S.focus.includes(c)?"on":""}" data-act="focus" data-c="${c}">${CATS[c].short}</button>`).join("")}</div></section>`;

  const modes=[["off","Uit"],["auto","Auto"],["cat","Categorie"],["ex","Oefening"]];
  h+=`<section class="set"><h3 class="sec-h">Optionele oefening</h3><p class="sec-p">Een extra oefening die je mag overslaan. Auto = de dag kiest zelf.</p>
      <div class="seg">${modes.map(([v,l])=>`<button class="${S.opt.mode===v?"on":""}" data-act="optmode" data-v="${v}">${l}</button>`).join("")}</div>`;
  if(S.opt.mode==="cat") h+=`<div class="sub"><div class="sub-l">Altijd iets voor</div><div class="seg pinkon">${catKeys.map(c=>`<button class="${S.opt.cat===c?"on":""}" data-act="optcat" data-c="${c}">${CATS[c].short}</button>`).join("")}</div></div>`;
  if(S.opt.mode==="ex") h+=`<div class="sub"><div class="sub-l">Altijd deze oefening</div><select class="sel" id="optex">${catKeys.map(c=>`<optgroup label="${CATS[c].label}">${poolList(c).map(k=>`<option value="${k}"${S.opt.ex===k?" selected":""}>${EX[k].n}</option>`).join("")}</optgroup>`).join("")}</select></div>`;
  h+=`</section>`;

  h+=`<section class="set"><h3 class="sec-h">Weergave</h3><p class="sec-p">Systeem volgt de instelling van je telefoon.</p>
      <div class="seg">${[["system","Systeem"],["light","Licht"],["dark","Donker"]].map(([v,l])=>`<button class="${S.theme===v?"on":""}" data-act="theme" data-v="${v}">${l}</button>`).join("")}</div></section>`;

  h+=`<section class="about">${fries("sleep",64)}<p class="sec-p" style="margin-top:10px">MCDO FIT · elke avond ~10 minuten<br>Normale spiervermoeidheid hoort erbij. Scherpe pijn = stoppen.</p><button class="danger" data-act="reset">Alles resetten</button></section></div>`;
  document.getElementById("p-set").innerHTML=h;
}

/* =====================================================================
   BEGELEIDE MODUS (fullscreen)
   ===================================================================== */
let G=null, gIv=null, actx=null, wakeLock=null;
const RING_C=2*Math.PI*90;

function ensureAudio(){ try{ actx=actx||new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==="suspended") actx.resume(); }catch(e){} }
function beep(f,d){ if(!actx) return; try{ const o=actx.createOscillator(), g=actx.createGain(), n=actx.currentTime; o.frequency.value=f; g.gain.setValueAtTime(.18,n); g.gain.exponentialRampToValueAtTime(.001,n+d); o.connect(g); g.connect(actx.destination); o.start(n); o.stop(n+d+.02); }catch(e){} }
function buzz(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }
async function wakeOn(){ try{ wakeLock=await navigator.wakeLock.request("screen"); }catch(e){} }
function wakeOff(){ try{ wakeLock && wakeLock.release(); }catch(e){} wakeLock=null; }

/* Water-transitie: de golf onderaan stijgt tot het hele scherm die kleur heeft,
   de oefening wisselt, en onderaan schuift een nieuwe golf (in de andere kleur) binnen. */
let flooding=false;
function flood(swap){
  if(flooding) return;
  const host=document.getElementById("guided"), H=window.innerHeight;
  const reduce=window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const block=host.querySelector(".gd-block");
  if(reduce || !Element.prototype.animate || !block){ swap(); return; }
  flooding=true; host.style.overflow="hidden";
  const color=getComputedStyle(block).backgroundColor;
  const f=document.createElement("div"); f.className="flood"; f.innerHTML=FLOOD_WAVE;
  f.style.background=color; f.style.color=color;
  document.body.appendChild(f);
  const done=()=>{ host.style.overflow=""; flooding=false; };
  const up=f.animate([{transform:`translateY(${block.getBoundingClientRect().top}px)`},{transform:"translateY(-40px)"}],{duration:430,easing:"cubic-bezier(.55,0,.8,.45)",fill:"forwards"});
  up.onfinish=()=>{
    swap();
    const nb=host.querySelector(".gd-block"), main=host.querySelector(".gd-main");
    if(!nb){ // naar het feestscherm: een roze golf spoelt over alles heen
      f.style.zIndex=59;
      const p=document.createElement("div"); p.className="flood"; p.innerHTML=FLOOD_WAVE;
      p.style.background=p.style.color=getComputedStyle(host).backgroundColor;
      document.body.appendChild(p);
      const inn=p.animate([{transform:`translateY(${H+40}px)`},{transform:"translateY(-40px)"}],{duration:520,easing:"cubic-bezier(.25,.6,.35,1)",fill:"forwards"});
      inn.onfinish=()=>{ f.remove(); p.remove(); done(); };
      return;
    }
    f.remove(); // de nieuwe achtergrond heeft nu dezelfde kleur als het water
    const dist=H-nb.getBoundingClientRect().top+40;
    nb.animate([{transform:`translateY(${dist}px)`},{transform:"translateY(0)"}],{duration:600,easing:"cubic-bezier(.2,.65,.3,1)"}).onfinish=done;
    if(main) main.animate([{opacity:0,transform:"translateY(18px)"},{opacity:1,transform:"translateY(0)"}],{duration:420,delay:120,easing:"ease-out",fill:"backwards"});
  };
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
    if(T.side<T.sides){ T.side++; T.rem=T.sec; T.switched=true; } else T.fin=true;
  }
  paintTimer();
}
function paintTimer(){
  const T=G&&G.timer, el=document.getElementById("gring"); if(!T||!el) return;
  el.classList.toggle("fin",T.fin);
  el.querySelector(".prg").style.strokeDashoffset = T.fin?0:RING_C*(1-T.rem/T.sec);
  el.querySelector(".rn b").textContent = T.fin?"✓":Math.ceil(T.rem);
  const side = T.sides>1?`kant ${T.side}/2<br>`:"";
  el.querySelector(".rn span").innerHTML = T.fin?"klaar":T.run?side+"tik = pauze":T.switched?"wissel<br>tik = start":side+(T.rem<T.sec?"tik = verder":"tik = start");
}

function renderGuided(){
  const host=document.getElementById("guided");
  if(!G){ host.hidden=true; host.className="ov"; host.innerHTML=""; syncScroll(); return; }
  host.hidden=false; syncScroll();
  const n=G.items.length;

  if(G.i>=n){
    const streak=computeStreak();
    host.className="ov end";
    host.innerHTML=`<div class="ov-top"><button class="iconbtn" data-act="gclose" aria-label="Sluiten">${CHEV}</button></div>
      <div class="gd-main">
        <div class="mascot big pop">${fries("flex",120)}</div>
        <div class="gd-name">${G.replay?"Extra rondje!":"Gedaan!"}</div>
        <p class="end-p">${G.replay?"Telt niet als extra sessie, wel als extra goed gevoel.":`${streak} ${streak===1?"dag":"dagen"} op rij · sessie #${total()}`}</p>
        ${gainedChips(G.result)}
      </div>
      <div class="end-foot"><button class="btn-w ink" data-act="gclose">Terug naar vandaag</button></div>`;
    return;
  }

  const it=G.items[G.i], info=INFO[it.n], T=G.timer, last=G.i===n-1;
  host.className="ov"+(G.i%2?" alt":""); // afwisselend wit-met-blauwe-golf en blauw-met-witte-golf
  host.innerHTML=`<div class="ov-top"><button class="iconbtn" data-act="gclose" aria-label="Sluiten">${CHEV}</button>
      <div class="gd-bar">${G.items.map((x,j)=>`<i class="${j<G.i?"done":j===G.i?"cur":""}"></i>`).join("")}</div>
      <span class="ov-count">${G.i+1}/${n}</span></div>
    <div class="gd-main">
      <div class="gd-cat">${catLabel(it)}${it.opt?" · optioneel":""}</div>
      <div class="gd-name">${it.n}</div>
      <div class="gd-rep">${it.r}</div>
      ${it.note?`<div class="gd-note">${it.note}</div>`:""}${it.easy?`<div class="gd-easy"><b>makkelijker:</b> ${it.easy}</div>`:""}
    </div>
    <section class="gd-block">${WAVE}<div class="gd-in">
      ${T?`<button class="ring" id="gring" data-act="gtimer" aria-label="timer starten of pauzeren"><svg viewBox="0 0 200 200"><circle class="trk" cx="100" cy="100" r="90" fill="none" stroke-width="12"/><circle class="prg" cx="100" cy="100" r="90" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="${RING_C}" stroke-dashoffset="0"/></svg><div class="rn"><b></b><span></span></div></button>`:""}
      ${info?`<p class="gd-info">${info}</p>`:""}
      <div class="gd-foot">
        ${G.i>0?`<button class="round-w" data-act="gprev" aria-label="Vorige">${CHEV}</button>`:""}
        ${it.opt?`<button class="ghost-w" data-act="gskip">Overslaan</button>`:""}
        <button class="btn-w" data-act="gnext">${last?"Afronden":"Volgende"}</button>
      </div>
    </div></section>`;
  host.scrollTop=0;
  if(T) paintTimer();
}

/* =====================================================================
   ACTIES (één centrale click-handler)
   ===================================================================== */
function planChanged(){ if(!state.log[todayStr()]) state.checks={}; infoOpen={}; }
const ACT={
  tab:el=>{ tab=el.dataset.tab; infoOpen={}; render(); window.scrollTo(0,0); },
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
  lvl:el=>{ const v=el.dataset.v; state.settings.manualLevel = v==="auto"?null:+v; if(curLevel()>=MAX) state.maxHit=true; save(); render(); },
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
  gnext:()=>{ if(flooding) return; if(!G.replay) state.checks[G.i]=true; save(); flood(()=>gGo(G.i+1)); },
  gskip:()=>{ if(flooding) return; if(!G.replay) delete state.checks[G.i]; save(); flood(()=>gGo(G.i+1)); },
  gprev:()=>flood(()=>gGo(Math.max(0,G.i-1))),
  gtimer:()=>gToggleTimer(),
};
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]"); if(!el || el.disabled) return;
  const fn=ACT[el.dataset.act]; if(fn){ e.preventDefault(); fn(el,e); }
});
document.addEventListener("change",e=>{
  if(e.target.id==="optex"){ state.settings.opt.ex=e.target.value; planChanged(); save(); render(); }
});
// App blijft soms openstaan over 04:00 heen: bij terugkeren opnieuw de dag checken
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState!=="visible") return;
  if(state.today!==todayStr()){ celebrate=null; freshen(); save(); if(!G) render(); }
  if(G) wakeOn();
});
try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme); }catch(e){}

/* =====================================================================
   OPSTARTEN
   ===================================================================== */
(async()=>{ await load(); freshen(); applyTheme(); await save(); render(); })();
